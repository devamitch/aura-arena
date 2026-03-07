// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — User Activity Monitor
// Tracks everything: poses, scores, session patterns, game actions.
// Saves to Supabase in real-time batches. Feeds the TF.js training pipeline.
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "@lib/supabase/client";
import type { DisciplineId } from "@types";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PoseFrame {
  timestamp: number;
  keypoints: number[][];
  confidence: number;
  exercise: string;
  score: number;
}

export interface GameAction {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface SessionPattern {
  sessionId: string;
  userId: string;
  discipline: DisciplineId;
  subDiscipline?: string;
  startTime: number;
  endTime?: number;
  poseFrames: PoseFrame[];
  actions: GameAction[];
  scores: number[];
  avgAccuracy: number;
  avgStability: number;
  combos: number[];
  peakScore: number;
  totalDuration: number;
}

// ─── BUFFER (accumulates data, flushes in batches) ───────────────────────────

const FLUSH_INTERVAL = 15_000; // 15 seconds
const MAX_BUFFER_SIZE = 500;

let _currentSession: SessionPattern | null = null;
let _poseBuffer: PoseFrame[] = [];
let _actionBuffer: GameAction[] = [];
let _flushTimer: ReturnType<typeof setInterval> | null = null;

// ─── START SESSION ────────────────────────────────────────────────────────────

export function startMonitoring(
  sessionId: string,
  userId: string,
  discipline: DisciplineId,
  subDiscipline?: string,
): void {
  _currentSession = {
    sessionId,
    userId,
    discipline,
    subDiscipline,
    startTime: Date.now(),
    poseFrames: [],
    actions: [],
    scores: [],
    avgAccuracy: 0,
    avgStability: 0,
    combos: [],
    peakScore: 0,
    totalDuration: 0,
  };
  _poseBuffer = [];
  _actionBuffer = [];

  if (_flushTimer) clearInterval(_flushTimer);
  _flushTimer = setInterval(flushBuffers, FLUSH_INTERVAL);
}

// ─── RECORD POSE ──────────────────────────────────────────────────────────────

export function recordPose(frame: PoseFrame): void {
  if (!_currentSession) return;
  _poseBuffer.push(frame);
  _currentSession.poseFrames.push(frame);

  if (frame.score > _currentSession.peakScore) {
    _currentSession.peakScore = frame.score;
  }

  // Auto-flush if buffer is large
  if (_poseBuffer.length >= MAX_BUFFER_SIZE) flushBuffers();
}

// ─── RECORD ACTION ────────────────────────────────────────────────────────────

export function recordAction(
  type: string,
  data: Record<string, unknown> = {},
): void {
  if (!_currentSession) return;
  const action: GameAction = { type, timestamp: Date.now(), data };
  _actionBuffer.push(action);
  _currentSession.actions.push(action);
}

// ─── RECORD SCORE ─────────────────────────────────────────────────────────────

export function recordScore(
  score: number,
  accuracy: number,
  stability: number,
  combo: number,
): void {
  if (!_currentSession) return;
  _currentSession.scores.push(score);
  _currentSession.combos.push(combo);

  // Running averages
  const n = _currentSession.scores.length;
  _currentSession.avgAccuracy =
    (_currentSession.avgAccuracy * (n - 1) + accuracy) / n;
  _currentSession.avgStability =
    (_currentSession.avgStability * (n - 1) + stability) / n;
}

// ─── FLUSH TO SUPABASE ────────────────────────────────────────────────────────

async function flushBuffers(): Promise<void> {
  if (!_currentSession) return;

  // Flush pose frames
  if (_poseBuffer.length > 0) {
    const batch = _poseBuffer.splice(0, _poseBuffer.length);
    const rows = batch.map((f) => ({
      session_id: _currentSession!.sessionId,
      user_id: _currentSession!.userId,
      discipline: _currentSession!.discipline,
      timestamp_ms: f.timestamp,
      keypoints: f.keypoints,
      confidence: f.confidence,
      exercise: f.exercise,
      score: f.score,
    }));

    supabase
      .from("pose_frames")
      .insert(rows)
      .then(({ error }) => {
        if (error)
          console.warn("[ActivityMonitor] Pose flush failed:", error.message);
      });
  }

  // Flush actions
  if (_actionBuffer.length > 0) {
    const batch = _actionBuffer.splice(0, _actionBuffer.length);
    const rows = batch.map((a) => ({
      session_id: _currentSession!.sessionId,
      user_id: _currentSession!.userId,
      action_type: a.type,
      timestamp_ms: a.timestamp,
      data: a.data,
    }));

    supabase
      .from("user_actions")
      .insert(rows)
      .then(({ error }) => {
        if (error)
          console.warn("[ActivityMonitor] Action flush failed:", error.message);
      });
  }
}

// ─── END SESSION ──────────────────────────────────────────────────────────────

export async function stopMonitoring(): Promise<SessionPattern | null> {
  if (!_currentSession) return null;

  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }

  // Final flush
  await flushBuffers();

  // Update session end time
  _currentSession.endTime = Date.now();
  _currentSession.totalDuration =
    (_currentSession.endTime - _currentSession.startTime) / 1000;

  // Save session summary to Supabase
  const { error } = await supabase.from("session_summaries").upsert({
    id: _currentSession.sessionId,
    user_id: _currentSession.userId,
    discipline: _currentSession.discipline,
    sub_discipline: _currentSession.subDiscipline,
    start_time: new Date(_currentSession.startTime).toISOString(),
    end_time: new Date(_currentSession.endTime).toISOString(),
    total_duration_s: _currentSession.totalDuration,
    pose_frame_count: _currentSession.poseFrames.length,
    action_count: _currentSession.actions.length,
    avg_accuracy: Math.round(_currentSession.avgAccuracy),
    avg_stability: Math.round(_currentSession.avgStability),
    peak_score: _currentSession.peakScore,
    avg_score:
      _currentSession.scores.length > 0
        ? Math.round(
            _currentSession.scores.reduce((a, b) => a + b, 0) /
              _currentSession.scores.length,
          )
        : 0,
    max_combo: Math.max(..._currentSession.combos, 0),
    score_timeline: _currentSession.scores,
  });

  if (error)
    console.warn(
      "[ActivityMonitor] Session summary save failed:",
      error.message,
    );

  const session = _currentSession;
  _currentSession = null;
  return session;
}

// ─── QUERY PATTERNS ───────────────────────────────────────────────────────────

export async function getUserPatterns(userId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("session_summaries")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", since)
    .order("start_time", { ascending: false });
  return data ?? [];
}

export async function getPostureAnalysis(
  userId: string,
  discipline: string,
  limit = 500,
) {
  const { data } = await supabase
    .from("pose_frames")
    .select("keypoints, confidence, exercise, score")
    .eq("user_id", userId)
    .eq("discipline", discipline)
    .order("timestamp_ms", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ─── STATUS ───────────────────────────────────────────────────────────────────

export function isMonitoring(): boolean {
  return _currentSession !== null;
}

export function getCurrentSession(): SessionPattern | null {
  return _currentSession;
}
