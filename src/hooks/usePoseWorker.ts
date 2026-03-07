// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — usePoseWorker
// React hook that manages the Pose Web Worker lifecycle.
// Sends video frames (as transferable ImageBitmap — zero-copy) to the worker
// and receives back landmarks, FrameScore, and PoseCorrectness in real-time.
// ═══════════════════════════════════════════════════════════════════════════════

import type { PoseCorrectness } from "@lib/poseCorrectness";
import type { RhythmState } from "@lib/score";
import { liveStream } from "@services/liveStream";
import type { FrameScore, Landmark } from "@types";
import { useCallback, useEffect, useRef, useState } from "react";
// (Result types match the dispatcher's final output)
export type WorkerFrameResult = {
  type: "FRAME_RESULT";
  poseLandmarks: Landmark[][];
  handLandmarks: Landmark[][];
  gestures: unknown[][];
  frameScore: FrameScore;
  poseCorrectness: PoseCorrectness;
  newCombo: number;
  updatedRhythmState: RhythmState;
  newLastComboTime: number;
  emitTelemetry?: boolean;
};
// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendFrameOpts {
  bitmap: ImageBitmap; // transferred (zero-copy) — do NOT use after calling
  timestamp: number; // video.currentTime * 1000
  elapsedMs: number; // session elapsed time
  discipline: string;
  subDiscipline?: string;
  prevLandmarks: Landmark[];
  frameWindow: Landmark[][];
  rhythmState: RhythmState;
  combo: number;
  lastComboTime: number;
}

export interface PoseWorkerState {
  /** True once the worker has initialised MediaPipe + TF.js */
  isReady: boolean;
  /** Latest result from the worker (null until first frame is processed) */
  lastResult: WorkerFrameResult | null;
  /** Whether the worker is currently processing a frame */
  isBusy: boolean;
  /** If the worker encountered a fatal error */
  workerError: string | null;
  /** Send one video frame to the worker for processing */
  sendFrame: (opts: SendFrameOpts) => void;
  /** Register a callback invoked synchronously when a result arrives */
  onResult: (cb: ResultCallback) => void;
}

type ResultCallback = (r: WorkerFrameResult) => void;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePoseWorker(
  discipline: string,
  subDiscipline?: string,
  bpm = 80,
): PoseWorkerState {
  const workerRef = useRef<Worker | null>(null);
  const busyRef = useRef(false);
  const callbackRef = useRef<ResultCallback | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [lastResult, setLastResult] = useState<WorkerFrameResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // ── Spawn worker once per discipline change ────────────────────────────────
  useEffect(() => {
    setIsReady(false);
    setLastResult(null);
    setWorkerError(null);
    busyRef.current = false;

    let alive = true;

    const worker = new Worker(
      new URL("../workers/dispatcher.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (e: MessageEvent) => {
      if (!alive) return;
      const msg = e.data as { type: string; [k: string]: unknown };

      if (msg.type === "READY") {
        setIsReady(true);
      } else if (msg.type === "FRAME_RESULT") {
        busyRef.current = false;
        setIsBusy(false);
        const result = msg as unknown as WorkerFrameResult;
        setLastResult(result);

        // Push telemetry if requested by dispatcher
        if (result.emitTelemetry) {
          liveStream.enqueue({
            matchId: "active-match", // In a full app, we map this to context
            userId: "local", // Or from global store
            timestamp: Date.now(),
            score: result.frameScore.overall,
            combo: result.newCombo,
            exercise: result.poseCorrectness?.exercise || "idle",
            poseCorrectness: result.poseCorrectness?.score || 100,
            isCorrect: result.poseCorrectness?.isCorrect ?? true,
          });
        }

        callbackRef.current?.(result);
      } else if (msg.type === "ERROR") {
        busyRef.current = false;
        setIsBusy(false);
        setWorkerError(
          (msg.message as string | undefined) ?? "Unknown worker error",
        );
      }
    };

    worker.onerror = (e) => {
      if (!alive) return;
      busyRef.current = false;
      setIsBusy(false);
      setWorkerError(e.message ?? "Worker crash");
    };

    // Kick off MediaPipe + TF.js initialisation inside the worker
    worker.postMessage({ type: "INIT", discipline, subDiscipline, bpm });
    workerRef.current = worker;

    return () => {
      alive = false;
      worker.postMessage({ type: "DESTROY" });
      // Give it a moment to clean up before terminating
      setTimeout(() => worker.terminate(), 200);
      workerRef.current = null;
    };
  }, [discipline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── sendFrame — drops frame if worker is busy (rate limiting) ─────────────
  const sendFrame = useCallback((opts: SendFrameOpts) => {
    const worker = workerRef.current;

    if (!worker || busyRef.current) {
      // Drop the frame but close the bitmap to avoid memory leak
      opts.bitmap.close();
      return;
    }

    busyRef.current = true;
    setIsBusy(true);

    worker.postMessage(
      { type: "PROCESS_FRAME", ...opts },
      [opts.bitmap], // ← transfer (zero-copy, no clone)
    );
  }, []);

  // ── onResult — store callback ref (stable, no re-renders) ─────────────────
  const onResult = useCallback((cb: ResultCallback) => {
    callbackRef.current = cb;
  }, []);

  return { isReady, lastResult, isBusy, workerError, sendFrame, onResult };
}
