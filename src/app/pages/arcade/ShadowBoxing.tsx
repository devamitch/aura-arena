// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Shadow Boxing (MediaPipe)
// Counts punches via wrist velocity in 45 seconds · tracks combo streaks
// ═══════════════════════════════════════════════════════════════════════════════

import { bus } from "@lib/eventBus";
import { useStore } from "@store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCamera } from "@hooks/useCamera";

type Phase = "idle" | "countdown" | "active" | "done";

const DURATION = 45;
const PUNCH_VELOCITY = 0.045;  // normalized units/frame to count as punch
const PUNCH_DEBOUNCE = 220;    // ms between punches per hand

export default function ShadowBoxing() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [punches, setPunches] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState("Get in stance and fight!");
  const [flash, setFlash] = useState<"left" | "right" | null>(null);

  const prevWristRef = useRef<{ lx: number; rx: number } | null>(null);
  const lastPunchTime = useRef({ left: 0, right: 0 });
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const punchesRef = useRef(0);
  const comboRef = useRef(0);
  phaseRef.current = phase;

  const camera = useCamera({ discipline: "boxing" });

  const registerPunch = useCallback((side: "left" | "right") => {
    const now = Date.now();
    const key = side;
    if (now - lastPunchTime.current[key] < PUNCH_DEBOUNCE) return;
    lastPunchTime.current[key] = now;

    punchesRef.current++;
    setPunches(punchesRef.current);
    comboRef.current++;
    setCombo(comboRef.current);
    setMaxCombo((m) => Math.max(m, comboRef.current));
    setFlash(side);
    setFeedback(side === "left" ? "Left jab! 👊" : "Right cross! 👊");
    setTimeout(() => setFlash(null), 150);

    // Reset combo after 1.5s inactivity
    if (comboTimer.current) clearTimeout(comboTimer.current);
    comboTimer.current = setTimeout(() => {
      comboRef.current = 0;
      setCombo(0);
    }, 1500);
  }, []);

  useEffect(() => {
    const handler = ({ poseLandmarks }: { poseLandmarks: unknown[][]; poseWorldLandmarks: unknown[][]; timestamp: number }) => {
      if (phaseRef.current !== "active") return;
      const lms = (poseLandmarks[0] ?? []) as { x: number; y: number; z: number; visibility?: number }[];
      if (lms.length < 17) return;

      const lWrist = lms[15], rWrist = lms[16];
      if (!lWrist || !rWrist) return;
      if ((lWrist.visibility ?? 0) < 0.4 && (rWrist.visibility ?? 0) < 0.4) return;

      const lx = lWrist.x, rx = rWrist.x;

      if (prevWristRef.current) {
        const { lx: plx, rx: prx } = prevWristRef.current;
        const ldx = Math.abs(lx - plx);
        const rdx = Math.abs(rx - prx);

        if (ldx > PUNCH_VELOCITY && (lWrist.visibility ?? 0) > 0.4) registerPunch("left");
        if (rdx > PUNCH_VELOCITY && (rWrist.visibility ?? 0) > 0.4) registerPunch("right");
      }

      prevWristRef.current = { lx, rx };
    };

    bus.on("pose:result", handler);
    return () => bus.off("pose:result", handler);
  }, [registerPunch]);

  const startCountdown = useCallback(() => {
    if (!camera.streaming) { camera.requestCamera(); return; }
    setPhase("countdown");
    setCountdown(3);
    setPunches(0); punchesRef.current = 0;
    setCombo(0); comboRef.current = 0;
    setMaxCombo(0);
    prevWristRef.current = null;
    lastPunchTime.current = { left: 0, right: 0 };

    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(iv);
        setPhase("active");
        setTimeLeft(DURATION);
        setFeedback("Throw punches — fast and hard!");

        let t = DURATION;
        timerRef.current = setInterval(() => {
          t--;
          setTimeLeft(t);
          if (t <= 0) {
            clearInterval(timerRef.current!);
            setPhase("done");
          }
        }, 1000);
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, [camera]);

  useEffect(() => {
    if (phase === "done") {
      const earned = Math.floor(punches * 0.5);
      addXP(earned);
    }
  }, [phase, punches, addXP]);

  useEffect(() => { camera.requestCamera(); }, []);
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (comboTimer.current) clearTimeout(comboTimer.current);
    camera.stopCamera();
  }, []);

  const xpEarned = Math.floor(punches * 0.5);

  return (
    <div className="fixed inset-0 z-50 text-white overflow-hidden" style={{ background: "#040914" }}>
      <video ref={camera.videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)", opacity: 0.85 }} />
      <canvas ref={camera.canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Punch flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div key={flash + Date.now()} className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0.3 }} animate={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ background: flash === "left" ? "rgba(0,240,255,0.15)" : "rgba(244,63,94,0.15)" }} />
        )}
      </AnimatePresence>

      <div className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(4,9,20,0.6) 0%, rgba(4,9,20,0.1) 40%, rgba(4,9,20,0.85) 100%)" }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(4,9,20,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color: "#f43f5e" }}>Pose Game</p>
          <h1 className="text-xl font-black">Shadow Boxing</h1>
        </div>
        {maxCombo > 0 && (
          <div className="px-3 py-1 rounded-full text-[10px] font-black"
            style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e" }}>
            Best: ×{maxCombo}
          </div>
        )}
      </div>

      {camera.permission === "denied" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8">
          <Camera className="w-16 h-16 text-white/30" />
          <p className="text-white/60 text-center text-sm">Camera needed for punch detection</p>
          <button onClick={() => camera.requestCamera()}
            className="px-6 py-3 rounded-2xl font-black text-[#040914]"
            style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)" }}>
            Enable Camera
          </button>
        </div>
      )}

      <div className="absolute inset-0 z-10 flex flex-col">
        <div className="flex-1" />

        <AnimatePresence mode="wait">
          {phase === "countdown" && (
            <motion.div key="countdown" className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.p key={countdown}
                initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-[120px] font-black" style={{ color: "#f43f5e", textShadow: "0 0 40px rgba(244,63,94,0.5)" }}>
                {countdown}
              </motion.p>
            </motion.div>
          )}

          {phase === "active" && (
            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="px-5 pb-safe space-y-3">
              {/* Combo badge */}
              <AnimatePresence>
                {combo >= 3 && (
                  <motion.div key={`combo-${combo}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-center">
                    <div className="px-4 py-1.5 rounded-full font-black text-sm"
                      style={{ background: "rgba(244,63,94,0.25)", border: "1px solid rgba(244,63,94,0.6)", color: "#f43f5e" }}>
                      🔥 ×{combo} COMBO
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{ background: "rgba(4,9,20,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-3xl font-black" style={{ color: timeLeft <= 10 ? "#f43f5e" : "white" }}>{timeLeft}s</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Time</p>
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{ background: "rgba(4,9,20,0.8)", border: "1px solid rgba(244,63,94,0.4)" }}>
                  <p className="text-3xl font-black text-[#f43f5e]">{punches}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Punches</p>
                </div>
              </div>

              <div className="rounded-xl px-4 py-2 text-center"
                style={{ background: "rgba(4,9,20,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[13px] font-bold text-white/80">{feedback}</p>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="mx-5 mb-safe rounded-[28px] p-6"
              style={{ background: "rgba(4,9,20,0.92)", border: "1px solid rgba(244,63,94,0.25)", backdropFilter: "blur(20px)" }}>
              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Round Over</p>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <p className="text-3xl font-black text-[#f43f5e]">{punches}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Punches</p>
                </div>
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="text-3xl font-black text-[#f59e0b]">×{maxCombo}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Max Combo</p>
                </div>
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p className="text-3xl font-black text-[#10b981]">+{xpEarned}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">XP</p>
                </div>
              </div>
              <p className="text-center text-white/40 text-xs mb-4">
                {punches >= 100 ? "Champion fighter! 🥊" : punches >= 60 ? "Solid combinations! 💪" : punches >= 30 ? "Good warmup!" : "Throw faster!"}
              </p>
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-2xl font-black text-sm text-white/60"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Done
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={startCountdown}
                  className="flex-2 py-3 px-6 rounded-2xl font-black text-sm text-[#040914]"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)" }}>
                  Next Round →
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mx-5 mb-safe rounded-[28px] p-5"
              style={{ background: "rgba(4,9,20,0.88)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
              <p className="text-center font-black text-lg mb-1">Shadow Boxing</p>
              <p className="text-center text-white/40 text-sm mb-4">45 seconds · throw punches · build combos · +0.5 XP per punch</p>
              <div className="flex gap-2 mb-4 text-[11px] text-white/50">
                <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>👊 Throw fast punches</div>
                <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>🔥 Build combos</div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={startCountdown}
                className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
                style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)" }}>
                {camera.streaming ? "Fight! →" : "Enable Camera →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
