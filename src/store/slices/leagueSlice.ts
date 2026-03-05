// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — League Slice
// Sessions, battle state, PvE/PvP, leaderboard cache
// ═══════════════════════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  SessionData, AiOpponent, BattleResult, SessionScoreSummary,
  Drill, DisciplineId, SubDisciplineId,
} from '@types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionPhase   = 'pre' | 'active' | 'post';
export type BattlePhase    = 'select' | 'countdown' | 'battle' | 'result';

export interface SessionMetrics {
  liveScore:      number;
  accuracy:       number;
  stability:      number;
  timing:         number;
  expressiveness: number;
  power:          number;
  balance:        number;
  combo:          number;
  timer:          number;
  frames:         number;
}

export interface LeagueSlice {
  // Session
  sessionPhase:      SessionPhase;
  metrics:           SessionMetrics;
  selectedDrill:     Drill | null;
  selectedDifficulty: 1 | 2 | 3 | 4 | 5;
  sessionHistory:    SessionData[];
  currentSession:    Partial<SessionData> | null;
  poseLandmarks:     unknown[];
  cameraActive:      boolean;

  // Battle
  battlePhase:       BattlePhase;
  selectedOpponent:  AiOpponent | null;
  playerScore:       number;
  opponentScore:     number;
  battleTime:        number;
  battleResult:      BattleResult | null;
  liveComments:      { id: string; user: string; text: string; ts: number }[];
  viewerCount:       number;
  clipPoints:        number[];

  // Actions
  startSession: () => void;
  endSession:   (summary: SessionScoreSummary) => void;
  resetSession: () => void;
  setDrill:     (d: Drill) => void;
  setDifficulty:(d: 1|2|3|4|5) => void;
  updateMetrics:(m: Partial<SessionMetrics>) => void;
  setCameraActive:(v: boolean) => void;
  setPoseLandmarks:(l: unknown[]) => void;

  selectOpponent:    (o: AiOpponent) => void;
  setBattlePhase:    (p: BattlePhase) => void;
  setBattleTime:     (t: number | ((prev: number) => number)) => void;
  updateBattleScores:(player: number, opponent: number) => void;
  setBattleResult:   (r: BattleResult) => void;
  resetBattle:       () => void;
  addComment:        (c: { user: string; text: string }) => void;
  setViewerCount:    (v: number) => void;
  addClipPoint:      (t: number) => void;
}

const zeroMetrics = (): SessionMetrics => ({
  liveScore: 0, accuracy: 0, stability: 0, timing: 0,
  expressiveness: 0, power: 0, balance: 0,
  combo: 0, timer: 0, frames: 0,
});

// ─── Slice Factory ────────────────────────────────────────────────────────────

export const createLeagueSlice: StateCreator<
  LeagueSlice,
  [['zustand/immer', never]],
  [],
  LeagueSlice
> = (set) => ({
  // Session
  sessionPhase:       'pre',
  metrics:             zeroMetrics(),
  selectedDrill:       null,
  selectedDifficulty:  2,
  sessionHistory:      [],
  currentSession:      null,
  poseLandmarks:       [],
  cameraActive:        false,

  // Battle
  battlePhase:         'select',
  selectedOpponent:    null,
  playerScore:         0,
  opponentScore:       0,
  battleTime:          60,
  battleResult:        null,
  liveComments:        [],
  viewerCount:         0,
  clipPoints:          [],

  startSession: () => set((s) => {
    s.sessionPhase = 'active';
    s.metrics      = zeroMetrics();
    s.currentSession = { startedAt: new Date().toISOString() };
  }),

  endSession: (summary) => set((s) => {
    s.sessionPhase = 'post';
    if (!s.currentSession) return;
    const sessionData: SessionData = {
      id:           nanoid(),
      userId:       '',
      discipline:   s.currentSession.discipline as DisciplineId ?? 'boxing',
      subDiscipline:s.currentSession.subDiscipline as SubDisciplineId,
      drillId:      s.selectedDrill?.id ?? 'freestyle',
      difficulty:   s.selectedDifficulty,
      score:        summary.finalScore,
      accuracy:     summary.accuracy,
      stability:    summary.stability,
      timing:       summary.timing,
      expressiveness: summary.expressiveness,
      power:        summary.power,
      balance:      summary.balance,
      duration:     s.metrics.timer,
      bestCombo:    summary.maxCombo,
      xpEarned:     0,
      pointsEarned: 0,
      coachingText: '',
      createdAt:    new Date().toISOString(),
    };
    s.sessionHistory.unshift(sessionData);
    if (s.sessionHistory.length > 100) s.sessionHistory.length = 100;
  }),

  resetSession: () => set((s) => {
    s.sessionPhase  = 'pre';
    s.metrics       = zeroMetrics();
    s.currentSession = null;
  }),

  setDrill:      (d) => set((s) => { s.selectedDrill = d; }),
  setDifficulty: (d) => set((s) => { s.selectedDifficulty = d; }),

  updateMetrics: (m) => set((s) => {
    Object.assign(s.metrics, m);
  }),

  setCameraActive:  (v) => set((s) => { s.cameraActive = v; }),
  setPoseLandmarks: (l) => set((s) => { s.poseLandmarks = l; }),

  selectOpponent:  (o) => set((s) => { s.selectedOpponent = o; }),
  setBattlePhase:  (p) => set((s) => { s.battlePhase = p; }),

  setBattleTime: (t) => set((s) => {
    s.battleTime = typeof t === 'function' ? t(s.battleTime) : t;
  }),

  updateBattleScores: (player, opp) => set((s) => {
    s.playerScore   = player;
    s.opponentScore = opp;
  }),

  setBattleResult: (r) => set((s) => { s.battleResult = r; }),

  resetBattle: () => set((s) => {
    s.battlePhase    = 'select';
    s.selectedOpponent = null;
    s.playerScore    = 0;
    s.opponentScore  = 0;
    s.battleTime     = 60;
    s.battleResult   = null;
    s.liveComments   = [];
    s.viewerCount    = 0;
    s.clipPoints     = [];
  }),

  addComment:    (c) => set((s) => {
    s.liveComments.unshift({ ...c, id: nanoid(), ts: Date.now() });
    if (s.liveComments.length > 50) s.liveComments.length = 50;
  }),

  setViewerCount: (v) => set((s) => { s.viewerCount = v; }),
  addClipPoint:   (t) => set((s) => { s.clipPoints.push(t); }),
});
