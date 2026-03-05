import { CameraView } from "@features/arena/components/CameraView";
import { DrillLibrary } from "@features/arena/components/DrillLibrary";
import { MetricsPanel } from "@features/arena/components/MetricsPanel";
import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { useCoachFeedback } from "@hooks/useAI";
import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { ArcGauge } from "@shared/components/ui/ArcGauge";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import {
  useSelectedDifficulty,
  useSelectedDrill,
  useSessionPhase,
  useStore,
} from "@store";
import type { SubDisciplineId } from "@types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const DIFF = ["", "Beginner", "Easy", "Medium", "Hard", "Elite"] as const;
const DIFF_C = [
  "",
  "#3b82f6", // Blue
  "#22d3ee", // Cyan
  "#00f0ff", // Neon Cyan
  "#a855f7", // Purple
  "#ff00ff", // Magenta
] as const;

type Tab = "drill" | "style";

export default function TrainingPage() {
  const navigate = useNavigate();
  const phase = useSessionPhase();
  const drill = useSelectedDrill();
  const diff = useSelectedDifficulty();
  const {
    startSession,
    endSession,
    resetSession,
    setDrill,
    setDifficulty,
    updateMissionProgress,
    addXP,
  } = useStore();
  const {
    discipline: disc,
    accentColor,
    statLabels,
    subDisciplineId: defSub,
  } = usePersonalization();
  const coachAI = useCoachFeedback();
  const [countdown, setCountdown] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0);

  const [subId, setSubId] = useState<SubDisciplineId | undefined>(defSub);
  const [tab, setTab] = useState<Tab>("drill");
  const [metricsOpen, setMetricsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lastGesture, setLastGesture] = useState<{
    label: string;
    time: number;
  } | null>(null);

  const camera = useCamera({
    discipline: disc.id,
    autoStart: true,
    onGesture: (label, bonus) => {
      setLastGesture({ label, time: Date.now() });
      if (phase === "active") {
        addXP(bonus);
      }
    },
  });

  // ── Destructure stable callbacks to avoid re-render loops ─────────────────
  const { stopCamera, getSessionSummary } = camera;
  const { currentScore } = camera;

  // Clear gesture after 2s
  useEffect(() => {
    if (lastGesture) {
      const t = setTimeout(() => setLastGesture(null), 2000);
      return () => clearTimeout(t);
    }
  }, [lastGesture]);

  /* start flow: countdown → live */
  const handleStart = () => {
    setCountdown(3);
  };

  /* countdown */
  useEffect(() => {
    if (countdown <= 0) return;
    if (countdown === 1) {
      setTimeout(() => {
        setCountdown(0);
        startSession();
      }, 900);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [countdown, startSession, setCountdown]);

  /* session timer */
  useEffect(() => {
    if (phase !== "active") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setSessionTimer((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, setSessionTimer]);

  /* end session — uses destructured stable refs, not the whole camera object */
  const handleEnd = useCallback(async () => {
    stopCamera();
    const summary = getSessionSummary();
    endSession({
      ...summary,
      framesScored: summary.totalFrames,
    } as any);
    addXP(Math.round(currentScore.overall * diff * 0.5 + 20));
    updateMissionProgress("sessions", 1);
    updateMissionProgress("accuracy", currentScore.accuracy);
    await coachAI.generate(
      disc.id,
      subId as any,
      summary.finalScore,
      summary.accuracy,
      summary.stability,
      summary.timing,
      summary.expressiveness,
      summary.maxCombo,
    );
  }, [
    stopCamera,
    getSessionSummary,
    currentScore,
    diff,
    disc.id,
    subId,
    endSession,
    addXP,
    updateMissionProgress,
    coachAI,
  ]);

  /* cleanup on unmount — stable refs only, no camera object in deps */
  useEffect(
    () => () => {
      stopCamera();
      resetSession();
    },
    [stopCamera, resetSession],
  );

  const mm = String(Math.floor(sessionTimer / 60)).padStart(2, "0");
  const ss = String(sessionTimer % 60).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "var(--void)" }}
    >
      {/* top bar */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-3 pb-3 flex-shrink-0 z-20">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            stopCamera();
            resetSession();
            navigate(-1);
          }}
          className="btn-icon"
        >
          <X className="w-4 h-4" />
        </motion.button>
        <div className="flex-1">
          <p className="font-display font-bold text-[15px] text-[var(--t1)] leading-tight">
            {drill?.name ?? "Freestyle"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <DynamicIcon
              name={disc.icon}
              className="w-3 h-3 text-[var(--t3)]"
            />
            <p className="label-hud uppercase tracking-widest opacity-70">
              {subId?.replace(/_/g, " ") ?? disc.name}
            </p>
          </div>
        </div>
        {phase === "active" && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 anim-live" />
            <p className="font-mono text-sm font-bold text-[var(--t1)] tabular">
              {mm}:{ss}
            </p>
          </div>
        )}
      </div>

      {/* ── PRE-SESSION ── */}
      {phase === "pre" && countdown === 0 && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* tab selector */}
          <div className="flex items-center gap-1 px-4 mb-3 flex-shrink-0">
            {(["drill", "style"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 rounded-2xl font-display font-bold text-sm transition-all"
                style={{
                  background: tab === t ? accentColor : "var(--s2)",
                  color: tab === t ? "#030510" : "var(--t3)",
                  boxShadow: tab === t ? `0 0 24px ${accentColor}40` : "none",
                  border: `1px solid ${tab === t ? "transparent" : "var(--b1)"}`,
                }}
              >
                {t === "drill" ? "Drill" : "Style"}
              </button>
            ))}
          </div>

          {/* tab content */}
          <div className="flex-1 overflow-y-auto px-4 scroll-none pb-4">
            <AnimatePresence mode="wait">
              {tab === "drill" ? (
                <motion.div
                  key="drill"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                >
                  <DrillLibrary
                    discipline={disc}
                    subDisciplineId={subId}
                    selectedId={drill?.id}
                    onSelect={setDrill}
                    selectedDifficulty={diff as any}
                    onDifficultyChange={setDifficulty as any}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="style"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                >
                  <SubDisciplineSelector
                    disciplineId={disc.id}
                    selected={subId}
                    onSelect={setSubId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Camera Preview in Pre-phase */}
          <div className="px-4 mb-4 h-48 flex-shrink-0 relative">
            <CameraView
              camera={camera}
              accentColor={accentColor}
              showScore={false}
            />

            {/* Gesture Feedback Overlay */}
            <AnimatePresence>
              {lastGesture && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.2, y: -20 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                >
                  <div className="glass-heavy border-white/20 rounded-[2rem] px-8 py-4 flex flex-col items-center gap-2 shadow-[0_0_50px_rgba(0,0,240,0.3)]">
                    <Sparkles
                      className="w-10 h-10 animate-pulse"
                      style={{ color: accentColor }}
                    />
                    <p className="font-display font-black text-2xl text-white uppercase tracking-tighter">
                      {lastGesture.label.replace("_", " ")}!
                    </p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-60">
                      Aura Boost Activated
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* difficulty + start */}
          <div
            className="px-4 pb-safe pb-6 pt-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--b1)" }}
          >
            <div className="flex items-center gap-2 mb-3 overflow-x-auto scroll-none">
              {([1, 2, 3, 4, 5] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d as any)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all"
                  style={{
                    background: diff === d ? DIFF_C[d] + "28" : "var(--s2)",
                    border: `1px solid ${diff === d ? DIFF_C[d] + "55" : "var(--b1)"}`,
                    color: diff === d ? DIFF_C[d] : "var(--t3)",
                  }}
                >
                  {DIFF[d]}
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStart}
              className="w-full py-4 rounded-[20px] font-display font-extrabold text-[17px] text-[#040610] flex items-center justify-center gap-2.5"
              style={{
                background: `linear-gradient(145deg,${accentColor},${accentColor}bb)`,
                boxShadow: `0 0 32px ${accentColor}55`,
              }}
            >
              <Play className="w-5 h-5 fill-current" />
              Start Session
            </motion.button>
          </div>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-40"
            style={{
              background: "rgba(4,6,16,.85)",
              backdropFilter: "blur(8px)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={countdown}
                initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 2, opacity: 0, rotate: 15 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className="font-display font-black leading-none italic"
                style={{
                  fontSize: "clamp(100px,30vw,160px)",
                  color: accentColor,
                  textShadow: `0 0 80px ${accentColor}aa`,
                }}
              >
                {countdown}
              </motion.p>
            </AnimatePresence>
            <p className="absolute bottom-16 label-section tracking-widest text-[var(--t3)]">
              GET READY
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACTIVE SESSION ── */}
      {phase === "active" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* camera fills most of the screen */}
          <div className="flex-1 px-3 pb-2">
            <CameraView
              camera={camera}
              score={currentScore}
              accentColor={accentColor}
              showScore
            />
          </div>

          {/* live score row */}
          <div className="flex items-center px-4 gap-3 py-2 flex-shrink-0">
            <div className="flex-1 flex items-center gap-2">
              <div className="relative">
                <p
                  className="font-display font-extrabold text-4xl leading-none tabular"
                  style={{ color: accentColor }}
                >
                  {currentScore.overall}
                </p>
                {currentScore.combo >= 3 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-6 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-lg anim-combo"
                    style={{
                      background: `${accentColor}30`,
                      color: accentColor,
                    }}
                  >
                    {currentScore.combo}x
                  </motion.span>
                )}
              </div>
              <div>
                <p className="label-hud">SCORE</p>
                <p className="label-hud mt-0.5" style={{ color: DIFF_C[diff] }}>
                  {DIFF[diff]}
                </p>
              </div>
            </div>
            <button
              onClick={() => setMetricsOpen((o) => !o)}
              className="btn-icon w-9 h-9"
            >
              {metricsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* collapsible metrics */}
          <AnimatePresence>
            {metricsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="px-4 overflow-hidden flex-shrink-0"
              >
                <div className="pb-3">
                  <MetricsPanel
                    score={currentScore}
                    statLabels={Object.values(statLabels)}
                    compact
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* end btn */}
          <div className="px-4 pb-safe pb-5 pt-2 flex-shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleEnd}
              className="w-full py-3.5 rounded-[18px] font-display font-bold text-sm"
              style={{
                background: "rgba(239,68,68,.12)",
                border: "1px solid rgba(239,68,68,.3)",
                color: "#ef4444",
              }}
            >
              End Session
            </motion.button>
          </div>
        </div>
      )}

      {/* ── POST SESSION ── */}
      {phase === "post" && (
        <div className="flex-1 overflow-y-auto scroll-none pb-safe pb-8 px-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="space-y-4 pt-4"
          >
            {/* score card */}
            <div
              className="rounded-[24px] p-6 text-center"
              style={{
                background: `${accentColor}0d`,
                border: `1px solid ${accentColor}28`,
              }}
            >
              <p className="label-section mb-3">Session Complete</p>
              <ArcGauge
                value={currentScore.overall}
                size={120}
                strokeWidth={10}
                color={accentColor}
              />
              <p className="label-hud mt-3 text-[var(--t2)]">
                {mm}:{ss} · {DIFF[diff]} · {drill?.name ?? "Freestyle"}
              </p>
            </div>

            {/* metrics */}
            <div
              className="rounded-[20px] p-4"
              style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
            >
              <p className="label-section mb-3">Breakdown</p>
              <MetricsPanel
                score={currentScore}
                statLabels={Object.values(statLabels)}
              />
            </div>

            {/* AI coach */}
            <div
              className="rounded-[20px] overflow-hidden"
              style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
            >
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{
                  background: `${accentColor}0d`,
                  borderBottom: "1px solid var(--b1)",
                }}
              >
                <Sparkles
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: accentColor }}
                />
                <p className="label-section">AI Coach</p>
              </div>
              <div className="p-4">
                {coachAI.loading ? (
                  <div className="space-y-2">
                    <div className="h-3 rounded anim-shimmer" />
                    <div className="h-3 w-3/4 rounded anim-shimmer" />
                  </div>
                ) : (
                  <p className="text-sm text-[var(--t2)] leading-relaxed">
                    {coachAI.text ||
                      "Complete another session to get personalised feedback."}
                  </p>
                )}
              </div>
            </div>

            {/* actions */}
            <div className="grid grid-cols-3 gap-2.5">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  resetSession();
                }}
                className="py-3.5 rounded-2xl font-display font-bold text-sm flex flex-col items-center gap-1"
                style={{
                  background: "var(--s2)",
                  border: "1px solid var(--b1)",
                  color: "var(--t2)",
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Again
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  resetSession();
                  navigate("/arena");
                }}
                className="py-3.5 rounded-2xl font-display font-bold text-sm col-span-2"
                style={{
                  background: `linear-gradient(145deg,${accentColor},${accentColor}aa)`,
                  color: "#040610",
                }}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
