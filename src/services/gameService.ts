// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Game Service
// Saves sessions, updates profile XP/stats, fetches leaderboard
// Falls back gracefully if Supabase is not configured
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from '@lib/supabase/client';

const ENABLED = !!(
  (import.meta as any).env?.VITE_SUPABASE_URL &&
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SessionPayload {
  userId: string;
  discipline: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  score: number;
  accuracy: number;
  combo: number;
  duration: number; // seconds
  xpGained: number;
  drillName?: string;
}

export interface BattlePayload {
  userId: string;
  opponentId: string | null; // null = AI
  opponentName: string;
  discipline: string;
  myScore: number;
  oppScore: number;
  won: boolean;
  xpGained: number;
  isRealOpponent: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  arenaName: string;
  avatarUrl: string | null;
  xp: number;
  tier: string;
  discipline: string;
  pveWins: number;
}

// ─── SESSION SAVE ─────────────────────────────────────────────────────────────

export async function saveSession(payload: SessionPayload): Promise<void> {
  if (!ENABLED) return;
  try {
    await supabase.from('session_history').insert({
      user_id: payload.userId,
      discipline: payload.discipline,
      difficulty: payload.difficulty,
      score: payload.score,
      accuracy: payload.accuracy,
      combo: payload.combo,
      duration_seconds: payload.duration,
      xp_gained: payload.xpGained,
      drill_name: payload.drillName ?? null,
    });

    // Update profile aggregate stats
    await supabase.rpc('increment_user_stats', {
      p_user_id: payload.userId,
      p_xp: payload.xpGained,
      p_sessions: 1,
      p_best_score: payload.score,
    }).maybeSingle();
  } catch (err) {
    console.warn('[gameService] saveSession failed (non-blocking):', err);
  }
}

// ─── BATTLE SAVE ──────────────────────────────────────────────────────────────

export async function saveBattle(payload: BattlePayload): Promise<void> {
  if (!ENABLED) return;
  try {
    await supabase.from('battle_history').insert({
      user_id: payload.userId,
      opponent_id: payload.opponentId,
      opponent_name: payload.opponentName,
      discipline: payload.discipline,
      my_score: payload.myScore,
      opp_score: payload.oppScore,
      won: payload.won,
      xp_gained: payload.xpGained,
      is_real_opponent: payload.isRealOpponent,
    });

    if (payload.won) {
      await supabase.rpc('increment_user_stats', {
        p_user_id: payload.userId,
        p_xp: payload.xpGained,
        p_sessions: 0,
        p_best_score: payload.myScore,
        p_pve_wins: 1,
      }).maybeSingle();
    } else {
      await supabase.rpc('increment_user_stats', {
        p_user_id: payload.userId,
        p_xp: payload.xpGained,
        p_sessions: 0,
        p_best_score: payload.myScore,
        p_pve_wins: 0,
      }).maybeSingle();
    }
  } catch (err) {
    console.warn('[gameService] saveBattle failed (non-blocking):', err);
  }
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

export async function fetchLeaderboard(
  discipline: string | null = null,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (!ENABLED) return [];
  try {
    let q = supabase
      .from('profiles')
      .select('id, display_name, arena_name, avatar_url, xp, tier, discipline, pve_wins')
      .gt('xp', 0)
      .order('xp', { ascending: false })
      .limit(limit);

    if (discipline) q = q.eq('discipline', discipline);

    const { data, error } = await q;
    if (error || !data) return [];

    return data.map((row: any, i: number) => ({
      rank: i + 1,
      userId: row.id,
      displayName: row.display_name ?? 'Athlete',
      arenaName: row.arena_name ?? row.display_name ?? 'Athlete',
      avatarUrl: row.avatar_url ?? null,
      xp: row.xp ?? 0,
      tier: row.tier ?? 'beginner',
      discipline: row.discipline ?? 'fitness',
      pveWins: row.pve_wins ?? 0,
    }));
  } catch (err) {
    console.warn('[gameService] fetchLeaderboard failed:', err);
    return [];
  }
}

// ─── UPSERT PROFILE ───────────────────────────────────────────────────────────

export async function upsertProfile(userId: string, data: {
  displayName?: string;
  arenaName?: string;
  avatarUrl?: string;
  discipline?: string;
  aiCoachName?: string;
}): Promise<void> {
  if (!ENABLED) return;
  try {
    await supabase.from('profiles').upsert({
      id: userId,
      display_name: data.displayName,
      arena_name: data.arenaName,
      avatar_url: data.avatarUrl,
      discipline: data.discipline,
      ai_coach_name: data.aiCoachName,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch (err) {
    console.warn('[gameService] upsertProfile failed (non-blocking):', err);
  }
}
