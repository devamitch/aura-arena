// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useAuth Hook (fully functional)
// Google OAuth via @react-oauth/google + Supabase session
// ═══════════════════════════════════════════════════════════════════════════════

import { initGemini } from "@/services/aiService";
import { analytics, identifyUser, resetAnalytics } from "@lib/analytics";
import { initOfflineSync } from "@lib/pwa/offlineQueue";
import {
  signInWithGoogle,
  supabase,
  signOut as supabaseSignOut,
} from "@lib/supabase/client";
import { useGoogleLogin } from "@react-oauth/google";
import { useIsLoading, useStore, useUser } from "@store";
import { useCallback, useEffect } from "react";

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const user = useUser();
  const loading = useIsLoading();
  const {
    setUser,
    setLoading,
    setAuthError,
    signOut: storeSignOut,
    addSavedAccount,
  } = useStore();

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        identifyUser(session.user.id);
        await hydrateUser(session.user.id, setUser);
      }
      // Auto-init Gemini from stored key (if user previously saved one)
      const storedKey = useStore.getState().geminiApiKey;
      if (storedKey) initGemini(storedKey);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        identifyUser(session.user.id);
        await hydrateUser(session.user.id, setUser);
      } else if (event === "SIGNED_OUT") {
        resetAnalytics();
        storeSignOut();
      }
    });

    // Init offline queue sync
    const cleanupSync = initOfflineSync();

    return () => {
      subscription.unsubscribe();
      cleanupSync();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Google login ──────────────────────────────────────────────────────────
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setAuthError(null);
      try {
        const { session } = await signInWithGoogle(tokenResponse.access_token);
        if (session?.user) {
          identifyUser(session.user.id);
          analytics.signInSuccess(session.user.id, "google");
          const profile = await hydrateUser(session.user.id, setUser);
          if (profile) {
            addSavedAccount({
              sub: session.user.id,
              email: session.user.email ?? "",
              displayName: profile.displayName ?? "",
              avatarUrl: profile.avatar ?? null,
              lastUsed: Date.now(),
            });
          }
        }
      } catch (err: any) {
        setAuthError(err.message ?? "Login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: (err) =>
      setAuthError(err.error_description ?? "Google login failed"),
  });

  // ── Sign out ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setLoading(true);
    analytics.signOut();
    try {
      await supabaseSignOut();
    } catch {
      /* signOut may fail if already signed out */
    }
    resetAnalytics();
    storeSignOut();
    setLoading(false);
  }, [storeSignOut, setLoading]);

  return { user, loading, loginWithGoogle, logout };
};

// ─── HELPER: Fetch profile from Supabase and populate store ──────────────────

async function hydrateUser(
  userId: string,
  setUser: (u: any) => void,
): Promise<any> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profile) {
    setUser({
      id: userId,
      email: profile.email ?? "",
      displayName: profile.display_name ?? "",
      arenaName: profile.arena_name ?? "",
      username: profile.username ?? "",
      avatar: profile.avatar ?? "",
      discipline: profile.discipline ?? "boxing",
      subDiscipline: profile.sub_discipline,
      experienceLevel: profile.experience_level ?? "beginner",
      goals: profile.goals ?? [],
      trainingFrequency: profile.training_frequency ?? 3,
      aiCoachName: profile.ai_coach_name ?? "Coach",
      onboardingComplete: profile.onboarding_complete ?? false,
      xp: profile.xp ?? 0,
      totalPoints: profile.total_points ?? 0,
      sessionsCompleted: profile.sessions_completed ?? 0,
      pveWins: profile.pve_wins ?? 0,
      pveLosses: profile.pve_losses ?? 0,
      winStreak: profile.win_streak ?? 0,
      averageScore: profile.average_score ?? 0,
      bestScore: profile.best_score ?? 0,
      bio: profile.bio ?? "",
      lastActiveDate: profile.last_active_date ?? "",
    });
  }

  return profile;
}
