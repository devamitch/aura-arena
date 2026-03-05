import { useAuth } from "@hooks/useAuth";
import { useStore } from "@store";
import { motion } from "framer-motion";
import {
  Accessibility,
  Activity,
  Box,
  Dumbbell,
  Music,
  Sparkles,
  Swords,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ICON_MAP = {
  box: Box,
  music: Music,
  swords: Swords,
  accessibility: Accessibility,
  activity: Activity,
  dumbbell: Dumbbell,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, loading } = useAuth();
  const savedAccounts = useStore((s) => s.savedAccounts);
  const { setUser, addSavedAccount } = useStore();

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
      lastActiveDate: "",
      avatarUrl: "",
      country: "UN",
      sessionDuration: 0,
      tier: "bronze",
      isPremium: false,
    });
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl shadow-2xl relative"
          style={{ boxShadow: "0 0 40px rgba(0,240,255,0.4)" }}
        >
          <span className="relative z-10 text-white">
            <Sparkles className="w-10 h-10" />
          </span>
          <div className="absolute inset-0 bg-white/20 animate-pulse rounded-3xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-black text-t1 tracking-tight">
            AURA ARENA
          </h1>
          <p className="text-sm text-t3 mt-2 max-w-72 leading-relaxed">
            AI-powered performance scoring for boxing, dance, martial arts &
            more
          </p>
        </motion.div>

        {/* Discipline previews */}
        <div className="flex gap-3 flex-wrap justify-center">
          {(Object.keys(ICON_MAP) as Array<keyof typeof ICON_MAP>).map(
            (key, i) => {
              const Icon = ICON_MAP[key];
              return (
                <motion.div
                  key={key}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="w-12 h-12 rounded-2xl bg-s1 border border-b1 flex items-center justify-center text-primary"
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
              );
            },
          )}
        </div>
      </div>

      {/* Auth section */}
      <div className="px-6 pb-10 space-y-3">
        {/* Saved accounts */}
        {savedAccounts.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-mono text-t3 uppercase tracking-widest">
              Continue as
            </p>
            {savedAccounts.slice(0, 3).map((acc) => (
              <button
                key={acc.sub}
                onClick={() => loginWithGoogle()}
                className="w-full flex items-center gap-3 p-3 bg-s1 border border-b1 rounded-xl hover:border-opacity-40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-s2 flex items-center justify-center text-lg font-bold text-t1">
                  {acc.email[0].toUpperCase()}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-semibold text-t1 truncate">
                    {acc.email.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-t3 truncate">{acc.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Google sign in */}
        <button
          onClick={() => loginWithGoogle()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white text-gray-900 font-bold text-sm transition-all active:scale-95"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Continue with Google
            </>
          )}
        </button>

        {/* Guest */}
        <button
          onClick={handleGuest}
          className="w-full py-3.5 rounded-2xl border border-b1 text-sm font-semibold text-t2 hover:text-t1 hover:border-opacity-40 transition-all"
        >
          Try as Guest
        </button>

        <p className="text-center text-[11px] text-t3 mt-2">
          By continuing you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}
