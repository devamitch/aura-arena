// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Pose Analyzer
// Takes a PoseSequence and produces per-second analysis with timestamps.
// Identifies good/bad moments with specific joint feedback.
// ═══════════════════════════════════════════════════════════════════════════════

import type { PoseSequence } from "./poseRecorder";

export interface SecondAnalysis {
  /** Which second (0-indexed) */
  second: number;
  /** Detected action/exercise at this moment */
  exercise: string;
  /** Form quality 0-100 */
  score: number;
  /** Average keypoint visibility (body in frame?) */
  visibility: number;
  /** Specific issues found */
  issues: string[];
  /** Was this a highlight moment? */
  isHighlight: boolean;
}

export interface SessionReport {
  overallScore: number;
  totalSeconds: number;
  bestMoment: { second: number; score: number };
  worstMoment: { second: number; score: number; issues: string[] };
  timeline: SecondAnalysis[];
  highlights: SecondAnalysis[];
  lowlights: SecondAnalysis[];
}

/** Compute angle between three 2D points in degrees */
function angleBetween(a: number[], b: number[], c: number[]): number {
  const ba = [a[0] - b[0], a[1] - b[1]];
  const bc = [c[0] - b[0], c[1] - b[1]];
  const dot = ba[0] * bc[0] + ba[1] * bc[1];
  const magBA = Math.sqrt(ba[0] ** 2 + ba[1] ** 2);
  const magBC = Math.sqrt(bc[0] ** 2 + bc[1] ** 2);
  if (magBA === 0 || magBC === 0) return 0;
  return (
    Math.acos(Math.min(1, Math.max(-1, dot / (magBA * magBC)))) *
    (180 / Math.PI)
  );
}

/** Average visibility of all keypoints in a frame */
function avgVisibility(kp: number[][]): number {
  if (!kp.length) return 0;
  return kp.reduce((sum, p) => sum + (p[3] ?? p[2] ?? 0), 0) / kp.length;
}

/** Analyze joint angles for common form issues */
function analyzeForm(kp: number[][]): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  if (kp.length < 17) return { score: 0, issues: ["Not enough keypoints"] };

  // Keypoint indices (MediaPipe Pose): 11=L_shoulder, 13=L_elbow, 15=L_wrist
  // 12=R_shoulder, 14=R_elbow, 16=R_wrist, 23=L_hip, 25=L_knee, 27=L_ankle
  // 24=R_hip, 26=R_knee, 28=R_ankle

  // Check left knee angle (should not collapse inward)
  if (kp[23] && kp[25] && kp[27]) {
    const kneeAngle = angleBetween(kp[23], kp[25], kp[27]);
    if (kneeAngle < 70) {
      issues.push("Left knee too bent — risk of injury");
      score -= 15;
    }
  }

  // Check right knee
  if (kp[24] && kp[26] && kp[28]) {
    const kneeAngle = angleBetween(kp[24], kp[26], kp[28]);
    if (kneeAngle < 70) {
      issues.push("Right knee too bent — risk of injury");
      score -= 15;
    }
  }

  // Check spine alignment (shoulders over hips)
  if (kp[11] && kp[12] && kp[23] && kp[24]) {
    const shoulderMidX = (kp[11][0] + kp[12][0]) / 2;
    const hipMidX = (kp[23][0] + kp[24][0]) / 2;
    const lean = Math.abs(shoulderMidX - hipMidX);
    if (lean > 0.08) {
      issues.push("Torso leaning — keep spine vertical");
      score -= 10;
    }
  }

  // Check elbow angles for guard (boxing/martial arts)
  if (kp[11] && kp[13] && kp[15]) {
    const elbowAngle = angleBetween(kp[11], kp[13], kp[15]);
    if (elbowAngle > 170) {
      issues.push("Left arm fully extended — keep guard up");
      score -= 5;
    }
  }

  return { score: Math.max(0, score), issues };
}

/** Group frames by second and compute per-second analysis */
export function analyzeSequence(seq: PoseSequence): SessionReport {
  const totalSeconds = Math.ceil(seq.durationMs / 1000);
  const timeline: SecondAnalysis[] = [];

  for (let s = 0; s < totalSeconds; s++) {
    const startMs = s * 1000;
    const endMs = (s + 1) * 1000;
    const bucket = seq.frames.filter(
      (f) => f.timestamp >= startMs && f.timestamp < endMs,
    );

    if (bucket.length === 0) {
      timeline.push({
        second: s,
        exercise: "idle",
        score: 0,
        visibility: 0,
        issues: ["No pose data"],
        isHighlight: false,
      });
      continue;
    }

    // Average the form analysis across all frames in this second
    const analyses = bucket.map((f) => analyzeForm(f.keypoints));
    const avgScore = Math.round(
      analyses.reduce((s, a) => s + a.score, 0) / analyses.length,
    );
    const allIssues = [...new Set(analyses.flatMap((a) => a.issues))];
    const vis =
      bucket.reduce((s, f) => s + avgVisibility(f.keypoints), 0) /
      bucket.length;
    const avgFrameScore = Math.round(
      bucket.reduce((s, f) => s + f.frameScore, 0) / bucket.length,
    );

    timeline.push({
      second: s,
      exercise: seq.discipline,
      score: Math.round((avgScore + avgFrameScore) / 2),
      visibility: Math.round(vis * 100),
      issues: allIssues,
      isHighlight: avgScore >= 90,
    });
  }

  const overallScore =
    timeline.length > 0
      ? Math.round(timeline.reduce((s, t) => s + t.score, 0) / timeline.length)
      : 0;

  const sorted = [...timeline].sort((a, b) => b.score - a.score);
  const bestMoment = sorted[0] ?? { second: 0, score: 0 };
  const worstMoment = sorted[sorted.length - 1] ?? {
    second: 0,
    score: 0,
    issues: [],
  };

  return {
    overallScore,
    totalSeconds,
    bestMoment: { second: bestMoment.second, score: bestMoment.score },
    worstMoment: {
      second: worstMoment.second,
      score: worstMoment.score,
      issues: worstMoment.issues,
    },
    timeline,
    highlights: timeline.filter((t) => t.isHighlight),
    lowlights: timeline.filter((t) => t.score < 50 && t.score > 0),
  };
}
