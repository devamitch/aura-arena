// Aura Arena — Unified Combat Engine
// Handles punch/kick/elbow/knee detection for ALL disciplines using 3D landmarks.
// Provides adaptive opponent AI, body-zone hit detection, damage map, lifelines.

// ── 3D landmark ─────────────────────────────────────────────────────────────
export interface Lm3D { x: number; y: number; z: number; visibility?: number }

// ── Move types per discipline ────────────────────────────────────────────────
export type MoveType =
  | "jab" | "cross" | "hook_l" | "hook_r" | "uppercut" | "body_shot"
  | "front_kick" | "side_kick" | "roundhouse" | "back_kick"
  | "knee_strike" | "elbow_strike" | "chop" | "palm_strike"
  | "sweep" | "takedown";

export const DISCIPLINE_MOVES: Record<string, MoveType[]> = {
  boxing:        ["jab","cross","hook_l","hook_r","uppercut","body_shot"],
  boxing_jab:    ["jab","cross","hook_l","hook_r","uppercut","body_shot"],
  muay_thai:     ["jab","cross","hook_l","hook_r","knee_strike","elbow_strike","roundhouse"],
  kickboxing:    ["jab","cross","hook_l","hook_r","front_kick","roundhouse"],
  karate:        ["jab","cross","chop","palm_strike","front_kick","side_kick"],
  mma:           ["jab","cross","hook_l","hook_r","front_kick","roundhouse","knee_strike","takedown"],
  martialarts:   ["jab","cross","chop","palm_strike","front_kick","side_kick","back_kick"],
  taekwondo:     ["jab","front_kick","side_kick","roundhouse","back_kick"],
  jiujitsu:      ["takedown","sweep","chop"],
  wrestling:     ["takedown","sweep"],
};

function getMoves(discipline: string): MoveType[] {
  const base = discipline.split("_")[0];
  return DISCIPLINE_MOVES[discipline] ?? DISCIPLINE_MOVES[base] ?? DISCIPLINE_MOVES["boxing"];
}

// ── Damage zones ─────────────────────────────────────────────────────────────
export type DamageZone =
  | "head" | "chin" | "left_face" | "right_face"
  | "body_left" | "body_right" | "solar_plexus"
  | "left_arm" | "right_arm"
  | "left_leg" | "right_leg";

export interface DamageMark {
  zone: DamageZone;
  pts: number;           // accumulated damage points in this zone
  lastHit: number;       // timestamp of last hit
  intensity: number;     // 0–1 visual intensity
  color: string;         // css color for rendering
}

export type DamageMap = Record<DamageZone, DamageMark>;

function makeDamageMap(): DamageMap {
  const zones: DamageZone[] = [
    "head","chin","left_face","right_face",
    "body_left","body_right","solar_plexus",
    "left_arm","right_arm","left_leg","right_leg",
  ];
  return Object.fromEntries(
    zones.map((z) => [z, { zone: z, pts: 0, lastHit: 0, intensity: 0, color: "#ffffff" }])
  ) as DamageMap;
}

function intensityColor(pts: number): string {
  if (pts < 10)  return "#aaddff"; // blue (light)
  if (pts < 25)  return "#9966ff"; // purple
  if (pts < 50)  return "#ff8800"; // orange
  return "#ff2222";                 // red (severe)
}

// Move → most likely hit zone mapping
const MOVE_ZONE: Record<MoveType, DamageZone[]> = {
  jab:          ["left_face", "chin"],
  cross:        ["right_face", "chin"],
  hook_l:       ["left_face", "head"],
  hook_r:       ["right_face", "head"],
  uppercut:     ["chin", "head"],
  body_shot:    ["body_left", "body_right", "solar_plexus"],
  front_kick:   ["solar_plexus", "body_left", "body_right"],
  side_kick:    ["body_left", "body_right"],
  roundhouse:   ["head", "left_face"],
  back_kick:    ["solar_plexus"],
  knee_strike:  ["solar_plexus", "body_left"],
  elbow_strike: ["chin", "head"],
  chop:         ["left_face", "right_face"],
  palm_strike:  ["chin", "solar_plexus"],
  sweep:        ["left_leg", "right_leg"],
  takedown:     ["left_leg", "right_leg", "body_left"],
};

// ── Detected strike event ─────────────────────────────────────────────────────
export interface StrikeEvent {
  moveType: MoveType;
  power: number;            // 0–100
  hand: "left" | "right" | "leg";
  speed3D: number;
  directionXYZ: [number, number, number];
  screenPos: [number, number];  // normalized [0,1]
  timestamp: number;
  isLethal: boolean;        // power > 80
  isCritical: boolean;      // power > 60
}

// ── Strike detector ───────────────────────────────────────────────────────────
interface Sample { pos: Lm3D; ts: number }

const WIN = 6;
const COOLDOWN_MS = 260;

export class StrikeDetector {
  private hist: Record<number, Sample[]> = {};
  private lastFired: Record<string, number> = {};

  detect(lms: Lm3D[], timestamp: number, discipline: string): StrikeEvent[] {
    const allowedMoves = getMoves(discipline);
    const events: StrikeEvent[] = [];

    // Wrist indices: 15=L, 16=R; Ankle: 27=L, 28=R; Elbow: 13=L, 14=R; Knee: 25=L, 26=R
    const limbChecks: { idx: number; key: string; side: "left"|"right"|"leg" }[] = [
      { idx: 15, key: "wL",   side: "left"  },
      { idx: 16, key: "wR",   side: "right" },
      { idx: 27, key: "ankL", side: "leg"   },
      { idx: 28, key: "ankR", side: "leg"   },
      { idx: 13, key: "elbL", side: "left"  },
      { idx: 14, key: "elbR", side: "right" },
      { idx: 25, key: "knL",  side: "leg"   },
      { idx: 26, key: "knR",  side: "leg"   },
    ];

    for (const { idx, key, side } of limbChecks) {
      if (!lms[idx]) continue;
      if (!this.hist[idx]) this.hist[idx] = [];
      this.hist[idx].push({ pos: lms[idx], ts: timestamp });
      if (this.hist[idx].length > WIN) this.hist[idx].shift();
      if (this.hist[idx].length < 3) continue;

      const e = this.analyze(key, side, this.hist[idx], lms, idx, timestamp, allowedMoves);
      if (e) events.push(e);
    }
    return events;
  }

  private analyze(
    key: string,
    side: "left"|"right"|"leg",
    history: Sample[],
    lms: Lm3D[],
    idx: number,
    ts: number,
    allowedMoves: MoveType[],
  ): StrikeEvent | null {
    const old = history[0];
    const cur = history[history.length - 1];
    const dtS = Math.max(1, cur.ts - old.ts) / 1000;
    const dx = cur.pos.x - old.pos.x;
    const dy = cur.pos.y - old.pos.y;
    const dz = (cur.pos.z ?? 0) - (old.pos.z ?? 0);
    const vx = dx/dtS, vy = dy/dtS, vz = dz/dtS;
    const speed = Math.sqrt(vx*vx + vy*vy + vz*vz);

    const threshold = side === "leg" ? 0.8 : 1.0;
    if (speed < threshold) return null;
    if (ts - (this.lastFired[key] ?? 0) < COOLDOWN_MS) return null;

    const forwardZ = -vz;  // positive = toward camera
    const isUp      = vy < -0.4;
    const isHoriz   = Math.abs(vx) > Math.abs(vz) * 1.4;
    const isBodyLvl = lms[idx] ? lms[idx].y > (lms[11]?.y ?? 0.4) + 0.05 : false;

    let move: MoveType;
    if (side === "leg") {
      const isKnee = idx === 25 || idx === 26;
      if (isKnee)          move = allowedMoves.includes("knee_strike") ? "knee_strike" : "front_kick";
      else if (isHoriz)    move = allowedMoves.includes("roundhouse")  ? "roundhouse"  : "front_kick";
      else                 move = allowedMoves.includes("front_kick")  ? "front_kick"  : "jab";
    } else {
      const isElbow = idx === 13 || idx === 14;
      if (isElbow && allowedMoves.includes("elbow_strike")) {
        move = "elbow_strike";
      } else if (isUp && forwardZ > 0.1) {
        move = allowedMoves.includes("uppercut") ? "uppercut" : "jab";
      } else if (isHoriz && forwardZ < 0.3) {
        move = side === "left"
          ? (allowedMoves.includes("hook_l") ? "hook_l" : "jab")
          : (allowedMoves.includes("hook_r") ? "hook_r" : "cross");
      } else if (isBodyLvl && forwardZ > 0.05) {
        move = allowedMoves.includes("body_shot") ? "body_shot" : "jab";
      } else if (!allowedMoves.includes("chop") || !isHoriz) {
        move = side === "left" ? "jab" : "cross";
      } else {
        move = "chop";
      }
    }

    if (!allowedMoves.includes(move)) return null;
    this.lastFired[key] = ts;
    const power = Math.min(100, Math.round((speed / 3.8) * 100));

    return {
      moveType: move,
      power,
      hand: side,
      speed3D: speed,
      directionXYZ: [vx, vy, vz],
      screenPos: [cur.pos.x, cur.pos.y],
      timestamp: ts,
      isLethal: power > 80,
      isCritical: power > 60,
    };
  }

  reset() { this.hist = {}; this.lastFired = {}; }
}

// ── Opponent state machine ────────────────────────────────────────────────────
export type OpponentState =
  | "idle" | "bob" | "advance" | "retreat"
  | "jab" | "cross" | "hook_l" | "hook_r" | "uppercut" | "roundhouse" | "front_kick"
  | "block_high" | "block_body" | "dodge_l" | "dodge_r" | "duck"
  | "hurt" | "stagger" | "ko";

export interface OpponentPosition3D { x: number; y: number; z: number }

export interface AIDecision3D {
  state: OpponentState;
  targetPos: OpponentPosition3D;
  duration: number;
  isAttack: boolean;
  damage: number;
  bodyTarget: DamageZone | null;  // which zone the AI attacks the USER
}

export class CombatOpponent {
  hp = 100;
  maxHp = 100;
  round = 1;
  lifelines: number;
  state: OpponentState = "bob";
  position: OpponentPosition3D = { x: 0.2, y: 0, z: 1.2 };  // 3D world position

  // Per zone damage tracking
  damageMap: DamageMap;

  private hitByMove: Record<string, number> = {};
  private blockRates: Record<string, number> = {};
  private reactionMs = 450;
  private consecutiveHits = 0;

  constructor(discipline: string, private readonly _discipline = discipline) {
    this.lifelines = ["mma","muay_thai","kickboxing"].includes(discipline) ? 2 : 3;
    this.damageMap = makeDamageMap();
  }

  takeDamage(strike: StrikeEvent): { damage: number; zone: DamageZone; blocked: boolean } {
    // Check if AI is currently blocking
    const isBlockState = this.state === "block_high" || this.state === "block_body";
    const zones = MOVE_ZONE[strike.moveType] ?? ["body_left"];
    const zone = zones[Math.floor(Math.random() * Math.min(zones.length, 2))];

    // Blocking reduces damage
    const isHeadMove = ["jab","cross","hook_l","hook_r","uppercut","elbow_strike","chop","roundhouse"].includes(strike.moveType);
    const isBodyMove = ["body_shot","front_kick","knee_strike","solar_plexus"].includes(strike.moveType);
    let blockMult = 1.0;
    if (isBlockState && this.state === "block_high" && isHeadMove) blockMult = 0.15;
    if (isBlockState && this.state === "block_body" && isBodyMove) blockMult = 0.15;

    const zoneMultiplier: Record<DamageZone, number> = {
      chin: 1.5, head: 1.2, left_face: 1.1, right_face: 1.1,
      solar_plexus: 1.3, body_left: 1.0, body_right: 1.0,
      left_arm: 0.5, right_arm: 0.5, left_leg: 0.7, right_leg: 0.7,
    };
    const dmg = (strike.power / 100) * 20 * (zoneMultiplier[zone] ?? 1.0) * blockMult;
    this.hp = Math.max(0, this.hp - dmg);

    // Update damage map
    const mark = this.damageMap[zone];
    mark.pts += dmg;
    mark.lastHit = strike.timestamp;
    mark.intensity = Math.min(1, mark.pts / 80);
    mark.color = intensityColor(mark.pts);

    // Track for adaptation
    this.hitByMove[strike.moveType] = (this.hitByMove[strike.moveType] ?? 0) + 1;
    this.consecutiveHits++;

    return { damage: dmg, zone, blocked: blockMult < 0.5 };
  }

  useLifeline(): boolean {
    if (this.lifelines <= 0) return false;
    this.lifelines--;
    this.hp = 60;
    return true;
  }

  learnFromRound(userMoveLog: Record<string, number>): void {
    this.round++;
    // Improve block rates based on which user moves connected
    for (const [move, count] of Object.entries(userMoveLog)) {
      const total = (this.hitByMove[move] ?? 0) + count;
      this.blockRates[move] = Math.min(0.80, 0.08 + total * 0.06);
    }
    // Partial HP restore
    this.hp = Math.min(this.maxHp, this.hp + 30);
    this.consecutiveHits = 0;
    this.reactionMs = Math.max(220, this.reactionMs - 35);
  }

  isKO(): boolean { return this.hp <= 0 && this.lifelines <= 0; }

  frustration(): 0 | 1 | 2 | 3 {
    if (this.hp > 70) return 0;
    if (this.hp > 45) return 1;
    if (this.hp > 20) return 2;
    return 3;
  }

  decide(userJustStruck: boolean, moveType?: string, elapsedMs = 0): AIDecision3D {
    if (this.isKO()) {
      return { state: "ko", targetPos: this.position, duration: 5000, isAttack: false, damage: 0, bodyTarget: null };
    }

    const frust = this.frustration();
    const aggression = 0.28 + frust * 0.10 + (this.round - 1) * 0.05;

    // ── React to user strike ──
    if (userJustStruck && moveType) {
      const blockChance = this.blockRates[moveType] ?? 0.12;
      if (Math.random() < blockChance) {
        const isHigh = ["jab","cross","hook_l","hook_r","uppercut","elbow_strike","roundhouse"].includes(moveType);
        const newState: OpponentState = isHigh ? "block_high" : "block_body";
        return { state: newState, targetPos: this.position, duration: this.reactionMs + 100, isAttack: false, damage: 0, bodyTarget: null };
      }
      if (Math.random() < 0.18) {
        const dodge: OpponentState = Math.random() < 0.4 ? "duck" : Math.random() < 0.5 ? "dodge_l" : "dodge_r";
        const newX = dodge === "dodge_l" ? this.position.x - 0.3 : dodge === "dodge_r" ? this.position.x + 0.3 : this.position.x;
        const newY = dodge === "duck" ? -0.25 : 0;
        const newPos = clamp3D({ ...this.position, x: newX, y: newY });
        return { state: dodge, targetPos: newPos, duration: 280, isAttack: false, damage: 0, bodyTarget: null };
      }
    }

    // ── Attack ──
    if (Math.random() < aggression) {
      // Use discipline-appropriate attacks
      const attacks = getDisciplineAttacks(this._discipline, frust);
      const [atk, baseDmg, bodyZone] = attacks[Math.floor(Math.random() * attacks.length)];

      // Move closer to attack (z-axis advance)
      const newZ = Math.max(0.4, this.position.z - 0.15);
      const newPos = clamp3D({ ...this.position, z: newZ, x: this.position.x + (Math.random()-0.5)*0.1 });
      this.position = newPos;

      return {
        state: atk as OpponentState,
        targetPos: newPos,
        duration: 280 + Math.random() * 200,
        isAttack: true,
        damage: (baseDmg as number) * (1 + frust * 0.12),
        bodyTarget: bodyZone as DamageZone,
      };
    }

    // ── Move / bob ──
    const phase = Math.floor(elapsedMs / 1200) % 3;
    const newPos = clamp3D({
      x: this.position.x + (Math.random() - 0.5) * 0.08,
      y: 0,
      z: phase === 2 ? Math.min(this.position.z + 0.1, 1.8) // retreat
         : phase === 0 ? Math.max(this.position.z - 0.05, 0.6) // advance
         : this.position.z,
    });
    this.position = newPos;

    return { state: "bob", targetPos: newPos, duration: 500 + Math.random()*300, isAttack: false, damage: 0, bodyTarget: null };
  }

  /** Normalized [0,1] hitboxes derived from 3D position (for screen-space hit checking) */
  getScreenHitboxes(canvasW: number, canvasH: number): {
    zone: DamageZone; cx: number; cy: number; w: number; h: number; mult: number }[] {
    // Map 3D position to approximate normalized screen coords
    // Camera at [0,1.0,3.5], FOV 55° — simplified linear mapping
    const fov = 55 * Math.PI / 180;
    const camZ = 3.5;
    const scale = 1 / Math.tan(fov / 2);
    const depth = camZ - this.position.z;
    const project = (v: number) => 0.5 + (v * scale) / (depth * 2);

    const bx = project(this.position.x);
    const by = 0.5 - (this.position.y * scale) / (depth * 2);

    const sz = 0.08 / Math.max(0.5, depth);

    return [
      { zone: "head",        cx: bx,       cy: by-sz*2.2, w: sz*1.3, h: sz*1.3, mult: 1.2 },
      { zone: "chin",        cx: bx,       cy: by-sz*1.5, w: sz*0.9, h: sz*0.7, mult: 1.5 },
      { zone: "left_face",   cx: bx-sz*0.5,cy: by-sz*2.0, w: sz*0.8, h: sz*0.9, mult: 1.1 },
      { zone: "right_face",  cx: bx+sz*0.5,cy: by-sz*2.0, w: sz*0.8, h: sz*0.9, mult: 1.1 },
      { zone: "solar_plexus",cx: bx,       cy: by-sz*0.5, w: sz*1.1, h: sz*0.9, mult: 1.3 },
      { zone: "body_left",   cx: bx-sz*0.6,cy: by+sz*0.1, w: sz,     h: sz*1.2, mult: 1.0 },
      { zone: "body_right",  cx: bx+sz*0.6,cy: by+sz*0.1, w: sz,     h: sz*1.2, mult: 1.0 },
      { zone: "left_arm",    cx: bx-sz*1.2,cy: by-sz*1.0, w: sz*0.9, h: sz*1.5, mult: 0.5 },
      { zone: "right_arm",   cx: bx+sz*1.2,cy: by-sz*1.0, w: sz*0.9, h: sz*1.5, mult: 0.5 },
      { zone: "left_leg",    cx: bx-sz*0.4,cy: by+sz*1.5, w: sz*0.7, h: sz*1.8, mult: 0.7 },
      { zone: "right_leg",   cx: bx+sz*0.4,cy: by+sz*1.5, w: sz*0.7, h: sz*1.8, mult: 0.7 },
    ];

    void canvasW; void canvasH;
  }

  checkHit(strike: StrikeEvent): DamageZone | null {
    const [sx, sy] = strike.screenPos;
    const boxes = this.getScreenHitboxes(1, 1);
    // Prefer body-level zones for body shots, head for head moves
    const isBodyMove = ["body_shot","front_kick","knee_strike"].includes(strike.moveType);
    for (const box of boxes) {
      const isBodyZone = ["solar_plexus","body_left","body_right","left_leg","right_leg"].includes(box.zone);
      if (isBodyMove && !isBodyZone) continue;
      if (!isBodyMove && isBodyZone) continue;
      if (sx >= box.cx - box.w/2 && sx <= box.cx + box.w/2 &&
          sy >= box.cy - box.h/2 && sy <= box.cy + box.h/2) {
        return box.zone;
      }
    }
    // Fallback: check all zones
    for (const box of boxes) {
      if (sx >= box.cx - box.w/2 && sx <= box.cx + box.w/2 &&
          sy >= box.cy - box.h/2 && sy <= box.cy + box.h/2) {
        return box.zone;
      }
    }
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
type AttackEntry = [OpponentState, number, DamageZone];

function getDisciplineAttacks(discipline: string, frust: number): AttackEntry[] {
  const base: AttackEntry[] = [
    ["jab",    7,  "left_face"],
    ["cross",  10, "right_face"],
    ["hook_l", 12, "left_face"],
    ["hook_r", 12, "right_face"],
  ];
  const aggressive: AttackEntry[] = [
    ...base,
    ["uppercut", 14, "chin"],
  ];
  if (frust >= 2) {
    return [...aggressive, ["hook_l", 13, "head"], ["hook_r", 13, "head"]];
  }

  const d = discipline.split("_")[0];
  if (["muay_thai","kickboxing","mma","karate","martialarts","taekwondo"].includes(d)) {
    return [
      ...base,
      ["front_kick", 11, "solar_plexus"],
      ["roundhouse", 13, "head"],
    ];
  }
  return base;
}

function clamp3D(p: OpponentPosition3D): OpponentPosition3D {
  return {
    x: Math.max(-0.8, Math.min(0.8, p.x)),
    y: Math.max(-0.3, Math.min(0.2, p.y)),
    z: Math.max(0.3, Math.min(2.2, p.z)),
  };
}

export { makeDamageMap, intensityColor };
