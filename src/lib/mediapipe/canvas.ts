import type { VisionFrameResult } from "./types";

const POSE_CONN: [number, number][] = [
  // ── Head / Face (pose landmarks 0-10: nose, eyes, ears, mouth) ────────────
  [0, 1], [1, 2], [2, 3], [3, 7],   // left eye path + ear
  [0, 4], [4, 5], [5, 6], [6, 8],   // right eye path + ear
  [0, 9], [0, 10], [9, 10],          // nose to mouth corners
  // ── Shoulders ─────────────────────────────────────────────────────────────
  [11, 12],
  // ── Arms ──────────────────────────────────────────────────────────────────
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  // ── Torso ─────────────────────────────────────────────────────────────────
  [11, 23], [12, 24], [23, 24],
  // ── Legs ──────────────────────────────────────────────────────────────────
  [23, 25], [25, 27], [27, 29], [29, 31],
  [24, 26], [26, 28], [28, 30], [30, 32],
  // ── Wrist fingers ─────────────────────────────────────────────────────────
  [15, 17], [15, 19], [15, 21],
  [16, 18], [16, 20], [16, 22],
];

const HAND_CONN: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const FACE_OVAL_IDX = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21,
  54, 103, 67, 109,
];

// Key contour pairs for lips, eyes, eyebrows, nose
const FACE_CONTOURS: [number, number][] = [
  [61,185],[185,40],[40,39],[39,37],[37,0],[0,267],[267,269],[269,270],[270,409],[409,291],
  [61,146],[146,91],[91,181],[181,84],[84,17],[17,314],[314,405],[405,321],[321,375],[375,291],
  [33,7],[7,163],[163,144],[144,145],[145,153],[153,154],[154,155],[155,133],
  [263,249],[249,390],[390,373],[373,374],[374,380],[380,381],[381,382],[382,362],
  [70,63],[63,105],[105,66],[66,107],
  [300,293],[293,334],[334,296],[296,336],
  [168,6],[6,197],[197,195],[195,5],
];

export interface RenderOptions {
  drawSkeleton?: boolean;
  drawHands?: boolean;
  drawFace?: boolean;
  drawObjects?: boolean;
  drawBrackets?: boolean;
  drawScanLine?: boolean;
  scanProgress?: number;
  mirrored?: boolean;
}

export const renderFrameToCanvas = (
  canvas: HTMLCanvasElement,
  r: VisionFrameResult,
  color: string,
  opts: RenderOptions = {},
): void => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const {
    drawSkeleton = true,
    drawHands = true,
    drawFace = true,
    drawObjects = true,
    drawBrackets = true,
    drawScanLine = false,
    scanProgress = 0,
    mirrored = true,
  } = opts;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (mirrored) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); }
  if (drawSkeleton) renderSkeleton(ctx, r.poseLandmarks, color, W, H);
  if (drawHands) renderHands(ctx, r.handLandmarks, color, W, H);
  if (drawFace) renderFace(ctx, r.faceLandmarks, color, W, H);
  if (drawObjects) renderObjects(ctx, r.objectDetections, W, H);
  if (mirrored) ctx.restore();
  if (drawBrackets) renderBrackets(ctx, W, H, color);
  if (drawScanLine && scanProgress < 1) renderScanLine(ctx, W, H, color, scanProgress);
};

const renderSkeleton = (
  ctx: CanvasRenderingContext2D,
  all: { x: number; y: number; visibility?: number }[][],
  c: string,
  W: number,
  H: number,
) => {
  for (const lms of all) {
    // Connections with visibility-based alpha
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.shadowColor = c;
    ctx.shadowBlur = 10;
    for (const [a, b] of POSE_CONN) {
      if (!lms[a] || !lms[b]) continue;
      const vis = Math.min(lms[a].visibility ?? 1, lms[b].visibility ?? 1);
      if (vis < 0.15) continue;
      const alpha = Math.round(Math.max(0.35, vis) * 255).toString(16).padStart(2, "0");
      ctx.strokeStyle = `${c}${alpha}`;
      ctx.beginPath();
      ctx.moveTo(lms[a].x * W, lms[a].y * H);
      ctx.lineTo(lms[b].x * W, lms[b].y * H);
      ctx.stroke();
    }
    ctx.restore();
    // Keypoint dots
    ctx.save();
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = 14;
    for (const lm of lms) {
      const vis = lm.visibility ?? 1;
      if (vis < 0.12) continue;
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0.3, vis).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, vis > 0.5 ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const renderHands = (
  ctx: CanvasRenderingContext2D,
  all: { x: number; y: number }[][],
  c: string,
  W: number,
  H: number,
) => {
  for (const h of all) {
    ctx.save();
    ctx.strokeStyle = "#ffffff70";
    ctx.lineWidth = 1.5;
    for (const [a, b] of HAND_CONN) {
      if (!h[a] || !h[b]) continue;
      ctx.beginPath();
      ctx.moveTo(h[a].x * W, h[a].y * H);
      ctx.lineTo(h[b].x * W, h[b].y * H);
      ctx.stroke();
    }
    ctx.fillStyle = `${c}a0`;
    ctx.shadowColor = c;
    ctx.shadowBlur = 8;
    for (const lm of h) {
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const renderFace = (
  ctx: CanvasRenderingContext2D,
  all: { x: number; y: number }[][],
  c: string,
  W: number,
  H: number,
) => {
  for (const f of all) {
    ctx.save();
    // Oval outline
    ctx.strokeStyle = `${c}50`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    let first = true;
    for (const i of FACE_OVAL_IDX) {
      if (!f[i]) continue;
      const x = f[i].x * W, y = f[i].y * H;
      first ? (ctx.moveTo(x, y), (first = false)) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    // Feature contours (eyes, lips, eyebrows, nose)
    ctx.strokeStyle = `${c}80`;
    ctx.lineWidth = 0.9;
    for (const [a, b] of FACE_CONTOURS) {
      if (!f[a] || !f[b]) continue;
      ctx.beginPath();
      ctx.moveTo(f[a].x * W, f[a].y * H);
      ctx.lineTo(f[b].x * W, f[b].y * H);
      ctx.stroke();
    }
    // Micro mesh dots
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.shadowColor = c;
    ctx.shadowBlur = 3;
    for (const lm of f) {
      ctx.beginPath();
      ctx.arc(lm.x * W, lm.y * H, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};

const renderObjects = (
  ctx: CanvasRenderingContext2D,
  dets: VisionFrameResult["objectDetections"],
  W: number,
  H: number,
) => {
  if (!dets.length) return;
  ctx.save();
  ctx.strokeStyle = "#00f0ff";
  ctx.fillStyle = "#00f0ff";
  ctx.lineWidth = 2;
  ctx.font = "11px monospace";
  for (const d of dets) {
    ctx.strokeRect(d.x * W, d.y * H, d.w * W, d.h * H);
    ctx.fillText(`${d.label} ${(d.score * 100).toFixed(0)}%`, d.x * W + 4, d.y * H - 5);
  }
  ctx.restore();
};

const renderBrackets = (ctx: CanvasRenderingContext2D, W: number, H: number, c: string) => {
  const s = 28;
  ctx.save();
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = c;
  ctx.shadowBlur = 10;
  for (const [x, y, dx, dy] of [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]] as [number,number,number,number][]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * s, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * s);
    ctx.stroke();
  }
  ctx.restore();
};

const renderScanLine = (ctx: CanvasRenderingContext2D, W: number, H: number, c: string, prog: number) => {
  const y = prog * H;
  const hex = Math.round((1 - prog) * 180).toString(16).padStart(2, "0");
  ctx.save();
  ctx.strokeStyle = `${c}${hex}`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = c;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
  ctx.restore();
};
