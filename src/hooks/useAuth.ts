// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useAuth Hook
// Google OAuth via supabase.auth.signInWithOAuth (redirect flow) → Supabase session
// Gemini key is user-provided (BYOK), stored in Zustand/localStorage, NOT Supabase
// ═══════════════════════════════════════════════════════════════════════════════

import { initGemini } from "@/services/aiService";
import { analytics, identifyUser, resetAnalytics } from "@lib/analytics";
import { initOfflineSync } from "@lib/pwa/offlineQueue";
import { supabase, signOut as supabaseSignOut } from "@lib/supabase/client";
import { useIsLoading, useStore, useUser } from "@store";
import { useCallback, useEffect } from "react";

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const user = useUser();
  const loading = useIsLoading();
  const { setUser, setLoading, setAuthError, signOut: storeSignOut, addSavedAccount } = useStore();

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        identifyUser(session.user.id);
        await hydrateUser(session.user.id, session.user, setUser);
      }
      // Re-init Gemini from stored key (BYOK — user provided, lives in localStorage)
      const storedKey = useStore.getState().geminiApiKey;
      if (storedKey) initGemini(storedKey);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          identifyUser(session.user.id);
          await hydrateUser(session.user.id, session.user, setUser);
        } else if (event === "SIGNED_OUT") {
          resetAnalytics();
          storeSignOut();
        }
      },
    );

    const cleanupSync = initOfflineSync();
    return () => { subscription.unsubscribe(); cleanupSync(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Google login via GoogleLogin component (credential = ID token) ─────────
  // Called from LoginPage with credentialResponse.credential (JWT id_token)
  const loginWithGoogleCredential = useCallback(
    async (credential: string) => {
      setLoading(true);
      setAuthError(null);
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: credential, // This IS the ID token (JWT) from GoogleLogin component
        });
        if (error) throw error;
        const session = data.session;
        if (session?.user) {
          identifyUser(session.user.id);
          analytics.signInSuccess(session.user.id, "google");
          const profile = await hydrateUser(session.user.id, session.user, setUser);
          if (profile) {
            addSavedAccount({
              sub: session.user.id,
              email: session.user.email ?? "",
              displayName: profile.display_name ?? profile.displayName ?? "",
              avatarUrl: profile.avatar_url ?? null,
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
    [setLoading, setAuthError, setUser, addSavedAccount],
  );

  // ── Sign out ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setLoading(true);
    analytics.signOut();
    try { await supabaseSignOut(); } catch { /* already signed out */ }
    resetAnalytics();
    storeSignOut();
    setLoading(false);
  }, [storeSignOut, setLoading]);

  return { user, loading, loginWithGoogleCredential, logout };
};

// ─── HELPER: Fetch or create profile from Supabase ────────────────────────────
// Gracefully degrades: always calls setUser even if the profiles table is missing.

export async function hydrateUser(
  userId: string,
  authUser: { email?: string; user_metadata?: Record<string, string> } | null,
  setUser: (u: any) => void,
): Promise<any> {
  const meta = authUser?.user_metadata ?? {};

  let p: Record<string, any> | null = null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      // New user — upsert a skeleton profile (DB trigger may have already created it)
      await supabase.from("profiles").upsert({
        id: userId,
        email: authUser?.email ?? "",
        display_name: meta.full_name ?? meta.name ?? authUser?.email ?? "",
        avatar_url: meta.avatar_url ?? meta.picture ?? "",
        onboarding_complete: false,
      }, { onConflict: "id" });

      const { data: fresh } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      p = fresh ?? null;
    } else {
      p = profile;
    }
  } catch {
    // Profiles table might not exist yet — gracefully fall through
    p = null;
  }

  // Always hydrate user store — use profile data if available, auth metadata as fallback
  setUser({
    id: userId,
    email: p?.email ?? authUser?.email ?? "",
    displayName: p?.display_name ?? meta.full_name ?? meta.name ?? authUser?.email ?? "",
    arenaName: p?.arena_name ?? "",
    username: p?.username ?? "",
    avatar: p?.avatar_url ?? meta.picture ?? "",
    avatarUrl: p?.avatar_url ?? meta.picture ?? "",
    discipline: p?.discipline ?? "boxing",
    subDiscipline: p?.sub_discipline ?? undefined,
    experienceLevel: p?.experience_level ?? "beginner",
    goals: p?.goals ?? [],
    trainingFrequency: p?.training_frequency ?? 3,
    aiCoachName: p?.ai_coach_name ?? "Aria",
    onboardingComplete: p?.onboarding_complete ?? false,
    xp: p?.xp ?? 0,
    totalPoints: p?.total_points ?? 0,
    sessionsCompleted: p?.sessions_completed ?? 0,
    pveWins: p?.pve_wins ?? 0,
    pveLosses: p?.pve_losses ?? 0,
    winStreak: p?.win_streak ?? 0,
    dailyStreak: p?.daily_streak ?? 0,
    bestStreak: p?.best_streak ?? 0,
    streakFreezeCount: p?.streak_freeze_count ?? 0,
    averageScore: p?.average_score ?? 0,
    bestScore: p?.best_score ?? 0,
    bio: p?.bio ?? "",
    lastActiveDate: p?.last_active_date ?? "",
    tier: p?.tier ?? "beginner",
    isPremium: p?.is_premium ?? false,
    country: p?.country ?? "UN",
    createdAt: p?.created_at ?? new Date().toISOString(),
    updatedAt: p?.updated_at ?? new Date().toISOString(),
  });

  return p;
}
