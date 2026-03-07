import type { DisciplineId, FrameScore, Landmark, SubDisciplineId } from '@/types';
import {
  poseCosineSimilarity, computeJitter, jitterToStability,
  bilateralSymmetry, lmDist2D, wristGuardScore,
} from './geometry';
import { scoreRhythm, type RhythmState } from './rhythm';
import { LM } from './landmarks';
import scoringWeightsJson from '@/data/scoring-weights.json';

type Weights = { accuracy: number; timing: number; power: number; stability: number; expressiveness: number; balance: number };
const WEIGHTS = scoringWeightsJson as Record<string, Weights>;

export interface ScoreFrameInput {
  landmarks:         Landmark[];
  previousLandmarks: Landmark[];
  frameWindow:       Landmark[][];
  discipline:        DisciplineId;
  subDiscipline?:    SubDisciplineId;
  elapsedMs:         number;
  rhythmState:       RhythmState;
  currentCombo:      number;
  lastComboTime:     number;
  gestures?:         { categoryName: string; score: number }[][];
}

export interface ScoreFrameOutput {
  frameScore:         FrameScore;
  updatedRhythmState: RhythmState;
  newCombo:           number;
  newLastComboTime:   number;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const warmup = (ms: number) => Math.min(1, ms / 8000);

export function scoreFrame(input: ScoreFrameInput): ScoreFrameOutput {
  const { landmarks: lms, previousLandmarks: prev,
    discipline, elapsedMs, rhythmState, currentCombo, lastComboTime, gestures } = input;

  if (!lms.length) {
    return { frameScore: zeroScoreFrame(), updatedRhythmState: rhythmState, newCombo: currentCombo, newLastComboTime: lastComboTime };
  }

  const w    = WEIGHTS[discipline] ?? WEIGHTS['default'] ?? { accuracy:0.2,timing:0.2,power:0.2,stability:0.15,expressiveness:0.1,balance:0.15 };
  const heat = warmup(elapsedMs);
  const keyVis = [11,12,23,24].reduce((s,i) => s + (lms[i]?.visibility ?? 0), 0) / 4;
  const confid = clamp(keyVis * 100 * heat);

  const accuracy   = prev.length ? clamp(poseCosineSimilarity(lms, prev) * 95 * heat + 5) : 60;
  const jitter     = prev.length ? computeJitter(lms, prev) : 0;
  const stability  = clamp(jitterToStability(jitter) * heat + (1-heat) * 50);

  const { score: timingRaw, updatedState: updatedRhythmState } = scoreRhythm(rhythmState, lms, elapsedMs);
  const timing     = clamp(timingRaw * heat + (1-heat) * 50);

  const exprJoints = [LM.LEFT_WRIST, LM.RIGHT_WRIST, LM.LEFT_ELBOW, LM.RIGHT_ELBOW];
  const exprVel    = prev.length ? exprJoints.reduce((s,i) => lms[i] && prev[i] ? s + lmDist2D(lms[i], prev[i]) : s, 0) / exprJoints.length : 0;
  const expressiveness = clamp(Math.min(1, exprVel / 0.04) * 80 * heat + 10);

  let power = 50;
  if (discipline === 'boxing' || discipline === 'martialarts') {
    power = clamp(wristGuardScore(lms) * heat + (1-heat) * 50);
  } else {
    const velLm = [LM.LEFT_WRIST, LM.RIGHT_WRIST];
    const vel   = prev.length ? velLm.reduce((s,i) => lms[i]&&prev[i] ? s+lmDist2D(lms[i],prev[i]) : s, 0)/velLm.length : 0;
    power = clamp(Math.min(1, vel/0.03) * 80 * heat + 15);
  }

  const balance = clamp(bilateralSymmetry(lms) * 90 * heat + 10);

  let gestureBonus = 0;
  const topGest = gestures?.[0]?.[0];
  if (topGest && topGest.score > 0.8 && topGest.categoryName !== 'None') gestureBonus = 3;

  const overall = clamp(
    accuracy*w.accuracy + timing*w.timing + power*w.power +
    stability*w.stability + expressiveness*w.expressiveness + balance*w.balance +
    gestureBonus + confid * 0.03,
  );

  let newCombo = currentCombo, newLastComboTime = lastComboTime;
  const now = elapsedMs;
  if (overall >= 65) {
    newCombo = now - lastComboTime < 2500 ? currentCombo + 1 : 1;
    newLastComboTime = now;
  } else if (now - lastComboTime > 3000) {
    newCombo = 0;
  }

  const frameScore: FrameScore = {
    overall, accuracy, stability, timing, expressiveness, power, balance,
    combo: newCombo,
    raw: { cosineSimilarity: accuracy/100, jitterMagnitude: jitter, rhythmPhaseError: (100-timing)/100,
      symmetryScore: balance/100, depthScore: power/100, velocityScore: expressiveness/100, keypointConfidence: confid/100 },
  };

  return { frameScore, updatedRhythmState, newCombo, newLastComboTime };
}

function zeroScoreFrame(): FrameScore {
  return {
    overall:0, accuracy:0, stability:0, timing:0, expressiveness:0, power:0, balance:0, combo:0,
    raw:{ cosineSimilarity:0, jitterMagnitude:0, rhythmPhaseError:0, symmetryScore:0, depthScore:0, velocityScore:0, keypointConfidence:0 },
  };
}
