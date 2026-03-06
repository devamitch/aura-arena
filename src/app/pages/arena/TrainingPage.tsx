// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Training Page (Full-Screen Camera HUD Edition)
// ═══════════════════════════════════════════════════════════════════════════════

import { MetricsPanel } from "@features/arena/components/MetricsPanel";
import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { useStore } from "@store";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Target,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function TrainingPage() {
  const navigate = useNavigate();
  const { drillId } = useParams<{ drillId?: string }>();
  const { discipline: disc } = usePersonalization();
  const { endSession, addXP } = useStore();

  const [elapsed, setElapsed] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const camera = useCamera({
    discipline: disc.id,
  });

  // Auto-start camera on mount
  useEffect(() => {
    camera.requestCamera();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      camera.stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndSession = useCallback(() => {
    setSessionActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    camera.stopCamera();

    const summary = camera.getSessionSummary();
    if (summary && elapsed > 5) {
      endSession(summary);
      addXP(Math.round(summary.finalScore * 2));
    }

    navigate(-1);
  }, [camera, elapsed, endSession, addXP, navigate]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden font-sans">
      {/* ── 1. The Full-Screen Mirror (Camera Layer) ── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          ref={camera.videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ transform: "scaleX(-1)" }}
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={camera.canvasRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Vignette & Scanlines for HUD effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, transparent 40%, rgba(4,9,20,0.8) 100%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==')]" />
      </div>

      {/* ── 2. Top HUD Bar ── */}
      <div className="relative z-10 p-5 flex items-start justify-between">
        <button
          onClick={handleEndSession}
          className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-xl transition-all active:scale-90"
          style={{
            background: "rgba(4,9,20,0.5)",
            border: "1px solid rgba(0,240,255,0.3)",
            boxShadow: "0 0 20px rgba(0,240,255,0.15)",
          }}
        >
          <ArrowLeft className="w-5 h-5 text-[#00f0ff]" strokeWidth={2.5} />
        </button>

        {/* Center Top: Match/Drill Title */}
        <div className="flex flex-col items-center">
          <div
            className="px-5 py-1.5 rounded-full backdrop-blur-md mb-2"
            style={{
              background: "rgba(0,240,255,0.1)",
              border: "1px solid rgba(0,240,255,0.4)",
            }}
          >
            <span className="text-[10px] font-mono text-[#0cebeb] uppercase tracking-[0.3em] font-bold">
              Live Telemetry
            </span>
          </div>
          <p className="text-white text-base font-black tracking-wide drop-shadow-md">
            {drillId
              ? `Drill: ${drillId.replace("-", " ")}`
              : "Free Training Mode"}
          </p>
        </div>

        {/* Timer Capsule */}
        <div
          className="px-4 py-2.5 rounded-[14px] flex items-center gap-2 backdrop-blur-xl"
          style={{
            background: "rgba(4,9,20,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Clock className="w-4 h-4 text-white/50" />
          <span className="text-sm font-mono text-white font-bold tabular-nums tracking-widest">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* ── 3. Floating Side Metrics (Left) ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 pointer-events-none">
        {[
          { icon: Activity, label: "Form", val: "94%" },
          { icon: Zap, label: "Speed", val: "88%" },
          { icon: Shield, label: "Def", val: "72%" },
        ].map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.5 }}
            className="flex items-center gap-3 backdrop-blur-md p-2 rounded-2xl"
            style={{
              background: "rgba(0,0,0,0.4)",
              borderLeft: "3px solid #00f0ff",
            }}
          >
            <div className="w-8 h-8 rounded-full bg-[#00f0ff]/20 flex items-center justify-center">
              <m.icon className="w-4 h-4 text-[#0cebeb]" />
            </div>
            <div>
              <p className="text-[#00f0ff] font-black text-sm tabular-nums">
                {m.val}
              </p>
              <p className="text-[8px] font-mono text-white/50 uppercase tracking-widest">
                {m.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── 4. Main Score Ring (Center Right) ── */}
      <div className="absolute right-6 top-1/3 z-10 pointer-events-none flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-[120px] h-[120px] -ml-[10px] -mt-[10px] rounded-full border-t-2 border-r-2 border-[#00f0ff] opacity-40"
        />
        <div
          className="w-[100px] h-[100px] rounded-full backdrop-blur-md flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(0,240,255,0.2)]"
          style={{
            background: "rgba(4,9,20,0.7)",
            border: "2px solid rgba(0,240,255,0.4)",
          }}
        >
          <span className="text-[10px] font-mono text-[#0cebeb] font-bold mb-[-4px]">
            SCORE
          </span>
          <span className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">
            {camera.currentScore.overall}
          </span>
        </div>
      </div>

      {/* ── 5. Bottom AI Analysis Panel ── */}
      <motion.div
        className="absolute bottom-0 inset-x-0 z-20 flex flex-col rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: showAnalysis ? 0 : "75%" }} // Peek mode vs Full mode
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Glass heavy background for the whole panel */}
        <div className="absolute inset-0 backdrop-blur-[40px] bg-black/60 border-t border-[#00f0ff]/30" />

        <div className="relative z-10 flex flex-col w-full h-full">
          {/* Grab Handle & Toggle */}
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full h-16 flex items-center justify-center relative cursor-ns-resize"
          >
            <div className="absolute top-3 w-12 h-1.5 bg-white/20 rounded-full" />
            <div className="flex items-center gap-2 mt-4">
              <Target className="w-4 h-4 text-[#00f0ff]" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em]">
                AI Engine Analysis
              </span>
              {showAnalysis ? (
                <ChevronDown className="w-4 h-4 text-white/50" />
              ) : (
                <ChevronUp className="w-4 h-4 text-[#00f0ff]" />
              )}
            </div>
          </button>

          {/* Expanded Content */}
          <div className="px-6 pb-8 pt-2">
            {/* 6-Dimension Radar/Metrics visual placeholder */}
            <div className="h-48 w-full rounded-2xl bg-[#040914]/80 border border-white/10 mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00f0ff] via-transparent to-transparent" />
              <MetricsPanel score={camera.currentScore} />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowAnalysis(false)}
                className="py-4 rounded-[20px] font-bold text-sm text-white/70"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Hide Panel
              </button>
              <button
                onClick={handleEndSession}
                className="py-4 rounded-[20px] font-black text-sm uppercase tracking-wider"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                  color: "white",
                  boxShadow: "0 0 20px rgba(239,68,68,0.3)",
                }}
              >
                End & Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
