// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — PvE Battle  (Realistic AI engine + 60s countdown + XP awards)
// ═══════════════════════════════════════════════════════════════════════════════

import { CameraView } from "@features/arena/components/CameraView";
import { useCamera } from "@hooks/useCamera";
import { usePersonalization } from "@hooks/usePersonalization";
import { useVideoRecorder } from "@hooks/useVideoRecorder";
import { analytics } from "@lib/analytics";
import { saveBattle } from "@services/gameService";
import { useStore, useUser } from "@store";
import { PREMIUM_ASSETS, pickImage } from "@utils/assets";
import { AI_OPPONENTS } from "@utils/constants";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Download, Globe, Swords, Timer, Trophy, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ─── AI Score Engine ─────────────────────────────────────────────────────────
// Simulates a realistic AI athlete that trends toward targetScore with variance

function nextAIScore(current: number, target: number, diff: number): number {
  const variance = 14 - diff * 2; // diff 1 → ±12, diff 5 → ±4
  const pull = (target - current) * 0.12; // gravity toward target
  const noise = (Math.random() - 0.42) * variance; // slight positive bias
  const next = current + pull + noise;
  return Math.max(0, Math.min(99, Math.round(next)));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BATTLE_DURATION = 60; // seconds

// Animated score number using Framer Motion spring
function AnimatedScore({
  value,
  color = "white",
  size = "text-4xl",
}: {
  value: number;
  color?: string;
  size?: string;
}) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 80, damping: 18 });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const unsubscribe = spring.on("change", (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [spring]);

  useEffect(() => {
    animate(mv, value, { duration: 0.4 });
  }, [value, mv]);

  return (
    <span className={`${size} font-black tabular-nums`} style={{ color }}>
      {display}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PveBattlePage() {
  const navigate = useNavigate();
  const { opponentId } = useParams<{ opponentId?: string }>();
  const { discipline: disc, accentColor } = usePersonalization();
  const { addXP, addPoints, updateUser } = useStore();
  const user = useUser();

  const opp = AI_OPPONENTS.find((o) => o.id === opponentId) ?? AI_OPPONENTS[0];
  const firstName = (user?.arenaName || user?.displayName || "You").split(
    " ",
  )[0];

  // ── Hero Rotation Logic ──
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => i + 1), 8000);
    return () => clearInterval(t);
  }, []);
  const heroImg = pickImage(
    PREMIUM_ASSETS.ATMOSPHERE.HERO_ROTATION_BATTLE || [
      PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA,
    ],
    heroIdx,
  );

  // ── Battle State ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"pre" | "battle" | "result">("pre");
  const [playerScore, setPlayerScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION);
  const [result, setResult] = useState<{
    won: boolean;
    xpGained: number;
    pointsGained: number;
    aiFeedback: string | null;
  } | null>(null);
  const [oppCombo, setOppCombo] = useState(0);
  const [oppMomentum, setOppMomentum] = useState<
    "rising" | "falling" | "steady"
  >("steady");
  const [showComboFlash, setShowComboFlash] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevOppScore = useRef(0);

  const camera = useCamera({
    discipline: disc.id,
    onFrame: useCallback(
      (_res: any, s: any) => {
        if (phase === "battle") setPlayerScore(s.overall);
      },
      [phase],
    ),
  });

  // Setup video recorder
  const { startRecording, stopRecording } = useVideoRecorder(
    camera.videoRef,
    camera.canvasRef,
    firstName,
    accentColor,
  );

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiRef.current) clearInterval(aiRef.current);
  };

  // ── Start Battle ────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    analytics.pveBattleStarted(opp.id, opp.difficulty);
    setPhase("battle");
    setPlayerScore(0);
    setOppScore(0);
    setTimeLeft(BATTLE_DURATION);
    setResult(null);
    prevOppScore.current = 0;
    camera.requestCamera().then(() => {
      // Start recording only after camera begins streaming
      setTimeout(startRecording, 1000);
    });

    // 60-second countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimers();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // AI scoring every 600ms — feels smooth
    aiRef.current = setInterval(() => {
      setOppScore((current) => {
        const next = nextAIScore(current, opp.targetScore, opp.difficulty);
        // Detect momentum
        if (next > current + 2) {
          setOppMomentum("rising");
          setOppCombo((c) => c + 1);
        } else if (next < current - 2) {
          setOppMomentum("falling");
          setOppCombo(0);
        } else {
          setOppMomentum("steady");
        }
        prevOppScore.current = next;
        return next;
      });
    }, 600);
  }, [camera, opp.targetScore, opp.difficulty, opp.id]);

  // Combo flash effect
  useEffect(() => {
    if (oppCombo >= 3) {
      setShowComboFlash(true);
      const t = setTimeout(() => setShowComboFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [oppCombo]);

  // Auto-end when time runs out
  useEffect(() => {
    if (timeLeft === 0 && phase === "battle") {
      handleEnd();
    }
  }, [timeLeft, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── End Battle ──────────────────────────────────────────────────────────────
  const handleEnd = useCallback(async () => {
    clearTimers();
    let videoUrl = null;
    try {
      const rec = await stopRecording();
      videoUrl = rec.url;
      setRecordedVideoUrl(videoUrl);
    } catch {
      /* ignored, no recording active */
    }

    camera.stopCamera();

    setPlayerScore((ps) => {
      setOppScore((os) => {
        const won = ps >= os;
        const xpGained = won
          ? Math.round(100 + ps * 2 + opp.difficulty * 25)
          : Math.round(30 + ps);
        const pointsGained = xpGained * 2;
        addXP(xpGained);
        addPoints(pointsGained);
        if (won) {
          updateUser({
            pveWins: (user?.pveWins ?? 0) + 1,
            winStreak: (user?.winStreak ?? 0) + 1,
          });
        } else {
          updateUser({ winStreak: 0 });
        }
        // Persist to Supabase (fire-and-forget)
        if (user?.id) {
          saveBattle({
            userId: user.id,
            opponentId: null,
            opponentName: opp.name,
            discipline: disc.id,
            myScore: ps,
            oppScore: os,
            won,
            xpGained,
            isRealOpponent: false,
          });
        }
        analytics.pveBattleEnded(won, ps, xpGained);
        analytics.xpGained(xpGained, won ? "pve_win" : "pve_loss");
        setResult({ won, xpGained, pointsGained, aiFeedback: null });
        return os;
      });
      return ps;
    });
    setPhase("result");
  }, [
    camera,
    addXP,
    addPoints,
    updateUser,
    opp.difficulty,
    opp.name,
    user,
    disc.id,
    stopRecording,
  ]);

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const momentumColor =
    oppMomentum === "rising"
      ? "#f97316"
      : oppMomentum === "falling"
        ? "#22d3ee"
        : "rgba(255,255,255,0.4)";

  // ── Result Screen ────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const { won, xpGained, pointsGained } = result;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040914] overflow-hidden">
        {/* Background fx */}
        <img
          src={
            won
              ? PREMIUM_ASSETS.ATMOSPHERE.BATTLE_VICTORY
              : PREMIUM_ASSETS.ATMOSPHERE.TRAINING_HUB_HERO
          }
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${won ? accentColor : "#ef4444"}10 0%, transparent 70%)`,
          }}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          className="relative z-10 flex flex-col items-center px-6 w-full max-w-sm"
        >
          {/* Trophy / defeat icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 18,
              delay: 0.15,
            }}
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{
              background: `${won ? accentColor : "#ef4444"}12`,
              border: `2px solid ${won ? accentColor : "#ef4444"}35`,
              boxShadow: `0 0 60px ${won ? accentColor : "#ef4444"}25`,
            }}
          >
            {won ? (
              <Trophy className="w-12 h-12" style={{ color: accentColor }} />
            ) : (
              <Swords className="w-12 h-12 text-red-500/70" />
            )}
          </motion.div>

          {/* Result heading */}
          <h1
            className="text-6xl font-black tracking-tighter mb-1"
            style={{
              color: won ? accentColor : "#ef4444",
              textShadow: `0 0 40px ${won ? accentColor : "#ef4444"}60`,
            }}
          >
            {won ? "VICTORY" : "DEFEAT"}
          </h1>
          <p className="font-mono text-sm text-white/30 mb-8">
            {firstName}: {playerScore} &nbsp;·&nbsp; {opp.name}: {oppScore}
          </p>

          {/* XP/Points gained */}
          <div
            className="w-full rounded-[22px] p-5 mb-8 flex items-center gap-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex-1 text-center">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25 mb-1">
                XP Gained
              </p>
              <p className="text-2xl font-black" style={{ color: accentColor }}>
                +{xpGained}
              </p>
            </div>
            <div className="w-px h-8 bg-white/8" />
            <div className="flex-1 text-center">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25 mb-1">
                Aura Points
              </p>
              <p className="text-2xl font-black text-white">+{pointsGained}</p>
            </div>
            {won && (
              <>
                <div className="w-px h-8 bg-white/8" />
                <div className="flex-1 text-center">
                  <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25 mb-1">
                    PvE Win
                  </p>
                  <p className="text-2xl font-black text-[#22d3ee]">+1</p>
                </div>
              </>
            )}
          </div>

          {/* AI Feedback Box */}
          <div className="mt-4 w-full">
            <div className="w-full rounded-[18px] p-4 bg-white/5 border border-white/10 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ background: accentColor }}
              />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10">
                  <span
                    className="w-3 h-3 block bg-current rounded-full"
                    style={{ color: accentColor }}
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Gemini AI Coach
                </span>
              </div>
              {result.aiFeedback ? (
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  "{result.aiFeedback}"
                </p>
              ) : (
                <div className="flex items-center gap-2 mt-2 opacity-50">
                  <div className="w-4 h-4 rounded-full border-2 border-t-white animate-spin" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                    Analyzing Biometrics...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setPhase("pre");
                camera.resetScoring?.();
              }}
              className="flex-1 py-4 rounded-2xl font-bold text-sm"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
              }}
            >
              Rematch
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/arena")}
              className="flex-1 py-4 rounded-2xl font-black text-sm"
              style={{ background: accentColor, color: "#040914" }}
            >
              Continue
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── In-Battle Fullscreen ─────────────────────────────────────────────────────
  if (phase === "battle") {
    const timePercent = (timeLeft / BATTLE_DURATION) * 100;
    const timeColor =
      timeLeft <= 10 ? "#ef4444" : timeLeft <= 20 ? "#f97316" : accentColor;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {/* Score HUD — top */}
        <div className="flex-shrink-0 px-4 pt-safe pt-4 pb-3">
          {/* Timer bar */}
          <div className="h-1 rounded-full bg-white/8 mb-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: timeColor, width: `${timePercent}%` }}
              animate={{ width: `${timePercent}%` }}
              transition={{ duration: 0.9, ease: "linear" }}
            />
          </div>

          <div
            className="rounded-[18px] px-4 py-3 flex items-center justify-between"
            style={{
              background: "rgba(4,6,20,0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Player */}
            <div className="flex-1 text-center">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/30 mb-0.5">
                {firstName}
              </p>
              <AnimatedScore
                value={playerScore}
                color={accentColor}
                size="text-3xl"
              />
            </div>

            {/* Timer center */}
            <div className="flex flex-col items-center px-3">
              <div className="flex items-center gap-1 mb-0.5">
                <Timer className="w-3 h-3" style={{ color: timeColor }} />
                <span
                  className="font-mono font-bold text-base tabular-nums"
                  style={{ color: timeColor }}
                >
                  {fmtTime(timeLeft)}
                </span>
              </div>
              <span className="text-[8px] font-mono text-white/20 tracking-widest">
                LIVE MATCH
              </span>
            </div>

            {/* Opponent */}
            <div className="flex-1 text-center relative">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/30 mb-0.5">
                {opp.name.split(" ")[0]}
              </p>
              <AnimatedScore
                value={oppScore}
                color="rgba(255,255,255,0.6)"
                size="text-3xl"
              />
              {/* Momentum indicator */}
              <AnimatePresence>
                {oppCombo >= 3 && showComboFlash && (
                  <motion.span
                    initial={{ opacity: 0, y: -8, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    className="absolute -top-3 right-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-lg"
                    style={{
                      background: `${momentumColor}25`,
                      color: momentumColor,
                    }}
                  >
                    {oppCombo}x
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Camera fills remaining space */}
        <div className="flex-1 px-3 pb-2">
          <CameraView
            camera={camera}
            score={camera.currentScore}
            accentColor={accentColor}
            showScore
          />
        </div>

        {/* Video Download Action */}
        {recordedVideoUrl && (
          <div className="flex-shrink-0 px-4 pt-4 pb-2">
            <a
              href={recordedVideoUrl}
              download={`AuraArena_${disc.id}_Vs_${opp.name.replace(/\s+/g, "")}.webm`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[18px] border transition-colors hover:bg-white/5 active:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "white" }}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">
                Save Watermarked Video
              </span>
            </a>
          </div>
        )}

        {/* End button */}
        <div className="flex-shrink-0 px-4 pb-safe pb-5">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleEnd}
            className="w-full py-3.5 rounded-[18px] font-black text-sm uppercase tracking-widest"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
            }}
          >
            End Battle
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Pre-Battle VS Screen ─────────────────────────────────────────────────────
  const DIFF_LABELS = ["", "Beginner", "Easy", "Medium", "Hard", "Elite"];
  const DIFF_COLORS = [
    "",
    "#3b82f6",
    "#22d3ee",
    "#f97316",
    "#a855f7",
    "#ff00ff",
  ];

  return (
    <div
      className="page min-h-screen pb-safe pt-12 relative overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Arena bg */}
      <AnimatePresence mode="wait">
        <motion.img
          key={heroImg}
          src={heroImg}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-x-0 top-[40%] bottom-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#00f0ff 1px,transparent 1px),linear-gradient(90deg,#00f0ff 1px,transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Nav row */}
      <div className="px-5 mb-6 flex justify-between items-center relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <X className="w-4 h-4 text-white/50" />
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/5">
          <Globe className="w-3 h-3 text-[#00f0ff]" />
          <span className="text-[9px] font-mono tracking-[0.2em] text-[#00f0ff] uppercase">
            Global PvE
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Title */}
      <div className="text-center relative z-10 mb-8">
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/30 mb-1">
          Round 1
        </p>
        <h2
          className="text-3xl font-black uppercase tracking-[0.1em]"
          style={{ color: accentColor }}
        >
          PvE Battle
        </h2>
      </div>

      {/* VS cards */}
      <div className="relative z-10 flex justify-center items-center gap-5 px-4 h-[44vh] mb-8">
        {/* Hexagon VS badge */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] w-14 h-14 flex items-center justify-center z-30"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}88 100%)`,
            clipPath:
              "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            boxShadow: `0 0 30px ${accentColor}60`,
          }}
        >
          <div
            className="w-[52px] h-[52px] flex items-center justify-center bg-[#040914]"
            style={{
              clipPath:
                "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            }}
          >
            <span
              className="font-black italic text-lg"
              style={{ color: accentColor }}
            >
              VS
            </span>
          </div>
        </div>

        {/* Player card */}
        <div className="flex-1 max-w-[152px] h-full flex flex-col">
          <div
            className="flex-1 relative overflow-hidden flex items-center justify-center"
            style={{
              clipPath: "polygon(15% 0,100% 0,85% 100%,0 100%)",
              background: `linear-gradient(180deg,${accentColor}20 0%,rgba(0,0,0,0.85) 100%)`,
              border: `1px solid ${accentColor}35`,
            }}
          >
            <div className="absolute inset-0 backdrop-blur-sm z-0" />
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
              />
            ) : (
              <span
                className="text-6xl font-black z-10"
                style={{ color: `${accentColor}90` }}
              >
                {firstName[0]}
              </span>
            )}
            <div
              className="absolute top-0 inset-x-0 h-1 z-20"
              style={{
                background: accentColor,
                boxShadow: `0 4px 15px ${accentColor}`,
              }}
            />
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-base font-black text-white uppercase tracking-widest mb-3">
              {firstName}
            </h3>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="w-full py-3.5 rounded-[16px] font-black text-[11px] uppercase tracking-[0.2em] text-[#040914] flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(145deg,${accentColor},${accentColor}bb)`,
                boxShadow: `0 0 24px ${accentColor}50`,
              }}
            >
              <Zap className="w-4 h-4 fill-current" />
              Start Battle
            </motion.button>
          </div>
        </div>

        {/* Opponent card */}
        <div className="flex-1 max-w-[152px] h-full flex flex-col">
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              clipPath: "polygon(0 0,85% 0,100% 100%,15% 100%)",
              background:
                "linear-gradient(180deg,rgba(8,20,25,0.9) 0%,rgba(0,0,0,0.85) 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <img
              src={opp.avatar}
              alt={opp.name}
              className="w-full h-full object-cover opacity-75"
              style={{ clipPath: "polygon(0 0,85% 0,100% 100%,15% 100%)" }}
            />
            {/* Difficulty badge */}
            <div
              className="absolute top-2 right-4 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase z-10"
              style={{
                background: `${DIFF_COLORS[opp.difficulty]}20`,
                border: `1px solid ${DIFF_COLORS[opp.difficulty]}40`,
                color: DIFF_COLORS[opp.difficulty],
              }}
            >
              {DIFF_LABELS[opp.difficulty]}
            </div>
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-base font-black text-white/50 uppercase tracking-widest mb-1">
              {opp.name}
            </h3>
            <p className="text-[9px] font-mono text-white/25 mb-3">
              {opp.discipline} · Target {opp.targetScore}
            </p>
            <div
              className="w-full py-2 rounded-[12px] text-[10px] font-bold text-white/30 uppercase tracking-widest text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              AI Opponent
            </div>
          </div>
        </div>
      </div>

      {/* Match info strip */}
      <div
        className="relative z-10 mx-5 rounded-[18px] px-5 py-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex justify-around">
          {[
            { label: "Duration", value: `${BATTLE_DURATION}s` },
            { label: "Format", value: "1v1" },
            { label: "Discipline", value: disc.name },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/25 mb-0.5">
                {s.label}
              </p>
              <p className="text-xs font-bold text-white/70">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
