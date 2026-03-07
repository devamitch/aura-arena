// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Feedback Loop Orchestrator
// After every Gemini video analysis, aligns timestamps to local pose keypoints
// and saves labeled samples to Supabase for TF.js model improvement.
// ═══════════════════════════════════════════════════════════════════════════════

import type { GeminiVideoAnalysis } from "@/services/geminiVideoService";
import { saveSamples } from "./feedbackStore";
import type { PoseSequence } from "./poseRecorder";

export interface FeedbackLoopResult {
  samplesCreated: number;
  disciplinesCovered: string[];
}

/**
 * Aligns Gemini's per-second analysis with recorded PoseSequence keypoints,
 * then saves the labeled frames to Supabase as training data.
 */
export async function runFeedbackLoop(
  userId: string,
  poseSequence: PoseSequence,
  geminiAnalysis: GeminiVideoAnalysis,
): Promise<FeedbackLoopResult> {
  const { frames, discipline } = poseSequence;
  const { actions } = geminiAnalysis;

  if (frames.length === 0 || actions.length === 0) {
    return { samplesCreated: 0, disciplinesCovered: [] };
  }

  // Group pose frames by second
  const framesBySecond = new Map<number, typeof frames>();
  for (const frame of frames) {
    const sec = Math.floor(frame.timestamp / 1000);
    if (!framesBySecond.has(sec)) framesBySecond.set(sec, []);
    framesBySecond.get(sec)!.push(frame);
  }

  // Align: for each Gemini action timestamp, pick the middle frame of that second
  const samples: Parameters<typeof saveSamples>[1] = [];

  for (const action of actions) {
    const secFrames = framesBySecond.get(action.second);
    if (!secFrames || secFrames.length === 0) continue;

    // Use the middle frame for the most representative keypoints
    const midIdx = Math.floor(secFrames.length / 2);
    const representativeFrame = secFrames[midIdx];

    if (representativeFrame.keypoints.length < 17) continue;

    samples.push({
      keypoints: representativeFrame.keypoints,
      gemini_label: action.label,
      gemini_score: action.score,
      discipline: action.label.includes(discipline) ? discipline : discipline,
      issues: action.issues,
    });
  }

  // Save to Supabase
  const saved = await saveSamples(userId, samples);

  const disciplinesCovered = [...new Set(samples.map((s) => s.discipline))];

  return {
    samplesCreated: saved,
    disciplinesCovered,
  };
}

/**
 * Quick stats about the feedback loop's impact.
 */
export function estimateModelImprovement(sampleCount: number): string {
  if (sampleCount < 10) return "Collecting initial data...";
  if (sampleCount < 50) return "Learning your style — accuracy improving";
  if (sampleCount < 200)
    return "Good training data — classifier getting smarter";
  if (sampleCount < 500) return "Strong dataset — high accuracy expected";
  return "Expert-level training data — classifier is highly tuned";
}
