// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useSupabaseSync
// React hook that bridges the supabaseSync Web Worker with the app.
// Initialises once per session, exposes queueFrames / queueSamples / flush.
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from "react";
import type { PoseFrameRow, TrainingSampleRow } from "@/workers/io/supabaseSync.worker";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface SupabaseSyncHandle {
  queueFrames: (
    userId: string,
    sessionId: string,
    discipline: string,
    frames: PoseFrameRow[],
    subDiscipline?: string,
  ) => void;
  queueSamples: (
    userId: string,
    discipline: string,
    samples: TrainingSampleRow[],
  ) => void;
  flush: () => void;
}

export function useSupabaseSync(): SupabaseSyncHandle {
  const workerRef = useRef<Worker | null>(null);
  const readyRef  = useRef(false);

  // ── Boot worker once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return; // no-op without env vars

    const worker = new Worker(
      new URL("../workers/io/supabaseSync.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (evt) => {
      const msg = evt.data as { type: string };
      if (msg.type === "READY") readyRef.current = true;
    };

    worker.postMessage({
      type: "INIT",
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
    });

    workerRef.current = worker;
    return () => {
      worker.postMessage({ type: "FLUSH" });
      setTimeout(() => worker.terminate(), 3000);
      readyRef.current = false;
      workerRef.current = null;
    };
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────────
  const queueFrames = useCallback(
    (
      userId: string,
      sessionId: string,
      discipline: string,
      frames: PoseFrameRow[],
      subDiscipline?: string,
    ) => {
      if (!readyRef.current || !workerRef.current || !frames.length) return;
      workerRef.current.postMessage({
        type: "QUEUE_FRAMES",
        userId,
        sessionId,
        discipline,
        subDiscipline,
        frames,
      });
    },
    [],
  );

  const queueSamples = useCallback(
    (
      userId: string,
      discipline: string,
      samples: TrainingSampleRow[],
    ) => {
      if (!readyRef.current || !workerRef.current || !samples.length) return;
      workerRef.current.postMessage({
        type: "QUEUE_SAMPLES",
        userId,
        discipline,
        samples,
      });
    },
    [],
  );

  const flush = useCallback(() => {
    workerRef.current?.postMessage({ type: "FLUSH" });
  }, []);

  return { queueFrames, queueSamples, flush };
}
