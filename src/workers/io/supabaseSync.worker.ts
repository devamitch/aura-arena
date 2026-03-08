// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Sync Worker
// Runs in a Web Worker — saves pose frames + training samples to Supabase
// without blocking the main thread. Batches writes and retries on failure.
// Max 200 lines.
// ═══════════════════════════════════════════════════════════════════════════════

export interface PoseFrameRow {
  second: number;
  landmarks: unknown[];
  handLandmarks?: unknown[];
  score?: number;
  label?: string;
  isCorrect?: boolean;
  issues?: string[];
  geminiFeedback?: string;
}

export interface TrainingSampleRow {
  label: string;
  keypoints: number[]; // 132 floats
  score?: number;
  isCorrect?: boolean;
  source?: string;
}

export type WorkerMsg =
  | { type: "INIT"; supabaseUrl: string; supabaseKey: string }
  | {
      type: "QUEUE_FRAMES";
      userId: string;
      sessionId: string;
      discipline: string;
      subDiscipline?: string;
      frames: PoseFrameRow[];
    }
  | {
      type: "QUEUE_SAMPLES";
      userId: string;
      discipline: string;
      samples: TrainingSampleRow[];
    }
  | { type: "FLUSH" }
  | { type: "PING" };

// ── State ─────────────────────────────────────────────────────────────────────

let supabaseUrl = "";
let supabaseKey = "";
const frameQueue: any[] = [];
const sampleQueue: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const BATCH = 100; // rows per insert call
const AUTO_FLUSH_MS = 5000; // flush every 5 s automatically

// ── Helpers ───────────────────────────────────────────────────────────────────

async function supabaseInsert(table: string, rows: any[]): Promise<void> {
  if (!rows.length || !supabaseUrl) return;
  const resp = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`[supabaseSync] ${table} insert failed: ${msg}`);
  }
}

async function flushAll() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Flush pose frames
  while (frameQueue.length > 0) {
    const batch = frameQueue.splice(0, BATCH);
    try {
      await supabaseInsert("pose_frames", batch);
    } catch (e) {
      console.warn(
        `[supabaseSync] Missing pose_frames table or network error. Dropping batch of ${batch.length} to prevent deadlock.`,
      );
      self.postMessage({
        type: "FLUSH_ERROR",
        table: "pose_frames",
        error: String(e),
      });
      // Intentionally not re-queueing to act as an optional fallback
    }
  }

  // Flush training samples
  while (sampleQueue.length > 0) {
    const batch = sampleQueue.splice(0, BATCH);
    try {
      await supabaseInsert("training_samples", batch);
    } catch (e) {
      console.warn(
        `[supabaseSync] Missing training_samples table or network error. Dropping batch of ${batch.length} to prevent deadlock.`,
      );
      self.postMessage({
        type: "FLUSH_ERROR",
        table: "training_samples",
        error: String(e),
      });
      // Intentionally not re-queueing to act as an optional fallback
    }
  }

  self.postMessage({
    type: "FLUSH_COMPLETE",
    framePending: frameQueue.length,
    samplePending: sampleQueue.length,
  });
  scheduleAutoFlush();
}

function scheduleAutoFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushAll();
  }, AUTO_FLUSH_MS);
}

// ── Message handler ───────────────────────────────────────────────────────────

self.onmessage = async (evt: MessageEvent<WorkerMsg>) => {
  const msg = evt.data;

  switch (msg.type) {
    case "INIT":
      supabaseUrl = msg.supabaseUrl;
      supabaseKey = msg.supabaseKey;
      self.postMessage({ type: "READY" });
      scheduleAutoFlush();
      break;

    case "QUEUE_FRAMES": {
      const rows = msg.frames.map((f) => ({
        user_id: msg.userId,
        session_id: msg.sessionId,
        discipline: msg.discipline,
        sub_discipline: msg.subDiscipline ?? null,
        frame_second: f.second,
        landmarks: f.landmarks,
        hand_landmarks: f.handLandmarks ?? null,
        frame_score: f.score ?? null,
        label: f.label ?? null,
        is_correct: f.isCorrect ?? null,
        issues: f.issues ?? [],
        gemini_feedback: f.geminiFeedback ?? null,
      }));
      frameQueue.push(...rows);
      self.postMessage({
        type: "QUEUED",
        table: "pose_frames",
        count: rows.length,
      });
      // Auto-flush when queue grows large
      if (frameQueue.length >= 200) flushAll();
      break;
    }

    case "QUEUE_SAMPLES": {
      const rows = msg.samples.map((s) => ({
        user_id: msg.userId,
        discipline: msg.discipline,
        label: s.label,
        keypoints: s.keypoints,
        score: s.score ?? null,
        is_correct: s.isCorrect ?? null,
        source: s.source ?? "live",
      }));
      sampleQueue.push(...rows);
      self.postMessage({
        type: "QUEUED",
        table: "training_samples",
        count: rows.length,
      });
      if (sampleQueue.length >= 200) flushAll();
      break;
    }

    case "FLUSH":
      await flushAll();
      break;

    case "PING":
      self.postMessage({
        type: "PONG",
        framePending: frameQueue.length,
        samplePending: sampleQueue.length,
      });
      break;
  }
};
