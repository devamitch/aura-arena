import type { FrameScore, SessionScoreSummary } from '@/types';

export const computeSessionSummary = (
  scores: FrameScore[],
  comboHistory: number[],
): SessionScoreSummary => {
  if (!scores.length) return {
    finalScore: 0, peakScore: 0, avgScore: 0,
    accuracy: 0, timing: 0, power: 0,
    expressiveness: 0, stability: 0, balance: 0,
    maxCombo: 0, totalFrames: 0,
    frameHistory: [], comboHistory: [],
  };
  const avg = (key: keyof FrameScore) => {
    const vals = scores.map(s => (s[key] as number) ?? 0).filter(v => v > 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };
  const finalScore = avg('overall');
  const allOveralls = scores.map(s => s.overall);
  const peakScore  = allOveralls.length ? Math.max(...allOveralls) : 0;
  const avgScore   = finalScore;
  const maxCombo   = comboHistory.length ? Math.max(...comboHistory) : 0;
  return {
    finalScore, peakScore, avgScore,
    accuracy:       avg('accuracy'),
    timing:         avg('timing'),
    power:          avg('power'),
    expressiveness: avg('expressiveness'),
    stability:      avg('stability'),
    balance:        avg('balance'),
    maxCombo,
    totalFrames:    scores.length,
    frameHistory:   allOveralls,
    comboHistory,
    framesScored:   scores.length,
  };
};

export const zeroScore = (): FrameScore => ({
  overall: 0, accuracy: 0, stability: 0, timing: 0,
  expressiveness: 0, power: 0, balance: 0, combo: 0,
  raw: {
    cosineSimilarity: 0, jitterMagnitude: 0, rhythmPhaseError: 0,
    symmetryScore: 0, depthScore: 0, velocityScore: 0, keypointConfidence: 0,
  },
});
