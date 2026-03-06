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
        navigate("/intro", { replace: true });
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--background)" }}
    >
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
              background:
                "radial-gradient(circle, rgba(var(--ac-rgb, 0,240,255), 0.2), transparent)",
            }}
          />
        ))}
        <div
          className="w-40 h-40 rounded-[3rem] overflow-hidden relative z-10"
          style={{
            background: "rgba(var(--ac-rgb, 0,240,255), 0.04)",
            border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.15)",
            boxShadow: "0 0 60px rgba(var(--ac-rgb, 0,240,255), 0.15)",
          }}
        >
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
        <h1 className="text-5xl font-black text-white tracking-tighter text-gradient">
          AURA ARENA
        </h1>
        <p className="text-[10px] text-white/40 font-mono tracking-[0.4em] uppercase mt-2">
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
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--ac)" }}
          />
        ))}
      </motion.div>
    </div>
  );
}
