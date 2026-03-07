// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Analytics (Supabase-native, zero third-party)
// Events stored in YOUR OWN Supabase database — free, private, full SQL access.
// Works offline: events queue in memory, flush every 10 s or on page hide.
// Same creds as everything else: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "@lib/supabase/client";
import { createLogger } from "./logger";

const log = createLogger("Analytics");

// ─── Session context ──────────────────────────────────────────────────────────

const SESSION_ID =
  typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

let _userId: string | null = null;
let _enabled = false;

// ─── In-memory event queue (offline support) ──────────────────────────────────

interface QueuedEvent {
  event: string;
  properties: Record<string, unknown>;
  session_id: string;
  user_id: string | null;
  created_at: string;
}

const _queue: QueuedEvent[] = [];

async function flush() {
  if (_queue.length === 0 || !_enabled) return;
  const batch = _queue.splice(0, 50);
  try {
    const { error } = await supabase.from("analytics_events").insert(batch);
    if (error) {
      _queue.unshift(...batch);
      log.warn("Analytics flush failed, re-queued", { count: batch.length });
    } else {
      log.debug("Flushed analytics events", { count: batch.length });
    }
  } catch {
    _queue.unshift(...batch);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initAnalytics() {
  if (_enabled) return;

  const url = import.meta.env.VITE_SUPABASE_URL ?? "";
  if (!url) {
    log.info("Analytics disabled — set VITE_SUPABASE_URL to enable");
    return;
  }

  _enabled = true;

  supabase.auth.getSession().then(({ data }) => {
    _userId = data.session?.user?.id ?? null;
  });

  supabase.auth.onAuthStateChange((_ev, session) => {
    _userId = session?.user?.id ?? null;
  });

  setInterval(flush, 10_000);

  if (typeof window !== "undefined") {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }

  log.info("Analytics ready (Supabase-native)", { session: SESSION_ID });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function identifyUser(userId: string, _props?: Record<string, unknown>) {
  _userId = userId;
}

export function resetAnalytics() {
  _userId = null;
}

export function track(event: string, props?: Record<string, unknown>) {
  log.debug("[analytics] " + event, props);
  _queue.push({
    event,
    properties: props ?? {},
    session_id: SESSION_ID,
    user_id: _userId,
    created_at: new Date().toISOString(),
  });
  if (_enabled && _queue.length >= 10) flush();
}

// ─── Typed event catalogue ────────────────────────────────────────────────────

export const analytics = {
  signInStarted: () => track("sign_in_started"),
  signInSuccess: (userId: string, provider: string) =>
    track("sign_in_success", { userId, provider }),
  signOut: () => track("sign_out"),
  onboardingComplete: (discipline: string) =>
    track("onboarding_complete", { discipline }),

  sessionStarted: (discipline: string, drillId?: string) =>
    track("session_started", { discipline, drillId }),
  sessionEnded: (score: number, duration: number, xpGained: number) =>
    track("session_ended", { score, duration, xpGained }),

  pveBattleStarted: (opponentId: string, difficulty: number) =>
    track("pve_battle_started", { opponentId, difficulty }),
  pveBattleEnded: (won: boolean, score: number, xpGained: number) =>
    track("pve_battle_ended", { won, score, xpGained }),

  liveMatchmakingStarted: (discipline: string) =>
    track("live_matchmaking_started", { discipline }),
  liveMatchFound: (isRealOpponent: boolean) =>
    track("live_match_found", { isRealOpponent }),
  liveBattleEnded: (won: boolean, score: number) =>
    track("live_battle_ended", { won, score }),

  xpGained: (amount: number, source: string) =>
    track("xp_gained", { amount, source }),
  tierUp: (fromTier: string, toTier: string) =>
    track("tier_up", { fromTier, toTier }),
  achievementUnlocked: (achievementId: string) =>
    track("achievement_unlocked", { achievementId }),
  missionComplete: (missionId: string, reward: number) =>
    track("mission_complete", { missionId, reward }),

  avatarSaved: (discipline: string, coachName: string) =>
    track("avatar_saved", { discipline, coachName }),

  upgradeViewed: (plan: string) => track("upgrade_viewed", { plan }),
  upgradePurchased: (plan: string, amount: number) =>
    track("upgrade_purchased", { plan, amount }),
  upgradeAbandoned: (plan: string) => track("upgrade_abandoned", { plan }),

  errorOccurred: (context: string, message: string) =>
    track("error_occurred", { context, message }),
  cameraBlocked: (reason: string) => track("camera_blocked", { reason }),
};
