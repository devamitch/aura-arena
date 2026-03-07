// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Pose Correctness Engine
// Uses TF.js CPU backend to batch-compute joint angles from MediaPipe landmarks,
// then applies per-discipline exercise rules to detect form errors in real-time.
// Runs inside the Pose Web Worker — zero main-thread impact.
// ═══════════════════════════════════════════════════════════════════════════════

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JointAngle {
  name:     string;
  angle:    number;       // degrees, rounded
  expected: [number, number]; // [min, max] OK range
  ok:       boolean;
}

export interface PoseCorrectness {
  isCorrect:   boolean;
  score:       number;       // 0–100
  feedback:    string[];     // coaching cues
  jointAngles: JointAngle[];
  exercise:    string;       // e.g. "boxing_guard", "squat"
}

export type AngleMap = Record<string, number>;

// ─── MediaPipe landmark indices ───────────────────────────────────────────────

const LM = {
  LEFT_SHOULDER:  11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW:     13, RIGHT_ELBOW:    14,
  LEFT_WRIST:     15, RIGHT_WRIST:    16,
  LEFT_HIP:       23, RIGHT_HIP:      24,
  LEFT_KNEE:      25, RIGHT_KNEE:     26,
  LEFT_ANKLE:     27, RIGHT_ANKLE:    28,
} as const;

// ─── Joint triples (A, B, C) — angle measured at B ───────────────────────────

const JOINT_TRIPLES: [number, number, number][] = [
  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW,    LM.LEFT_WRIST  ],  // 0 leftElbow
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW,   LM.RIGHT_WRIST ],  // 1 rightElbow
  [LM.LEFT_ELBOW,     LM.LEFT_SHOULDER, LM.LEFT_HIP    ],  // 2 leftShoulder
  [LM.RIGHT_ELBOW,    LM.RIGHT_SHOULDER,LM.RIGHT_HIP   ],  // 3 rightShoulder
  [LM.LEFT_HIP,       LM.LEFT_KNEE,     LM.LEFT_ANKLE  ],  // 4 leftKnee
  [LM.RIGHT_HIP,      LM.RIGHT_KNEE,    LM.RIGHT_ANKLE ],  // 5 rightKnee
  [LM.LEFT_SHOULDER,  LM.LEFT_HIP,      LM.LEFT_KNEE   ],  // 6 leftHip
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP,     LM.RIGHT_KNEE  ],  // 7 rightHip
];

const JOINT_NAMES = [
  'leftElbow', 'rightElbow',
  'leftShoulder', 'rightShoulder',
  'leftKnee', 'rightKnee',
  'leftHip', 'rightHip',
] as const;

// ─── TF.js initialisation ─────────────────────────────────────────────────────

let _tfReady = false;

export async function ensureTF(): Promise<void> {
  if (_tfReady) return;
  await tf.setBackend('cpu');
  await tf.ready();
  _tfReady = true;
}

// ─── Batch angle computation (single TF tidy — no GC pressure) ───────────────
// All 8 joint angles computed in one tensor operation.

type Lm = { x: number; y: number; z?: number; visibility?: number };

export function computeAngles(lms: Lm[]): AngleMap {
  if (!lms || lms.length < 29) return {};

  return tf.tidy(() => {
    const As = tf.tensor2d(JOINT_TRIPLES.map(([a])    => [lms[a].x, lms[a].y]));
    const Bs = tf.tensor2d(JOINT_TRIPLES.map(([, b])  => [lms[b].x, lms[b].y]));
    const Cs = tf.tensor2d(JOINT_TRIPLES.map(([,, c]) => [lms[c].x, lms[c].y]));

    const BA  = tf.sub(As, Bs);                         // [8, 2]
    const BC  = tf.sub(Cs, Bs);                         // [8, 2]

    const dot   = tf.sum(tf.mul(BA, BC), 1);            // [8]
    const magBA = tf.sqrt(tf.sum(tf.square(BA), 1));    // [8]
    const magBC = tf.sqrt(tf.sum(tf.square(BC), 1));    // [8]

    const denom  = tf.add(tf.mul(magBA, magBC), 1e-7);  // avoid div/0
    const cosine = tf.clipByValue(tf.div(dot, denom), -1, 1);
    const deg    = tf.mul(tf.acos(cosine), 180 / Math.PI);

    const vals = deg.dataSync();                        // sync read — worker context, OK
    const map: AngleMap = {};
    JOINT_NAMES.forEach((name, i) => { map[name] = vals[i]; });
    return map;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type CheckResult = { joint: JointAngle; cue: string | null };

function checkJoint(
  name:     string,
  angle:    number,
  min:      number,
  max:      number,
  cue:      string,
): CheckResult {
  const ok = Number.isFinite(angle) && angle >= min && angle <= max;
  return {
    joint: { name, angle: Math.round(angle), expected: [min, max], ok },
    cue:   ok ? null : cue,
  };
}

function buildResult(
  checks:   CheckResult[],
  exercise: string,
  extra:    string[] = [],
): PoseCorrectness {
  const feedback = [
    ...checks.map(c => c.cue).filter(Boolean) as string[],
    ...extra,
  ].slice(0, 3); // max 3 cues at once — don't overwhelm the athlete
  const score = Math.round(100 - (feedback.length / Math.max(checks.length, 1)) * 100);
  return {
    isCorrect:   score >= 70,
    score,
    feedback,
    jointAngles: checks.map(c => c.joint),
    exercise,
  };
}

// ─── Per-discipline rules ─────────────────────────────────────────────────────

function checkBoxing(a: AngleMap): PoseCorrectness {
  return buildResult([
    checkJoint('leftElbow',   a.leftElbow,   60, 125, 'Tuck left elbow — guard position'),
    checkJoint('rightElbow',  a.rightElbow,  60, 125, 'Keep right elbow in — protect your chin'),
    checkJoint('leftKnee',    a.leftKnee,    140, 175, 'Soft knees — stay light on your feet'),
    checkJoint('rightKnee',   a.rightKnee,   140, 175, 'Slight bend — ready to move'),
  ], 'boxing_guard');
}

function checkYoga(a: AngleMap, sub?: string): PoseCorrectness {
  // Warrior I / Warrior II
  if (!sub || sub.includes('warrior')) {
    return buildResult([
      checkJoint('leftKnee',  a.leftKnee,  80, 100, 'Bend front knee to 90°'),
      checkJoint('rightKnee', a.rightKnee, 155, 180, 'Straighten back leg fully'),
      checkJoint('leftHip',   a.leftHip,   85, 110, 'Square your hips forward'),
    ], 'yoga_warrior');
  }
  // Forward fold / downward dog
  return buildResult([
    checkJoint('leftKnee',  a.leftKnee,  155, 180, 'Straighten your legs'),
    checkJoint('rightKnee', a.rightKnee, 155, 180, 'Press heels toward the floor'),
    checkJoint('leftHip',   a.leftHip,   45, 85,   'Hinge deeper from your hips'),
  ], 'yoga_fold');
}

function checkSquat(a: AngleMap): PoseCorrectness {
  const balance = Math.abs(a.leftKnee - a.rightKnee);
  const extra   = balance > 18 ? ['Balance weight evenly on both feet'] : [];
  return buildResult([
    checkJoint('leftKnee',  a.leftKnee,  75, 110, 'Squat deeper — aim for 90° at the knees'),
    checkJoint('rightKnee', a.rightKnee, 75, 110, 'Depth looks uneven — check your stance'),
    checkJoint('leftHip',   a.leftHip,   70, 110, 'Chest up — lean forward less'),
  ], 'squat', extra);
}

function checkLunge(a: AngleMap): PoseCorrectness {
  return buildResult([
    checkJoint('leftKnee',  a.leftKnee,  80, 100, 'Front knee at 90° — track over toes'),
    checkJoint('rightKnee', a.rightKnee, 80, 100, 'Lower back knee toward the floor'),
    checkJoint('leftHip',   a.leftHip,   85, 110, 'Keep torso upright — tall spine'),
  ], 'lunge');
}

function checkMartialArts(a: AngleMap): PoseCorrectness {
  return buildResult([
    checkJoint('leftKnee',      a.leftKnee,      100, 150, 'Drop your stance — bend knees deeper'),
    checkJoint('rightKnee',     a.rightKnee,     100, 150, 'Both knees bent equally'),
    checkJoint('leftShoulder',  a.leftShoulder,  55, 120,  'Raise your guard — hands up'),
    checkJoint('rightShoulder', a.rightShoulder, 55, 120,  'Keep hands at chin level'),
  ], 'martial_stance');
}

function checkCalisthenics(a: AngleMap, sub?: string): PoseCorrectness {
  if (sub === 'pushup') {
    return buildResult([
      checkJoint('leftElbow',  a.leftElbow,  75, 100, 'Lower to 90° at the elbows'),
      checkJoint('rightElbow', a.rightElbow, 75, 100, 'Keep elbows close to body'),
      checkJoint('leftHip',    a.leftHip,    155, 180, 'Body in a straight plank — don\'t sag'),
    ], 'pushup');
  }
  if (sub === 'pullup') {
    return buildResult([
      checkJoint('leftElbow',  a.leftElbow,  30, 80, 'Pull higher — chin over bar'),
      checkJoint('rightElbow', a.rightElbow, 30, 80, 'Full range of motion'),
      checkJoint('leftHip',    a.leftHip,    155, 180, 'Hollow body — no swinging'),
    ], 'pullup');
  }
  // Default: squat / air squat
  return checkSquat(a);
}

function checkDance(a: AngleMap): PoseCorrectness {
  return buildResult([
    checkJoint('leftShoulder',  a.leftShoulder,  75, 155, 'Extend arms for expression'),
    checkJoint('rightShoulder', a.rightShoulder, 75, 155, 'Match arm levels on both sides'),
    checkJoint('leftKnee',      a.leftKnee,      130, 180, 'Extend through your legs'),
  ], 'dance_form');
}

function checkGymnastics(a: AngleMap): PoseCorrectness {
  return buildResult([
    checkJoint('leftKnee',      a.leftKnee,      155, 180, 'Point your toes — full extension'),
    checkJoint('rightKnee',     a.rightKnee,     155, 180, 'Legs together and straight'),
    checkJoint('leftShoulder',  a.leftShoulder,  155, 180, 'Arms fully overhead'),
    checkJoint('rightShoulder', a.rightShoulder, 155, 180, 'Reach up — full stretch'),
  ], 'gymnastics_extension');
}

function checkPilates(a: AngleMap): PoseCorrectness {
  return buildResult([
    checkJoint('leftHip',  a.leftHip,  80, 110, 'Neutral spine — engage your core'),
    checkJoint('rightHip', a.rightHip, 80, 110, 'Level hips — no rotation'),
    checkJoint('leftKnee', a.leftKnee, 85, 100, 'Tabletop position — 90° at the knees'),
  ], 'pilates_tabletop');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const POSE_OK: PoseCorrectness = {
  isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: 'idle',
};

export function checkExerciseForm(
  lms:         Lm[],
  discipline:  string,
  subDiscipline?: string,
): PoseCorrectness {
  if (!lms || lms.length < 29) return POSE_OK;

  // Require key body points to be visible before giving feedback
  const keyIdx = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP];
  const avgVis = keyIdx.reduce((s, i) => s + (lms[i]?.visibility ?? 0), 0) / keyIdx.length;
  if (avgVis < 0.45) return POSE_OK;

  const angles = computeAngles(lms);

  switch (discipline) {
    case 'boxing':       return checkBoxing(angles);
    case 'yoga':         return checkYoga(angles, subDiscipline);
    case 'martialarts':  return checkMartialArts(angles);
    case 'calisthenics': return checkCalisthenics(angles, subDiscipline);
    case 'fitness':      return checkSquat(angles);
    case 'bodybuilding': return checkSquat(angles);
    case 'dance':        return checkDance(angles);
    case 'gymnastics':   return checkGymnastics(angles);
    case 'pilates':      return checkPilates(angles);
    case 'parkour':      return checkLunge(angles);
    default:             return POSE_OK;
  }
}
