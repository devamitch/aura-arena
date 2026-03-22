// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useSupabaseSync (main-thread, no web worker)
// Batches pose frames and training samples, flushes to Supabase every 15 s
// or when flush() is called explicitly.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef } from "react";

const SUPABASE_URL = import.meta.env.SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.SUPABASE_ANON_KEY as string | undefined;

// ── Row types (previously imported from supabaseSync.worker) ──────────────────
// Callers only provide the per-frame data; queueFrames() fills in the IDs.
export interface PoseFrameRow {
  second: number;
  landmarks: unknown;
  score: number;
}

export interface TrainingSampleRow {
  user_id: string;
  discipline: string;
  landmarks: unknown;
  label: string;
  confidence: number;
}

// ── Supabase client (module-level singleton) ──────────────────────────────────
const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const FLUSH_INTERVAL_MS = 15_000;
const MAX_BATCH = 500;

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
  const frameQueue  = useRef<PoseFrameRow[]>([]);
  const sampleQueue = useRef<TrainingSampleRow[]>([]);

  const doFlush = useCallback(async () => {
    if (!supabase) return;

    const frames  = frameQueue.current.splice(0);
    const samples = sampleQueue.current.splice(0);

    if (frames.length) {
      supabase.from("pose_frames").insert(frames).then(({ error }) => {
        if (error) console.warn("[SupabaseSync] pose_frames insert error:", error.message);
      });
    }
    if (samples.length) {
      supabase.from("training_samples").insert(samples).then(({ error }) => {
        if (error) console.warn("[SupabaseSync] training_samples insert error:", error.message);
      });
    }
  }, []);

  // Auto-flush every 15 s
  useEffect(() => {
    if (!supabase) return;
    const id = setInterval(doFlush, FLUSH_INTERVAL_MS);
    return () => {
      clearInterval(id);
      doFlush(); // flush on unmount
    };
  }, [doFlush]);

  const queueFrames = useCallback(
    (
      userId: string,
      sessionId: string,
      discipline: string,
      frames: PoseFrameRow[],
      subDiscipline?: string,
    ) => {
      if (!supabase || !frames.length) return;
      const rows = frames.map((f) => ({
        ...f,
        user_id: userId,
        session_id: sessionId,
        discipline,
        sub_discipline: subDiscipline,
      }));
      frameQueue.current = [...frameQueue.current, ...rows].slice(-MAX_BATCH);
    },
    [],
  );

  const queueSamples = useCallback(
    (userId: string, discipline: string, samples: TrainingSampleRow[]) => {
      if (!supabase || !samples.length) return;
      const rows = samples.map((s) => ({ ...s, user_id: userId, discipline }));
      sampleQueue.current = [...sampleQueue.current, ...rows].slice(-MAX_BATCH);
    },
    [],
  );

  const flush = useCallback(() => { doFlush(); }, [doFlush]);

  return { queueFrames, queueSamples, flush };
}
