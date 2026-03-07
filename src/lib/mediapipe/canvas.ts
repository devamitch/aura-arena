import type { VisionFrameResult } from './types';

const POSE_CONN: [number,number][] = [
  [11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],
  [23,25],[25,27],[27,29],[29,31],[24,26],[26,28],[28,30],[30,32],
  [15,17],[15,19],[15,21],[16,18],[16,20],[16,22],
];
const HAND_CONN: [number,number][] = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17],
];
const FACE_IDX = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];

export interface RenderOptions {
  drawSkeleton?: boolean; drawHands?: boolean; drawFace?: boolean;
  drawObjects?: boolean;  drawBrackets?: boolean; drawScanLine?: boolean;
  scanProgress?: number;  mirrored?: boolean;
}

export const renderFrameToCanvas = (canvas: HTMLCanvasElement, r: VisionFrameResult, color: string, opts: RenderOptions = {}): void => {
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const { drawSkeleton=true, drawHands=true, drawFace=true, drawObjects=true,
          drawBrackets=true, drawScanLine=false, scanProgress=0, mirrored=true } = opts;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  if (mirrored) { ctx.save(); ctx.translate(W,0); ctx.scale(-1,1); }
  if (drawSkeleton) renderSkeleton(ctx, r.poseLandmarks, color, W, H);
  if (drawHands)    renderHands(ctx, r.handLandmarks, color, W, H);
  if (drawFace)     renderFace(ctx, r.faceLandmarks, color, W, H);
  if (drawObjects)  renderObjects(ctx, r.objectDetections, W, H);
  if (mirrored) ctx.restore();
  if (drawBrackets) renderBrackets(ctx, W, H, color);
  if (drawScanLine && scanProgress < 1) renderScanLine(ctx, W, H, color, scanProgress);
};

const renderSkeleton = (ctx: CanvasRenderingContext2D, all: { x:number;y:number;visibility?:number }[][], c: string, W: number, H: number) => {
  for (const lms of all) {
    ctx.save(); ctx.strokeStyle=`${c}cc`; ctx.lineWidth=3; ctx.shadowColor=c; ctx.shadowBlur=15;
    for (const [a,b] of POSE_CONN) {
      if (!lms[a]||!lms[b]||(lms[a].visibility??1)<0.3||(lms[b].visibility??1)<0.3) continue;
      ctx.beginPath(); ctx.moveTo(lms[a].x*W,lms[a].y*H); ctx.lineTo(lms[b].x*W,lms[b].y*H); ctx.stroke();
    }
    ctx.fillStyle='#fff'; ctx.shadowBlur=20; ctx.shadowColor='#fff';
    for (const lm of lms) {
      if ((lm.visibility??1)<0.3) continue;
      ctx.beginPath(); ctx.arc(lm.x*W,lm.y*H,3.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
};

const renderHands = (ctx: CanvasRenderingContext2D, all: { x:number;y:number }[][], c: string, W: number, H: number) => {
  for (const h of all) {
    ctx.save(); ctx.strokeStyle='#ffffff70'; ctx.lineWidth=1.5;
    for (const [a,b] of HAND_CONN) {
      if (!h[a]||!h[b]) continue;
      ctx.beginPath(); ctx.moveTo(h[a].x*W,h[a].y*H); ctx.lineTo(h[b].x*W,h[b].y*H); ctx.stroke();
    }
    ctx.fillStyle=`${c}90`; ctx.shadowColor=c; ctx.shadowBlur=8;
    for (const lm of h) { ctx.beginPath(); ctx.arc(lm.x*W,lm.y*H,2.5,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
};

const renderFace = (ctx: CanvasRenderingContext2D, all: { x:number;y:number }[][], c: string, W: number, H: number) => {
  for (const f of all) {
    ctx.save(); ctx.strokeStyle=`${c}35`; ctx.lineWidth=1; ctx.beginPath(); let first=true;
    for (const i of FACE_IDX) {
      if (!f[i]) continue;
      const x=f[i].x*W, y=f[i].y*H;
      first ? (ctx.moveTo(x,y), first=false) : ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke(); ctx.restore();
  }
};

const renderObjects = (ctx: CanvasRenderingContext2D, dets: VisionFrameResult['objectDetections'], W: number, H: number) => {
  if (!dets.length) return;
  ctx.save(); ctx.strokeStyle='#00f0ff'; ctx.fillStyle='#00f0ff'; ctx.lineWidth=2; ctx.font='11px monospace';
  for (const d of dets) {
    ctx.strokeRect(d.x*W,d.y*H,d.w*W,d.h*H);
    ctx.fillText(`${d.label} ${(d.score*100).toFixed(0)}%`,d.x*W+4,d.y*H-5);
  }
  ctx.restore();
};

const renderBrackets = (ctx: CanvasRenderingContext2D, W: number, H: number, c: string) => {
  const s=28; ctx.save(); ctx.strokeStyle=c; ctx.lineWidth=2.5; ctx.shadowColor=c; ctx.shadowBlur=10;
  for (const [x,y,dx,dy] of [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]] as [number,number,number,number][]) {
    ctx.beginPath(); ctx.moveTo(x+dx*s,y); ctx.lineTo(x,y); ctx.lineTo(x,y+dy*s); ctx.stroke();
  }
  ctx.restore();
};

const renderScanLine = (ctx: CanvasRenderingContext2D, W: number, H: number, c: string, prog: number) => {
  const y=prog*H, hex=Math.round((1-prog)*180).toString(16).padStart(2,'0');
  ctx.save(); ctx.strokeStyle=`${c}${hex}`; ctx.lineWidth=1.5; ctx.shadowColor=c; ctx.shadowBlur=14;
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); ctx.restore();
};
