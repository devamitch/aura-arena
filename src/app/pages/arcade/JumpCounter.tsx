// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Jump Counter (MediaPipe)
// Detects jumps via hip Y velocity and counts reps in 30 seconds
// ═══════════════════════════════════════════════════════════════════════════════

import { bus } from "@lib/eventBus";
import { useStore } from "@store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCamera } from "@hooks/useCamera";

type Phase = "idle" | "countdown" | "active" | "done";

const DURATION = 30;
const JUMP_THRESHOLD = 0.06;   // hip Y must drop by this much from baseline
const LAND_THRESHOLD = 0.025;  // hip Y must return within this of baseline
const DEBOUNCE_MS = 400;

export default function JumpCounter() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [jumps, setJumps] = useState(0);
  const [feedback, setFeedback] = useState("Stand in frame and get ready!");
  const [bestJumps, setBestJumps] = useState(0);
  const [airborne, setAirborne] = useState(false);

  const baseline = useRef<number | null>(null);
  const baselineSamples = useRef<number[]>([]);
  const inAir = useRef(false);
  const lastJumpTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const camera = useCamera({ discipline: "fitness" });

  useEffect(() => {
    const handler = ({ poseLandmarks }: { poseLandmarks: unknown[][]; poseWorldLandmarks: unknown[][]; timestamp: number }) => {
      if (phaseRef.current !== "active" && phaseRef.current !== "idle") return;
      const lms = (poseLandmarks[0] ?? []) as { x: number; y: number; z: number; visibility?: number }[];
      if (lms.length < 25) return;

      const lHip = lms[23], rHip = lms[24];
      if (!lHip || !rHip) return;
      if ((lHip.visibility ?? 0) + (rHip.visibility ?? 0) < 0.8) return;

      const hipY = (lHip.y + rHip.y) / 2;

      // Build baseline from first ~20 frames
      if (phaseRef.current === "active" && baselineSamples.current.length < 20) {
        baselineSamples.current.push(hipY);
        if (baselineSamples.current.length === 20) {
          baseline.current = baselineSamples.current.reduce((a, b) => a + b, 0) / 20;
        }
        return;
      }

      if (phaseRef.current !== "active" || baseline.current === null) return;

      const delta = baseline.current - hipY; // positive = hips went UP (person rose)

      if (delta > JUMP_THRESHOLD && !inAir.current) {
        inAir.current = true;
        setAirborne(true);
        setFeedback("Airborne! 🚀");
      } else if (delta < LAND_THRESHOLD && inAir.current) {
        const now = Date.now();
        if (now - lastJumpTime.current > DEBOUNCE_MS) {
          lastJumpTime.current = now;
          inAir.current = false;
          setAirborne(false);
          setJumps((j) => j + 1);
          setFeedback("Jump! Keep bouncing ⚡");
        }
      } else if (!inAir.current) {
        setFeedback("Jump as high as you can!");
      }
    };

    bus.on("pose:result", handler);
    return () => bus.off("pose:result", handler);
  }, []);

  const startCountdown = useCallback(() => {
    if (!camera.streaming) { camera.requestCamera(); return; }
    setPhase("countdown");
    setCountdown(3);
    setJumps(0);
    baseline.current = null;
    baselineSamples.current = [];
    inAir.current = false;
    setAirborne(false);

    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(iv);
        setPhase("active");
        setTimeLeft(DURATION);
        setFeedback("Stand still for 1s to calibrate…");

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
      const earned = jumps * 5;
      addXP(earned);
      setBestJumps((b) => Math.max(b, jumps));
    }
  }, [phase, jumps, addXP]);

  useEffect(() => {
    if (phase === "idle") camera.requestCamera();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); camera.stopCamera(); }, []);

  const xpEarned = jumps * 5;

  return (
    <div className="fixed inset-0 z-50 text-white overflow-hidden" style={{ background: "#040914" }}>
      <video ref={camera.videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)", opacity: 0.85 }} />
      <canvas ref={camera.canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0"
        style={{ background: airborne
          ? "linear-gradient(180deg, rgba(0,240,255,0.12) 0%, rgba(4,9,20,0.2) 40%, rgba(4,9,20,0.85) 100%)"
          : "linear-gradient(180deg, rgba(4,9,20,0.6) 0%, rgba(4,9,20,0.2) 40%, rgba(4,9,20,0.8) 100%)" }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(4,9,20,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color: "#a855f7" }}>Pose Game</p>
          <h1 className="text-xl font-black">Jump Counter</h1>
        </div>
        {bestJumps > 0 && (
          <div className="px-3 py-1 rounded-full text-[10px] font-black"
            style={{ background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
            Best: {bestJumps}
          </div>
        )}
      </div>

      {camera.permission === "denied" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8">
          <Camera className="w-16 h-16 text-white/30" />
          <p className="text-white/60 text-center text-sm">Camera access needed for jump detection</p>
          <button onClick={() => camera.requestCamera()}
            className="px-6 py-3 rounded-2xl font-black text-[#040914]"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
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
                className="text-[120px] font-black" style={{ color: "#a855f7", textShadow: "0 0 40px rgba(168,85,247,0.5)" }}>
                {countdown}
              </motion.p>
            </motion.div>
          )}

          {phase === "active" && (
            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="px-5 pb-safe space-y-3">
              {/* Airborne indicator */}
              <AnimatePresence>
                {airborne && (
                  <motion.div key="air" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex justify-center">
                    <div className="px-4 py-2 rounded-full font-black text-sm"
                      style={{ background: "rgba(0,240,255,0.2)", border: "1px solid rgba(0,240,255,0.5)", color: "var(--ac)" }}>
                      🚀 AIRBORNE
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
                  style={{ background: "rgba(4,9,20,0.8)", border: "1px solid rgba(168,85,247,0.4)" }}>
                  <p className="text-3xl font-black text-[#a855f7]">{jumps}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Jumps</p>
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
              style={{ background: "rgba(4,9,20,0.92)", border: "1px solid rgba(168,85,247,0.3)", backdropFilter: "blur(20px)" }}>
              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Results</p>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
                  <p className="text-4xl font-black text-[#a855f7]">{jumps}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Jumps</p>
                </div>
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p className="text-4xl font-black text-[#10b981]">+{xpEarned}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">XP</p>
                </div>
              </div>
              <p className="text-center text-white/40 text-xs mb-4">
                {jumps >= 30 ? "Insane! 🔥" : jumps >= 20 ? "Great work! ⚡" : jumps >= 10 ? "Good effort! 💪" : "Keep jumping!"}
              </p>
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-2xl font-black text-sm text-white/60"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Done
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={startCountdown}
                  className="flex-2 py-3 px-6 rounded-2xl font-black text-sm text-[#040914]"
                  style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  Try Again →
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mx-5 mb-safe rounded-[28px] p-5"
              style={{ background: "rgba(4,9,20,0.88)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
              <p className="text-center font-black text-lg mb-1">Jump Counter</p>
              <p className="text-center text-white/40 text-sm mb-4">30 seconds · jump as many times as you can · +5 XP per jump</p>
              <div className="flex gap-2 mb-4 text-[11px] text-white/50">
                <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>📐 Full body visible</div>
                <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>⬆️ Jump high!</div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={startCountdown}
                className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                {camera.streaming ? "Start Challenge →" : "Enable Camera →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
