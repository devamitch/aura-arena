// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — XP & Points Calculation
// Pure functions for computing session XP, battle XP, streak bonuses.
// ═══════════════════════════════════════════════════════════════════════════════

import type { DisciplineId, Landmark } from "@/types";

// XP from training sessions
export const calcSessionXP = (
  score: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
): number => Math.round(score * difficulty * 0.5);

// Points from training sessions
export const calcSessionPoints = (
  score: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
): number => Math.round(score * difficulty * 0.3);

// XP from PvE battles
export const calcPvEXP = (
  difficulty: 1 | 2 | 3 | 4 | 5,
  won: boolean,
): number => (won ? 50 + difficulty * 20 : 10 + difficulty * 5);

// Points from PvE battles
export const calcPvEPoints = (
  difficulty: 1 | 2 | 3 | 4 | 5,
  won: boolean,
): number => (won ? 30 + difficulty * 15 : 5);

// Streak bonus multiplier
export const calcStreakBonus = (streak: number): number =>
  Math.min(3, 1 + streak * 0.1);

// Mission XP
export const calcMissionXP = (reward: number): number => reward;

// Score trend analysis
export interface ScoreTrend {
  direction: "improving" | "declining" | "steady";
  delta: number;
  label: string;
}

export const analyseScoreTrend = (history: number[]): ScoreTrend => {
  if (history.length < 5)
    return { direction: "steady", delta: 0, label: "Not enough data" };
  const half = Math.floor(history.length / 2);
  const older = history.slice(0, half);
  const newer = history.slice(half);
  const avgOld = older.reduce((a, b) => a + b, 0) / older.length;
  const avgNew = newer.reduce((a, b) => a + b, 0) / newer.length;
  const delta = Math.round(avgNew - avgOld);
  if (delta > 3)
    return { direction: "improving", delta, label: `+${delta} avg` };
  if (delta < -3)
    return { direction: "declining", delta, label: `${delta} avg` };
  return { direction: "steady", delta, label: "Consistent" };
};

// Ideal reference pose generator (used when no ground truth exists)
export const generateIdealPose = (
  discipline: DisciplineId,
  elapsedMs: number,
): Landmark[] => {
  const t = elapsedMs / 1000;
  const rhythms: Record<string, number> = {
    boxing: 0.8,
    dance: 0.5,
    yoga: 3.0,
    martialarts: 1.0,
    gymnastics: 0.6,
    fitness: 1.2,
    bodybuilding: 2.0,
    parkour: 0.7,
    calisthenics: 1.5,
    pilates: 2.5,
  };
  const phase = (t % (rhythms[discipline] ?? 1)) / (rhythms[discipline] ?? 1);
  return Array.from({ length: 33 }, (_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 2;
    const wave = Math.sin(phase * Math.PI * 2) * 0.025;
    return {
      x: 0.5 + (col === 0 ? -0.12 : 0.12) + (i % 3 === 0 ? wave : 0),
      y: 0.08 + row * 0.07,
      z: 0,
      visibility: 0.95,
    };
  });
};

// Velocity appropriateness: fast vs slow disciplines
export const computeVelocityScore = (
  jitter: number,
  discipline: DisciplineId,
): number => {
  const fast = new Set([
    "boxing",
    "dance",
    "fitness",
    "parkour",
    "martialarts",
  ]);
  const slow = new Set(["yoga", "pilates", "bodybuilding"]);
  if (fast.has(discipline)) return Math.min(1, jitter / 0.04);
  if (slow.has(discipline)) return Math.max(0, 1 - jitter / 0.02);
  return 0.7;
};
