import type { Landmark } from '@/types';
import { LM } from './landmarks';

export const vec3 = {
  from: (lm: Landmark): [number, number, number] => [lm.x, lm.y, lm.z],
  dot: ([ax, ay, az]: [number, number, number], [bx, by, bz]: [number, number, number]) => ax*bx + ay*by + az*bz,
  mag: ([x, y, z]: [number, number, number]) => Math.sqrt(x*x + y*y + z*z),
  sub: ([ax, ay, az]: [number, number, number], [bx, by, bz]: [number, number, number]): [number, number, number] => [ax-bx, ay-by, az-bz],
  cosAngle(a: [number,number,number], b: [number,number,number]) {
    const d = this.dot(a,b), m = this.mag(a)*this.mag(b);
    return m === 0 ? 0 : Math.max(-1, Math.min(1, d/m));
  },
};

export const jointAngleDeg = (a: Landmark, b: Landmark, c: Landmark): number => {
  const ba = vec3.sub(vec3.from(a), vec3.from(b));
  const bc = vec3.sub(vec3.from(c), vec3.from(b));
  return (Math.acos(vec3.cosAngle(ba, bc)) * 180) / Math.PI;
};

export const lmDist2D = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

export const midpoint = (a: Landmark, b: Landmark): Landmark => ({
  x: (a.x+b.x)/2, y: (a.y+b.y)/2, z: (a.z+b.z)/2,
});

export const bilateralSymmetry = (lms: Landmark[]): number => {
  const pairs: [number,number][] = [[11,12],[13,14],[15,16],[23,24],[25,26],[27,28]];
  const cx = 0.5;
  let diff = 0, n = 0;
  for (const [l,r] of pairs) {
    if (!lms[l] || !lms[r]) continue;
    diff += Math.abs(Math.abs(lms[l].x-cx) - Math.abs(lms[r].x-cx)) + Math.abs(lms[l].y-lms[r].y)*0.5;
    n++;
  }
  return n === 0 ? 1 : Math.max(0, 1 - diff/n/0.1);
};

export const poseCosineSimilarity = (a: Landmark[], b: Landmark[]): number => {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i].x*b[i].x + a[i].y*b[i].y + a[i].z*b[i].z;
    na  += a[i].x**2 + a[i].y**2 + a[i].z**2;
    nb  += b[i].x**2 + b[i].y**2 + b[i].z**2;
  }
  const d = Math.sqrt(na)*Math.sqrt(nb);
  return d === 0 ? 0 : Math.max(0, Math.min(1, dot/d));
};

export const computeJitter = (cur: Landmark[], prev: Landmark[]): number => {
  if (!prev.length) return 0;
  const len = Math.min(cur.length, prev.length);
  let total = 0;
  for (let i = 0; i < len; i++) total += lmDist2D(cur[i], prev[i]);
  return total / len;
};

export const jitterToStability = (jitter: number) => Math.max(0, Math.min(100, 100 - (jitter/0.06)*100));

export const lmVisible = (lm: Landmark | undefined, min = 0.3) => !!lm && (lm.visibility ?? 1) >= min;

// Wrist height (0=top, 1=bottom of frame) — used for guard checks
export const wristGuardScore = (lms: Landmark[]): number => {
  const ls = lms[LM.LEFT_SHOULDER], rs = lms[LM.RIGHT_SHOULDER];
  const lw = lms[LM.LEFT_WRIST],   rw = lms[LM.RIGHT_WRIST];
  if (!ls || !rs || !lw || !rw) return 50;
  const shoulderY = (ls.y + rs.y) / 2;
  const wristY    = (lw.y + rw.y) / 2;
  const guardRatio = Math.max(0, Math.min(1, (shoulderY - wristY + 0.1) / 0.3));
  return Math.round(guardRatio * 100);
};
