// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Live Battle (Supabase Realtime matchmaking → Battle → Result)
// ═══════════════════════════════════════════════════════════════════════════════

import { CameraView } from "@features/arena/components/CameraView";
import { useCamera } from "@hooks/useCamera";
import { useLiveBattle } from "@hooks/useLiveBattle";
import { usePersonalization } from "@hooks/usePersonalization";
import { analytics } from "@lib/analytics";
import { saveBattle } from "@services/gameService";
import { useStore, useUser } from "@store";
import { AnimatePresence, animate, motion, useMotionValue, useSpring } from "framer-motion";
import { Globe, Radio, Trophy, Users, Wifi, WifiOff, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type UIPhase = "matchmaking" | "battle" | "result";

const BATTLE_DURATION = 60;

function AnimatedScore({ value, color = "white", size = "text-3xl" }: {
  value: number; color?: string; size?: string;
}) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 80, damping: 18 });
  const [display, setDisplay] = useState(value);

  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);
  useEffect(() => { animate(mv, value, { duration: 0.4 }); }, [value, mv]);

  return <span className={`${size} font-black tabular-nums`} style={{ color }}>{display}</span>;
}

export default function LiveBattlePage() {
  const navigate = useNavigate();
  const user = useUser();
  const { addXP, addPoints } = useStore();

  const [uiPhase, setUiPhase] = useState<UIPhase>("matchmaking");
  const [dots, setDots] = useState("");
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [result, setResult] = useState<{ won: boolean; xpGained: number } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const broadcastTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerScoreRef = useRef(0);
  const oppScoreRef = useRef(50);

  const firstName = (user?.arenaName || user?.displayName || "You").split(" ")[0];
  const { discipline: disc, accentColor } = usePersonalization();
  const camera = useCamera({ discipline: disc.id, autoStart: false });

  // Track matchmaking start once
  useEffect(() => {
    analytics.liveMatchmakingStarted(disc.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const liveBattle = useLiveBattle(
    user?.id,
    user?.arenaName || user?.displayName || "Fighter",
    disc.id,
  );

  // Keep refs fresh
  useEffect(() => {
    playerScoreRef.current = camera.currentScore.overall;
  }, [camera.currentScore.overall]);

  useEffect(() => {
    oppScoreRef.current = liveBattle.oppScore;
  }, [liveBattle.oppScore]);

  // Dot animation during search
  useEffect(() => {
    if (uiPhase !== "matchmaking") return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, [uiPhase]);

  // Transition from matchmaking → battle when Supabase finds opponent (or AI fallback)
  useEffect(() => {
    if (uiPhase !== "matchmaking") return;
    if (liveBattle.phase === "battling" || liveBattle.phase === "ai_fallback") {
      analytics.liveMatchFound(liveBattle.isRealOpponent);
      camera.requestCamera();
      setUiPhase("battle");
    }
  }, [liveBattle.phase, uiPhase, camera]); // eslint-disable-line react-hooks/exhaustive-deps

  // Battle countdown + score broadcast
  useEffect(() => {
    if (uiPhase !== "battle") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Broadcast score every 500ms to real opponent
    if (liveBattle.isRealOpponent) {
      broadcastTimerRef.current = setInterval(() => {
        liveBattle.broadcastScore(playerScoreRef.current);
      }, 500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    };
  }, [uiPhase, liveBattle.isRealOpponent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-end when time hits 0
  useEffect(() => {
    if (timeLeft === 0 && uiPhase === "battle") handleEnd();
  }, [timeLeft, uiPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
  };

  const handleEnd = useCallback(() => {
    clearTimers();
    camera.stopCamera();
    liveBattle.cleanup();
    const ps = playerScoreRef.current;
    const os = oppScoreRef.current;
    const won = ps >= os;
    const xpGained = won ? Math.round(120 + ps * 1.5) : Math.round(30 + ps);
    addXP(xpGained);
    addPoints(xpGained * 2);
    // Persist to Supabase (fire-and-forget)
    if (user?.id) {
      saveBattle({
        userId: user.id,
        opponentId: null,
        opponentName: liveBattle.oppName,
        discipline: disc.id,
        myScore: ps,
        oppScore: os,
        won,
        xpGained,
        isRealOpponent: liveBattle.isRealOpponent,
      });
    }
    analytics.liveBattleEnded(won, ps);
    analytics.xpGained(xpGained, won ? "live_win" : "live_loss");
    setResult({ won, xpGained });
    setUiPhase("result");
  }, [camera, liveBattle, addXP, addPoints]);

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const timePercent = (timeLeft / BATTLE_DURATION) * 100;
  const timeColor = timeLeft <= 10 ? "#ef4444" : timeLeft <= 20 ? "#f97316" : accentColor;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-safe pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          onClick={() => { camera.stopCamera(); clearTimers(); liveBattle.cleanup(); navigate(-1); }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: accentColor }}>
            Live Battle
          </p>
        </div>
        {liveBattle.isRealOpponent ? (
          <Wifi className="w-4 h-4" style={{ color: accentColor }} />
        ) : (
          <Globe className="w-4 h-4 text-white/20" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Matchmaking ── */}
        {uiPhase === "matchmaking" && (
          <motion.div
            key="mm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 px-8"
          >
            <div className="relative w-28 h-28">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full"
                style={{ border: "3px solid transparent", borderTopColor: accentColor, borderRightColor: `${accentColor}40` }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-3 rounded-full"
                style={{ border: "2px solid transparent", borderTopColor: `${accentColor}60`, borderLeftColor: `${accentColor}25` }}
              />
              <div
                className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}30` }}
              >
                <Radio className="w-5 h-5" style={{ color: accentColor }} />
              </div>
            </div>

            <div className="text-center">
              {liveBattle.phase === "found" ? (
                <>
                  <h2 className="font-black text-white text-2xl tracking-tight mb-2">
                    Opponent Found!
                  </h2>
                  <p className="text-sm font-bold mb-1" style={{ color: accentColor }}>
                    {liveBattle.oppName}
                  </p>
                  <p className="text-xs text-white/30">Get ready to battle…</p>
                </>
              ) : (
                <>
                  <h2 className="font-black text-white text-2xl tracking-tight mb-2">
                    Finding Opponent{dots}
                  </h2>
                  <p className="text-sm text-white/30 mb-4">Searching global {disc.name} players</p>
                  <div className="flex items-center justify-center gap-2">
                    {["Global", "1v1", "Ranked"].map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: accentColor,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => { liveBattle.cleanup(); navigate(-1); }}
              className="text-xs text-white/20 underline underline-offset-4"
            >
              Cancel Search
            </button>
          </motion.div>
        )}

        {/* ── Battle ── */}
        {uiPhase === "battle" && (
          <motion.div
            key="battle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col gap-3 px-4 pt-2 pb-3 overflow-hidden"
          >
            {/* Timer bar */}
            <div className="h-0.5 rounded-full bg-white/8 flex-shrink-0 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: timeColor }}
                animate={{ width: `${timePercent}%` }}
                transition={{ duration: 0.9, ease: "linear" }}
              />
            </div>

            {/* Score strip */}
            <div
              className="rounded-[18px] px-5 py-3 flex items-center justify-between flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-center flex-1">
                <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/30 mb-0.5">{firstName}</p>
                <AnimatedScore value={camera.currentScore.overall} color={accentColor} />
              </div>
              <div className="flex flex-col items-center px-4">
                <Zap className="w-3 h-3 mb-0.5" style={{ color: timeColor }} />
                <span className="font-mono text-sm font-bold tabular-nums" style={{ color: timeColor }}>
                  {fmtTime(timeLeft)}
                </span>
              </div>
              <div className="text-center flex-1">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {liveBattle.isRealOpponent ? (
                    <Wifi className="w-2.5 h-2.5" style={{ color: accentColor }} />
                  ) : (
                    <WifiOff className="w-2.5 h-2.5 text-white/20" />
                  )}
                  <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/30">
                    {liveBattle.oppName}
                  </p>
                </div>
                <AnimatedScore value={liveBattle.oppScore} color="rgba(255,255,255,0.5)" />
              </div>
            </div>

            {/* Camera */}
            <div className="flex-1 min-h-0">
              <CameraView
                camera={camera}
                score={camera.currentScore}
                accentColor={accentColor}
                showScore
              />
            </div>

            {/* End button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEnd}
              className="py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex-shrink-0"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
              }}
            >
              End Battle
            </motion.button>
          </motion.div>
        )}

        {/* ── Result ── */}
        {uiPhase === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: result.won ? `${accentColor}10` : "rgba(239,68,68,0.08)",
                border: `2px solid ${result.won ? accentColor : "#ef4444"}30`,
                boxShadow: `0 0 40px ${result.won ? accentColor : "#ef4444"}20`,
              }}
            >
              {result.won ? (
                <Trophy className="w-12 h-12" style={{ color: accentColor }} />
              ) : (
                <Users className="w-12 h-12 text-red-500/60" />
              )}
            </motion.div>

            <div className="text-center">
              <h1
                className="text-5xl font-black tracking-tighter mb-2"
                style={{ color: result.won ? accentColor : "#ef4444" }}
              >
                {result.won ? "VICTORY" : "DEFEAT"}
              </h1>
              <div className="flex items-center justify-center gap-1 mb-1">
                {liveBattle.isRealOpponent ? (
                  <Wifi className="w-3 h-3" style={{ color: accentColor }} />
                ) : (
                  <WifiOff className="w-3 h-3 text-white/30" />
                )}
                <p className="text-white/30 font-mono text-xs">
                  {liveBattle.isRealOpponent ? "Real match" : "vs AI"}
                </p>
              </div>
              <p className="text-white/30 font-mono text-sm">
                You: {camera.currentScore.overall} · {liveBattle.oppName}: {oppScoreRef.current}
              </p>
            </div>

            {/* XP reward */}
            <div
              className="rounded-[18px] px-6 py-4 flex items-center justify-center gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Zap className="w-5 h-5" style={{ color: accentColor }} />
              <div className="text-center">
                <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25">XP Gained</p>
                <p className="text-2xl font-black" style={{ color: accentColor }}>+{result.xpGained}</p>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setUiPhase("matchmaking");
                  setTimeLeft(BATTLE_DURATION);
                  setResult(null);
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-sm"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white" }}
              >
                Rematch
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/home")}
                className="flex-1 py-4 rounded-2xl font-black text-sm"
                style={{ background: accentColor, color: "#040914" }}
              >
                Home
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
