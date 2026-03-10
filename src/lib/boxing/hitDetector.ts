// Aura Arena — 3D Hit Detector
// Detects punches using full X/Y/Z landmark velocity and classifies type.
// Also checks if a punch trajectory intersects the AI's screen hitboxes.

export interface Lm3D { x: number; y: number; z: number; visibility?: number }

export interface PunchEvent {
  hand: "left" | "right";
  type: "jab" | "cross" | "hook" | "uppercut" | "body_shot";
  power: number;         // 0–100
  speed3D: number;       // normalized units/sec
  dirZ: number;          // negative = toward camera (forward punch)
  screenPos: { x: number; y: number };
  timestamp: number;
}

export interface HitBox {
  cx: number; cy: number;    // center in normalized [0,1] coords
  w: number;  h: number;
  zone: "head" | "body" | "guard_l" | "guard_r";
  damageMultiplier: number;
}

interface WristSample { pos: Lm3D; ts: number }

const WINDOW = 6;          // frames of history
const COOLDOWN_MS = 280;
const MIN_SPEED = 1.1;     // units/sec threshold to count as a punch

export class HitDetector {
  private lHistory: WristSample[] = [];
  private rHistory: WristSample[] = [];
  private lastFired: Record<string, number> = {};

  detect(lms: Lm3D[], timestamp: number): PunchEvent[] {
    if (!lms[15] || !lms[16]) return [];

    this.lHistory.push({ pos: lms[15], ts: timestamp });
    this.rHistory.push({ pos: lms[16], ts: timestamp });
    if (this.lHistory.length > WINDOW) this.lHistory.shift();
    if (this.rHistory.length > WINDOW) this.rHistory.shift();

    const punches: PunchEvent[] = [];
    if (this.lHistory.length >= 3) {
      const p = this.analyze("left", this.lHistory, lms, timestamp);
      if (p) punches.push(p);
    }
    if (this.rHistory.length >= 3) {
      const p = this.analyze("right", this.rHistory, lms, timestamp);
      if (p) punches.push(p);
    }
    return punches;
  }

  private analyze(
    hand: "left" | "right",
    history: WristSample[],
    lms: Lm3D[],
    ts: number,
  ): PunchEvent | null {
    const old = history[0];
    const cur = history[history.length - 1];
    const dtS = Math.max(1, cur.ts - old.ts) / 1000;

    const dx = cur.pos.x - old.pos.x;
    const dy = cur.pos.y - old.pos.y;
    const dz = (cur.pos.z ?? 0) - (old.pos.z ?? 0);

    const vx = dx / dtS, vy = dy / dtS, vz = dz / dtS;
    const speed3D = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (speed3D < MIN_SPEED) return null;

    const key = hand;
    if (ts - (this.lastFired[key] ?? 0) < COOLDOWN_MS) return null;

    // Classify using 3D direction
    const shoulderLm = lms[hand === "left" ? 11 : 12];
    const forwardZ = -vz; // positive = moving toward camera (punch)
    const isUpward = vy < -0.5; // wrist moving upward
    const isHorizontal = Math.abs(vx) > Math.abs(vz) * 1.5;
    const isBodyLevel = shoulderLm
      ? cur.pos.y > shoulderLm.y - 0.05
      : false;

    let type: PunchEvent["type"];
    if (isUpward && forwardZ > 0.2) {
      type = "uppercut";
    } else if (isHorizontal && forwardZ < 0.3) {
      type = "hook";
    } else if (isBodyLevel && forwardZ > 0.1) {
      type = "body_shot";
    } else {
      type = hand === "left" ? "jab" : "cross";
    }

    this.lastFired[key] = ts;

    return {
      hand,
      type,
      power: Math.min(100, Math.round((speed3D / 4.0) * 100)),
      speed3D,
      dirZ: vz,
      screenPos: { x: cur.pos.x, y: cur.pos.y },
      timestamp: ts,
    };
  }

  /** Check if punch screen position falls within any of the AI's hitboxes.
   *  coords are normalized [0,1]. Returns first hit or null. */
  checkHit(punch: PunchEvent, hitboxes: HitBox[]): HitBox | null {
    const { x, y } = punch.screenPos;
    for (const box of hitboxes) {
      if (
        x >= box.cx - box.w / 2 &&
        x <= box.cx + box.w / 2 &&
        y >= box.cy - box.h / 2 &&
        y <= box.cy + box.h / 2
      ) {
        return box;
      }
    }
    return null;
  }

  reset() {
    this.lHistory = [];
    this.rHistory = [];
    this.lastFired = {};
  }
}
