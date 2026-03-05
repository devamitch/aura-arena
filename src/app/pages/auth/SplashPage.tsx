import { useIsLoading, useUser } from "@store";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashPage() {
  const navigate = useNavigate();
  const user = useUser();
  const loading = useIsLoading();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        navigate(user.onboardingComplete ? "/home" : "/onboarding", {
          replace: true,
        });
      } else {
        navigate("/login", { replace: true });
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-4">
      {/* Logo animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative"
      >
        {/* Glow rings */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
            transition={{
              duration: 1.5,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="absolute inset-0 rounded-3xl"
            style={{
              background: "radial-gradient(circle, #00f0ff30, transparent)",
            }}
          />
        ))}
        <div className="w-40 h-40 rounded-[3rem] glass overflow-hidden relative z-10 shadow-[0_0_60px_rgba(0,240,255,0.2)] border-white/20">
          <img
            src="/logo.png"
            alt="AURA ARENA Logo"
            className="w-full h-full object-contain p-4"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
          AURA ARENA
        </h1>
        <p className="text-[10px] text-t2 font-mono tracking-[0.4em] uppercase mt-2 opacity-80">
          Premium Esports · AI Powered
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex gap-1.5 mt-4"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          />
        ))}
      </motion.div>
    </div>
  );
}
