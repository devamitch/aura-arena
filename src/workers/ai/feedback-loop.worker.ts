// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Feedback Loop Worker
// Runs Gemini data labeling + Supabase storage off main thread.
// Pipeline: label keypoints with Gemini analysis → batch store → return stats.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── MESSAGE TYPES ────────────────────────────────────────────────────────────

interface LabelRequest {
  type: "LABEL_AND_STORE";
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  discipline: string;
  geminiAnalysis: Array<{
    time: string;
    second: number;
    label: string;
    score: number;
    issues: string[];
  }>;
  sessionKeypoints: number[][][];
}

interface FetchSamplesRequest {
  type: "FETCH_SAMPLES";
  supabaseUrl: string;
  supabaseKey: string;
  discipline: string;
  limit: number;
}

interface StatsRequest {
  type: "GET_STATS";
  supabaseUrl: string;
  supabaseKey: string;
  userId?: string;
}

type FeedbackLoopMessage = LabelRequest | FetchSamplesRequest | StatsRequest;

// ─── SUPABASE HELPER ──────────────────────────────────────────────────────────

async function supaFetch(
  url: string,
  key: string,
  path: string,
  opts: { method?: string; body?: any; params?: Record<string, string> } = {},
) {
  const endpoint = `${url}/rest/v1/${path}`;
  const searchParams = new URLSearchParams(opts.params ?? {});
  const fullUrl = searchParams.toString()
    ? `${endpoint}?${searchParams}`
    : endpoint;

  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: opts.method === "POST" ? "return=minimal" : "",
  };

  const res = await fetch(fullUrl, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status}`);
  if (opts.method === "POST") return null;
  return res.json();
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleFeedbackLoopMessage(msg: FeedbackLoopMessage) {
  const post = (type: string, data: any) =>
    (self as unknown as Worker).postMessage({ type, ...data });

  switch (msg.type) {
    case "LABEL_AND_STORE": {
      // Match Gemini timestamps with keypoints
      const samples = msg.geminiAnalysis
        .filter((a) => a.second < msg.sessionKeypoints.length)
        .map((a) => ({
          user_id: msg.userId,
          keypoints: msg.sessionKeypoints[a.second] ?? [],
          discipline: msg.discipline,
          gemini_label: a.label,
          gemini_score: a.score,
          issues: a.issues,
          frame_timestamp: a.second,
        }))
        .filter((s) => s.keypoints.length > 0);

      // Batch insert in chunks of 100
      let stored = 0;
      const chunkSize = 100;
      for (let i = 0; i < samples.length; i += chunkSize) {
        const chunk = samples.slice(i, i + chunkSize);
        try {
          await supaFetch(
            msg.supabaseUrl,
            msg.supabaseKey,
            "training_samples",
            {
              method: "POST",
              body: chunk,
            },
          );
          stored += chunk.length;
        } catch {
          /* continue with next chunk */
        }
      }

      post("LABEL_RESULT", { stored, total: samples.length });
      return;
    }

    case "FETCH_SAMPLES": {
      try {
        const data = await supaFetch(
          msg.supabaseUrl,
          msg.supabaseKey,
          "training_samples",
          {
            params: {
              discipline: `eq.${msg.discipline}`,
              order: "created_at.desc",
              limit: String(msg.limit),
              select: "keypoints,discipline,gemini_label,gemini_score,issues",
            },
          },
        );

        // Format for TF.js training
        const xs = (data ?? []).map((r: any) => r.keypoints);
        const ys = (data ?? []).map((r: any) => r.gemini_label);

        post("SAMPLES_RESULT", { xs, ys, count: xs.length });
      } catch {
        post("SAMPLES_RESULT", { xs: [], ys: [], count: 0 });
      }
      return;
    }

    case "GET_STATS": {
      try {
        const params: Record<string, string> = {
          select: "discipline,gemini_score",
          limit: "5000",
        };
        if (msg.userId) params.user_id = `eq.${msg.userId}`;

        const data = await supaFetch(
          msg.supabaseUrl,
          msg.supabaseKey,
          "training_samples",
          { params },
        );

        const byDiscipline: Record<string, number> = {};
        let totalScore = 0;
        (data ?? []).forEach((r: any) => {
          byDiscipline[r.discipline] = (byDiscipline[r.discipline] ?? 0) + 1;
          totalScore += r.gemini_score ?? 0;
        });

        const count = (data ?? []).length;
        post("STATS_RESULT", {
          totalSamples: count,
          byDiscipline,
          avgGeminiScore: count ? Math.round(totalScore / count) : 0,
        });
      } catch {
        post("STATS_RESULT", {
          totalSamples: 0,
          byDiscipline: {},
          avgGeminiScore: 0,
        });
      }
      return;
    }
  }
}

self.addEventListener("message", (e: MessageEvent) =>
  handleFeedbackLoopMessage(e.data),
);
