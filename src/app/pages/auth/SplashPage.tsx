// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Splash Screen (premium multi-panel athlete mosaic)
// ═══════════════════════════════════════════════════════════════════════════════

import { AuraLogoText } from "@shared/components/ui/aura-logo-text";
import { useIsLoading, useUser } from "@store";
import {
  ALL_ATHLETES, ALL_BANNERS, COACH_ARIA, COACH_MAX, COACH_SENSEI,
  BADGE_BEGINNER, BADGE_INTERMEDIATE, BADGE_ADVANCED, BADGE_PROFESSIONAL,
  LOGOS, HERO_VICTORY, INTRO_MISC,
} from "@utils/assets";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 6-panel mosaic images — athlete action shots + banners
const PANEL_IMAGES = [
  ALL_ATHLETES[0],   // boxer
  ALL_ATHLETES[2],   // yogi
  ALL_ATHLETES[4],   // martial arts
  ALL_ATHLETES[6],   // arena
  ALL_ATHLETES[8],   // referee
  ALL_BANNERS[4],    // gymnastics banner
];

// 3D badge showcase
const BADGES_3D = [
  BADGE_BEGINNER[1],
  BADGE_INTERMEDIATE[1],
  BADGE_ADVANCED[1],
  BADGE_PROFESSIONAL[2],
];

// Coach portrait strip
const COACHES = [COACH_ARIA[0], COACH_MAX[0], COACH_SENSEI[0]];

export default function SplashPage() {
  const navigate  = useNavigate();
  const user      = useUser();
  const loading   = useIsLoading();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        navigate(user.onboardingComplete ? "/home" : "/onboarding", { replace: true });
      } else {
        navigate("/intro", { replace: true });
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: "#040914" }}>

      {/* ── Athlete mosaic grid (3 cols × 2 rows) ─────────────────────────── */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5 opacity-0"
        style={{ opacity: show ? 1 : 0, transition: "opacity 0.4s" }}>
        {PANEL_IMAGES.map((src, i) => (
          <motion.div
            key={src}
            className="relative overflow-hidden"
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            {/* Per-panel dark vignette */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(135deg, rgba(4,9,20,0.55) 0%, rgba(4,9,20,0.2) 50%, rgba(4,9,20,0.6) 100%)",
            }} />
          </motion.div>
        ))}
      </div>

      {/* ── Global darkening overlay ──────────────────────────────────────── */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(4,9,20,0.65) 0%, rgba(4,9,20,0.35) 40%, rgba(4,9,20,0.9) 100%)",
      }} />

      {/* ── Neon glow orbs ───────────────────────────────────────────────── */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,240,255,0.07) 0%, transparent 65%)" }} />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)" }} />

      {/* ── Thin horizontal scan line ─────────────────────────────────────── */}
      <motion.div
        className="absolute inset-x-0 h-px z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.6), transparent)" }}
        initial={{ top: "0%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 1.8, ease: "linear", delay: 0.2 }}
      />

      {/* ── Coach portrait strip (left side, floating) ───────────────────── */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {COACHES.map((src, i) => (
          <motion.div
            key={src}
            className="w-14 h-14 rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(0,240,255,0.25)",
              boxShadow: "0 0 16px rgba(0,240,255,0.15)",
            }}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 220, damping: 22 }}
          >
            <img src={src} alt="" className="w-full h-full object-cover object-top" />
          </motion.div>
        ))}
        <motion.p
          className="text-[7px] font-mono tracking-widest uppercase text-center mt-1"
          style={{ color: "rgba(0,240,255,0.45)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          AI Coaches
        </motion.p>
      </div>

      {/* ── Victory hero image (right side) ─────────────────────────────── */}
      <motion.div
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-16 h-44 rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(139,92,246,0.3)",
          boxShadow: "0 0 20px rgba(139,92,246,0.15)",
        }}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 220, damping: 22 }}
      >
        <img src={HERO_VICTORY[0]} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(180deg, transparent 50%, rgba(4,9,20,0.8) 100%)",
        }} />
        <div className="absolute bottom-2 inset-x-0 text-center">
          <p className="text-[6px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Victory</p>
        </div>
      </motion.div>

      {/* ── Central content ───────────────────────────────────────────────── */}
      <div className="relative z-30 flex flex-col items-center justify-center h-full gap-5 px-6">

        {/* Logo mark with pulsing rings */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0.65, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-[3rem]"
              style={{
                width: "112px", height: "112px",
                background: "radial-gradient(circle, rgba(0,240,255,0.2), transparent)",
              }}
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 2.5 + i * 0.4, opacity: 0 }}
              transition={{ duration: 2.2, delay: 0.4 + i * 0.5, repeat: Infinity, repeatDelay: 0.2 }}
            />
          ))}
          <div
            className="w-28 h-28 rounded-[2.5rem] relative z-10 flex items-center justify-center"
            style={{
              background: "rgba(0,240,255,0.05)",
              border: "1px solid rgba(0,240,255,0.28)",
              boxShadow: "0 0 80px rgba(0,240,255,0.18), inset 0 1px 0 rgba(255,255,255,0.07)",
              backdropFilter: "blur(24px)",
            }}
          >
            <img
              src={LOGOS[1]}
              alt="Aura Arena"
              className="w-16 h-16 object-contain"
              style={{ filter: "drop-shadow(0 0 20px rgba(0,240,255,0.7))" }}
            />
          </div>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          className="text-center flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AuraLogoText size="xl" glow className="scale-110" />
          <p className="text-[8px] font-mono tracking-[0.45em] uppercase"
            style={{ color: "rgba(255,255,255,0.32)" }}>
            Premium Esports · AI Powered
          </p>
        </motion.div>

        {/* 3D Badge row */}
        <motion.div
          className="flex gap-3 items-end"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          {BADGES_3D.map((src, i) => (
            <motion.img
              key={src}
              src={src}
              alt=""
              className="object-contain"
              style={{ width: 36 + i * 4, height: 36 + i * 4, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))" }}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 0.85 + i * 0.04 }}
              transition={{ delay: 0.85 + i * 0.08 }}
            />
          ))}
        </motion.div>

        {/* Stat pills */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          {[
            { label: "50K+ Athletes", icon: "⚡" },
            { label: "Real-time AI", icon: "🧠" },
            { label: "Global Arena", icon: "🌐" },
          ].map(({ label, icon }) => (
            <span key={label}
              className="text-[8px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{
                background: "rgba(0,240,255,0.07)",
                border: "1px solid rgba(0,240,255,0.18)",
                color: "rgba(255,255,255,0.48)",
              }}>
              <span className="text-[9px]">{icon}</span>{label}
            </span>
          ))}
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="relative w-32 h-0.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, var(--ac), rgba(0,240,255,0.6))" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.6, delay: 1.2, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* ── Typographic logo watermark (bottom center) ───────────────────── */}
      <motion.div
        className="absolute bottom-8 inset-x-0 flex justify-center z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <img
          src={LOGOS[0]}
          alt=""
          className="h-6 object-contain"
          style={{ opacity: 0.18, filter: "brightness(2)" }}
        />
      </motion.div>

      {/* ── Bottom gradient vignette ──────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none z-10"
        style={{ background: "linear-gradient(0deg, rgba(4,9,20,1) 0%, transparent 100%)" }} />
    </div>
  );
}
