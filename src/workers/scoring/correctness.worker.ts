// Aura Arena — Pose Correctness Worker (TF.js CPU + JSON rules, < 200 lines)
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import type { Landmark } from '@/types';
import poseRules from '@/data/pose-rules.json';
import disciplineConfig from '@/data/discipline-config.json';

type RuleCheck = { joint: string; min: number; max: number; cue: string };
type Rule = { exercise: string; visibilityMin: number; checks: RuleCheck[] };
const RULES = poseRules as Record<string, Rule>;
const DC    = disciplineConfig as Record<string, { poseRule: string }>;

const JOINTS   = ['leftElbow','rightElbow','leftShoulder','rightShoulder','leftKnee','rightKnee','leftHip','rightHip'];
const TRIPLES: [number,number,number][] = [[11,13,15],[12,14,16],[13,11,23],[14,12,24],[23,25,27],[24,26,28],[11,23,25],[12,24,26]];
const post = (data: unknown) => (self as unknown as Worker).postMessage(data);
let tfReady = false;

async function init() {
  if (!tfReady) { await tf.setBackend('cpu'); await tf.ready(); tfReady = true; }
  post({ type: 'READY' });
}

function computeAngles(lms: Landmark[]): Record<string, number> {
  return tf.tidy(() => {
    const As = tf.tensor2d(TRIPLES.map(([a])    => [lms[a].x, lms[a].y]));
    const Bs = tf.tensor2d(TRIPLES.map(([,b])   => [lms[b].x, lms[b].y]));
    const Cs = tf.tensor2d(TRIPLES.map(([,,c])  => [lms[c].x, lms[c].y]));
    const BA  = tf.sub(As, Bs), BC = tf.sub(Cs, Bs);
    const dot = tf.sum(tf.mul(BA, BC), 1);
    const mag = tf.mul(tf.sqrt(tf.sum(tf.square(BA),1)), tf.sqrt(tf.sum(tf.square(BC),1)));
    const cos = tf.clipByValue(tf.div(dot, tf.add(mag, 1e-7)), -1, 1);
    const deg = tf.mul(tf.acos(cos), 180 / Math.PI);
    const vals = deg.dataSync();
    const map: Record<string, number> = {};
    JOINTS.forEach((n, i) => { map[n] = vals[i]; });
    return map;
  });
}

function checkForm(lms: Landmark[], disc: string, subDiscipline?: string) {
  if (!lms || lms.length < 29) return { isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: 'idle' };
  const key  = DC[disc]?.poseRule ?? disc;
  const rule = RULES[subDiscipline ? `${disc}_${subDiscipline}` : key] ?? RULES[key];
  if (!rule) return { isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: 'idle' };
  const keyIdx = [11,12,23,24];
  const avgVis = keyIdx.reduce((s,i) => s + (lms[i]?.visibility ?? 0), 0) / keyIdx.length;
  if (avgVis < (rule.visibilityMin ?? 0.45)) return { isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: 'idle' };
  const angles  = computeAngles(lms);
  const results = rule.checks.map(c => {
    const ang = angles[c.joint] ?? 0;
    const ok  = Number.isFinite(ang) && ang >= c.min && ang <= c.max;
    return { joint: { name: c.joint, angle: Math.round(ang), expected: [c.min, c.max] as [number,number], ok }, cue: ok ? null : c.cue };
  });
  const feedback = results.map(r => r.cue).filter(Boolean).slice(0, 3) as string[];
  const score    = Math.round(100 - (feedback.length / Math.max(rule.checks.length, 1)) * 100);
  return { isCorrect: score >= 70, score, feedback, jointAngles: results.map(r => r.joint), exercise: rule.exercise };
}

self.addEventListener('message', async (e: MessageEvent) => {
  const msg = e.data as Record<string, unknown>;
  if (msg['type'] === 'INIT') {
    try { await init(); } catch (err) { post({ type: 'ERROR', message: String(err) }); }
  } else if (msg['type'] === 'CHECK_FORM') {
    const result = checkForm((msg['landmarks'] as Landmark[]) ?? [], (msg['discipline'] as string) ?? 'fitness', msg['subDiscipline'] as string | undefined);
    post({ type: 'FORM_RESULT', poseCorrectness: result });
  } else if (msg['type'] === 'DESTROY') { /* no persistent state */ }
});
