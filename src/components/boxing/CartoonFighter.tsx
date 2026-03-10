// Aura Arena — CartoonFighter
// Draws a stylized 2D cartoon boxer on a canvas using imperativeCanvas 2D API.
// Supports: idle/guard, bob, jab, cross, hook_l/r, uppercut, block, dodge, hurt, stagger, KO.
// Frustration levels add progressive damage overlays.

import type { AIAnimState, FrustrationLevel } from "@/lib/boxing/aiOpponent";
import { useEffect, useRef } from "react";

interface Vec2 { x: number; y: number }

// ── Skeleton pose: all positions relative to (0,0) fighter center ──────────
// Positive Y = down (canvas coords)
interface Pose {
  head: Vec2; neck: Vec2;
  lShoulder: Vec2; lElbow: Vec2; lWrist: Vec2;
  rShoulder: Vec2; rElbow: Vec2; rWrist: Vec2;
  hip: Vec2;
  lKnee: Vec2; lAnkle: Vec2;
  rKnee: Vec2; rAnkle: Vec2;
  bodyLean: number; // degrees, applied to whole body
}

const S = 90; // base scale (half-height from center to head)

const BASE: Pose = {
  head:      { x:  0,   y: -S * 0.95 },
  neck:      { x:  0,   y: -S * 0.65 },
  lShoulder: { x: -S * 0.28, y: -S * 0.55 },
  lElbow:    { x: -S * 0.48, y: -S * 0.10 },
  lWrist:    { x: -S * 0.55, y:  S * 0.20 },
  rShoulder: { x:  S * 0.28, y: -S * 0.55 },
  rElbow:    { x:  S * 0.48, y: -S * 0.10 },
  rWrist:    { x:  S * 0.55, y:  S * 0.20 },
  hip:       { x:  0,   y:  S * 0.25 },
  lKnee:     { x: -S * 0.22, y:  S * 0.65 },
  lAnkle:    { x: -S * 0.22, y:  S * 1.05 },
  rKnee:     { x:  S * 0.22, y:  S * 0.65 },
  rAnkle:    { x:  S * 0.22, y:  S * 1.05 },
  bodyLean: 0,
};

// ── Pose keyframes ─────────────────────────────────────────────────────────
const POSES: Record<AIAnimState, Partial<Pose>> = {
  idle: {},
  bob: { head: { x: 0, y: -S * 0.90 } },
  jab: {
    lShoulder: { x: -S * 0.20, y: -S * 0.55 },
    lElbow: { x:  S * 0.20, y: -S * 0.35 },
    lWrist: { x:  S * 0.70, y: -S * 0.45 },
    bodyLean: -12,
  },
  cross: {
    rShoulder: { x:  S * 0.20, y: -S * 0.55 },
    rElbow: { x: -S * 0.20, y: -S * 0.35 },
    rWrist: { x: -S * 0.70, y: -S * 0.45 },
    bodyLean: 12,
  },
  hook_l: {
    lElbow: { x: -S * 0.10, y: -S * 0.50 },
    lWrist: { x:  S * 0.30, y: -S * 0.55 },
    bodyLean: -8,
  },
  hook_r: {
    rElbow: { x:  S * 0.10, y: -S * 0.50 },
    rWrist: { x: -S * 0.30, y: -S * 0.55 },
    bodyLean: 8,
  },
  uppercut: {
    lElbow: { x: -S * 0.30, y:  S * 0.10 },
    lWrist: { x:  S * 0.10, y: -S * 0.70 },
    bodyLean: -15,
  },
  block_high: {
    lWrist: { x: -S * 0.05, y: -S * 0.80 },
    rWrist: { x:  S * 0.05, y: -S * 0.85 },
    lElbow: { x: -S * 0.35, y: -S * 0.55 },
    rElbow: { x:  S * 0.35, y: -S * 0.55 },
    head:   { x: 0, y: -S * 0.80 },
  },
  block_body: {
    lWrist: { x: -S * 0.10, y: -S * 0.40 },
    rWrist: { x:  S * 0.10, y: -S * 0.40 },
    lElbow: { x: -S * 0.38, y: -S * 0.20 },
    rElbow: { x:  S * 0.38, y: -S * 0.20 },
  },
  dodge_l: { head: { x: -S * 0.25, y: -S * 0.85 }, bodyLean: -10 },
  dodge_r: { head: { x:  S * 0.25, y: -S * 0.85 }, bodyLean: 10 },
  hurt: {
    head: { x: S * 0.15, y: -S * 0.80 },
    bodyLean: 20,
    lWrist: { x: -S * 0.45, y: S * 0.30 },
    rWrist: { x:  S * 0.35, y: S * 0.25 },
  },
  stagger: {
    head: { x: S * 0.20, y: -S * 0.75 },
    bodyLean: 30,
    lWrist: { x: -S * 0.55, y: S * 0.40 },
    rWrist: { x:  S * 0.60, y: S * 0.35 },
    lKnee: { x: -S * 0.30, y: S * 0.60 },
  },
  ko: {
    head: { x: S * 0.10, y: S * 0.20 },
    neck: { x: S * 0.05, y: S * 0.10 },
    lShoulder: { x: -S * 0.25, y: S * 0.15 },
    rShoulder: { x:  S * 0.25, y: S * 0.10 },
    lElbow: { x: -S * 0.55, y: S * 0.45 },
    rElbow: { x:  S * 0.55, y: S * 0.40 },
    lWrist: { x: -S * 0.70, y: S * 0.70 },
    rWrist: { x:  S * 0.70, y: S * 0.65 },
    hip:    { x: 0, y: S * 0.55 },
    lKnee:  { x: -S * 0.30, y: S * 0.95 },
    rKnee:  { x:  S * 0.30, y: S * 0.90 },
    lAnkle: { x: -S * 0.35, y: S * 1.10 },
    rAnkle: { x:  S * 0.35, y: S * 1.08 },
    bodyLean: 85,
  },
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpV(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
function mergedPose(target: Partial<Pose>): Pose {
  const p = { ...BASE };
  return {
    head:      target.head      ?? p.head,
    neck:      target.neck      ?? p.neck,
    lShoulder: target.lShoulder ?? p.lShoulder,
    lElbow:    target.lElbow    ?? p.lElbow,
    lWrist:    target.lWrist    ?? p.lWrist,
    rShoulder: target.rShoulder ?? p.rShoulder,
    rElbow:    target.rElbow    ?? p.rElbow,
    rWrist:    target.rWrist    ?? p.rWrist,
    hip:       target.hip       ?? p.hip,
    lKnee:     target.lKnee     ?? p.lKnee,
    lAnkle:    target.lAnkle    ?? p.lAnkle,
    rKnee:     target.rKnee     ?? p.rKnee,
    rAnkle:    target.rAnkle    ?? p.rAnkle,
    bodyLean:  target.bodyLean  ?? 0,
  };
}

// ── Damage crack paths (pre-computed SVG-like canvas path sequences) ────────
function drawCracks(ctx: CanvasRenderingContext2D, s: number, level: FrustrationLevel) {
  if (level === 0) return;
  ctx.save();
  ctx.strokeStyle = level >= 3 ? "rgba(255,60,60,0.7)" : "rgba(255,100,100,0.4)";
  ctx.lineWidth = level >= 2 ? 1.5 : 1;
  // Simple lightning-bolt crack pattern
  const cracks: [number, number, number, number][][] = [
    [[-8, -60, -14, -45], [-14, -45, -5, -35], [-5, -35, -18, -22]],
    [[10, -50, 18, -30], [18, -30, 8, -20], [8, -20, 22, -5]],
    [[-5, -30, -20, -10], [-20, -10, -8, 5]],
  ];
  for (let i = 0; i < Math.min(level, cracks.length); i++) {
    for (const [x1, y1, x2, y2] of cracks[i]) {
      ctx.beginPath();
      ctx.moveTo(x1 * (s / S), y1 * (s / S));
      ctx.lineTo(x2 * (s / S), y2 * (s / S));
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ── Main draw function ─────────────────────────────────────────────────────
function drawBoxer(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  cx: number,
  cy: number,
  scale: number,
  color: string,
  shadowColor: string,
  frustration: FrustrationLevel,
  hitFlash: boolean,
  bobOffset: number,
) {
  const sc = scale / S; // from "base" units to canvas pixels
  const by = cy + bobOffset;

  ctx.save();
  ctx.translate(cx, by);
  ctx.rotate((pose.bodyLean * Math.PI) / 180);

  const p: Record<keyof Pose, Vec2 & { lean?: number }> = {
    head: { x: pose.head.x * sc, y: pose.head.y * sc },
    neck: { x: pose.neck.x * sc, y: pose.neck.y * sc },
    lShoulder: { x: pose.lShoulder.x * sc, y: pose.lShoulder.y * sc },
    lElbow:    { x: pose.lElbow.x * sc,    y: pose.lElbow.y * sc },
    lWrist:    { x: pose.lWrist.x * sc,    y: pose.lWrist.y * sc },
    rShoulder: { x: pose.rShoulder.x * sc, y: pose.rShoulder.y * sc },
    rElbow:    { x: pose.rElbow.x * sc,    y: pose.rElbow.y * sc },
    rWrist:    { x: pose.rWrist.x * sc,    y: pose.rWrist.y * sc },
    hip:       { x: pose.hip.x * sc,       y: pose.hip.y * sc },
    lKnee:     { x: pose.lKnee.x * sc,     y: pose.lKnee.y * sc },
    lAnkle:    { x: pose.lAnkle.x * sc,    y: pose.lAnkle.y * sc },
    rKnee:     { x: pose.rKnee.x * sc,     y: pose.rKnee.y * sc },
    rAnkle:    { x: pose.rAnkle.x * sc,    y: pose.rAnkle.y * sc },
    bodyLean: { x: 0, y: 0 },
  };

  const bodyAlpha = hitFlash ? 1.0 : 0.92;
  const skinColor = hitFlash ? "#ff9999" : "#ffcba4";
  const gloveColor = hitFlash ? "#ff4444" : color;
  const shortsColor = color + "cc";

  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = hitFlash ? 28 : 14;

  // ── Helper to draw thick rounded limb ──
  const limb = (a: Vec2, b: Vec2, w: number, col: string) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  // Torso
  const torsoW = scale * 0.35;
  const torsoH = scale * 0.75;
  const tx = p.neck.x - torsoW / 2;
  const ty = p.neck.y;
  ctx.fillStyle = skinColor;
  ctx.globalAlpha = bodyAlpha;
  ctx.beginPath();
  ctx.roundRect(tx, ty, torsoW, torsoH * 0.4, 6 * sc);
  ctx.fill();

  // Shorts (lower torso)
  ctx.fillStyle = shortsColor;
  ctx.beginPath();
  ctx.roundRect(tx, ty + torsoH * 0.38, torsoW, torsoH * 0.35, 4 * sc);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Legs
  const legW = scale * 0.14;
  limb(p.hip, p.lKnee, legW, skinColor);
  limb(p.lKnee, p.lAnkle, legW * 0.9, skinColor);
  limb(p.hip, p.rKnee, legW, skinColor);
  limb(p.rKnee, p.rAnkle, legW * 0.9, skinColor);

  // Shoes
  for (const ankle of [p.lAnkle, p.rAnkle]) {
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.ellipse(ankle.x, ankle.y + scale * 0.04, scale * 0.12, scale * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arms (behind gloves, so drawn first)
  const armW = scale * 0.12;
  limb(p.lShoulder, p.lElbow, armW, skinColor);
  limb(p.lElbow,    p.lWrist, armW * 0.9, skinColor);
  limb(p.rShoulder, p.rElbow, armW, skinColor);
  limb(p.rElbow,    p.rWrist, armW * 0.9, skinColor);

  // Gloves
  const gr = scale * 0.18;
  for (const wrist of [p.lWrist, p.rWrist]) {
    ctx.beginPath();
    ctx.arc(wrist.x, wrist.y, gr, 0, Math.PI * 2);
    ctx.fillStyle = gloveColor;
    ctx.fill();
    // Glove highlight
    ctx.beginPath();
    ctx.arc(wrist.x - gr * 0.25, wrist.y - gr * 0.25, gr * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
    // Glove outline
    ctx.beginPath();
    ctx.arc(wrist.x, wrist.y, gr, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Head (drawn last to appear on top)
  const hr = scale * 0.22;
  ctx.beginPath();
  ctx.arc(p.head.x, p.head.y, hr, 0, Math.PI * 2);
  ctx.fillStyle = hitFlash ? "#ff9999" : skinColor;
  ctx.fill();
  // Headgear
  ctx.beginPath();
  ctx.arc(p.head.x, p.head.y, hr * 1.05, Math.PI * 0.85, Math.PI * 0.15);
  ctx.strokeStyle = gloveColor;
  ctx.lineWidth = hr * 0.35;
  ctx.stroke();
  // Eyes
  const eyeY = p.head.y - hr * 0.15;
  const eyeX = hr * 0.30;
  ctx.fillStyle = "#222";
  for (const ex of [-eyeX, eyeX]) {
    ctx.beginPath();
    ctx.arc(p.head.x + ex, eyeY, hr * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Eye whites
    ctx.beginPath();
    ctx.arc(p.head.x + ex, eyeY, hr * 0.18, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Mouthguard (slight grin)
  ctx.beginPath();
  ctx.arc(p.head.x, p.head.y + hr * 0.25, hr * 0.25, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = hr * 0.18;
  ctx.stroke();

  // Damage cracks
  drawCracks(ctx, scale, frustration);

  // Stars on stagger
  if (frustration >= 2) {
    const t = Date.now() / 600;
    for (let i = 0; i < 3; i++) {
      const angle = t + (i * Math.PI * 2) / 3;
      const sx = p.head.x + Math.cos(angle) * hr * 1.6;
      const sy = p.head.y + Math.sin(angle) * hr * 1.2 - hr;
      ctx.font = `${hr * 0.55}px sans-serif`;
      ctx.fillStyle = "rgba(255,220,0,0.85)";
      ctx.textAlign = "center";
      ctx.fillText("★", sx, sy);
    }
  }

  ctx.restore();
}

// ── React Component ─────────────────────────────────────────────────────────
interface CartoonFighterProps {
  animState: AIAnimState;
  /** 0–1 normalized screen coords, converted to canvas pixels internally */
  normX: number;
  normY: number;
  scale?: number;        // canvas pixels for the fighter height (default 160)
  color?: string;        // primary color (gloves, headgear)
  shadowColor?: string;
  frustration?: FrustrationLevel;
  hitFlash?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function CartoonFighter({
  animState,
  normX,
  normY,
  scale = 160,
  color = "#00aaff",
  shadowColor = "#0066cc",
  frustration = 0,
  hitFlash = false,
  className,
  style,
}: CartoonFighterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPoseRef = useRef<Pose>(mergedPose({}));
  const bobRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetPose = mergedPose(POSES[animState] ?? {});
    const LERP_SPEED = animState === "hurt" || animState === "ko" ? 0.25 : 0.15;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Lerp toward target pose
      const cp = currentPoseRef.current;
      const keys: (keyof Pose)[] = [
        "head", "neck", "lShoulder", "lElbow", "lWrist",
        "rShoulder", "rElbow", "rWrist", "hip",
        "lKnee", "lAnkle", "rKnee", "rAnkle",
      ];
      for (const k of keys) {
        (cp[k] as Vec2) = lerpV(cp[k] as Vec2, targetPose[k] as Vec2, LERP_SPEED);
      }
      cp.bodyLean = lerp(cp.bodyLean, targetPose.bodyLean, LERP_SPEED);

      // Bob oscillation
      const isMoving = animState === "bob" || animState === "idle";
      bobRef.current = isMoving ? Math.sin(Date.now() / 380) * 4 : lerp(bobRef.current, 0, 0.1);

      const cx = normX * W;
      const cy = normY * H;

      drawBoxer(ctx, cp, cx, cy, scale, color, shadowColor, frustration, hitFlash, bobRef.current);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animState, normX, normY, scale, color, shadowColor, frustration, hitFlash]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ ...style, imageRendering: "pixelated" }}
      width={typeof style?.width === "number" ? style.width : 400}
      height={typeof style?.height === "number" ? style.height : 700}
    />
  );
}
