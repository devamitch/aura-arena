// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Detection Lab
// Standalone camera tester: live landmark stats, FPS, all detection modes
// ═══════════════════════════════════════════════════════════════════════════════

import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { cn } from "@lib/utils";
import { Activity, ArrowLeft, Camera, Cpu, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Mode = "pose" | "hands" | "face" | "all";

const MODES: { id: Mode; label: string; emoji: string; desc: string }[] = [
  { id: "pose", label: "Pose", emoji: "🦴", desc: "33-point body skeleton" },
  { id: "hands", label: "Hands", emoji: "🖐️", desc: "21-point hand landmarks" },
  { id: "face", label: "Face", emoji: "😶", desc: "Face mesh + expressions" },
  { id: "all", label: "All", emoji: "🤖", desc: "Full holistic detection" },
];

export default function DetectionLabPage() {
  const navigate = useNavigate();
  const { accentColor } = usePersonalization();

  const [mode, setMode] = useState<Mode>("pose");
  const [statsHistory, setStatsHistory] = useState<number[]>([]);

  const camera = useCamera({
    discipline: "boxing", // Default for testing
    autoStart: true,
    extraTasks: mode === "all" ? ["hands", "face"] : [mode as any],
    showSkeleton: true,
    showHands: true,
    showFace: true,
    showObjects: true,
  });

  const {
    videoRef,
    canvasRef,
    permission,
    streaming,
    engineReady,
    scanProgress,
    currentScore,
    lastResult,
  } = camera;

  // Track history for sparkline
  useEffect(() => {
    if (streaming) {
      const interval = setInterval(() => {
        setStatsHistory((prev) => {
          const newStat = Math.max(
            10,
            currentScore.stability || currentScore.accuracy,
          );
          return [...prev.slice(-59), newStat];
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [streaming, currentScore]);

  const landmarksCount = lastResult
    ? (lastResult.poseLandmarks?.[0]?.length ?? 0) +
      (lastResult.handLandmarks?.[0]?.length ?? 0) +
      (lastResult.faceLandmarks?.[0]?.length ?? 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-void flex flex-col">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-14 pb-3 z-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,6,16,0.95) 0%, transparent 100%)",
        }}
      >
        <button onClick={() => navigate(-1)} className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-base font-black text-t1 leading-none">
            Detection Lab
          </p>
          <p className="text-[10px] font-mono text-t3 mt-0.5">
            MediaPipe · Real-time CV
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: streaming ? "#34d399" : "#f87171" }}
          />
          <span className="text-[10px] font-mono text-t3">
            {streaming ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Camera view */}
      <div className="relative flex-1 mx-4 mb-2 rounded-2xl overflow-hidden bg-card/60 backdrop-blur-xl border-white/10 shadow-sm">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* HUD overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          {["tl", "tr", "bl", "br"].map((corner) => (
            <div
              key={corner}
              className={cn("absolute w-6 h-6", {
                "top-3 left-3": corner === "tl",
                "top-3 right-3": corner === "tr",
                "bottom-3 left-3": corner === "bl",
                "bottom-3 right-3": corner === "br",
              })}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d={
                    corner.includes("l")
                      ? "M0 12 L0 0 L12 0"
                      : "M24 12 L24 0 L12 0"
                  }
                  stroke={accentColor}
                  strokeWidth="2"
                  opacity="0.7"
                />
              </svg>
            </div>
          ))}

          {/* Scan line */}
          {streaming && scanProgress < 1 && <div className="scan-beam" />}

          {/* Status Indicators */}
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg font-mono text-[11px] flex gap-2"
            style={{ background: "rgba(4,6,16,0.7)" }}
          >
            <span style={{ color: engineReady ? "#34d399" : "#fbbf24" }}>
              {engineReady ? "CORE: ACTIVE" : "SYNCING..."}
            </span>
          </div>
        </div>

        {/* No camera state */}
        {!streaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Camera className="w-12 h-12 text-t3" />
            <p className="text-sm text-t3">
              {permission === "denied"
                ? "Camera denied — check browser settings"
                : "Starting camera…"}
            </p>
            {permission === "denied" && (
              <button
                onClick={() => camera.requestCamera()}
                className="px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: accentColor, color: "#040610" }}
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div className="px-4 mb-3 grid grid-cols-4 gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded-2xl p-2.5 text-center transition-all",
              mode === m.id ? "" : "opacity-50",
            )}
            style={{
              background:
                mode === m.id ? `${accentColor}18` : "rgba(10,12,26,0.8)",
              border: `1px solid ${mode === m.id ? accentColor + "50" : "rgba(255,255,255,0.05)"}`,
            }}
          >
            <div className="text-lg mb-0.5">{m.emoji}</div>
            <p
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: mode === m.id ? accentColor : "var(--t3)" }}
            >
              {m.label}
            </p>
          </button>
        ))}
      </div>

      {/* Stats strip */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        {[
          {
            icon: Activity,
            label: "Landmarks",
            value: landmarksCount.toString(),
            color: accentColor,
          },
          {
            icon: Cpu,
            label: "Accuracy",
            value: `${currentScore.accuracy}%`,
            color: "#f97316",
          },
          {
            icon: Eye,
            label: "Mode",
            value: mode.toUpperCase(),
            color: "#a78bfa",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-s1 rounded-2xl px-3 py-2.5 border border-b1 flex items-center gap-2"
            >
              <Icon
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: stat.color }}
              />
              <div className="min-w-0">
                <p className="text-[9px] font-mono text-t3 uppercase tracking-widest truncate">
                  {stat.label}
                </p>
                <p
                  className="text-sm font-black tabular-nums leading-none"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* FPS sparkline */}
      <div className="px-4 mb-6">
        <div className="bg-s1 rounded-2xl p-3 border border-b1">
          <p className="label-section mb-2">Signal Stability</p>
          <div className="flex items-end gap-0.5 h-8">
            {statsHistory.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.min(100, (v / 60) * 100)}%`,
                  minHeight: 2,
                  background:
                    v >= 30 ? accentColor : v >= 15 ? "#fbbf24" : "#f87171",
                  opacity: 0.6 + (i / statsHistory.length) * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
