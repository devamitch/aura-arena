// Aura Arena — Move Detector
// Velocity-based real-time move recognition per discipline.
// Tracks wrist/hip/knee landmark velocities to classify moves and estimate power.
//
// Landmark indices (MediaPipe PoseLandmarker, 33 points):
//   0=nose   11=l-shoulder  12=r-shoulder
//   13=l-elbow  14=r-elbow
//   15=l-wrist  16=r-wrist
//   23=l-hip    24=r-hip
//   25=l-knee   26=r-knee
//   27=l-ankle  28=r-ankle

export interface DetectedMove {
  name: string;       // e.g. "Jab", "Squat", "Step"
  power: number;      // 0–100
  timestamp: number;
}

export interface MoveStat {
  name: string;
  count: number;
  maxPower: number;
  totalPower: number;
  avgPower: number;
}

interface Lm { x: number; y: number; z?: number; visibility?: number }

// ── Velocity helpers ──────────────────────────────────────────────────────────
function dist2D(a: Lm, b: Lm) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function velocityTo100(vel: number, scale: number) {
  return Math.min(100, Math.round((vel / scale) * 100));
}

// ── Per-discipline move classifiers ──────────────────────────────────────────

interface FrameContext {
  lms: Lm[];
  prev: Lm[];
  dtMs: number;          // time since last frame (ms)
  timestamp: number;
}

type Classifier = (ctx: FrameContext, state: MoveDetectorState) => DetectedMove[];

// State machine helpers
interface MoveDetectorState {
  // Tracks last fired timestamp per move name to enforce cooldown
  lastFired: Record<string, number>;
  // Per-move stateful trackers
  squat: "up" | "down";
  jumpJack: "closed" | "open";
  pushUp: "up" | "down";
  lunge: "up" | "down";
  // Boxing burst counters (wrist speed)
  jabReady: boolean;
  crossReady: boolean;
}

const COOLDOWN_MS = 350; // minimum gap between same-move detections

function canFire(state: MoveDetectorState, name: string, ts: number): boolean {
  const last = state.lastFired[name] ?? 0;
  if (ts - last < COOLDOWN_MS) return false;
  state.lastFired[name] = ts;
  return true;
}

// ── BOXING classifier ─────────────────────────────────────────────────────────
const classifyBoxing: Classifier = (ctx, state) => {
  const { lms, prev, dtMs, timestamp } = ctx;
  if (!lms[15] || !lms[16] || !prev[15] || !prev[16]) return [];
  const moves: DetectedMove[] = [];

  const lWrist = lms[15], rWrist = lms[16];
  const pLWrist = prev[15], pRWrist = prev[16];
  const lShoulder = lms[11];
  const rShoulder = lms[12];

  const dtS = Math.max(dtMs, 16) / 1000;

  // Wrist velocities (normalized screen units per second)
  const lVelX = Math.abs(lWrist.x - pLWrist.x) / dtS;
  const lVelY = Math.abs(lWrist.y - pLWrist.y) / dtS;
  const rVelX = Math.abs(rWrist.x - pRWrist.x) / dtS;
  const rVelY = Math.abs(rWrist.y - pRWrist.y) / dtS;
  const lSpeed = Math.sqrt(lVelX ** 2 + lVelY ** 2);
  const rSpeed = Math.sqrt(rVelX ** 2 + rVelY ** 2);

  // JAB: left wrist high horizontal speed, hand above shoulder level
  if (lSpeed > 0.9 && lWrist.y < (lShoulder?.y ?? 0.4) + 0.1 && canFire(state, "Jab", timestamp)) {
    // Uppercut vs jab: if wrist moves up → uppercut, else jab
    const isUp = (pLWrist.y - lWrist.y) / dtS > 0.5;
    const name = isUp ? "Uppercut" : "Jab";
    if (canFire(state, name, timestamp)) {
      moves.push({ name, power: velocityTo100(lSpeed, 2.5), timestamp });
    }
  }

  // CROSS: right wrist high speed, forward motion (x change)
  if (rSpeed > 0.9 && rWrist.y < (rShoulder?.y ?? 0.4) + 0.1 && canFire(state, "Cross", timestamp)) {
    const isUp = (pRWrist.y - rWrist.y) / dtS > 0.5;
    const name = isUp ? "Right Uppercut" : "Cross";
    if (canFire(state, name, timestamp)) {
      moves.push({ name, power: velocityTo100(rSpeed, 2.5), timestamp });
    }
  }

  // HOOK: horizontal sweep (large x change, wrist stays at shoulder height)
  if (lVelX > 1.2 && lVelY < 0.6 && canFire(state, "Left Hook", timestamp)) {
    moves.push({ name: "Left Hook", power: velocityTo100(lVelX, 2.5), timestamp });
  }
  if (rVelX > 1.2 && rVelY < 0.6 && canFire(state, "Right Hook", timestamp)) {
    moves.push({ name: "Right Hook", power: velocityTo100(rVelX, 2.5), timestamp });
  }

  // BOB & WEAVE: head (nose) horizontal evasion
  if (lms[0] && prev[0]) {
    const nVelX = Math.abs(lms[0].x - prev[0].x) / dtS;
    if (nVelX > 0.8 && canFire(state, "Bob & Weave", timestamp)) {
      moves.push({ name: "Bob & Weave", power: velocityTo100(nVelX, 1.5), timestamp });
    }
  }

  return moves;
};

// ── SQUAT / LUNGE / DEADLIFT classifier ──────────────────────────────────────
const classifyStrength: Classifier = (ctx, state) => {
  const { lms, prev, timestamp } = ctx;
  const moves: DetectedMove[] = [];

  const lHip = lms[23], rHip = lms[24];
  const lKnee = lms[25], rKnee = lms[26];
  const nose = lms[0];

  // SQUAT: hip drops below knee level, then rises
  if (lHip && rHip && lKnee && rKnee) {
    const hipY = (lHip.y + rHip.y) / 2;
    const kneeY = (lKnee.y + rKnee.y) / 2;
    if (hipY > kneeY - 0.05 && state.squat === "up") {
      state.squat = "down";
    } else if (hipY < kneeY - 0.12 && state.squat === "down" && canFire(state, "Squat", timestamp)) {
      state.squat = "up";
      // Power = how deep the squat was
      const depth = Math.max(0, hipY - (prev[23]?.y ?? hipY));
      moves.push({ name: "Squat", power: Math.min(100, Math.round(60 + depth * 300)), timestamp });
    }
  }

  // LUNGE: one knee extends far (knee x diverges from hip x)
  if (lHip && rHip && lKnee && rKnee) {
    const hipCenterX = (lHip.x + rHip.x) / 2;
    const kneeSeparation = Math.abs(lKnee.x - rKnee.x);
    if (kneeSeparation > 0.3 && state.lunge === "up" && canFire(state, "Lunge", timestamp)) {
      state.lunge = "down";
      moves.push({ name: "Lunge", power: velocityTo100(kneeSeparation, 0.6), timestamp });
    } else if (kneeSeparation < 0.15 && state.lunge === "down") {
      state.lunge = "up";
    }
    void hipCenterX; // unused for now
  }

  // JUMP (burpee / jumping): nose moves up fast
  if (nose && prev[0]) {
    const nVelY = (prev[0].y - nose.y); // negative = moving up on screen
    if (nVelY > 0.04 && canFire(state, "Jump", timestamp)) {
      moves.push({ name: "Jump", power: velocityTo100(nVelY, 0.12), timestamp });
    }
  }

  return moves;
};

// ── PUSH-UP / PLANK classifier ────────────────────────────────────────────────
const classifyPushUp: Classifier = (ctx, state) => {
  const { lms, timestamp } = ctx;
  const moves: DetectedMove[] = [];

  const lShoulder = lms[11], rShoulder = lms[12];
  const lWrist = lms[15], rWrist = lms[16];

  if (lShoulder && rShoulder && lWrist && rWrist) {
    const shoulderY = (lShoulder.y + rShoulder.y) / 2;
    const wristY = (lWrist.y + rWrist.y) / 2;
    const diff = shoulderY - wristY; // positive = shoulders above wrists

    if (diff < 0.03 && state.pushUp === "up") {
      // Shoulders near wrist level = down position
      state.pushUp = "down";
    } else if (diff > 0.12 && state.pushUp === "down" && canFire(state, "Push-Up", timestamp)) {
      state.pushUp = "up";
      moves.push({ name: "Push-Up", power: velocityTo100(diff, 0.25), timestamp });
    }
  }

  return moves;
};

// ── JUMPING JACK classifier ───────────────────────────────────────────────────
const classifyJumpingJack: Classifier = (ctx, state) => {
  const { lms, timestamp } = ctx;
  const moves: DetectedMove[] = [];

  const lWrist = lms[15], rWrist = lms[16];
  const lShoulder = lms[11], rShoulder = lms[12];

  if (lWrist && rWrist && lShoulder && rShoulder) {
    const wristSep = Math.abs(lWrist.x - rWrist.x);
    if (wristSep > 0.7 && state.jumpJack === "closed" && canFire(state, "Jumping Jack", timestamp)) {
      state.jumpJack = "open";
    } else if (wristSep < 0.35 && state.jumpJack === "open" && canFire(state, "Jumping Jack", timestamp)) {
      state.jumpJack = "closed";
      moves.push({ name: "Jumping Jack", power: velocityTo100(wristSep, 0.9), timestamp });
    }
  }

  return moves;
};

// ── DANCE / YOGA classifier ────────────────────────────────────────────────────
const classifyDance: Classifier = (ctx, state) => {
  const { lms, prev, dtMs, timestamp } = ctx;
  const moves: DetectedMove[] = [];
  const dtS = Math.max(dtMs, 16) / 1000;

  // Arm raise: left or right wrist moves upward fast
  const lWrist = lms[15], pLWrist = prev[15];
  const rWrist = lms[16], pRWrist = prev[16];
  const lShoulder = lms[11];
  const rShoulder = lms[12];

  if (lWrist && pLWrist && lShoulder) {
    const lVelY = (pLWrist.y - lWrist.y) / dtS;
    if (lVelY > 0.6 && lWrist.y < lShoulder.y - 0.05 && canFire(state, "L Arm Raise", timestamp)) {
      moves.push({ name: "L Arm Raise", power: velocityTo100(lVelY, 1.5), timestamp });
    }
  }
  if (rWrist && pRWrist && rShoulder) {
    const rVelY = (pRWrist.y - rWrist.y) / dtS;
    if (rVelY > 0.6 && rWrist.y < rShoulder.y - 0.05 && canFire(state, "R Arm Raise", timestamp)) {
      moves.push({ name: "R Arm Raise", power: velocityTo100(rVelY, 1.5), timestamp });
    }
  }

  // Step: ankle lateral movement
  const lAnkle = lms[27], pLAnkle = prev[27];
  if (lAnkle && pLAnkle) {
    const ankleVelX = Math.abs(lAnkle.x - pLAnkle.x) / dtS;
    if (ankleVelX > 0.4 && canFire(state, "Step", timestamp)) {
      moves.push({ name: "Step", power: velocityTo100(ankleVelX, 1.0), timestamp });
    }
  }

  return moves;
};

// ── Discipline → classifier map ───────────────────────────────────────────────
const CLASSIFIERS: Record<string, Classifier[]> = {
  boxing:            [classifyBoxing],
  boxing_jab:        [classifyBoxing],
  boxing_cross:      [classifyBoxing],
  boxing_hook:       [classifyBoxing],
  muay_thai:         [classifyBoxing],
  karate:            [classifyBoxing],
  kickboxing:        [classifyBoxing],
  mma:               [classifyBoxing],
  martialarts:       [classifyBoxing],
  squat:             [classifyStrength],
  lunge:             [classifyStrength],
  deadlift:          [classifyStrength],
  fitness:           [classifyStrength, classifyJumpingJack],
  hiit:              [classifyStrength, classifyJumpingJack],
  jumping_jacks:     [classifyJumpingJack],
  burpees:           [classifyStrength, classifyJumpingJack],
  push_up:           [classifyPushUp],
  calisthenics:      [classifyPushUp, classifyStrength],
  gymnastics:        [classifyPushUp, classifyStrength],
  dance:             [classifyDance],
  hiphop:            [classifyDance],
  salsa:             [classifyDance],
  ballet:            [classifyDance],
  contemporary:      [classifyDance],
  yoga:              [classifyDance],    // arm raises / holds
};

function getClassifiers(discipline: string): Classifier[] {
  return CLASSIFIERS[discipline] ?? CLASSIFIERS[discipline.split("_")[0]] ?? [classifyStrength];
}

// ── Main MoveDetector class ───────────────────────────────────────────────────

export class MoveDetector {
  private classifiers: Classifier[];
  private state: MoveDetectorState;
  private prevLms: Lm[] = [];
  private prevTs = 0;
  private log: DetectedMove[] = [];
  private stats: Map<string, MoveStat> = new Map();

  constructor(discipline: string) {
    this.classifiers = getClassifiers(discipline);
    this.state = {
      lastFired: {},
      squat: "up",
      jumpJack: "closed",
      pushUp: "up",
      lunge: "up",
      jabReady: true,
      crossReady: true,
    };
  }

  /** Call every frame with the current landmarks array. Returns moves detected this frame. */
  update(lms: Lm[], timestamp: number): DetectedMove[] {
    if (!lms || lms.length < 17) {
      this.prevLms = lms ?? [];
      this.prevTs = timestamp;
      return [];
    }

    const dtMs = this.prevTs > 0 ? timestamp - this.prevTs : 16;
    const ctx: FrameContext = { lms, prev: this.prevLms.length ? this.prevLms : lms, dtMs, timestamp };

    const detected: DetectedMove[] = [];
    for (const classifier of this.classifiers) {
      const moves = classifier(ctx, this.state);
      for (const m of moves) {
        detected.push(m);
        this.log.push(m);
        const stat = this.stats.get(m.name) ?? { name: m.name, count: 0, maxPower: 0, totalPower: 0, avgPower: 0 };
        stat.count++;
        stat.totalPower += m.power;
        stat.maxPower = Math.max(stat.maxPower, m.power);
        stat.avgPower = Math.round(stat.totalPower / stat.count);
        this.stats.set(m.name, stat);
      }
    }

    this.prevLms = lms;
    this.prevTs = timestamp;
    return detected;
  }

  getLog(): DetectedMove[] { return this.log; }

  getStats(): MoveStat[] {
    return Array.from(this.stats.values()).sort((a, b) => b.count - a.count);
  }

  getTotalReps(): number {
    let total = 0;
    this.stats.forEach(s => (total += s.count));
    return total;
  }

  reset() {
    this.log = [];
    this.stats = new Map();
    this.prevLms = [];
    this.prevTs = 0;
  }
}
