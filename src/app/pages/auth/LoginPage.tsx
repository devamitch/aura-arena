// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Login Page (MusicX Premium)
// Full-bleed cycling hero + floating glass card + feature pills
// ═══════════════════════════════════════════════════════════════════════════════

import { cn } from "@/lib/utils";
import { useAuth } from "@hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import { useStore } from "@store";
import {
  AUTH_BACKGROUNDS,
  HERO_BATTLE,
  HERO_DASHBOARD,
  HERO_TRAINING,
  INTRO_SLIDES,
  PREMIUM_ASSETS,
  pickImage,
} from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Loader2, Shield, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Hero image pool ────────────────────────────────────────────────────────
const BG_POOL = [
  AUTH_BACKGROUNDS[0],
  HERO_BATTLE[0],
  HERO_DASHBOARD[0],
  AUTH_BACKGROUNDS[1],
  HERO_TRAINING[0],
  HERO_BATTLE[1],
  INTRO_SLIDES[0],
];

// ─── Feature highlights ─────────────────────────────────────────────────────
const FEATURES = [
  { Icon: Zap, label: "Real-time AI Vision", color: "var(--ac)" },
  { Icon: Trophy, label: "Global PvE Battles", color: "#f59e0b" },
  { Icon: Shield, label: "Ranked Leagues", color: "#f43f5e" },
  { Icon: Brain, label: "Session Analytics", color: "#a855f7" },
];

const GradientText = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "text-transparent bg-clip-text font-black tracking-tight",
      className,
    )}
    style={{
      backgroundImage:
        "linear-gradient(135deg, #00f0ff 0%, #3b82f6 60%, #a855f7 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }}
  >
    {children}
  </span>
);

// ─── Social proof stats ─────────────────────────────────────────────────────
const STATS = [
  { value: "50K+", label: "Athletes" },
  { value: "1.2M", label: "Sessions" },
  { value: "98%", label: "Accuracy" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogleCredential, loading } = useAuth();
  const { setUser, setAuthError } = useStore();

  const [bgIdx, setBgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBgIdx((i) => i + 1), 4500);
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
      {/* ── Hero cycling background ── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={bgIdx}
            src={pickImage(BG_POOL, bgIdx)}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,6,16,0.65) 0%, rgba(4,6,16,0.4) 35%, rgba(4,6,16,0.95) 72%, rgba(4,6,16,1) 100%)",
          }}
        />
        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,240,255,0.012) 3px, rgba(0,240,255,0.012) 4px)",
          }}
        />
        {/* Side vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(0,240,255,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ── Top bar — stats ── */}
      <motion.div
        className="relative z-10 px-6 pt-12 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Logo pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            background: "rgba(4,8,20,0.72)",
            border: "1px solid rgba(0,240,255,0.15)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 16px rgba(0,240,255,0.1)",
          }}
        >
          <img
            src={PREMIUM_ASSETS.BRANDING.LOGO_PREMIUM}
            alt="Logo"
            className="w-5 h-5 object-contain"
          />
          <span className="text-white font-black text-[13px] tracking-tight">
            AURA
          </span>
        </div>

        {/* Live badge */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{
            background: "rgba(4,8,20,0.72)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
            style={{ boxShadow: "0 0 6px #4ade80" }}
          />
          <span className="text-white/70 text-[11px] font-bold tracking-wide">
            LIVE
          </span>
        </div>
      </motion.div>

      {/* ── Stats row — floating center ── */}
      <motion.div
        className="relative z-10 flex items-center justify-center gap-8 mt-auto px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        style={{ marginBottom: "auto", marginTop: "auto" }}
      >
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p
              className="text-2xl font-black leading-none"
              style={{
                color: "var(--ac)",
                textShadow: "0 0 20px rgba(0,240,255,0.5)",
              }}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ── Bottom glass card ── */}
      <div className="relative z-10 px-4 pb-8 flex flex-col gap-0">
        {/* Feature pills horizontal scroll */}
        <motion.div
          className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none px-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {FEATURES.map(({ Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
              style={{
                background: "rgba(4,8,20,0.75)",
                border: `1px solid ${color}30`,
                backdropFilter: "blur(12px)",
              }}
            >
              <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
              <span className="text-[11px] font-bold text-white/70 whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 28,
          }}
          className="rounded-[28px] overflow-hidden"
          style={{
            background: "rgba(4,8,20,0.88)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            boxShadow:
              "0 -8px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,240,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Top accent line */}
          <div
            className="h-[1px] w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)",
            }}
          />

          <div className="p-6">
            {/* Brand row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
                  style={{
                    border: "1px solid rgba(0,240,255,0.2)",
                    boxShadow: "0 0 12px rgba(0,240,255,0.1)",
                  }}
                >
                  <img
                    src={PREMIUM_ASSETS.BRANDING.LOGO_PREMIUM}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1
                    className="text-[20px] font-black text-white tracking-tight leading-none"
                    style={{ textShadow: "0 0 20px rgba(0,240,255,0.2)" }}
                  >
                    AURA <GradientText>ARENA</GradientText>
                  </h1>
                  <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase mt-0.5">
                    AI-Powered Performance
                  </p>
                </div>
              </div>

              {/* Coach preview */}
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  background: "rgba(0,240,255,0.06)",
                  border: "1px solid rgba(0,240,255,0.15)",
                }}
              >
                <img
                  src={PREMIUM_ASSETS.COACHES.ARIA}
                  alt="Aria"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <h2 className="text-[32px] font-black text-white leading-[1.05] tracking-tight mb-2">
              Train Smarter.
              <br />
              <GradientText className="text-[32px]">Win More.</GradientText>
            </h2>
            <p className="text-[13px] text-white/45 mt-2 leading-relaxed max-w-[280px]">
              AI coaches track your every move — join 50K+ athletes competing
              globally.
            </p>

            {/* Auth buttons */}
            <div className="space-y-3">
              {loading ? (
                <div
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-3"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
                  <span className="text-white/50 text-[14px] font-semibold">
                    Signing in…
                  </span>
                </div>
              ) : (
                <div
                  className="google-login-wrapper rounded-2xl overflow-hidden"
                  style={{
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        loginWithGoogleCredential(
                          credentialResponse.credential,
                        );
                      }
                    }}
                    onError={() =>
                      setAuthError("Google sign-in failed. Please try again.")
                    }
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
                className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl text-[14px] font-semibold opacity-25 cursor-not-allowed"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "white",
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple Sign-In — Coming Soon
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <span className="text-[10px] text-white/25 font-bold tracking-widest">
                  OR
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              </div>

              {/* Guest */}
              <button
                onClick={handleGuest}
                disabled={loading}
                className="w-full h-12 flex items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-[0.97]"
                style={{
                  background: "rgba(0,240,255,0.04)",
                  border: "1px solid rgba(0,240,255,0.15)",
                  color: "var(--ac)",
                }}
              >
                Explore as Guest →
              </button>

              <p className="text-center text-[10px] text-white/20 leading-relaxed">
                By signing in you agree to our{" "}
                <span className="underline underline-offset-2 text-white/35">
                  Terms
                </span>{" "}
                &{" "}
                <span className="underline underline-offset-2 text-white/35">
                  Privacy Policy
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Google iframe styling */}
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
