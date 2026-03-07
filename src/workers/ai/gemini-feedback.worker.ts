// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Gemini Feedback Worker
// Moves Gemini AI feedback generation off main thread.
// Handles match feedback, detailed coaching, and coach tips.
// ═══════════════════════════════════════════════════════════════════════════════

import { GoogleGenAI } from "@google/genai";

// ─── MESSAGE TYPES ────────────────────────────────────────────────────────────

interface MatchFeedbackRequest {
  type: "MATCH_FEEDBACK";
  apiKey: string;
  playerName: string;
  discipline: string;
  exercise: string;
  score: number;
  comboMax: number;
  lowAreas: string[];
  won: boolean;
}

interface DetailedFeedbackRequest {
  type: "DETAILED_FEEDBACK";
  apiKey: string;
  playerName: string;
  overallScore: number;
  totalSeconds: number;
  bestSecond: number;
  bestScore: number;
  worstSecond: number;
  worstScore: number;
  worstIssues: string[];
  timeline: Array<{
    second: number;
    score: number;
    exercise: string;
    issues: string[];
  }>;
}

interface CoachTipRequest {
  type: "COACH_TIP";
  apiKey: string;
  discipline: string;
  subDiscipline?: string;
  score: number;
  accuracy: number;
  stability: number;
  timing: number;
}

interface ReelCaptionRequest {
  type: "REEL_CAPTION";
  apiKey: string;
  discipline: string;
  subDiscipline?: string;
  score: number;
  drill: string;
}

type WorkerMessage =
  | MatchFeedbackRequest
  | DetailedFeedbackRequest
  | CoachTipRequest
  | ReelCaptionRequest;

// ─── MODELS ───────────────────────────────────────────────────────────────────

const MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash"] as const;

async function generate(apiKey: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  for (const model of MODELS) {
    try {
      const r = await ai.models.generateContent({ model, contents: prompt });
      const text = (r.text ?? "").trim();
      if (text) return text;
    } catch (e: any) {
      if (e?.status === 429) continue;
      break;
    }
  }
  return "";
}

// ─── FALLBACKS ────────────────────────────────────────────────────────────────

const FALLBACK_TIPS = [
  "Focus on breathing — it controls everything.",
  "Every rep is a deposit in your performance account.",
  "Perfect practice makes perfect performance.",
  "Consistency beats intensity every day.",
];

function fallback(type: string): string {
  if (type === "MATCH_FEEDBACK")
    return "Great effort! Keep training to unlock AI coaching insights.";
  if (type === "DETAILED_FEEDBACK")
    return "Session tracked! Configure your Gemini key for detailed coaching.";
  if (type === "REEL_CAPTION") return "🔥 Training hard in AURA ARENA!";
  return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleMessage(msg: WorkerMessage) {
  const post = (type: string, data: any) =>
    (self as unknown as Worker).postMessage({ type, ...data });

  if (!msg.apiKey) {
    post(`${msg.type}_RESULT`, {
      text: fallback(msg.type),
      source: "fallback",
    });
    return;
  }

  switch (msg.type) {
    case "MATCH_FEEDBACK": {
      const prompt = `Expert AI coach. ${msg.playerName}'s ${msg.discipline} session — ${msg.exercise}. ${msg.won ? "Won!" : "Lost."} Score: ${msg.score}/100. Combo: ${msg.comboMax}. Weak areas: ${msg.lowAreas.join(", ") || "none"}. Give 2-3 punchy, motivating sentences. Reference combo and weak areas. Plain text only.`;
      const text = (await generate(msg.apiKey, prompt)) || fallback(msg.type);
      post("MATCH_FEEDBACK_RESULT", {
        text,
        source: text ? "gemini" : "fallback",
      });
      return;
    }

    case "DETAILED_FEEDBACK": {
      const lows = msg.timeline
        .filter((t) => t.score < 60 && t.score > 0)
        .slice(0, 5)
        .map(
          (t) =>
            `At ${Math.floor(t.second / 60)}:${String(t.second % 60).padStart(2, "0")} (score ${t.score}): ${t.issues.join(", ")}`,
        )
        .join("\n");
      const prompt = `Expert AI coach for ${msg.playerName}. Score ${msg.overallScore}/100, ${msg.totalSeconds}s. Best at ${msg.bestSecond}s (${msg.bestScore}). Worst at ${msg.worstSecond}s (${msg.worstScore}): ${msg.worstIssues.join(", ")}. Low moments:\n${lows || "None"}. Give 3-5 tips with timestamps. Plain text.`;
      const text = (await generate(msg.apiKey, prompt)) || fallback(msg.type);
      post("DETAILED_FEEDBACK_RESULT", {
        text,
        source: text ? "gemini" : "fallback",
      });
      return;
    }

    case "COACH_TIP": {
      const name = msg.subDiscipline ?? msg.discipline;
      const prompt = `Elite ${name} coach. Scores — overall: ${msg.score}/100, accuracy: ${msg.accuracy}%, stability: ${msg.stability}%, timing: ${msg.timing}%. Two motivating sentences + two ${name}-specific technique improvements. Plain text.`;
      const text = (await generate(msg.apiKey, prompt)) || fallback(msg.type);
      post("COACH_TIP_RESULT", { text, source: text ? "gemini" : "fallback" });
      return;
    }

    case "REEL_CAPTION": {
      const name = msg.subDiscipline ?? msg.discipline;
      const prompt = `Write a short, exciting social media caption for a ${name} training reel. Score: ${msg.score}. Drill: ${msg.drill}. Use 1-2 emojis. Under 100 chars.`;
      const text = (await generate(msg.apiKey, prompt)) || fallback(msg.type);
      post("REEL_CAPTION_RESULT", {
        text,
        source: text ? "gemini" : "fallback",
      });
      return;
    }
  }
}

self.addEventListener("message", (e: MessageEvent) => handleMessage(e.data));
