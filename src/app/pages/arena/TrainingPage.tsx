// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Training Page (Full-Screen Camera HUD + Video Recording)
// ═══════════════════════════════════════════════════════════════════════════════

import { MetricsPanel } from "@features/arena/components/MetricsPanel";
import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { useVideoRecorder } from "@hooks/useVideoRecorder";
import { analytics } from "@lib/analytics";
import { getGeminiCoaching } from "@/lib/gemini/coaching";
import { saveSession } from "@services/gameService";
import { useStore, useUser } from "@store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Download,
  Shield,
  Sparkles,
  Square,
  Target,
  VideoOff,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function TrainingPage() {
  const navigate = useNavigate();
  const { drillId } = useParams<{ drillId?: string }>();
  const { discipline: disc } = usePersonalization();
  const { endSession, addXP } = useStore();
  const user = useUser();

  const [elapsed, setElapsed] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [ended, setEnded] = useState(false);
  type SessionResult = { finalScore: number; peakScore: number; avgScore: number; accuracy: number; timing: number; power: number; expressiveness: number; stability: number; balance: number; maxCombo: number; totalFrames: number; frameHistory: number[]; comboHistory: number[] };
  type GeminiCoaching = { summary: string; strengths: string[]; improvements: string[]; nextGoal: string; motivational: string };
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [geminiCoaching, setGeminiCoaching] = useState<GeminiCoaching | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const camera = useCamera({ discipline: disc.id });
  const recorder = useVideoRecorder();

  // ── Analytics: session started ─────────────────────────────────────────────
  useEffect(() => {
    analytics.sessionStarted(disc.id, drillId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-start camera on mount ─────────────────────────────────────────────
  useEffect(() => {
    camera.requestCamera();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      camera.stopCamera();
      recorder.stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle video recording ─────────────────────────────────────────────────
  const handleToggleRecording = useCallback(() => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }
    const videoEl = camera.videoRef?.current;
    if (!videoEl) return;
    recorder.startRecording(
      videoEl,
      camera.canvasRef?.current,
      "AURA ARENA",
    );
  }, [recorder, camera.videoRef, camera.canvasRef]);

  const getGrade = (s: number) => s >= 95 ? 'S' : s >= 85 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 40 ? 'D' : 'F';

  // ── End session ────────────────────────────────────────────────────────────
  const handleEndSession = useCallback(() => {
    if (ended) return;
    setEnded(true);

    if (timerRef.current) clearInterval(timerRef.current);
    if (recorder.isRecording) recorder.stopRecording();
    camera.stopCamera();

    const summary = camera.getSessionSummary();
    if (summary && elapsed > 5) {
      const xpGained = Math.round(summary.finalScore * 2);
      endSession(summary);
      addXP(xpGained);
      analytics.sessionEnded(summary.finalScore, elapsed, xpGained);
      analytics.xpGained(xpGained, "training");

      if (user?.id) {
        saveSession({
          userId: user.id,
          discipline: disc.id,
          difficulty: 3,
          score: summary.finalScore,
          accuracy: summary.accuracy ?? 0,
          combo: summary.maxCombo ?? 0,
          duration: elapsed,
          xpGained,
          drillName: drillId ?? undefined,
        });
      }

      setSessionResult(summary as Parameters<typeof setSessionResult>[0]);
      setGeminiLoading(true);
      getGeminiCoaching({
        discipline: disc.id,
        finalScore: summary.finalScore,
        accuracy:   summary.accuracy ?? 0,
        timing:     summary.timing   ?? 0,
        power:      summary.power    ?? 0,
        maxCombo:   summary.maxCombo ?? 0,
        grade:      getGrade(summary.finalScore),
        topFeedback: [],
        duration:   elapsed,
      }).then(coaching => {
        setGeminiLoading(false);
        if (coaching) setGeminiCoaching(coaching);
      }).catch(() => setGeminiLoading(false));
    } else {
      navigate(-1);
    }
  }, [camera, recorder, elapsed, endSession, addXP, navigate, ended, disc.id, user]);

  const handleBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorder.isRecording) recorder.stopRecording();
    camera.stopCamera();
    navigate(-1);
  }, [camera, recorder, navigate]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const score = camera.currentScore;
  const sideMetrics = [
    { icon: Activity, label: "Form", val: `${score.accuracy ?? 0}%` },
    { icon: Zap, label: "Speed", val: `${score.timing ?? 0}%` },
    { icon: Shield, label: "Power", val: `${score.power ?? 0}%` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden font-sans">
      {/* ── Camera + Overlay Layer ── */}
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle, transparent 40%, rgba(4,9,20,0.8) 100%)",
          }}
        />
      </div>

      {/* ── Top HUD ── */}
      <div className="relative z-10 p-5 flex items-start justify-between">
        <button
          onClick={handleBack}
          className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-xl transition-all active:scale-90"
          style={{
            background: "rgba(4,9,20,0.5)",
            border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.3)",
            boxShadow: "0 0 20px rgba(var(--ac-rgb, 0,240,255), 0.15)",
          }}
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ac)" }} strokeWidth={2.5} />
        </button>

        {/* Center: Drill title */}
        <div className="flex flex-col items-center">
          <div
            className="px-5 py-1.5 rounded-full backdrop-blur-md mb-2"
            style={{
              background: "rgba(var(--ac-rgb, 0,240,255), 0.1)",
              border: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.4)",
            }}
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold" style={{ color: "var(--ac)" }}>
              Live Telemetry
            </span>
          </div>
          <p className="text-white text-base font-black tracking-wide drop-shadow-md">
            {drillId ? `Drill: ${drillId.replace("-", " ")}` : "Free Training Mode"}
          </p>
        </div>

        {/* Timer Capsule */}
        <div
          className="px-4 py-2.5 rounded-[14px] flex items-center gap-2 backdrop-blur-xl"
          style={{ background: "rgba(4,9,20,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Clock className="w-4 h-4 text-white/50" />
          <span className="text-sm font-mono text-white font-bold tabular-nums tracking-widest">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>

      {/* ── Left: Side Metrics ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 pointer-events-none">
        {sideMetrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 + 0.5 }}
            className="flex items-center gap-3 backdrop-blur-md p-2 rounded-2xl"
            style={{ background: "rgba(0,0,0,0.4)", borderLeft: "3px solid var(--ac)" }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(var(--ac-rgb, 0,240,255), 0.2)" }}>
              <m.icon className="w-4 h-4" style={{ color: "var(--ac)" }} />
            </div>
            <div>
              <p className="font-black text-sm tabular-nums" style={{ color: "var(--ac)" }}>{m.val}</p>
              <p className="text-[8px] font-mono text-white/50 uppercase tracking-widest">{m.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Pose Correctness Panel (right side, below score ring) ── */}
      <AnimatePresence>
        {camera.engineReady && camera.poseCorrectness.exercise !== 'idle' && !camera.outOfFrame && (
          <motion.div
            key={camera.poseCorrectness.isCorrect ? 'ok' : 'fix'}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="absolute right-4 top-[58%] z-10 flex flex-col gap-1.5 pointer-events-none"
            style={{ maxWidth: 136 }}
          >
            {/* Form score badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-xl"
              style={{
                background: camera.poseCorrectness.isCorrect ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                border: `1px solid ${camera.poseCorrectness.isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
              }}
            >
              {camera.poseCorrectness.isCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-green-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
              )}
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: camera.poseCorrectness.isCorrect ? '#4ade80' : '#f87171' }}>
                  Form
                </p>
                <p className="font-black text-xs text-white leading-none">
                  {camera.poseCorrectness.score}
                  <span className="text-[9px] text-white/40 font-normal">/100</span>
                </p>
              </div>
            </div>

            {/* Feedback cues */}
            {!camera.poseCorrectness.isCorrect && camera.poseCorrectness.feedback.slice(0, 2).map((cue, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="px-2.5 py-1.5 rounded-xl backdrop-blur-xl"
                style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p className="text-[9px] text-red-300 leading-tight font-medium">{cue}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Coach message overlay ── */}
      <AnimatePresence>
        {camera.engineReady && camera.coachMessage && !camera.outOfFrame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-[22%] left-1/2 -translate-x-1/2 z-20"
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl border whitespace-nowrap"
              style={{ background: 'rgba(0,240,255,0.12)', borderColor: 'rgba(0,240,255,0.35)' }}
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ac)' }} />
              <span className="font-display font-bold text-sm" style={{ color: 'var(--ac)' }}>
                {camera.coachMessage}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right: Score Ring ── */}
      <div className="absolute right-6 top-1/3 z-10 pointer-events-none flex flex-col items-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-[120px] h-[120px] -ml-[10px] -mt-[10px] rounded-full border-t-2 border-r-2 border-[var(--ac)] opacity-40"
        />
        <div
          className="w-[100px] h-[100px] rounded-full backdrop-blur-md flex flex-col items-center justify-center relative"
          style={{
            background: "rgba(4,9,20,0.7)",
            border: "2px solid rgba(var(--ac-rgb, 0,240,255), 0.4)",
            boxShadow: "0 0 30px rgba(var(--ac-rgb, 0,240,255), 0.2)",
          }}
        >
          <span className="text-[10px] font-mono font-bold mb-[-4px]" style={{ color: "var(--ac)" }}>SCORE</span>
          <span className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">{score.overall}</span>
        </div>
      </div>

      {/* ── REC Button (top-right, below timer) ── */}
      <div className="absolute top-24 right-5 z-20 flex flex-col items-end gap-2">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleToggleRecording}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-xl"
          style={
            recorder.isRecording
              ? { background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.5)" }
              : { background: "rgba(4,9,20,0.55)", border: "1px solid rgba(255,255,255,0.12)" }
          }
        >
          <AnimatePresence mode="wait">
            {recorder.isRecording ? (
              <motion.span key="stop" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 rounded-full bg-red-500" />
                <Square className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-mono text-red-400 font-bold">STOP</span>
              </motion.span>
            ) : (
              <motion.span key="rec" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                <Circle className="w-3.5 h-3.5" style={{ color: "var(--ac)" }} />
                <span className="text-[10px] font-mono font-bold" style={{ color: "var(--ac)" }}>REC</span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Download button after recording stops */}
        <AnimatePresence>
          {recorder.recordingUrl && !recorder.isRecording && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => recorder.downloadRecording()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-xl"
              style={{
                background: "rgba(34,197,94,0.18)",
                border: "1px solid rgba(34,197,94,0.4)",
              }}
            >
              <Download className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] font-mono text-green-400 font-bold">SAVE</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Post-Session Results Overlay ── */}
      <AnimatePresence>
        {sessionResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-end backdrop-blur-xl"
            style={{ background: 'rgba(4,9,20,0.92)' }}
          >
            <div className="w-full max-w-sm px-6 pb-safe-bottom pb-8 flex flex-col gap-4">
              {/* Grade badge */}
              <div className="flex flex-col items-center gap-1 mb-2">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-2"
                  style={{ background: 'rgba(var(--ac-rgb,0,240,255),0.12)', border: '2px solid rgba(var(--ac-rgb,0,240,255),0.5)', boxShadow: '0 0 40px rgba(var(--ac-rgb,0,240,255),0.2)' }}
                >
                  <span className="text-5xl font-black" style={{ color: 'var(--ac)' }}>{getGrade(sessionResult.finalScore)}</span>
                </div>
                <p className="text-white font-black text-2xl tabular-nums">{sessionResult.finalScore}<span className="text-white/40 text-sm font-normal">/100</span></p>
                <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Session Complete</p>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2">
                {([['Accuracy', sessionResult.accuracy], ['Timing', sessionResult.timing], ['Power', sessionResult.power]] as const).map(([label, val]) => (
                  <div key={label} className="flex flex-col items-center py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-xl font-black text-white tabular-nums">{val}</span>
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              {/* Gemini coaching */}
              <div className="rounded-2xl p-4 min-h-[80px]" style={{ background: 'rgba(var(--ac-rgb,0,240,255),0.06)', border: '1px solid rgba(var(--ac-rgb,0,240,255),0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--ac)' }} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'var(--ac)' }}>AI Coach Aria</span>
                </div>
                {geminiLoading && (
                  <div className="flex gap-1 mt-2">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ac)' }}
                        animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                )}
                {geminiCoaching ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-white/80 text-xs leading-relaxed">{geminiCoaching.summary}</p>
                    {geminiCoaching.nextGoal && (
                      <p className="text-xs font-semibold" style={{ color: 'var(--ac)' }}>→ {geminiCoaching.nextGoal}</p>
                    )}
                    {geminiCoaching.motivational && (
                      <p className="text-white/50 text-[10px] italic">{geminiCoaching.motivational}</p>
                    )}
                  </div>
                ) : !geminiLoading && (
                  <p className="text-white/40 text-xs">Add VITE_GEMINI_API_KEY for AI coaching</p>
                )}
              </div>

              {/* Continue button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(-1)}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, var(--ac) 0%, #0088cc 100%)', color: '#040914' }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Camera permission denied overlay ── */}
      <AnimatePresence>
        {camera.errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <VideoOff className="w-14 h-14 text-white/20 mb-4" />
            <p className="text-white/60 text-sm font-bold mb-2">Camera Access Required</p>
            <p className="text-white/30 text-xs text-center px-10 mb-6">{camera.errorMessage}</p>
            <button
              onClick={() => camera.requestCamera()}
              className="px-6 py-3 rounded-2xl font-bold text-sm"
              style={{ background: "var(--ac)", color: "#040914" }}
            >
              Grant Access
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom AI Analysis Panel ── */}
      <motion.div
        className="absolute bottom-0 inset-x-0 z-20 flex flex-col rounded-t-[32px] overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: showAnalysis ? 0 : "75%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div
          className="absolute inset-0 backdrop-blur-[40px]"
          style={{
            background: "rgba(0,0,0,0.6)",
            borderTop: "1px solid rgba(var(--ac-rgb, 0,240,255), 0.3)",
          }}
        />

        <div className="relative z-10 flex flex-col w-full h-full">
          {/* Handle & Toggle */}
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full h-16 flex items-center justify-center relative cursor-ns-resize"
          >
            <div className="absolute top-3 w-12 h-1.5 bg-white/20 rounded-full" />
            <div className="flex items-center gap-2 mt-4">
              <Target className="w-4 h-4" style={{ color: "var(--ac)" }} />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-[0.2em]">
                AI Engine Analysis
              </span>
              {showAnalysis ? (
                <ChevronDown className="w-4 h-4 text-white/50" />
              ) : (
                <ChevronUp className="w-4 h-4" style={{ color: "var(--ac)" }} />
              )}
            </div>
          </button>

          {/* Expanded Content */}
          <div className="px-6 pb-8 pt-2">
            <div
              className="h-48 w-full rounded-2xl border border-white/10 mb-6 flex items-center justify-center relative overflow-hidden"
              style={{ background: "rgba(var(--ac-rgb, 0,240,255), 0.02)" }}
            >
              <MetricsPanel score={camera.currentScore} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowAnalysis(false)}
                className="py-4 rounded-[20px] font-bold text-sm text-white/70"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Hide Panel
              </button>
              <button
                onClick={handleEndSession}
                className="py-4 rounded-[20px] font-black text-sm uppercase tracking-wider"
                style={{
                  background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
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
