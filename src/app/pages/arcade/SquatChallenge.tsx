// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Squat Challenge (MediaPipe)
// Detects squats via knee angle and counts reps in 30 seconds
// ═══════════════════════════════════════════════════════════════════════════════

import { bus } from "@lib/eventBus";
import { useStore } from "@store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCamera } from "@hooks/useCamera";

type Phase = "idle" | "countdown" | "active" | "done";
type SquatState = "standing" | "squatting";

const DURATION = 30;

type Pt = { x: number; y: number };
function angleDeg(a: Pt, b: Pt, c: Pt): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  return Math.acos(Math.max(-1, Math.min(1, dot / (mag || 0.001)))) * (180 / Math.PI);
}

export default function SquatChallenge() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Get in frame and stand tall");
  const [bestReps, setBestReps] = useState(0);

  const squatState = useRef<SquatState>("standing");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const camera = useCamera({ discipline: "calisthenics" });

  // Pose landmark detection
  useEffect(() => {
    const handler = ({ poseLandmarks }: { poseLandmarks: unknown[][]; poseWorldLandmarks: unknown[][]; timestamp: number }) => {
      if (phaseRef.current !== "active") return;
      const lms = (poseLandmarks[0] ?? []) as { x: number; y: number; z: number; visibility?: number }[];
      if (lms.length < 29) return;

      const lHip   = lms[23], lKnee = lms[25], lAnkle = lms[27];
      const rHip   = lms[24], rKnee = lms[26], rAnkle = lms[28];
      if (!lHip || !lKnee || !lAnkle || !rHip || !rKnee || !rAnkle) return;

      // Check visibility
      const vis = (lms[25]?.visibility ?? 0) + (lms[26]?.visibility ?? 0);
      if (vis < 0.8) { setFeedback("Step back so your full body is visible"); return; }

      const lAngle = angleDeg(lHip, lKnee, lAnkle);
      const rAngle = angleDeg(rHip, rKnee, rAnkle);
      const avgAngle = (lAngle + rAngle) / 2;

      if (avgAngle < 100 && squatState.current === "standing") {
        squatState.current = "squatting";
        setFeedback("Good! Now stand back up");
      } else if (avgAngle > 155 && squatState.current === "squatting") {
        squatState.current = "standing";
        setReps((r) => r + 1);
        setFeedback("Rep! Keep going 💪");
      } else if (squatState.current === "standing") {
        setFeedback("Squat down — bend your knees");
      }
    };

    bus.on("pose:result", handler);
    return () => bus.off("pose:result", handler);
  }, []);

  const startCountdown = useCallback(() => {
    if (!camera.streaming) { camera.requestCamera(); return; }
    setPhase("countdown");
    setCountdown(3);
    setReps(0);
    squatState.current = "standing";

    let c = 3;
    const iv = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(iv);
        setPhase("active");
        setTimeLeft(DURATION);
        setFeedback("Squat down — bend your knees");

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
      setReps((r) => {
        const earned = r * 3;
        addXP(earned);
        setBestReps((b) => Math.max(b, r));
        return r;
      });
    }
  }, [phase, addXP]);

  useEffect(() => {
    if (phase === "idle" && !camera.streaming) camera.requestCamera();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); camera.stopCamera(); }, []);

  const xpEarned = reps * 3;

  return (
    <div className="fixed inset-0 z-50 text-white overflow-hidden" style={{ background: "#040914" }}>
      {/* Camera feed */}
      <video
        ref={camera.videoRef}
        autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)", opacity: 0.85 }}
      />
      <canvas ref={camera.canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(4,9,20,0.6) 0%, rgba(4,9,20,0.2) 40%, rgba(4,9,20,0.8) 100%)" }} />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(4,9,20,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ac)" }}>Pose Game</p>
          <h1 className="text-xl font-black">Squat Challenge</h1>
        </div>
        {bestReps > 0 && (
          <div className="px-3 py-1 rounded-full text-[10px] font-black"
            style={{ background: "rgba(0,240,255,0.15)", border: "1px solid rgba(0,240,255,0.3)", color: "var(--ac)" }}>
            Best: {bestReps}
          </div>
        )}
      </div>

      {/* Camera permission prompt */}
      {camera.permission === "denied" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8">
          <Camera className="w-16 h-16 text-white/30" />
          <p className="text-white/60 text-center text-sm">Camera access needed for pose detection</p>
          <button onClick={() => camera.requestCamera()}
            className="px-6 py-3 rounded-2xl font-black text-[#040914]"
            style={{ background: "linear-gradient(135deg, var(--ac), #3b82f6)" }}>
            Enable Camera
          </button>
        </div>
      )}

      {/* Main overlay */}
      <div className="absolute inset-0 z-10 flex flex-col">
        <div className="flex-1" />

        <AnimatePresence mode="wait">
          {/* Countdown */}
          {phase === "countdown" && (
            <motion.div key="countdown" className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.p key={countdown}
                initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-[120px] font-black" style={{ color: "var(--ac)", textShadow: "0 0 40px rgba(0,240,255,0.5)" }}>
                {countdown}
              </motion.p>
            </motion.div>
          )}

          {/* Active */}
          {phase === "active" && (
            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="px-5 pb-safe space-y-3">
              {/* Timer + reps */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{ background: "rgba(4,9,20,0.8)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <p className="text-3xl font-black" style={{ color: timeLeft <= 10 ? "#f43f5e" : "white" }}>{timeLeft}s</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Time</p>
                </div>
                <div className="flex-1 rounded-2xl px-4 py-3 text-center"
                  style={{ background: "rgba(4,9,20,0.8)", border: "1px solid rgba(0,240,255,0.3)" }}>
                  <p className="text-3xl font-black" style={{ color: "var(--ac)" }}>{reps}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Reps</p>
                </div>
              </div>
              {/* Feedback */}
              <div className="rounded-xl px-4 py-2 text-center"
                style={{ background: "rgba(4,9,20,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[13px] font-bold text-white/80">{feedback}</p>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {phase === "done" && (
            <motion.div key="done" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              className="mx-5 mb-safe rounded-[28px] p-6"
              style={{ background: "rgba(4,9,20,0.92)", border: "1px solid rgba(0,240,255,0.2)", backdropFilter: "blur(20px)" }}>
              <p className="text-center text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Results</p>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)" }}>
                  <p className="text-4xl font-black" style={{ color: "var(--ac)" }}>{reps}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">Squats</p>
                </div>
                <div className="flex-1 rounded-2xl p-3 text-center"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <p className="text-4xl font-black text-[#10b981]">+{xpEarned}</p>
                  <p className="text-[10px] text-white/30 uppercase font-mono">XP</p>
                </div>
              </div>
              <p className="text-center text-white/40 text-xs mb-4">
                {reps >= 20 ? "Beast mode! 🔥" : reps >= 12 ? "Solid effort! 💪" : reps >= 6 ? "Good start!" : "Keep practicing!"}
              </p>
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-2xl font-black text-sm text-white/60"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Done
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={startCountdown}
                  className="flex-2 py-3 px-6 rounded-2xl font-black text-sm text-[#040914]"
                  style={{ background: "linear-gradient(135deg, var(--ac), #3b82f6)" }}>
                  Try Again →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Idle */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mx-5 mb-safe rounded-[28px] p-5"
              style={{ background: "rgba(4,9,20,0.88)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
              <p className="text-center font-black text-lg mb-1">Squat Challenge</p>
              <p className="text-center text-white/40 text-sm mb-4">30 seconds · as many squats as you can · +3 XP per rep</p>
              <div className="flex gap-2 mb-4 text-[11px] text-white/50">
                <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>📐 Full body visible</div>
                <div className="flex-1 rounded-xl p-2 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>👟 Feet shoulder-width</div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={startCountdown}
                className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
                style={{ background: "linear-gradient(135deg, var(--ac), #3b82f6)" }}>
                {camera.streaming ? "Start Challenge →" : "Enable Camera →"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
