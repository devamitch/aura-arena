// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Analytics (PostHog)
// Free tier: 1M events/month, no sampling, no limits on users
// Set VITE_POSTHOG_KEY in .env.local to activate.
// All calls are no-ops when key is not set (fully offline-safe).
// ═══════════════════════════════════════════════════════════════════════════════

import posthog from 'posthog-js';
import { createLogger } from './logger';

const log = createLogger('Analytics');
const POSTHOG_KEY = (import.meta as any).env?.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta as any).env?.VITE_POSTHOG_HOST ?? 'https://app.posthog.com';

let _initialized = false;

export function initAnalytics() {
  if (!POSTHOG_KEY || _initialized) return;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false,     // manual events only — keeps data clean
      persistence: 'localStorage',
      disable_session_recording: true,  // no video recording on free plan
    });
    _initialized = true;
    log.info('PostHog initialized');
  } catch (err) {
    log.warn('PostHog init failed (non-blocking)', err);
  }
}

export function identifyUser(userId: string, props?: Record<string, unknown>) {
  if (!_initialized) return;
  try { posthog.identify(userId, props); } catch { /* no-op */ }
}

export function resetAnalytics() {
  if (!_initialized) return;
  try { posthog.reset(); } catch { /* no-op */ }
}

// ─── Typed event catalogue ────────────────────────────────────────────────────
// Add every significant user action here. Keep names snake_case.

export function track(event: string, props?: Record<string, unknown>) {
  log.debug(`track: ${event}`, props);
  if (!_initialized) return;
  try { posthog.capture(event, props); } catch { /* no-op */ }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const analytics = {
  // Auth
  signInStarted:      ()           => track('sign_in_started'),
  signInSuccess:      (userId: string, provider: string) =>
    track('sign_in_success', { userId, provider }),
  signOut:            ()           => track('sign_out'),
  onboardingComplete: (discipline: string) =>
    track('onboarding_complete', { discipline }),

  // Training
  sessionStarted:  (discipline: string, drillId?: string) =>
    track('session_started', { discipline, drillId }),
  sessionEnded:    (score: number, duration: number, xpGained: number) =>
    track('session_ended', { score, duration, xpGained }),

  // PvE Battle
  pveBattleStarted: (opponentId: string, difficulty: number) =>
    track('pve_battle_started', { opponentId, difficulty }),
  pveBattleEnded:   (won: boolean, score: number, xpGained: number) =>
    track('pve_battle_ended', { won, score, xpGained }),

  // Live Battle
  liveMatchmakingStarted: (discipline: string) =>
    track('live_matchmaking_started', { discipline }),
  liveMatchFound:         (isRealOpponent: boolean) =>
    track('live_match_found', { isRealOpponent }),
  liveBattleEnded:        (won: boolean, score: number) =>
    track('live_battle_ended', { won, score }),

  // Gamification
  xpGained:      (amount: number, source: string) =>
    track('xp_gained', { amount, source }),
  tierUp:        (fromTier: string, toTier: string) =>
    track('tier_up', { fromTier, toTier }),
  achievementUnlocked: (achievementId: string) =>
    track('achievement_unlocked', { achievementId }),
  missionComplete: (missionId: string, reward: number) =>
    track('mission_complete', { missionId, reward }),

  // Profile
  avatarSaved:   (discipline: string, coachName: string) =>
    track('avatar_saved', { discipline, coachName }),

  // Payments
  upgradeViewed:   (plan: string) => track('upgrade_viewed', { plan }),
  upgradePurchased:(plan: string, amount: number) =>
    track('upgrade_purchased', { plan, amount }),
  upgradeAbandoned:(plan: string) => track('upgrade_abandoned', { plan }),

  // Errors
  errorOccurred: (context: string, message: string) =>
    track('error_occurred', { context, message }),
  cameraBlocked: (reason: string) =>
    track('camera_blocked', { reason }),
};
