// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Functional Score Engine
// Pure functions. No classes. Type-safe throughout.
// Handles all discipline/sub-discipline scoring nuances.
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  DisciplineId,
  Drill,
  FrameScore,
  Landmark,
  RawScoreComponents,
  ScoringWeights,
  SessionScoreSummary,
  SubDisciplineId,
} from "@types";
import { getDiscipline, getSubDiscipline } from "@utils/constants/disciplines";

// ─── MEDIAPIPE LANDMARK INDICES ───────────────────────────────────────────────
// Names match MediaPipe Pose Landmarker indices exactly
export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Key joint groups per scoring domain
export const JOINT_GROUPS = {
  upper_body: [
    LM.LEFT_SHOULDER,
    LM.RIGHT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.RIGHT_ELBOW,
    LM.LEFT_WRIST,
    LM.RIGHT_WRIST,
  ],
  lower_body: [
    LM.LEFT_HIP,
    LM.RIGHT_HIP,
    LM.LEFT_KNEE,
    LM.RIGHT_KNEE,
    LM.LEFT_ANKLE,
    LM.RIGHT_ANKLE,
  ],
  torso: [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP],
  arms: [
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
  ],
  legs: [
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
  ],
  face: [LM.NOSE, LM.LEFT_EYE, LM.RIGHT_EYE, LM.MOUTH_LEFT, LM.MOUTH_RIGHT],
  hands: [LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_INDEX, LM.RIGHT_INDEX],
  feet: [
    LM.LEFT_ANKLE,
    LM.RIGHT_ANKLE,
    LM.LEFT_FOOT_INDEX,
    LM.RIGHT_FOOT_INDEX,
  ],
  spine: [
    LM.NOSE,
    LM.LEFT_SHOULDER,
    LM.RIGHT_SHOULDER,
    LM.LEFT_HIP,
    LM.RIGHT_HIP,
  ],
} as const;

// ─── VECTOR MATH (pure functions) ─────────────────────────────────────────────

export const vec3 = {
  from: (lm: Landmark): [number, number, number] => [lm.x, lm.y, lm.z],

  dot: (
    [ax, ay, az]: [number, number, number],
    [bx, by, bz]: [number, number, number],
  ): number => ax * bx + ay * by + az * bz,

  mag: ([x, y, z]: [number, number, number]): number =>
    Math.sqrt(x * x + y * y + z * z),

  sub: (
    [ax, ay, az]: [number, number, number],
    [bx, by, bz]: [number, number, number],
  ): [number, number, number] => [ax - bx, ay - by, az - bz],

  cosAngle: (
    a: [number, number, number],
    b: [number, number, number],
  ): number => {
    const d = vec3.dot(a, b);
    const m = vec3.mag(a) * vec3.mag(b);
    return m === 0 ? 0 : Math.max(-1, Math.min(1, d / m));
  },
};

// Joint angle in degrees: vertex at B, rays B→A and B→C
export const jointAngleDeg = (
  a: Landmark,
  b: Landmark,
  c: Landmark,
): number => {
  const ba = vec3.sub(vec3.from(a), vec3.from(b));
  const bc = vec3.sub(vec3.from(c), vec3.from(b));
  return (Math.acos(vec3.cosAngle(ba, bc)) * 180) / Math.PI;
};

// 2D distance between two landmarks (ignores z)
export const lmDist2D = (a: Landmark, b: Landmark): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

// Midpoint of two landmarks
export const midpoint = (a: Landmark, b: Landmark): Landmark => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: (a.z + b.z) / 2,
});

// Bilateral symmetry score (0→1, 1 = perfect symmetry)
export const bilateralSymmetry = (lms: Landmark[]): number => {
  const pairs: [number, number][] = [
    [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    [LM.LEFT_ELBOW, LM.RIGHT_ELBOW],
    [LM.LEFT_WRIST, LM.RIGHT_WRIST],
    [LM.LEFT_HIP, LM.RIGHT_HIP],
    [LM.LEFT_KNEE, LM.RIGHT_KNEE],
    [LM.LEFT_ANKLE, LM.RIGHT_ANKLE],
  ];
  const centerX = 0.5;
  let totalDiff = 0;
  let count = 0;
  for (const [l, r] of pairs) {
    if (!lms[l] || !lms[r]) continue;
    const leftDist = Math.abs(lms[l].x - centerX);
    const rightDist = Math.abs(lms[r].x - centerX);
    const yDiff = Math.abs(lms[l].y - lms[r].y);
    totalDiff += Math.abs(leftDist - rightDist) + yDiff * 0.5;
    count++;
  }
  return count === 0 ? 1 : Math.max(0, 1 - totalDiff / count / 0.1);
};

// ─── COSINE SIMILARITY (whole pose) ──────────────────────────────────────────

export const poseCosineSimilarity = (a: Landmark[], b: Landmark[]): number => {
  const len = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i].x * b[i].x + a[i].y * b[i].y + a[i].z * b[i].z;
    na += a[i].x ** 2 + a[i].y ** 2 + a[i].z ** 2;
    nb += b[i].x ** 2 + b[i].y ** 2 + b[i].z ** 2;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : Math.max(0, Math.min(1, dot / denom));
};

// ─── JITTER ANALYSIS ──────────────────────────────────────────────────────────

export const computeJitter = (
  current: Landmark[],
  previous: Landmark[],
): number => {
  if (!previous.length) return 0;
  const len = Math.min(current.length, previous.length);
  let total = 0;
  for (let i = 0; i < len; i++) {
    total += lmDist2D(current[i], previous[i]);
  }
  return total / len; // avg landmark displacement per frame
};

// Stability from jitter (0→100, 100 = perfectly still)
export const jitterToStability = (jitter: number): number =>
  Math.max(0, Math.min(100, 100 - (jitter / 0.06) * 100));

// ─── RHYTHM / TIMING ENGINE ───────────────────────────────────────────────────

export interface RhythmState {
  expectedBPM: number;
  lastBeatTime: number;
  beatHistory: number[]; // timestamps of detected movement peaks
  phaseOffset: number;
}

export const createRhythmState = (bpm: number): RhythmState => ({
  expectedBPM: bpm,
  lastBeatTime: 0,
  beatHistory: [],
  phaseOffset: 0,
});

// Score timing accuracy 0→100 based on movement phase vs expected beat grid
export const scoreRhythm = (
  state: RhythmState,
  lms: Landmark[],
  nowMs: number,
): { score: number; updatedState: RhythmState } => {
  const beatPeriodMs = (60 / state.expectedBPM) * 1000;
  const phaseInBeat = (nowMs % beatPeriodMs) / beatPeriodMs; // 0→1

  // Detect "beat" using wrist velocity proxy (movement oscillation)
  const lw = lms[LM.LEFT_WRIST];
  const rw = lms[LM.RIGHT_WRIST];
  if (!lw || !rw) return { score: 70, updatedState: state };

  // Movement energy: deviation of wrists from center
  const energy = lmDist2D(lw, rw);
  const expectedEnergy = Math.abs(Math.sin(phaseInBeat * Math.PI * 2)) * 0.3;

  // Phase error: how far off is actual movement from expected beat shape
  const phaseError = Math.abs(energy - expectedEnergy);
  const score = Math.max(0, Math.min(100, 100 - phaseError * 300));

  const newBeatHistory = [...state.beatHistory.slice(-20), nowMs];

  return {
    score,
    updatedState: { ...state, beatHistory: newBeatHistory },
  };
};

// ─── DISCIPLINE-SPECIFIC SCORERS ──────────────────────────────────────────────

// Boxing: score strike power from wrist velocity + guard stability
export const scoreBoxingFrame = (
  lms: Landmark[],
  prev: Landmark[],
  weights: ScoringWeights,
): Partial<FrameScore> => {
  const lw = lms[LM.LEFT_WRIST];
  const rw = lms[LM.RIGHT_WRIST];
  const ln = lms[LM.LEFT_SHOULDER];
  const rn = lms[LM.RIGHT_SHOULDER];
  if (!lw || !rw || !ln || !rn) return {};

  // Power: wrist velocity
  const leftVel = prev[LM.LEFT_WRIST] ? lmDist2D(lw, prev[LM.LEFT_WRIST]) : 0;
  const rightVel = prev[LM.RIGHT_WRIST]
    ? lmDist2D(rw, prev[LM.RIGHT_WRIST])
    : 0;
  const power = Math.min(100, (Math.max(leftVel, rightVel) / 0.08) * 100);

  // Guard: elbows tucked, wrists near shoulders
  const leftGuard = Math.max(0, 1 - lmDist2D(lw, ln) / 0.3);
  const rightGuard = Math.max(0, 1 - lmDist2D(rw, rn) / 0.3);
  const guardScore = ((leftGuard + rightGuard) / 2) * 100;

  // Elbow angle for jab extension
  const elbowAngle = lms[LM.LEFT_ELBOW]
    ? jointAngleDeg(
        lms[LM.LEFT_SHOULDER],
        lms[LM.LEFT_ELBOW],
        lms[LM.LEFT_WRIST],
      )
    : 90;
  const extensionScore =
    elbowAngle > 140 ? Math.min(100, ((elbowAngle - 140) / 40) * 100) : 0;

  return {
    power: Math.round(power),
    stability: Math.round(guardScore),
    accuracy: Math.round(guardScore * 0.5 + extensionScore * 0.5),
  };
};

// Dance Indian Classical: score mudra precision from hand landmarks
export const scoreMudraFrame = (
  lms: Landmark[],
  subStyle: SubDisciplineId,
): number => {
  const lw = lms[LM.LEFT_WRIST];
  const rw = lms[LM.RIGHT_WRIST];
  const li = lms[LM.LEFT_INDEX];
  const ri = lms[LM.RIGHT_INDEX];
  if (!lw || !rw) return 70;

  // Expressiveness: hands raised, symmetrical positioning
  const handsRaised = (lw.y < 0.7 ? 1 : 0) + (rw.y < 0.7 ? 1 : 0);
  const handSymmetry = 1 - Math.abs(lw.y - rw.y) * 2;
  const fingerExtension =
    li && ri ? (lmDist2D(lw, li) + lmDist2D(rw, ri)) / 2 / 0.15 : 0.7;

  return Math.min(
    100,
    Math.round(handsRaised * 20 + handSymmetry * 40 + fingerExtension * 40),
  );
};

// Yoga: score balance from single-leg stance variance
export const scoreYogaBalance = (
  lms: Landmark[],
  frameWindow: Landmark[][],
): number => {
  const lAnkle = lms[LM.LEFT_ANKLE];
  const rAnkle = lms[LM.RIGHT_ANKLE];
  const hip = midpoint(
    lms[LM.LEFT_HIP] ?? { x: 0.5, y: 0.5, z: 0 },
    lms[LM.RIGHT_HIP] ?? { x: 0.5, y: 0.5, z: 0 },
  );
  if (!lAnkle || !rAnkle) return 70;

  // Detect single-leg: one foot much higher than other
  const isBalance = Math.abs(lAnkle.y - rAnkle.y) > 0.15;
  if (!isBalance) return 80; // both feet on ground — no balance challenge

  // Sway: hip position variance over last N frames
  const hipPositions = frameWindow.map((f) => f[LM.LEFT_HIP]?.x ?? 0.5);
  const mean = hipPositions.reduce((a, b) => a + b, 0) / hipPositions.length;
  const variance =
    hipPositions.reduce((a, x) => a + (x - mean) ** 2, 0) / hipPositions.length;
  const sway = Math.sqrt(variance);

  return Math.max(0, Math.min(100, 100 - (sway / 0.01) * 30));
};

// Gymnastics: score body extension (straight lines)
export const scoreExtension = (lms: Landmark[]): number => {
  // Score how straight the body line is in key moments
  const shoulder = midpoint(
    lms[LM.LEFT_SHOULDER] ?? { x: 0.5, y: 0.2, z: 0 },
    lms[LM.RIGHT_SHOULDER] ?? { x: 0.5, y: 0.2, z: 0 },
  );
  const hip = midpoint(
    lms[LM.LEFT_HIP] ?? { x: 0.5, y: 0.5, z: 0 },
    lms[LM.RIGHT_HIP] ?? { x: 0.5, y: 0.5, z: 0 },
  );
  const ankle = midpoint(
    lms[LM.LEFT_ANKLE] ?? { x: 0.5, y: 0.9, z: 0 },
    lms[LM.RIGHT_ANKLE] ?? { x: 0.5, y: 0.9, z: 0 },
  );

  // Spine angle (should be < 10° deviation for extensions)
  const spineAngle = Math.abs(shoulder.x - ankle.x);
  const hipDeviation = Math.abs(hip.x - (shoulder.x + ankle.x) / 2);

  const lineScore = Math.max(0, 1 - (spineAngle + hipDeviation) * 5);
  return Math.min(100, Math.round(lineScore * 100));
};

// Bodybuilding: score pose quality from symmetry + muscle engagement proxy
export const scorePose = (lms: Landmark[]): number => {
  const sym = bilateralSymmetry(lms);

  // Shoulder width relative to hip width (V-taper indicator)
  const shoulderWidth = lmDist2D(
    lms[LM.LEFT_SHOULDER] ?? { x: 0.3, y: 0.2, z: 0 },
    lms[LM.RIGHT_SHOULDER] ?? { x: 0.7, y: 0.2, z: 0 },
  );
  const hipWidth = lmDist2D(
    lms[LM.LEFT_HIP] ?? { x: 0.35, y: 0.5, z: 0 },
    lms[LM.RIGHT_HIP] ?? { x: 0.65, y: 0.5, z: 0 },
  );
  const vTaper = hipWidth > 0 ? Math.min(1, shoulderWidth / hipWidth) : 0.5;

  // Arms at specific mandatory-pose angles
  const leftElbowAngle = lms[LM.LEFT_ELBOW]
    ? jointAngleDeg(
        lms[LM.LEFT_SHOULDER],
        lms[LM.LEFT_ELBOW],
        lms[LM.LEFT_WRIST],
      )
    : 90;
  const poseQuality = leftElbowAngle > 60 && leftElbowAngle < 140 ? 1 : 0.6;

  return Math.min(100, Math.round(sym * 40 + vTaper * 30 + poseQuality * 30));
};

// Calisthenics: score isometric hold stability
export const scoreStaticHold = (
  lms: Landmark[],
  frameWindow: Landmark[][],
): number => {
  if (frameWindow.length < 5) return 70;

  // Measure key joint position variance over hold period
  const joints = [LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];
  let totalVar = 0;
  let count = 0;

  for (const j of joints) {
    const positions = frameWindow.map((f) => ({
      x: f[j]?.x ?? 0,
      y: f[j]?.y ?? 0,
    }));
    const mx = positions.reduce((a, p) => a + p.x, 0) / positions.length;
    const my = positions.reduce((a, p) => a + p.y, 0) / positions.length;
    const vx =
      positions.reduce((a, p) => a + (p.x - mx) ** 2, 0) / positions.length;
    const vy =
      positions.reduce((a, p) => a + (p.y - my) ** 2, 0) / positions.length;
    totalVar += Math.sqrt(vx + vy);
    count++;
  }

  const avgVar = count > 0 ? totalVar / count : 0;
  return Math.max(0, Math.min(100, Math.round(100 - (avgVar / 0.005) * 100)));
};

// Martial arts: score kata execution — angles + transitions + power
export const scoreKataFrame = (
  lms: Landmark[],
  prev: Landmark[],
): Partial<FrameScore> => {
  // Front stance (zenkutsu-dachi): front knee bent ~90°, back leg straight
  const leftKnee = lms[LM.LEFT_KNEE];
  const leftHip = lms[LM.LEFT_HIP];
  const leftAnkle = lms[LM.LEFT_ANKLE];
  const stanceAngle =
    leftKnee && leftHip && leftAnkle
      ? jointAngleDeg(leftHip, leftKnee, leftAnkle)
      : 90;
  const stanceScore = Math.max(0, 100 - Math.abs(stanceAngle - 90) * 2);

  // Strike velocity: hand speed
  const jitter = computeJitter(lms, prev);
  const powerScore = Math.min(100, (jitter / 0.04) * 100);

  // Symmetry for kata
  const symScore = bilateralSymmetry(lms) * 100;

  return {
    accuracy: Math.round(stanceScore),
    power: Math.round(powerScore),
    stability: Math.round(symScore),
  };
};

// ─── IDEAL POSE GENERATOR ─────────────────────────────────────────────────────
// Generates a sinusoidal reference pose for scoring when no ground truth exists

export const generateIdealPose = (
  discipline: DisciplineId,
  elapsedMs: number,
): Landmark[] => {
  const t = elapsedMs / 1000;
  const rhythms: Record<DisciplineId, number> = {
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
  const r = rhythms[discipline] ?? 1.0;
  const phase = (t % r) / r;

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

// ─── MASTER FRAME SCORER ──────────────────────────────────────────────────────
// Called every animation frame. Pure function — no side effects.

export interface ScoreFrameInput {
  landmarks: Landmark[];
  previousLandmarks: Landmark[];
  frameWindow: Landmark[][]; // last N frames
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  drill?: Drill;
  elapsedMs: number;
  rhythmState: RhythmState;
  currentCombo: number;
  lastComboTime: number;
  gestures?: { categoryName: string; score: number }[][];
}

export interface ScoreFrameOutput {
  frameScore: FrameScore;
  raw: RawScoreComponents;
  updatedRhythmState: RhythmState;
  newCombo: number;
  newLastComboTime: number;
}

export const scoreFrame = (input: ScoreFrameInput): ScoreFrameOutput => {
  const {
    landmarks: lms,
    previousLandmarks: prev,
    frameWindow,
    discipline,
    subDiscipline,
    drill,
    elapsedMs,
    rhythmState,
    currentCombo,
    lastComboTime,
    gestures,
  } = input;

  if (!lms.length) {
    return {
      frameScore: zeroScore(),
      raw: zeroRaw(),
      updatedRhythmState: rhythmState,
      newCombo: 0,
      newLastComboTime: lastComboTime,
    };
  }

  // Get weights — prefer sub-discipline weights when available
  const subDisc = subDiscipline ? getSubDiscipline(subDiscipline) : undefined;
  const disc = getDiscipline(discipline);
  const weights: ScoringWeights =
    subDisc?.scoringWeights ?? disc.scoringWeights;

  // ── Raw components ──────────────────────────────────────────────────────────

  const ideal = generateIdealPose(discipline, elapsedMs);
  const cosineSimilarity = poseCosineSimilarity(lms, ideal);
  const jitterMagnitude = computeJitter(lms, prev);
  const symmetryScore = bilateralSymmetry(lms);
  const keypointConfidence =
    lms.reduce((a, l) => a + (l.visibility ?? 1), 0) / lms.length;

  const { score: rhythmScore, updatedState: updatedRhythmState } =
    rhythmState.expectedBPM
      ? scoreRhythm(rhythmState, lms, Date.now())
      : { score: 72, updatedState: rhythmState };

  // Velocity score: movement appropriate to discipline
  const velocityScore = computeVelocityScore(jitterMagnitude, discipline);

  // Depth: using z coordinates if available
  const depthScore = lms.some((l) => Math.abs(l.z) > 0.01)
    ? Math.min(1, lms.reduce((a, l) => a + Math.abs(l.z), 0) / lms.length / 0.1)
    : 0.5;

  const raw: RawScoreComponents = {
    cosineSimilarity,
    jitterMagnitude,
    rhythmPhaseError: 1 - rhythmScore / 100,
    symmetryScore,
    depthScore,
    velocityScore,
    keypointConfidence,
  };

  // ── Per-discipline specialised scores ────────────────────────────────────────

  let accuracy = Math.round(cosineSimilarity * 100);
  let stability = jitterToStability(jitterMagnitude);
  let timing = rhythmScore;
  let expressiveness = 60;
  let power = 50;
  let balance = 70;

  switch (discipline) {
    case "boxing": {
      const boxing = scoreBoxingFrame(lms, prev, weights);
      if (boxing.power !== undefined) power = boxing.power;
      if (boxing.stability !== undefined) stability = boxing.stability;
      if (boxing.accuracy !== undefined) accuracy = boxing.accuracy;
      break;
    }
    case "dance": {
      const isIndianClassical =
        subDiscipline &&
        [
          "bharatnatyam",
          "kathak",
          "odissi",
          "kuchipudi",
          "manipuri",
          "mohiniyattam",
          "sattriya",
        ].includes(subDiscipline);
      expressiveness = isIndianClassical
        ? scoreMudraFrame(lms, subDiscipline as SubDisciplineId)
        : Math.round(symmetryScore * 80 + keypointConfidence * 20);
      timing = rhythmScore;
      break;
    }
    case "yoga": {
      balance = scoreYogaBalance(lms, frameWindow);
      expressiveness = Math.round(keypointConfidence * 100);
      // Stillness rewards stability highly in yoga
      stability = Math.min(100, stability * 1.3);
      break;
    }
    case "gymnastics": {
      accuracy = Math.round(accuracy * 0.5 + scoreExtension(lms) * 0.5);
      balance = scoreYogaBalance(lms, frameWindow);
      break;
    }
    case "bodybuilding": {
      accuracy = scorePose(lms);
      expressiveness = Math.round(symmetryScore * 100);
      break;
    }
    case "calisthenics": {
      stability = scoreStaticHold(lms, frameWindow);
      accuracy = Math.round(accuracy * 0.6 + scoreExtension(lms) * 0.4);
      break;
    }
    case "martialarts": {
      const kata = scoreKataFrame(lms, prev);
      if (kata.accuracy !== undefined) accuracy = kata.accuracy;
      if (kata.power !== undefined) power = kata.power;
      if (kata.stability !== undefined) stability = kata.stability;
      break;
    }
    case "pilates": {
      const core = scoreCoreEngagement(lms);
      stability = Math.round(stability * 0.5 + core * 0.5);
      timing = Math.round(
        timing * 0.5 + (rhythmState.expectedBPM ? rhythmScore : 70) * 0.5,
      );
      break;
    }
    case "fitness": {
      power = Math.min(100, Math.round((jitterMagnitude / 0.03) * 100));
      timing = rhythmScore;
      break;
    }
    case "parkour": {
      power = Math.min(100, Math.round((jitterMagnitude / 0.05) * 100));
      balance = scoreYogaBalance(lms, frameWindow);
      break;
    }
  }

  // Clamp all to 0–100
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
  accuracy = clamp(accuracy);
  stability = clamp(stability);
  timing = clamp(timing);
  expressiveness = clamp(expressiveness);
  power = clamp(power);
  balance = clamp(balance);

  // Weighted overall score
  let overall = clamp(
    accuracy * weights.accuracy +
      stability * weights.stability +
      timing * weights.timing +
      expressiveness * weights.expressiveness +
      power * weights.power +
      balance * weights.balance,
  );

  // Gesture Bonus
  if (gestures && gestures.length > 0) {
    const topGesture = gestures[0]?.[0];
    if (topGesture && topGesture.score > 0.8) {
      if (
        ["Thumb_Up", "Victory", "Open_Palm"].includes(topGesture.categoryName)
      ) {
        overall = Math.min(100, overall + 5); // +5 bonus for "perfect" gestures
      }
    }
  }

  // ── Combo detection ─────────────────────────────────────────────────────────
  const now = Date.now();
  let newCombo = currentCombo;
  let newLastComboTime = lastComboTime;

  if (accuracy > 78 && stability > 70 && timing > 65) {
    if (now - lastComboTime < 2500) {
      newCombo = currentCombo + 1;
    } else if (now - lastComboTime > 4000) {
      newCombo = 1;
    }
    newLastComboTime = now;
  } else if (now - lastComboTime > 4000) {
    newCombo = 0;
  }

  return {
    frameScore: {
      overall,
      accuracy,
      stability,
      timing,
      expressiveness,
      power,
      balance,
      combo: newCombo,
      raw,
    },
    raw,
    updatedRhythmState,
    newCombo,
    newLastComboTime,
  };
};

// Core engagement score for pilates/yoga
const scoreCoreEngagement = (lms: Landmark[]): number => {
  const lh = lms[LM.LEFT_HIP];
  const rh = lms[LM.RIGHT_HIP];
  const ls = lms[LM.LEFT_SHOULDER];
  const rs = lms[LM.RIGHT_SHOULDER];
  if (!lh || !rh || !ls || !rs) return 70;

  const hipWidth = lmDist2D(lh, rh);
  const spineVertical = Math.abs((ls.x + rs.x) / 2 - (lh.x + rh.x) / 2);
  const spineScore = Math.max(0, 1 - spineVertical * 8);
  return Math.min(100, Math.round(spineScore * 100));
};

// Velocity appropriateness: some disciplines need speed, others need slowness
const computeVelocityScore = (
  jitter: number,
  discipline: DisciplineId,
): number => {
  const fastDisciplines = new Set<DisciplineId>([
    "boxing",
    "dance",
    "fitness",
    "parkour",
    "martialarts",
  ]);
  const slowDisciplines = new Set<DisciplineId>([
    "yoga",
    "pilates",
    "bodybuilding",
  ]);

  if (fastDisciplines.has(discipline)) {
    return Math.min(1, jitter / 0.04); // reward movement
  } else if (slowDisciplines.has(discipline)) {
    return Math.max(0, 1 - jitter / 0.02); // reward stillness
  }
  return 0.7;
};

// ─── SESSION SUMMARY COMPUTER ──────────────────────────────────────────────────

export const computeSessionSummary = (
  frameScores: FrameScore[],
  comboHistory: number[],
): SessionScoreSummary => {
  if (!frameScores.length) return emptySessionSummary();

  const overalls = frameScores.map((f) => f.overall);
  const finalScore = overalls[overalls.length - 1] ?? 0;
  const peakScore = Math.max(...overalls);
  const avgScore = Math.round(
    overalls.reduce((a, b) => a + b, 0) / overalls.length,
  );
  const maxCombo = Math.max(...comboHistory, 0);

  const avg = (key: keyof FrameScore) => {
    const vals = frameScores
      .map((f) => f[key] as number)
      .filter((v) => typeof v === "number");
    return vals.length
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      : 0;
  };

  return {
    finalScore,
    peakScore,
    avgScore,
    maxCombo,
    totalFrames: frameScores.length,
    accuracy: avg("accuracy"),
    stability: avg("stability"),
    timing: avg("timing"),
    expressiveness: avg("expressiveness"),
    power: avg("power"),
    balance: avg("balance"),
    frameHistory: overalls,
    comboHistory,
  };
};

// ─── XP / POINTS CALCULATION ──────────────────────────────────────────────────

export const calcSessionXP = (
  score: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
): number => Math.round(50 * (score / 100) * difficulty);

export const calcSessionPoints = (
  score: number,
  difficulty: 1 | 2 | 3 | 4 | 5,
): number => Math.round(calcSessionXP(score, difficulty) * 2);

export const calcPvEXP = (
  difficulty: 1 | 2 | 3 | 4 | 5,
  won: boolean,
): number => (won ? Math.round(100 * difficulty) : Math.round(30 * difficulty));

export const calcPvEPoints = (
  difficulty: 1 | 2 | 3 | 4 | 5,
  won: boolean,
): number => calcPvEXP(difficulty, won) * 2;

export const calcStreakBonus = (streak: number): number =>
  Math.round(Math.min(50, streak * 5));

export const calcMissionXP = (missionReward: number): number => missionReward;

// ─── ZERO / EMPTY HELPERS ─────────────────────────────────────────────────────

export const zeroScore = (): FrameScore => ({
  overall: 0,
  accuracy: 0,
  stability: 0,
  timing: 0,
  expressiveness: 0,
  power: 0,
  balance: 0,
  combo: 0,
  raw: zeroRaw(),
});

export const zeroRaw = (): RawScoreComponents => ({
  cosineSimilarity: 0,
  jitterMagnitude: 0,
  rhythmPhaseError: 1,
  symmetryScore: 0,
  depthScore: 0,
  velocityScore: 0,
  keypointConfidence: 0,
});

export const emptySessionSummary = (): SessionScoreSummary => ({
  finalScore: 0,
  peakScore: 0,
  avgScore: 0,
  maxCombo: 0,
  totalFrames: 0,
  accuracy: 0,
  stability: 0,
  timing: 0,
  expressiveness: 0,
  power: 0,
  balance: 0,
  frameHistory: [],
  comboHistory: [],
});

// ─── SCORE TREND ANALYSIS ──────────────────────────────────────────────────────

export interface ScoreTrend {
  direction: "improving" | "declining" | "steady";
  delta: number;
  label: string;
}

export const analyseScoreTrend = (history: number[]): ScoreTrend => {
  if (history.length < 3)
    return { direction: "steady", delta: 0, label: "Not enough data" };

  const recent = history.slice(-5);
  const older = history.slice(-10, -5);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length
    ? older.reduce((a, b) => a + b, 0) / older.length
    : recentAvg;
  const delta = recentAvg - olderAvg;

  if (delta > 2)
    return {
      direction: "improving",
      delta,
      label: `Improving +${delta.toFixed(1)} pts`,
    };
  if (delta < -2)
    return {
      direction: "declining",
      delta,
      label: `Declining ${delta.toFixed(1)} pts`,
    };
  return { direction: "steady", delta, label: "Steady" };
};
