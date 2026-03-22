// Aura Arena — Scoring Hook (main-thread only, no web workers)
//
// Replaces the previous WorkerBridge-based implementation.
// All scoring runs synchronously on the main thread using the same lib functions
// the workers called, so behaviour is identical without the worker lifecycle issues.

import { bus } from "@/lib/eventBus";
import type { PoseCorrectness } from "@/lib/poseCorrectness";
import { scoreFrame, type ScoreFrameInput } from "@/lib/score/frame";
import { createRhythmState, type RhythmState } from "@/lib/score/rhythm";
import { computeSessionSummary, zeroScore } from "@/lib/score/session";
import { getPoseRules } from "@/data/rules";
import disciplineConfig from "@/data/discipline-config.json";
import type { DisciplineId, FrameScore, Landmark } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types (mirrors the worker message shapes) ────────────────────────────────
type RuleCheck = { joint: string; min: number; max: number; cue: string };
type Rule = { exercise: string; visibilityMin: number; checks: RuleCheck[] };
const DC = disciplineConfig as Record<string, { bpm: number; poseRule?: string }>;

export interface ScoringState {
  frameReady: boolean;
  correctnessReady: boolean;
  sessionReady: boolean;
}

// ── Angle helpers (plain math — no TF.js needed) ─────────────────────────────
const TRIPLES: [number, number, number][] = [
  [11, 13, 15], [12, 14, 16],
  [13, 11, 23], [14, 12, 24],
  [23, 25, 27], [24, 26, 28],
  [11, 23, 25], [12, 24, 26],
];
const JOINT_NAMES = [
  "leftElbow", "rightElbow",
  "leftShoulder", "rightShoulder",
  "leftKnee", "rightKnee",
  "leftHip", "rightHip",
];

function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const bax = a.x - b.x, bay = a.y - b.y;
  const bcx = c.x - b.x, bcy = c.y - b.y;
  const dot = bax * bcx + bay * bcy;
  const mag = Math.sqrt(bax * bax + bay * bay) * Math.sqrt(bcx * bcx + bcy * bcy);
  return Math.acos(Math.max(-1, Math.min(1, dot / (mag || 0.001)))) * (180 / Math.PI);
}

function computeAngles(lms: Landmark[]): Record<string, number> {
  const map: Record<string, number> = {};
  TRIPLES.forEach(([ai, bi, ci], idx) => {
    const a = lms[ai], b = lms[bi], c = lms[ci];
    map[JOINT_NAMES[idx]] = a && b && c ? angleDeg(a, b, c) : 0;
  });
  return map;
}

function checkFormMain(
  lms: Landmark[],
  disc: string,
  subDiscipline?: string,
): PoseCorrectness {
  const empty: PoseCorrectness = { isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: "idle" };
  if (!lms || lms.length < 29) return empty;

  const key = (DC[disc]?.poseRule ?? disc) as string;
  const targetKey = subDiscipline ? `${disc}_${subDiscipline}` : key;
  const rule = getPoseRules(targetKey) as Rule | undefined;
  if (!rule) return empty;

  const keyIdx = [11, 12, 23, 24];
  const avgVis = keyIdx.reduce((s, i) => s + (lms[i]?.visibility ?? 0), 0) / keyIdx.length;
  if (avgVis < (rule.visibilityMin ?? 0.45)) return empty;

  const angles = computeAngles(lms);
  const results = rule.checks.map((c) => {
    const ang = angles[c.joint] ?? 0;
    const ok = Number.isFinite(ang) && ang >= c.min && ang <= c.max;
    return {
      joint: { name: c.joint, angle: Math.round(ang), expected: [c.min, c.max] as [number, number], ok },
      cue: ok ? null : c.cue,
    };
  });

  const feedback = results.map((r) => r.cue).filter(Boolean).slice(0, 3) as string[];
  const score = Math.round(100 - (feedback.length / Math.max(rule.checks.length, 1)) * 100);

  return {
    isCorrect: score >= 70,
    score,
    feedback,
    jointAngles: results.map((r) => r.joint),
    exercise: rule.exercise,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useScoringWorker(
  discipline: string,
  _subDiscipline?: string,
): ScoringState & {
  scoreFrame: (payload: Record<string, unknown>) => void;
  checkForm: (landmarks: unknown[], discipline: string, subDiscipline?: string) => void;
  getSessionSummary: () => Promise<unknown>;
  addFrame: (frameScore: FrameScore) => void;
  resetSession: () => void;
  lastScore: React.RefObject<FrameScore>;
  lastCorrectness: React.RefObject<PoseCorrectness>;
} {
  const [state, setState] = useState<ScoringState>({
    frameReady: false,
    correctnessReady: false,
    sessionReady: false,
  });

  // Session accumulation
  const framesRef = useRef<FrameScore[]>([]);
  const combosRef = useRef<number[]>([]);
  const rhythmRef = useRef<RhythmState>(createRhythmState(90));

  const lastScore = useRef<FrameScore>(zeroScore());
  const lastCorrectness = useRef<PoseCorrectness>({
    isCorrect: true, score: 100, feedback: [], jointAngles: [], exercise: "idle",
  });

  // Initialise rhythm from discipline config and mark everything ready
  useEffect(() => {
    const bpm = DC[discipline]?.bpm ?? 90;
    rhythmRef.current = createRhythmState(bpm);
    framesRef.current = [];
    combosRef.current = [];

    setState({ frameReady: true, correctnessReady: true, sessionReady: true });
  }, [discipline]);

  // ── scoreFrame ──────────────────────────────────────────────────────────
  const doScoreFrame = useCallback((payload: Record<string, unknown>) => {
    const input: ScoreFrameInput = {
      landmarks:         (payload["landmarks"]     as ScoreFrameInput["landmarks"])      ?? [],
      previousLandmarks: (payload["prevLandmarks"] as ScoreFrameInput["previousLandmarks"]) ?? [],
      frameWindow:       (payload["frameWindow"]   as ScoreFrameInput["frameWindow"])    ?? [],
      discipline:        (payload["discipline"]    as DisciplineId)                      ?? (discipline as DisciplineId),
      subDiscipline:     payload["subDiscipline"]  as ScoreFrameInput["subDiscipline"],
      elapsedMs:         (payload["elapsedMs"]     as number)                            ?? 0,
      rhythmState:       (payload["rhythmState"]   as RhythmState) ?? rhythmRef.current,
      currentCombo:      (payload["combo"]         as number)                            ?? 0,
      lastComboTime:     (payload["lastComboTime"] as number)                            ?? 0,
      gestures:          payload["gestures"]       as ScoreFrameInput["gestures"],
    };

    const result = scoreFrame(input);
    rhythmRef.current = result.updatedRhythmState;
    lastScore.current = result.frameScore;

    bus.emit("frame:scored", result as Parameters<typeof bus.emit<"frame:scored">>[1]);
  }, [discipline]);

  // ── checkForm ────────────────────────────────────────────────────────────
  const doCheckForm = useCallback((lms: unknown[], disc: string, sub?: string) => {
    const result = checkFormMain(lms as Landmark[], disc, sub);
    lastCorrectness.current = result;
    bus.emit("form:result", { poseCorrectness: result });
  }, []);

  // ── Session accumulation ──────────────────────────────────────────────────
  const addFrame = useCallback((fs: FrameScore) => {
    framesRef.current = [...framesRef.current.slice(-599), fs];
    combosRef.current = [...combosRef.current.slice(-599), fs.combo ?? 0];
  }, []);

  const resetSession = useCallback(() => {
    framesRef.current = [];
    combosRef.current = [];
    rhythmRef.current = createRhythmState(DC[discipline]?.bpm ?? 90);
  }, [discipline]);

  const getSessionSummary = useCallback(
    () => Promise.resolve(computeSessionSummary(framesRef.current, combosRef.current)),
    [],
  );

  return {
    ...state,
    scoreFrame: doScoreFrame,
    checkForm: doCheckForm,
    addFrame,
    resetSession,
    getSessionSummary,
    lastScore,
    lastCorrectness,
  };
}
