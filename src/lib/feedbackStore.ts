// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Feedback Store (Supabase)
// Stores Gemini-labeled training samples in Supabase.
// These samples improve the local TF.js action classifier over time.
// Uses React Query for caching/fetching.
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "@lib/supabase/client";

const TABLE = "training_samples";

export interface TrainingSample {
  id?: string;
  user_id: string;
  /** 33 keypoints: [x, y, z, visibility] — stored as JSONB */
  keypoints: number[][];
  /** Action label from Gemini */
  gemini_label: string;
  /** Form quality from Gemini (0-100) */
  gemini_score: number;
  /** Discipline */
  discipline: string;
  /** Issues identified by Gemini */
  issues: string[];
  /** When this sample was created */
  created_at?: string;
}

// ─── Write Operations ────────────────────────────────────────────────────────

/** Save a batch of training samples to Supabase */
export async function saveSamples(
  userId: string,
  samples: Omit<TrainingSample, "id" | "user_id" | "created_at">[],
): Promise<number> {
  const rows = samples.map((s) => ({
    user_id: userId,
    keypoints: s.keypoints,
    gemini_label: s.gemini_label,
    gemini_score: s.gemini_score,
    discipline: s.discipline,
    issues: s.issues,
  }));

  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) {
    console.error("[feedbackStore] Insert failed:", error);
    return 0;
  }
  return rows.length;
}

// ─── Read Operations (used by React Query) ───────────────────────────────────

/** Get total sample count for a user */
export async function fetchSampleCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return 0;
  return count ?? 0;
}

/** Get samples for a specific discipline */
export async function fetchSamplesForDiscipline(
  userId: string,
  discipline: string,
  limit = 200,
): Promise<TrainingSample[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("discipline", discipline)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

/** Get global samples for a discipline (community data — all users) */
export async function fetchGlobalSamples(
  discipline: string,
  limit = 500,
): Promise<TrainingSample[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("discipline", discipline)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

/** Find nearest keypoint matches for classifier boosting */
export async function findNearestSamples(
  keypoints: number[][],
  discipline: string,
  limit = 200,
): Promise<TrainingSample[]> {
  // Fetch recent samples and compute distance client-side
  const samples = await fetchGlobalSamples(discipline, limit);
  if (samples.length === 0) return [];

  const withDist = samples.map((s) => ({
    sample: s,
    distance: keypointDistance(keypoints, s.keypoints),
  }));

  withDist.sort((a, b) => a.distance - b.distance);
  return withDist.slice(0, 5).map((w) => w.sample);
}

/** Export all user samples as JSON */
export async function exportUserDataset(userId: string): Promise<string> {
  const { data } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5000);
  return JSON.stringify(data ?? [], null, 2);
}

// ─── React Query Keys ────────────────────────────────────────────────────────

export const trainingQueryKeys = {
  all: ["training-samples"] as const,
  count: (userId: string) =>
    [...trainingQueryKeys.all, "count", userId] as const,
  forDiscipline: (userId: string, disc: string) =>
    [...trainingQueryKeys.all, "discipline", userId, disc] as const,
  global: (disc: string) => [...trainingQueryKeys.all, "global", disc] as const,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function keypointDistance(a: number[][], b: number[][]): number {
  const minLen = Math.min(a.length, b.length);
  if (minLen === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < minLen; i++) {
    const dx = (a[i]?.[0] ?? 0) - (b[i]?.[0] ?? 0);
    const dy = (a[i]?.[1] ?? 0) - (b[i]?.[1] ?? 0);
    sum += dx * dx + dy * dy;
  }
  return Math.sqrt(sum / minLen);
}
