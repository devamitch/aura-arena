// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Login Page
// Full-bleed cycling hero images + floating glass card (MusicX aesthetic)
// Google Sign-In via GoogleLogin (credential = ID token → Supabase signInWithIdToken)
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuth } from "@hooks/useAuth";
import { useStore } from "@store";
import { AUTH_BACKGROUNDS, LOGOS, pickImage } from "@utils/assets";
import { GoogleLogin } from "@react-oauth/google";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogleCredential, loading } = useAuth();
  const { setUser, setAuthError } = useStore();

  const [bgIdx, setBgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBgIdx((i) => i + 1), 5000);
    return () => clearInterval(t);
  }, []);

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
      dailyStreak: 0,
      bestStreak: 0,
      streakFreezeCount: 0,
      averageScore: 0,
      bestScore: 0,
      goals: [],
      trainingFrequency: 3,
      experienceLevel: "beginner",
      aiCoachName: "Aria",
      bio: "",
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
      {/* ── Cycling full-bleed hero images ── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={bgIdx}
            src={pickImage(AUTH_BACKGROUNDS, bgIdx)}
            alt=""
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
      </div>

      {/* ── Floating glass card — anchored bottom ── */}
      <div className="relative z-10 flex flex-col h-full justify-end px-5 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 320, damping: 28 }}
          className="rounded-3xl p-7"
          style={{
            background: "rgba(4,8,20,0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow: "0 -8px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,240,255,0.06)",
          }}
        >
          {/* Brand row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shadow">
              <img src={LOGOS[2]} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">AURA ARENA</span>
          </div>

          {/* Headline */}
          <h1 className="text-[28px] font-black text-white leading-[1.15] tracking-tight mb-6">
            AI-Powered Athletic{" "}
            <span style={{ color: "var(--ac)", textShadow: "0 0 20px rgba(0,240,255,0.5)" }}>
              Performance.
            </span>
            <br />
            <span className="text-white/70 text-[22px]">Login Now.</span>
          </h1>

          {/* Auth buttons */}
          <div className="space-y-3">
            {/* Google Sign-In — GoogleLogin returns credential (ID token) */}
            {loading ? (
              <div
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                <span className="text-white/60 text-[15px] font-semibold">Signing in…</span>
              </div>
            ) : (
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      loginWithGoogleCredential(credentialResponse.credential);
                    }
                  }}
                  onError={() => setAuthError("Google sign-in failed. Please try again.")}
                  useOneTap={false}
                  width="100%"
                  size="large"
                  theme="filled_black"
                  shape="rectangular"
                  text="signup_with"
                  logo_alignment="left"
                />
              </div>
            )}

            {/* Apple — coming soon */}
            <button
              disabled
              className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl text-[15px] font-semibold opacity-30 cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Available Soon…
            </button>

            {/* Guest mode */}
            <button
              onClick={handleGuest}
              disabled={loading}
              className="w-full h-[50px] flex items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-[0.97]"
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
                <span className="underline underline-offset-2" style={{ color: "rgba(0,240,255,0.5)" }}>
                  Use Google Sign-In above
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Patch GoogleLogin iframe to respect our dark container radius */}
      <style>{`
        .google-login-wrapper > div,
        .google-login-wrapper iframe {
          border-radius: 16px !important;
          overflow: hidden !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}
