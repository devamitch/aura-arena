// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Feedback Loop Service
// Collects pose data labeled by Gemini, stores in Supabase, and feeds it back
// to improve TensorFlow.js action classifier models on-device.
// The loop: Record → Analyze (Gemini) → Label → Store → Retrain TF.js locally.
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "@lib/supabase/client";
import type { DisciplineId } from "@types";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface LabeledPoseSample {
  keypoints: number[][];
  discipline: string;
  geminiLabel: string;
  geminiScore: number;
  issues: string[];
  frameTimestamp: number;
}

export interface FeedbackStats {
  totalSamples: number;
  byDiscipline: Record<string, number>;
  avgGeminiScore: number;
}

// ─── COLLECT & STORE ──────────────────────────────────────────────────────────

export async function storeLabeledSamples(
  userId: string,
  samples: LabeledPoseSample[],
): Promise<number> {
  if (samples.length === 0) return 0;

  const rows = samples.map((s) => ({
    user_id: userId,
    keypoints: s.keypoints,
    discipline: s.discipline,
    gemini_label: s.geminiLabel,
    gemini_score: s.geminiScore,
    issues: s.issues,
    frame_timestamp: s.frameTimestamp,
  }));

  // Batch insert in chunks of 100
  const chunkSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("training_samples").insert(chunk);
    if (!error) inserted += chunk.length;
  }

  return inserted;
}

// ─── FETCH FOR LOCAL TRAINING ─────────────────────────────────────────────────

export async function fetchTrainingSamples(
  discipline: DisciplineId,
  limit = 1000,
): Promise<LabeledPoseSample[]> {
  const { data, error } = await supabase
    .from("training_samples")
    .select(
      "keypoints, discipline, gemini_label, gemini_score, issues, frame_timestamp",
    )
    .eq("discipline", discipline)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    keypoints: row.keypoints,
    discipline: row.discipline,
    geminiLabel: row.gemini_label,
    geminiScore: row.gemini_score,
    issues: row.issues ?? [],
    frameTimestamp: row.frame_timestamp ?? 0,
  }));
}

// ─── GET STATS ────────────────────────────────────────────────────────────────

export async function getFeedbackStats(
  userId?: string,
): Promise<FeedbackStats> {
  let query = supabase
    .from("training_samples")
    .select("discipline, gemini_score", { count: "exact" });

  if (userId) query = query.eq("user_id", userId);

  const { data, count } = await query.limit(5000);

  const byDiscipline: Record<string, number> = {};
  let totalScore = 0;

  (data ?? []).forEach((row: any) => {
    byDiscipline[row.discipline] = (byDiscipline[row.discipline] ?? 0) + 1;
    totalScore += row.gemini_score ?? 0;
  });

  return {
    totalSamples: count ?? 0,
    byDiscipline,
    avgGeminiScore: count ? Math.round(totalScore / count) : 0,
  };
}

// ─── EXPORT FOR TF.JS TRAINING ────────────────────────────────────────────────

export function samplesToTFData(samples: LabeledPoseSample[]): {
  xs: number[][][];
  ys: string[];
} {
  return {
    xs: samples.map((s) => s.keypoints),
    ys: samples.map((s) => s.geminiLabel),
  };
}

// ─── WORKFLOW: Full feedback loop step ────────────────────────────────────────

export async function runFeedbackLoop(
  userId: string,
  discipline: DisciplineId,
  geminiAnalysis: Array<{
    time: string;
    second: number;
    label: string;
    score: number;
    issues: string[];
  }>,
  sessionKeypoints: number[][][],
): Promise<{ stored: number; totalSamples: number }> {
  // 1. Match Gemini timestamps with pose keypoints
  const samples: LabeledPoseSample[] = geminiAnalysis
    .filter((a) => a.second < sessionKeypoints.length)
    .map((a) => ({
      keypoints: sessionKeypoints[a.second] ?? [],
      discipline,
      geminiLabel: a.label,
      geminiScore: a.score,
      issues: a.issues,
      frameTimestamp: a.second,
    }))
    .filter((s) => s.keypoints.length > 0);

  // 2. Store in Supabase
  const stored = await storeLabeledSamples(userId, samples);

  // 3. Get updated stats
  const stats = await getFeedbackStats(userId);

  return { stored, totalSamples: stats.totalSamples };
}
