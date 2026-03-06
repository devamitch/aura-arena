// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Achievement Service (fully functional, zero classes)
// All 26+ achievements. Called after every state-changing action.
// ═══════════════════════════════════════════════════════════════════════════════

import { ACHIEVEMENTS } from '@utils/constants';
import type { Achievement } from '@types';

// ─── TRIGGER CONTEXT ──────────────────────────────────────────────────────────

export type AchievementTrigger =
  | 'session_complete' | 'pve_win' | 'pve_loss'
  | 'reel_post' | 'reel_like_received'
  | 'streak_update' | 'score_update'
  | 'combo_achieved' | 'tier_change'
  | 'login' | 'comment_posted'
  | 'discipline_trained' | 'import_complete';

export interface AchievementContext {
  trigger: AchievementTrigger;
  // Session data
  score?: number;
  accuracy?: number;
  stability?: number;
  timing?: number;
  combo?: number;
  difficulty?: number;
  sessionDurationSec?: number;
  // Cumulative stats
  totalSessions?: number;
  sessionsToday?: number;
  disciplinesTrained?: string[];
  streakDays?: number;
  totalPveWins?: number;
  consecutivePveWins?: number;
  // Social
  totalLikesReceived?: number;
  singleReelLikes?: number;
  totalReelsPosted?: number;
  totalComments?: number;
  // Progression
  tierId?: string;
  earnedAchievements?: string[];
  currentHour?: number;           // for secret midnight achievement
}

// ─── CONDITION CHECKERS ───────────────────────────────────────────────────────
// Pure functions: (context) => boolean

type Checker = (ctx: AchievementContext) => boolean;

const CHECKERS: Record<string, Checker> = {
  // ── Training ────────────────────────────────────────────────────────────────
  first_step:       (c) => c.trigger === 'session_complete' && (c.totalSessions ?? 0) >= 1,
  perfect_form:     (c) => c.trigger === 'session_complete' && (c.score ?? 0) >= 90,
  accuracy_master:  (c) => c.trigger === 'session_complete' && (c.accuracy ?? 0) >= 95,
  iron_week:        (c) => (c.streakDays ?? 0) >= 7,
  month_warrior:    (c) => (c.streakDays ?? 0) >= 30,
  disciplined:      (c) => (c.totalSessions ?? 0) >= 50,
  centurion:        (c) => (c.totalSessions ?? 0) >= 100,
  diverse:          (c) => (c.disciplinesTrained?.length ?? 0) >= 3,
  all_disciplines:  (c) => (c.disciplinesTrained?.length ?? 0) >= 10,
  fast_learner:     (c) => c.trigger === 'session_complete' && (c.score ?? 0) >= 75 && (c.totalSessions ?? 0) <= 5,
  // ── Combos ──────────────────────────────────────────────────────────────────
  combo_king:       (c) => (c.combo ?? 0) >= 15,
  combo_legend:     (c) => (c.combo ?? 0) >= 30,
  // ── PvE Battle ──────────────────────────────────────────────────────────────
  first_blood:      (c) => c.trigger === 'pve_win' && (c.totalPveWins ?? 0) >= 1,
  flawless:         (c) => c.trigger === 'pve_win' && (c.consecutivePveWins ?? 0) >= 5,
  pve_veteran:      (c) => (c.totalPveWins ?? 0) >= 25,
  // ── Social ──────────────────────────────────────────────────────────────────
  crowd_favorite:   (c) => (c.totalLikesReceived ?? 0) >= 50,
  viral_reel:       (c) => (c.singleReelLikes ?? 0) >= 100,
  social_athlete:   (c) => (c.totalReelsPosted ?? 0) >= 10,
  // ── Progression ─────────────────────────────────────────────────────────────
  league_contender: (c) => c.trigger === 'tier_change' && c.tierId === 'silver',
  silver_ascent:    (c) => c.tierId === 'silver',
  gold_warrior:     (c) => c.tierId === 'gold',
  platinum_elite:   (c) => c.tierId === 'plat',
  champion_tier:    (c) => c.tierId === 'champ',
  global_elite:     (c) => c.tierId === 'elite',
  coachs_pet:       (c) => (c.totalSessions ?? 0) >= 10,
  // ── Secret ──────────────────────────────────────────────────────────────────
  secret_perfect_100:      (c) => c.trigger === 'session_complete' && (c.score ?? 0) >= 100,
  secret_midnight:         (c) => c.trigger === 'login' && (c.currentHour ?? 12) === 0,
  secret_commentator:      (c) => (c.totalComments ?? 0) >= 20,
  secret_all_disciplines:  (c) => (c.disciplinesTrained?.length ?? 0) >= 10,
  secret_cross_discipline: (c) => (c.totalLikesReceived ?? 0) >= 10,
  secret_hard_mode:        (c) =>
    c.trigger === 'session_complete' && (c.difficulty ?? 1) >= 5 && (c.score ?? 0) >= 85,
};

// ─── MAIN CHECK FUNCTION ──────────────────────────────────────────────────────

/**
 * Given the current context, returns all achievement IDs newly unlocked.
 * Call this after every state-changing action.
 */
export const checkAchievements = (
  ctx: AchievementContext,
  alreadyEarned: string[]
): { newlyUnlocked: Achievement[]; allEarned: string[] } => {
  const earned = new Set(alreadyEarned);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (earned.has(achievement.id)) continue; // already have it

    const checker = CHECKERS[achievement.id];
    if (!checker) continue; // no checker defined

    try {
      if (checker(ctx)) {
        newlyUnlocked.push(achievement);
        earned.add(achievement.id);
      }
    } catch {
      // Checker threw — skip safely
    }
  }

  return {
    newlyUnlocked,
    allEarned: Array.from(earned),
  };
};

// ─── HELPER: Build context from store state ────────────────────────────────────

export const buildAchievementContext = (
  trigger: AchievementTrigger,
  overrides: Partial<AchievementContext>,
  storeState: {
    sessionsCompleted: number;
    pveWins: number;
    streak: number;
    earnedAchievements: string[];
    sessionHistory: { discipline: string; createdAt: string }[];
  }
): AchievementContext => {
  const disciplines = [...new Set(storeState.sessionHistory.map((s) => s.discipline))];
  const today = new Date().toISOString().split('T')[0];
  const sessionsToday = storeState.sessionHistory.filter((s) => s.createdAt.startsWith(today)).length;

  return {
    trigger,
    totalSessions:    storeState.sessionsCompleted,
    sessionsToday,
    totalPveWins:     storeState.pveWins,
    streakDays:       storeState.streak,
    earnedAchievements: storeState.earnedAchievements,
    disciplinesTrained: disciplines,
    currentHour:      new Date().getHours(),
    ...overrides,
  };
};

// ─── useAchievements HOOK ─────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useStore, useEarnedAchievements, useSessionHistory, useDailyStreak } from '@store';
import { useAudio } from '@lib/audio/audioService';

export const useAchievements = () => {
  const earned      = useEarnedAchievements();
  const sessions    = useSessionHistory();
  const streak      = useDailyStreak();
  const { unlockAchievement, addNotification, addXP, user } = useStore();
  const { achievement: playAchievement } = useAudio();

  const checkAndUnlock = useCallback((
    trigger: AchievementTrigger,
    overrides: Partial<AchievementContext> = {}
  ) => {
    const ctx = buildAchievementContext(trigger, overrides, {
      sessionsCompleted: user?.sessionsCompleted ?? 0,
      pveWins:          user?.pveWins ?? 0,
      streak,
      earnedAchievements: earned,
      sessionHistory:   sessions,
    });

    const { newlyUnlocked } = checkAchievements(ctx, earned);

    for (const a of newlyUnlocked) {
      unlockAchievement(a.id);
      addXP(a.xpReward);
      addNotification({
        type: 'achievement',
        title: `🏆 ${a.name}`,
        body: a.secret ? 'Secret achievement unlocked!' : a.description,
        data: { achievementId: a.id, rarity: a.rarity },
      });
      playAchievement(a.rarity);
    }

    return newlyUnlocked;
  }, [earned, sessions, streak, user, unlockAchievement, addNotification, addXP, playAchievement]);

  return { checkAndUnlock, earned };
};
