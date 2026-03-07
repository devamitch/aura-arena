import type { Landmark } from '@/types';
import { LM } from './landmarks';
import { lmDist2D } from './geometry';

export interface RhythmState {
  expectedBPM: number;
  lastBeatTime: number;
  beatHistory: number[];
  phaseOffset: number;
}

export const createRhythmState = (bpm: number): RhythmState => ({
  expectedBPM: bpm, lastBeatTime: 0, beatHistory: [], phaseOffset: 0,
});

export const scoreRhythm = (
  state: RhythmState,
  lms: Landmark[],
  nowMs: number,
): { score: number; updatedState: RhythmState } => {
  const beatMs = (60 / state.expectedBPM) * 1000;
  const phase  = (nowMs % beatMs) / beatMs;
  const lw = lms[LM.LEFT_WRIST], rw = lms[LM.RIGHT_WRIST];
  if (!lw || !rw) return { score: 70, updatedState: state };
  const energy   = lmDist2D(lw, rw);
  const expected = Math.abs(Math.sin(phase * Math.PI * 2)) * 0.3;
  const score    = Math.max(0, Math.min(100, 100 - Math.abs(energy - expected) * 300));
  return { score, updatedState: { ...state, beatHistory: [...state.beatHistory.slice(-20), nowMs] } };
};
