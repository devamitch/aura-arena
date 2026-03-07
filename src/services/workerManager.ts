// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Worker Manager
// Central hub for spawning, communicating, and cleaning up all web workers.
// Provides promise-based APIs for fire-and-forget worker messaging.
// ═══════════════════════════════════════════════════════════════════════════════

type WorkerCallback = (data: any) => void;

// ─── WORKER POOL ──────────────────────────────────────────────────────────────

interface ManagedWorker {
  worker: Worker;
  listeners: Map<string, WorkerCallback[]>;
  ready: boolean;
}

const _pool = new Map<string, ManagedWorker>();

// ─── SPAWN ────────────────────────────────────────────────────────────────────

function spawn(name: string, factory: () => Worker): ManagedWorker {
  const existing = _pool.get(name);
  if (existing?.ready) return existing;

  const worker = factory();
  const listeners = new Map<string, WorkerCallback[]>();
  const managed: ManagedWorker = { worker, listeners, ready: true };

  worker.onmessage = (e: MessageEvent) => {
    const type = e.data?.type as string;
    if (!type) return;
    const cbs = listeners.get(type) ?? [];
    cbs.forEach((cb) => cb(e.data));
  };

  worker.onerror = (err) => {
    console.error(`[WorkerManager] ${name} error:`, err);
    managed.ready = false;
  };

  _pool.set(name, managed);
  return managed;
}

// ─── POST WITH RESPONSE ──────────────────────────────────────────────────────

function postAndWait<T = any>(
  name: string,
  msg: any,
  responseType: string,
  timeout = 30_000,
): Promise<T> {
  const managed = _pool.get(name);
  if (!managed?.ready)
    return Promise.reject(new Error(`Worker ${name} not ready`));

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Worker ${name}: timeout waiting for ${responseType}`));
    }, timeout);

    const handler = (data: T) => {
      cleanup();
      resolve(data);
    };

    const cleanup = () => {
      clearTimeout(timer);
      const cbs = managed.listeners.get(responseType) ?? [];
      const idx = cbs.indexOf(handler);
      if (idx >= 0) cbs.splice(idx, 1);
    };

    const cbs = managed.listeners.get(responseType) ?? [];
    cbs.push(handler);
    managed.listeners.set(responseType, cbs);
    managed.worker.postMessage(msg);
  });
}

// ─── FIRE AND FORGET ──────────────────────────────────────────────────────────

function post(name: string, msg: any) {
  const managed = _pool.get(name);
  if (managed?.ready) managed.worker.postMessage(msg);
}

// ─── ON (subscribe to worker events) ─────────────────────────────────────────

function on(name: string, type: string, cb: WorkerCallback) {
  const managed = _pool.get(name);
  if (!managed) return;
  const cbs = managed.listeners.get(type) ?? [];
  cbs.push(cb);
  managed.listeners.set(type, cbs);
}

// ─── CLEANUP ──────────────────────────────────────────────────────────────────

function terminate(name: string) {
  const managed = _pool.get(name);
  if (managed) {
    managed.worker.terminate();
    managed.ready = false;
    _pool.delete(name);
  }
}

function terminateAll() {
  _pool.forEach((_, name) => terminate(name));
}

// ─── LAZY WORKER FACTORIES ──────────────────────────────────────────────────

export const workers = {
  // AI workers
  planner: () =>
    spawn(
      "planner",
      () =>
        new Worker(
          new URL("../workers/ai/planner.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  geminiFeedback: () =>
    spawn(
      "gemini-feedback",
      () =>
        new Worker(
          new URL("../workers/ai/gemini-feedback.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  feedbackLoop: () =>
    spawn(
      "feedback-loop",
      () =>
        new Worker(
          new URL("../workers/ai/feedback-loop.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),

  // Scoring workers
  scoringEngine: () =>
    spawn(
      "scoring-engine",
      () =>
        new Worker(
          new URL("../workers/scoring/engine.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  scoringFrame: () =>
    spawn(
      "scoring-frame",
      () =>
        new Worker(
          new URL("../workers/scoring/frame.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  scoringSession: () =>
    spawn(
      "scoring-session",
      () =>
        new Worker(
          new URL("../workers/scoring/session.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  scoringCorrectness: () =>
    spawn(
      "scoring-correctness",
      () =>
        new Worker(
          new URL("../workers/scoring/correctness.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),

  // MediaPipe workers
  pose: () =>
    spawn(
      "pose",
      () =>
        new Worker(
          new URL("../workers/mediapipe/pose.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  hands: () =>
    spawn(
      "hands",
      () =>
        new Worker(
          new URL("../workers/mediapipe/hands.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  face: () =>
    spawn(
      "face",
      () =>
        new Worker(
          new URL("../workers/mediapipe/face.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  segmentation: () =>
    spawn(
      "segmentation",
      () =>
        new Worker(
          new URL(
            "../workers/mediapipe/segmentation.worker.ts",
            import.meta.url,
          ),
          { type: "module" },
        ),
    ),

  // TensorFlow workers
  actionClassifier: () =>
    spawn(
      "action-classifier",
      () =>
        new Worker(
          new URL("../workers/tf/action-classifier.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  tfTraining: () =>
    spawn(
      "tf-training",
      () =>
        new Worker(
          new URL("../workers/tf/training.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),

  // IO workers
  videoUpload: () =>
    spawn(
      "video-upload",
      () =>
        new Worker(
          new URL("../workers/io/video-upload.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
  analytics: () =>
    spawn(
      "analytics",
      () =>
        new Worker(
          new URL("../workers/io/analytics.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),

  // Audio
  beat: () =>
    spawn(
      "beat",
      () =>
        new Worker(
          new URL("../workers/audio/beat.worker.ts", import.meta.url),
          { type: "module" },
        ),
    ),
};

// ─── TYPED CONVENIENCE APIs ──────────────────────────────────────────────────

export const workerAPI = {
  // AI Planner
  generatePlan: (msg: any) =>
    postAndWait(workers.planner().worker ? "planner" : "", msg, "PLAN_RESULT"),
  analyzeSession: (msg: any) =>
    postAndWait(
      workers.planner().worker ? "planner" : "",
      msg,
      "ANALYSIS_RESULT",
    ),

  // Gemini Feedback
  matchFeedback: (msg: any) =>
    postAndWait(
      workers.geminiFeedback().worker ? "gemini-feedback" : "",
      msg,
      "MATCH_FEEDBACK_RESULT",
    ),
  detailedFeedback: (msg: any) =>
    postAndWait(
      workers.geminiFeedback().worker ? "gemini-feedback" : "",
      msg,
      "DETAILED_FEEDBACK_RESULT",
    ),
  coachTip: (msg: any) =>
    postAndWait(
      workers.geminiFeedback().worker ? "gemini-feedback" : "",
      msg,
      "COACH_TIP_RESULT",
    ),
  reelCaption: (msg: any) =>
    postAndWait(
      workers.geminiFeedback().worker ? "gemini-feedback" : "",
      msg,
      "REEL_CAPTION_RESULT",
    ),

  // Feedback Loop
  labelAndStore: (msg: any) =>
    postAndWait(
      workers.feedbackLoop().worker ? "feedback-loop" : "",
      msg,
      "LABEL_RESULT",
    ),
  fetchSamples: (msg: any) =>
    postAndWait(
      workers.feedbackLoop().worker ? "feedback-loop" : "",
      msg,
      "SAMPLES_RESULT",
    ),

  // Video Upload
  uploadVideo: (msg: any) =>
    postAndWait(
      workers.videoUpload().worker ? "video-upload" : "",
      msg,
      "UPLOAD_RESULT",
      120_000,
    ),

  // Analytics (fire-and-forget)
  track: (msg: any) => post("analytics", msg),
  initAnalytics: (msg: any) => {
    workers.analytics();
    post("analytics", msg);
  },

  // Action Classifier
  classify: (msg: any) =>
    postAndWait(
      workers.actionClassifier().worker ? "action-classifier" : "",
      msg,
      "ACTION_RESULT",
    ),
};

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

export { on, post, postAndWait, terminate, terminateAll };
