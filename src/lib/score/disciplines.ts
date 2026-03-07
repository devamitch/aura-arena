// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Per-Discipline Scorers
// Each discipline gets its own pure scoring function.
// All imported by frame.ts or workers.
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  FrameScore,
  Landmark,
  ScoringWeights,
  SubDisciplineId,
} from "@/types";
import {
  bilateralSymmetry,
  computeJitter,
  jointAngleDeg,
  lmDist2D,
  midpoint,
} from "./geometry";
import { LM } from "./landmarks";

// Boxing: wrist velocity + guard stability + extension
export const scoreBoxingFrame = (
  lms: Landmark[],
  prev: Landmark[],
  _w: ScoringWeights,
): Partial<FrameScore> => {
  const lw = lms[LM.LEFT_WRIST],
    rw = lms[LM.RIGHT_WRIST];
  const ls = lms[LM.LEFT_SHOULDER],
    rs = lms[LM.RIGHT_SHOULDER];
  if (!lw || !rw || !ls || !rs) return {};
  const leftVel = prev[LM.LEFT_WRIST] ? lmDist2D(lw, prev[LM.LEFT_WRIST]) : 0;
  const rightVel = prev[LM.RIGHT_WRIST]
    ? lmDist2D(rw, prev[LM.RIGHT_WRIST])
    : 0;
  const power = Math.min(100, (Math.max(leftVel, rightVel) / 0.08) * 100);
  const guard =
    ((Math.max(0, 1 - lmDist2D(lw, ls) / 0.3) +
      Math.max(0, 1 - lmDist2D(rw, rs) / 0.3)) /
      2) *
    100;
  const elbow = lms[LM.LEFT_ELBOW]
    ? jointAngleDeg(
        lms[LM.LEFT_SHOULDER],
        lms[LM.LEFT_ELBOW],
        lms[LM.LEFT_WRIST],
      )
    : 90;
  const ext = elbow > 140 ? Math.min(100, ((elbow - 140) / 40) * 100) : 0;
  return {
    power: Math.round(power),
    stability: Math.round(guard),
    accuracy: Math.round(guard * 0.5 + ext * 0.5),
  };
};

// Dance (Indian Classical): mudra precision
export const scoreMudraFrame = (
  lms: Landmark[],
  _sub: SubDisciplineId,
): number => {
  const lw = lms[LM.LEFT_WRIST],
    rw = lms[LM.RIGHT_WRIST];
  const li = lms[LM.LEFT_INDEX],
    ri = lms[LM.RIGHT_INDEX];
  if (!lw || !rw) return 70;
  const raised = (lw.y < 0.7 ? 1 : 0) + (rw.y < 0.7 ? 1 : 0);
  const sym = 1 - Math.abs(lw.y - rw.y) * 2;
  const finger =
    li && ri ? (lmDist2D(lw, li) + lmDist2D(rw, ri)) / 2 / 0.15 : 0.7;
  return Math.min(100, Math.round(raised * 20 + sym * 40 + finger * 40));
};

// Yoga: balance from single-leg stance sway
export const scoreYogaBalance = (
  lms: Landmark[],
  window: Landmark[][],
): number => {
  const la = lms[LM.LEFT_ANKLE],
    ra = lms[LM.RIGHT_ANKLE];
  if (!la || !ra) return 70;
  if (Math.abs(la.y - ra.y) <= 0.15) return 80;
  const xs = window.map((f) => f[LM.LEFT_HIP]?.x ?? 0.5);
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
  return Math.max(0, Math.min(100, 100 - (Math.sqrt(v) / 0.01) * 30));
};

// Gymnastics: body extension (straight lines)
export const scoreExtension = (lms: Landmark[]): number => {
  const sh = midpoint(
    lms[LM.LEFT_SHOULDER] ?? { x: 0.5, y: 0.2, z: 0 },
    lms[LM.RIGHT_SHOULDER] ?? { x: 0.5, y: 0.2, z: 0 },
  );
  const hp = midpoint(
    lms[LM.LEFT_HIP] ?? { x: 0.5, y: 0.5, z: 0 },
    lms[LM.RIGHT_HIP] ?? { x: 0.5, y: 0.5, z: 0 },
  );
  const ak = midpoint(
    lms[LM.LEFT_ANKLE] ?? { x: 0.5, y: 0.9, z: 0 },
    lms[LM.RIGHT_ANKLE] ?? { x: 0.5, y: 0.9, z: 0 },
  );
  const dev = Math.abs(sh.x - ak.x) + Math.abs(hp.x - (sh.x + ak.x) / 2);
  return Math.min(100, Math.round(Math.max(0, 1 - dev * 5) * 100));
};

// Bodybuilding: symmetry + V-taper + pose angles
export const scorePose = (lms: Landmark[]): number => {
  const sym = bilateralSymmetry(lms);
  const sw = lmDist2D(
    lms[LM.LEFT_SHOULDER] ?? { x: 0.3, y: 0.2, z: 0 },
    lms[LM.RIGHT_SHOULDER] ?? { x: 0.7, y: 0.2, z: 0 },
  );
  const hw = lmDist2D(
    lms[LM.LEFT_HIP] ?? { x: 0.35, y: 0.5, z: 0 },
    lms[LM.RIGHT_HIP] ?? { x: 0.65, y: 0.5, z: 0 },
  );
  const vTaper = hw > 0 ? Math.min(1, sw / hw) : 0.5;
  const ea = lms[LM.LEFT_ELBOW]
    ? jointAngleDeg(
        lms[LM.LEFT_SHOULDER],
        lms[LM.LEFT_ELBOW],
        lms[LM.LEFT_WRIST],
      )
    : 90;
  const q = ea > 60 && ea < 140 ? 1 : 0.6;
  return Math.min(100, Math.round(sym * 40 + vTaper * 30 + q * 30));
};

// Calisthenics: isometric hold stability
export const scoreStaticHold = (
  lms: Landmark[],
  window: Landmark[][],
): number => {
  if (window.length < 5) return 70;
  const joints = [LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  let totalVar = 0;
  for (const j of joints) {
    const ps = window.map((f) => ({ x: f[j]?.x ?? 0, y: f[j]?.y ?? 0 }));
    const mx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
    const my = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    const vx = ps.reduce((a, p) => a + (p.x - mx) ** 2, 0) / ps.length;
    const vy = ps.reduce((a, p) => a + (p.y - my) ** 2, 0) / ps.length;
    totalVar += Math.sqrt(vx + vy);
  }
  const avg = totalVar / joints.length;
  return Math.max(0, Math.min(100, Math.round(100 - (avg / 0.005) * 100)));
};

// Martial Arts: kata stance + strike power
export const scoreKataFrame = (
  lms: Landmark[],
  prev: Landmark[],
): Partial<FrameScore> => {
  const lk = lms[LM.LEFT_KNEE],
    lh = lms[LM.LEFT_HIP],
    la = lms[LM.LEFT_ANKLE];
  const angle = lk && lh && la ? jointAngleDeg(lh, lk, la) : 90;
  const stance = Math.max(0, 100 - Math.abs(angle - 90) * 2);
  const power = Math.min(100, (computeJitter(lms, prev) / 0.04) * 100);
  const sym = bilateralSymmetry(lms) * 100;
  return {
    accuracy: Math.round(stance),
    power: Math.round(power),
    stability: Math.round(sym),
  };
};

// Core engagement (pilates/yoga)
export const scoreCoreEngagement = (lms: Landmark[]): number => {
  const lh = lms[LM.LEFT_HIP],
    rh = lms[LM.RIGHT_HIP];
  const ls = lms[LM.LEFT_SHOULDER],
    rs = lms[LM.RIGHT_SHOULDER];
  if (!lh || !rh || !ls || !rs) return 70;
  const spineOff = Math.abs((ls.x + rs.x) / 2 - (lh.x + rh.x) / 2);
  return Math.min(100, Math.round(Math.max(0, 1 - spineOff * 8) * 100));
};

// Wrestling: takedown readiness (stance width + center of mass)
export const scoreWrestlingStance = (lms: Landmark[]): number => {
  const stanceW = lmDist2D(
    lms[LM.LEFT_ANKLE] ?? { x: 0.4, y: 0.9, z: 0 },
    lms[LM.RIGHT_ANKLE] ?? { x: 0.6, y: 0.9, z: 0 },
  );
  const kneeAngle = lms[LM.LEFT_KNEE]
    ? jointAngleDeg(lms[LM.LEFT_HIP], lms[LM.LEFT_KNEE], lms[LM.LEFT_ANKLE])
    : 90;
  const stanceScore =
    stanceW > 0.2 && stanceW < 0.5
      ? 100
      : Math.max(0, 100 - Math.abs(stanceW - 0.35) * 300);
  const bendScore =
    kneeAngle > 70 && kneeAngle < 120
      ? 100
      : Math.max(0, 100 - Math.abs(kneeAngle - 95) * 3);
  return Math.round(stanceScore * 0.5 + bendScore * 0.5);
};
