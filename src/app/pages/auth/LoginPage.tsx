// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Login Page
// Full-bleed hero + floating glass card (MusicX aesthetic)
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuth } from "@hooks/useAuth";
import { Button } from "@shared/components/ui/button";
import { useStore } from "@store";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, loading } = useAuth();
  const { setUser } = useStore();

  const handleGuest = () => {
    setUser({
      id: "guest",
      email: "",
      displayName: "Guest Athlete",
      arenaName: "Guest",
      username: "guest",
      discipline: "boxing",
      onboardingComplete: false,
      xp: 0,
      totalPoints: 0,
      sessionsCompleted: 0,
      pveWins: 0,
      pveLosses: 0,
      winStreak: 0,
      averageScore: 0,
      bestScore: 0,
      goals: [],
      trainingFrequency: 3,
      experienceLevel: "beginner",
      aiCoachName: "Coach",
      bio: "",
      bestStreak: 0,
      dailyStreak: 0,
      streakFreezeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPremium: false,
      lastActiveDate: "",
      avatarUrl: "",
      country: "UN",
      sessionDuration: 0,
      tier: "bronze",
    });
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      {/* ── Full-bleed hero image (full opacity like MusicX) ── */}
      <div className="absolute inset-0">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.AUTH_BG}
          alt=""
          className="w-full h-full object-cover"
        />
        {/* dark scrim so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* ── Floating glass card — anchored bottom like MusicX ── */}
      <div className="relative z-10 flex flex-col h-full justify-end px-5 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            type: "spring",
            stiffness: 320,
            damping: 28,
          }}
          className="rounded-3xl p-7"
          style={{
            background: "rgba(4, 8, 20, 0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow:
              "0 -8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,240,255,0.06)",
          }}
        >
          {/* Brand row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shadow">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white font-black text-lg tracking-tight">
              AURA ARENA
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[28px] font-black text-white leading-[1.15] tracking-tight mb-6">
            AI-Powered Athletic{" "}
            <span
              style={{
                color: "var(--ac)",
                textShadow: "0 0 20px rgba(0,240,255,0.5)",
              }}
            >
              Performance.
            </span>
            <br />
            <span className="text-white/70 text-[22px]">Login Now.</span>
          </h1>

          {/* Auth buttons */}
          <div className="space-y-3">
            {/* Google — white like MusicX */}
            <Button
              variant="auth-google"
              size="lg"
              className="w-full h-14 text-[15px] gap-3"
              onClick={() => loginWithGoogle()}
              disabled={loading}
              loading={loading}
            >
              {!loading && (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Signup Via Google
            </Button>

            {/* Apple — black like MusicX, disabled */}
            <Button
              variant="auth-apple"
              size="lg"
              className="w-full h-14 text-[15px] gap-3 opacity-40 cursor-not-allowed"
              disabled
            >
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                fill="white"
              >
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Available Soon …
            </Button>

            {/* Guest */}
            <button
              onClick={handleGuest}
              className="w-full h-[50px] flex items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-[0.97] hover:bg-[rgba(0,240,255,0.08)]"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--ac)",
              }}
            >
              Try as Guest
            </button>

            <div className="text-center pt-1">
              <p className="text-[11px] text-white/25">
                Already have an account?{" "}
                <button
                  onClick={() => loginWithGoogle()}
                  className="underline underline-offset-2"
                  style={{ color: "rgba(0,240,255,0.5)" }}
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
