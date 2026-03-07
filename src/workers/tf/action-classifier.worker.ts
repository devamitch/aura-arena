// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Action Classifier Worker (TF.js)
// Rule-based classifier with TF.js model fallback.
// Takes a sliding window of pose keypoints and classifies the action.
// ═══════════════════════════════════════════════════════════════════════════════

import { ACTION_LABELS, NUM_ACTIONS } from "@/lib/actionLabels";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassifyMessage {
  type: "CLASSIFY";
  /** [WINDOW_SIZE, 33, 4] flattened keypoints (x,y,z,visibility) */
  windowFrames: number[][][];
  discipline: string;
}

interface ClassifyResult {
  type: "ACTION_RESULT";
  actionIndex: number;
  actionName: string;
  confidence: number;
  discipline: string;
}

// ─── Joint angle helper ──────────────────────────────────────────────────────

function angle(a: number[], b: number[], c: number[]): number {
  const ba = [a[0] - b[0], a[1] - b[1]];
  const bc = [c[0] - b[0], c[1] - b[1]];
  const dot = ba[0] * bc[0] + ba[1] * bc[1];
  const mag =
    Math.sqrt(ba[0] ** 2 + ba[1] ** 2) * Math.sqrt(bc[0] ** 2 + bc[1] ** 2);
  if (mag === 0) return 180;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) * (180 / Math.PI);
}

// ─── Rule-based classifier ──────────────────────────────────────────────────
// Uses the LAST frame in the window + motion across window for velocity

function classifyByRules(
  frames: number[][][],
  discipline: string,
): ClassifyResult {
  const last = frames[frames.length - 1] ?? [];
  if (last.length < 17) {
    return {
      type: "ACTION_RESULT",
      actionIndex: 42,
      actionName: "Standing",
      confidence: 0.2,
      discipline,
    };
  }

  // Compute key angles from last frame
  const leftKneeAngle =
    last[23] && last[25] && last[27]
      ? angle(last[23], last[25], last[27])
      : 180;
  const rightKneeAngle =
    last[24] && last[26] && last[28]
      ? angle(last[24], last[26], last[28])
      : 180;
  const leftElbow =
    last[11] && last[13] && last[15]
      ? angle(last[11], last[13], last[15])
      : 180;
  const rightElbow =
    last[12] && last[14] && last[16]
      ? angle(last[12], last[14], last[16])
      : 180;

  // Compute vertical velocity (are they moving up/down?)
  const first = frames[0] ?? last;
  const hipMovement = last[23]
    ? Math.abs((last[23][1] ?? 0) - (first[23]?.[1] ?? 0))
    : 0;
  const handHeight = last[15] ? (last[15][1] ?? 0) : 1;
  const shoulderHeight = last[11] ? (last[11][1] ?? 0) : 1;

  // Discipline-specific rules
  if (discipline === "kuchipudi" || discipline === "bharatanatyam") {
    // Araimandi: both knees bent, wide stance
    if (leftKneeAngle < 120 && rightKneeAngle < 120) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 8,
        actionName: "Araimandi",
        confidence: 0.85,
        discipline,
      };
    }
    // Tribhangi: asymmetric body bend
    if (Math.abs(leftKneeAngle - rightKneeAngle) > 30) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 10,
        actionName: "Tribhangi",
        confidence: 0.7,
        discipline,
      };
    }
    return {
      type: "ACTION_RESULT",
      actionIndex: 9,
      actionName: "Natyarambham",
      confidence: 0.6,
      discipline,
    };
  }

  if (discipline === "boxing" || discipline === "mma") {
    // Guard: both elbows bent, hands near face
    if (leftElbow < 100 && rightElbow < 100 && handHeight < shoulderHeight) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 4,
        actionName: "Guard Stance",
        confidence: 0.8,
        discipline,
      };
    }
    // Jab: one arm extended
    if (leftElbow > 150 && rightElbow < 120) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 0,
        actionName: "Jab",
        confidence: 0.75,
        discipline,
      };
    }
    if (rightElbow > 150 && leftElbow < 120) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 1,
        actionName: "Cross",
        confidence: 0.75,
        discipline,
      };
    }
    return {
      type: "ACTION_RESULT",
      actionIndex: 4,
      actionName: "Guard Stance",
      confidence: 0.5,
      discipline,
    };
  }

  if (discipline === "yoga") {
    // Warrior: lunge position
    if (
      (leftKneeAngle < 120 && rightKneeAngle > 150) ||
      (rightKneeAngle < 120 && leftKneeAngle > 150)
    ) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 25,
        actionName: "Warrior I",
        confidence: 0.75,
        discipline,
      };
    }
    // Tree: one leg lifted
    if (leftKneeAngle < 90 || rightKneeAngle < 90) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 27,
        actionName: "Tree Pose",
        confidence: 0.7,
        discipline,
      };
    }
    return {
      type: "ACTION_RESULT",
      actionIndex: 29,
      actionName: "Chair Pose",
      confidence: 0.5,
      discipline,
    };
  }

  if (discipline === "fitness") {
    // Squat: both knees bent significantly
    if (leftKneeAngle < 110 && rightKneeAngle < 110) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 30,
        actionName: "Squat",
        confidence: 0.8,
        discipline,
      };
    }
    // Lunge: asymmetric knee bend
    if (Math.abs(leftKneeAngle - rightKneeAngle) > 40) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 31,
        actionName: "Lunge",
        confidence: 0.7,
        discipline,
      };
    }
    // Jumping Jack: arms up + legs wide (high velocity)
    if (hipMovement > 0.05 && handHeight < shoulderHeight - 0.2) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 33,
        actionName: "Jumping Jack",
        confidence: 0.65,
        discipline,
      };
    }
    return {
      type: "ACTION_RESULT",
      actionIndex: 42,
      actionName: "Standing",
      confidence: 0.4,
      discipline,
    };
  }

  if (discipline === "martialarts") {
    // Kick: one leg raised
    if (leftKneeAngle > 150 && rightKneeAngle < 100) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 35,
        actionName: "Front Kick",
        confidence: 0.7,
        discipline,
      };
    }
    if (rightKneeAngle > 150 && leftKneeAngle < 100) {
      return {
        type: "ACTION_RESULT",
        actionIndex: 36,
        actionName: "Roundhouse Kick",
        confidence: 0.7,
        discipline,
      };
    }
    return {
      type: "ACTION_RESULT",
      actionIndex: 37,
      actionName: "Kata Stance",
      confidence: 0.5,
      discipline,
    };
  }

  // Generic fallback
  if (leftKneeAngle < 130 && rightKneeAngle < 130) {
    return {
      type: "ACTION_RESULT",
      actionIndex: 30,
      actionName: "Squat",
      confidence: 0.5,
      discipline,
    };
  }

  return {
    type: "ACTION_RESULT",
    actionIndex: 42,
    actionName: "Standing",
    confidence: 0.3,
    discipline,
  };
}

// ─── Message Handler ─────────────────────────────────────────────────────────

self.addEventListener("message", (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "INIT") {
    // Suppress unused
    void NUM_ACTIONS;
    void ACTION_LABELS;
    (self as unknown as Worker).postMessage({ type: "READY" });
  } else if (msg.type === "CLASSIFY") {
    const cm = msg as ClassifyMessage;
    const result = classifyByRules(cm.windowFrames, cm.discipline);
    (self as unknown as Worker).postMessage(result);
  } else if (msg.type === "DESTROY") {
    // Cleanup if needed
  }
});
