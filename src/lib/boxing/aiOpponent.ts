// Aura Arena — Boxing AI Opponent
// State machine with adaptive strategy.
// After each round the AI "studies" user's favorite moves and improves block rates.

export type AIAnimState =
  | "idle"
  | "bob"
  | "jab"
  | "cross"
  | "hook_l"
  | "hook_r"
  | "uppercut"
  | "block_high"
  | "block_body"
  | "dodge_l"
  | "dodge_r"
  | "hurt"
  | "stagger"
  | "ko";

export type FrustrationLevel = 0 | 1 | 2 | 3;

export interface AIAction {
  state: AIAnimState;
  duration: number;   // ms
  /** 0–1 normalized screen position of the fighter center */
  position: { x: number; y: number };
  /** Whether this action should reduce user HP if it connects */
  isAttack: boolean;
  damage: number;     // HP damage to user (0 if not attack)
}

interface UserMoveLog {
  [moveName: string]: number; // move name → hit count
}

export class BoxingAI {
  hp = 100;
  maxHp = 100;
  round = 1;
  animState: AIAnimState = "bob";
  position = { x: 0.68, y: 0.48 };

  private hitHistory: UserMoveLog = {};
  private blockRates: Record<string, number> = {};
  private roundHitsReceived = 0;
  private reactionSpeedMs = 420; // gets faster each round

  /** Call after each round to adapt strategy */
  learnFromRound(userMoveLog: UserMoveLog): void {
    this.round++;
    // Improve block rate for frequently-connecting user moves
    for (const [move, count] of Object.entries(userMoveLog)) {
      this.hitHistory[move] = (this.hitHistory[move] ?? 0) + count;
      const totalHits = this.hitHistory[move];
      // Asymptotic block improvement: more hits → higher block ceiling
      this.blockRates[move] = Math.min(0.75, 0.1 + totalHits * 0.08);
    }
    // Partial HP restore between rounds
    this.hp = Math.min(this.maxHp, this.hp + 25);
    this.roundHitsReceived = 0;
    // Speed up reactions each round (min 240ms)
    this.reactionSpeedMs = Math.max(240, this.reactionSpeedMs - 40);
  }

  takeDamage(power: number, zone: "head" | "body" | "guard_l" | "guard_r"): number {
    const mult =
      zone === "head" ? 1.3
      : zone === "body" ? 1.0
      : 0.25; // guard zones absorb most damage
    const dmg = (power / 100) * 18 * mult;
    this.hp = Math.max(0, this.hp - dmg);
    this.roundHitsReceived++;
    return dmg;
  }

  isKO(): boolean { return this.hp <= 0; }

  getFrustrationLevel(): FrustrationLevel {
    if (this.hp > 70) return 0;
    if (this.hp > 45) return 1;
    if (this.hp > 20) return 2;
    return 3;
  }

  /** Decide the AI's next action given context */
  decide(
    userJustPunched: boolean,
    userMoveType?: string,
    elapsed?: number,
  ): AIAction {
    if (this.isKO()) {
      return { state: "ko", duration: 4000, position: this.position, isAttack: false, damage: 0 };
    }

    const frustration = this.getFrustrationLevel();
    const aggression = 0.28 + frustration * 0.12 + (this.round - 1) * 0.04;

    // React to user punch: maybe block / dodge
    if (userJustPunched && userMoveType) {
      const blockRate = this.blockRates[userMoveType] ?? 0.15;
      if (Math.random() < blockRate) {
        const isHighPunch = userMoveType.includes("Jab") || userMoveType.includes("Cross") || userMoveType.includes("Uppercut");
        return {
          state: isHighPunch ? "block_high" : "block_body",
          duration: this.reactionSpeedMs + Math.random() * 150,
          position: this.position,
          isAttack: false,
          damage: 0,
        };
      }
      // Dodge instead
      if (Math.random() < 0.15 + this.round * 0.04) {
        const dir: AIAnimState = Math.random() < 0.5 ? "dodge_l" : "dodge_r";
        return {
          state: dir,
          duration: 300,
          position: {
            x: Math.max(0.5, Math.min(0.85, this.position.x + (dir === "dodge_l" ? -0.04 : 0.04))),
            y: this.position.y,
          },
          isAttack: false,
          damage: 0,
        };
      }
    }

    // Attack?
    const rand = Math.random();
    if (rand < aggression) {
      // Frustrated AI prefers wild swings
      type W = [AIAnimState, number, number];
      const weights: W[] = frustration >= 2
        ? [["hook_l", 0.28, 12], ["hook_r", 0.28, 12], ["cross", 0.22, 10], ["jab", 0.15, 7], ["uppercut", 0.07, 14]]
        : [["jab", 0.35, 7], ["cross", 0.30, 10], ["hook_l", 0.15, 12], ["hook_r", 0.15, 12], ["uppercut", 0.05, 14]];

      const [atk, , baseDmg] = weightedPick(weights);
      const newPos = clampPos({
        x: this.position.x + (Math.random() - 0.5) * 0.06,
        y: this.position.y + (Math.random() - 0.5) * 0.03,
      });
      this.position = newPos;
      return {
        state: atk,
        duration: 320 + Math.random() * 180,
        position: newPos,
        isAttack: true,
        damage: baseDmg * (1 + frustration * 0.15),
      };
    }

    // Move / bob
    const newPos = clampPos({
      x: this.position.x + (Math.random() - 0.5) * 0.06,
      y: this.position.y + (Math.random() - 0.5) * 0.04,
    });
    this.position = newPos;
    return {
      state: elapsed && elapsed % 2000 < 1000 ? "bob" : "idle",
      duration: 500 + Math.random() * 400,
      position: newPos,
      isAttack: false,
      damage: 0,
    };
  }

  /** Screen-space hitboxes for the AI at its current position.
   *  All coords normalized to [0,1] screen space. */
  getHitboxes(scale = 0.1): import("./hitDetector").HitBox[] {
    const { x, y } = this.position;
    return [
      { cx: x, cy: y - scale * 1.2, w: scale * 0.7, h: scale * 0.7, zone: "head", damageMultiplier: 1.3 },
      { cx: x, cy: y + scale * 0.2, w: scale * 1.0, h: scale * 1.1, zone: "body", damageMultiplier: 1.0 },
      { cx: x - scale * 0.5, cy: y - scale * 0.8, w: scale * 0.6, h: scale * 0.8, zone: "guard_l", damageMultiplier: 0.25 },
      { cx: x + scale * 0.5, cy: y - scale * 0.8, w: scale * 0.6, h: scale * 0.8, zone: "guard_r", damageMultiplier: 0.25 },
    ];
  }
}

function clampPos(p: { x: number; y: number }) {
  return { x: Math.max(0.5, Math.min(0.88, p.x)), y: Math.max(0.3, Math.min(0.65, p.y)) };
}

function weightedPick<T extends [unknown, number, ...unknown[]]>(items: T[]): T {
  const total = items.reduce((s, [, w]) => s + (w as number), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item[1] as number;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
