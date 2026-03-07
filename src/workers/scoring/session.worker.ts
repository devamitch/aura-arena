// Aura Arena — Session Worker (accumulates frame scores, computes summary)
import type { FrameScore } from '@/types';
import { computeSessionSummary } from '@/lib/score/session';

const MAX_FRAMES = 600; // 10 min @ 1fps
let scores: FrameScore[] = [];
let combos: number[] = [];
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);

self.addEventListener('message', (e: MessageEvent) => {
  const msg = e.data as Record<string, unknown>;
  if (msg['type'] === 'INIT') { post({ type: 'READY' }); return; }
  if (msg['type'] === 'ADD_FRAME') {
    const s = msg['frameScore'] as FrameScore;
    scores = [...scores.slice(-(MAX_FRAMES-1)), s];
    combos = [...combos.slice(-(MAX_FRAMES-1)), s.combo ?? 0];
    return;
  }
  if (msg['type'] === 'GET_SUMMARY') {
    post({ type: 'SUMMARY', summary: computeSessionSummary(scores, combos) });
    return;
  }
  if (msg['type'] === 'RESET') { scores = []; combos = []; return; }
  if (msg['type'] === 'DESTROY') { scores = []; combos = []; }
});
