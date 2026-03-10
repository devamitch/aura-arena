// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Boxing Arena
// Full 3D action detection (X/Y/Z), adaptive cartoon AI, rounds, HP, frustration
// ═══════════════════════════════════════════════════════════════════════════════

import { CartoonFighter } from "@/components/boxing/CartoonFighter";
import { HitDetector, type PunchEvent } from "@/lib/boxing/hitDetector";
import { BoxingAI, type AIAnimState } from "@/lib/boxing/aiOpponent";
import { bus } from "@/lib/eventBus";
import { useCamera } from "@hooks/useCamera";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Shield, Swords, Trophy, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Round config ──────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 3;
const ROUND_DURATION = 90;   // seconds
const REST_DURATION = 8;     // seconds between rounds
const AI_SCALE = 150;
const AI_COLOR = "#3b82f6";
const AI_SHADOW = "#1d4ed8";

type Phase = "countdown" | "fight" | "rest" | "result";
type HitZone = "head" | "body" | "guard" | null;

interface FightResult {
  winner: "user" | "ai" | "draw";
  userScore: number;
  aiScore: number;
  totalPunches: number;
  accuracy: number;
  rounds: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BoxingArenaPage() {
  const navigate = useNavigate();

  // camera / pose
  const camera = useCamera({ discipline: "boxing", showSkeleton: true });

  // game state
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [round, setRound] = useState(1);
  const [roundTimer, setRoundTimer] = useState(ROUND_DURATION);
  const [restTimer, setRestTimer] = useState(REST_DURATION);

  // HP
  const [userHp, setUserHp] = useState(100);
  const [aiHp, setAiHp] = useState(100);

  // AI animation
  const [aiState, setAiState] = useState<AIAnimState>("idle");
  const [aiHitFlash, setAiHitFlash] = useState(false);
  const [userHitFlash, setUserHitFlash] = useState(false);

  // scoring
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [punchCount, setPunchCount] = useState(0);
  const [hitCount, setHitCount] = useState(0);

  // last punch flash
  const [lastPunchLabel, setLastPunchLabel] = useState<string | null>(null);
  const [hitZoneFlash, setHitZoneFlash] = useState<HitZone>(null);

  // result
  const [fightResult, setFightResult] = useState<FightResult | null>(null);

  // refs
  const hitDetector = useRef(new HitDetector());
  const aiOpponent = useRef(new BoxingAI());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundRef = useRef(1);
  const phaseRef = useRef<Phase>("countdown");
  const userHpRef = useRef(100);
  const aiHpRef = useRef(100);
  const punchCountRef = useRef(0);
  const hitCountRef = useRef(0);
  const userMoveLog = useRef<Record<string, number>>({});

  roundRef.current = round;
  phaseRef.current = phase;
  userHpRef.current = userHp;
  aiHpRef.current = aiHp;

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    camera.requestCamera();
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase("fight");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  // ── Round timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "fight") return;
    timerRef.current = setInterval(() => {
      setRoundTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          endRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]); // eslint-disable-line

  // ── AI action loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "fight") {
      if (aiLoopRef.current) clearInterval(aiLoopRef.current);
      return;
    }

    const runAI = () => {
      if (phaseRef.current !== "fight") return;
      const ai = aiOpponent.current;
      const action = ai.decide(false, undefined, Date.now());
      setAiState(action.state);

      // If AI attacks: deal damage to user after animation delay
      if (action.isAttack) {
        setTimeout(() => {
          if (phaseRef.current !== "fight") return;
          const dmg = action.damage;
          const newHp = Math.max(0, userHpRef.current - dmg);
          setUserHp(newHp);
          userHpRef.current = newHp;
          setUserHitFlash(true);
          setAiScore((s) => s + Math.round(dmg * 2));
          setTimeout(() => setUserHitFlash(false), 200);

          if (newHp <= 0) endFight();
        }, 320);
      }
    };

    runAI(); // immediate first call
    aiLoopRef.current = setInterval(runAI, 900 + Math.random() * 600);
    return () => { if (aiLoopRef.current) clearInterval(aiLoopRef.current); };
  }, [phase]); // eslint-disable-line

  // ── Punch detection via pose:result bus ───────────────────────────────────
  useEffect(() => {
    const unsub = bus.on("pose:result", ({ poseLandmarks, timestamp }) => {
      if (phaseRef.current !== "fight") return;

      const lms = (poseLandmarks as { x: number; y: number; z?: number; visibility?: number }[][])[0] ?? [];
      if (lms.length < 17) return;

      const lms3D = lms.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0, visibility: l.visibility }));
      const punches = hitDetector.current.detect(lms3D, (timestamp as number) ?? performance.now());

      for (const punch of punches) {
        punchCountRef.current++;
        setPunchCount(punchCountRef.current);

        // Track user move log for AI adaptation
        const moveKey = punch.type;
        userMoveLog.current[moveKey] = (userMoveLog.current[moveKey] ?? 0) + 1;

        // Check if punch hits AI hitboxes
        const hitboxes = aiOpponent.current.getHitboxes(0.12);
        const hit = hitDetector.current.checkHit(punch, hitboxes);

        const punchLabel = formatPunchName(punch);
        showPunchLabel(punchLabel);

        if (hit) {
          hitCountRef.current++;
          setHitCount(hitCountRef.current);

          // Notify AI (so it can react / learn)
          const aiAction = aiOpponent.current.decide(true, punch.type);
          setAiState(aiAction.state);

          const dmg = aiOpponent.current.takeDamage(punch.power, hit.zone);
          const newAiHp = aiOpponent.current.hp;
          setAiHp(newAiHp);
          aiHpRef.current = newAiHp;
          setAiHitFlash(true);
          setHitZoneFlash(hit.zone === "guard_l" || hit.zone === "guard_r" ? "guard" : hit.zone);
          setUserScore((s) => s + Math.round(dmg * 3 + punch.power * 0.5));

          setTimeout(() => { setAiHitFlash(false); setHitZoneFlash(null); }, 220);

          // KO check
          if (newAiHp <= 0) {
            setTimeout(endFight, 400);
          }
        }
      }
    });
    return unsub;
  }, []); // eslint-disable-line

  // ── Round end ─────────────────────────────────────────────────────────────
  const endRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) {
      endFight();
      return;
    }
    setPhase("rest");
    setAiState("idle");

    // AI learns from this round
    aiOpponent.current.learnFromRound(userMoveLog.current);
    userMoveLog.current = {};

    // Rest timer
    let t = REST_DURATION;
    setRestTimer(t);
    const id = setInterval(() => {
      t--;
      setRestTimer(t);
      if (t <= 0) {
        clearInterval(id);
        const nextRound = roundRef.current + 1;
        setRound(nextRound);
        setRoundTimer(ROUND_DURATION);
        // Partial HP restore
        setUserHp((h) => Math.min(100, h + 20));
        setPhase("fight");
      }
    }, 1000);
  }, []); // eslint-disable-line

  // ── Fight end ─────────────────────────────────────────────────────────────
  const endFight = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiLoopRef.current) clearInterval(aiLoopRef.current);

    const total = punchCountRef.current;
    const hits = hitCountRef.current;
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;

    const userFinal = userScore + Math.round(userHpRef.current * 1.5);
    const aiFinal = aiScore + Math.round(aiOpponent.current.hp * 1.5);

    const winner: FightResult["winner"] =
      userFinal > aiFinal ? "user"
      : aiFinal > userFinal ? "ai"
      : "draw";

    setAiState(aiOpponent.current.isKO() ? "ko" : "idle");
    setFightResult({
      winner,
      userScore: userFinal,
      aiScore: aiFinal,
      totalPunches: total,
      accuracy,
      rounds: roundRef.current,
    });
    setPhase("result");
  }, [userScore, aiScore]); // eslint-disable-line

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showPunchLabel = (label: string) => {
    setLastPunchLabel(label);
    if (labelTimerRef.current) clearTimeout(labelTimerRef.current);
    labelTimerRef.current = setTimeout(() => setLastPunchLabel(null), 1200);
  };

  const formatPunchName = (punch: PunchEvent): string => {
    const side = punch.hand === "left" ? "L" : "R";
    const typeMap: Record<PunchEvent["type"], string> = {
      jab: "JAB", cross: "CROSS", hook: "HOOK",
      uppercut: "UPPERCUT", body_shot: "BODY SHOT",
    };
    return `${side} ${typeMap[punch.type]}`;
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const aiPosition = aiOpponent.current.position;
  const frustration = aiOpponent.current.getFrustrationLevel();

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* Camera feed */}
      <video
        ref={camera.videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        autoPlay playsInline muted
      />
      <canvas
        ref={camera.canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "cover", zIndex: 5 }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)",
          zIndex: 6,
        }}
      />

      {/* 2D Cartoon AI Fighter */}
      <CartoonFighter
        animState={aiState}
        normX={aiPosition.x}
        normY={aiPosition.y}
        scale={AI_SCALE}
        color={AI_COLOR}
        shadowColor={AI_SHADOW}
        frustration={frustration}
        hitFlash={aiHitFlash}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10, width: "100%", height: "100%" }}
      />

      {/* Hit zone flash overlay */}
      <AnimatePresence>
        {hitZoneFlash && (
          <motion.div
            key={hitZoneFlash}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute pointer-events-none"
            style={{
              zIndex: 11,
              left: `${aiPosition.x * 100}%`,
              top: `${(aiPosition.y - (hitZoneFlash === "head" ? 0.12 : 0.05)) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: hitZoneFlash === "head" ? 60 : 90,
              height: hitZoneFlash === "head" ? 60 : 90,
              borderRadius: "50%",
              background: hitZoneFlash === "guard"
                ? "rgba(100,100,255,0.5)"
                : hitZoneFlash === "head"
                ? "rgba(255,50,50,0.7)"
                : "rgba(255,150,50,0.5)",
              boxShadow: "0 0 30px 10px rgba(255,200,0,0.4)",
            }}
          />
        )}
      </AnimatePresence>

      {/* User hit flash (screen edge red flash) */}
      <AnimatePresence>
        {userHitFlash && (
          <motion.div
            key="user-hit"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 8, background: "radial-gradient(ellipse at center, transparent 40%, rgba(220,30,30,0.55) 100%)" }}
          />
        )}
      </AnimatePresence>

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-col items-center pt-12 px-4 pointer-events-none">
        {/* Round + Timer */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] font-mono text-white/60 uppercase tracking-widest">
            RND {round}/{TOTAL_ROUNDS}
          </span>
          <div
            className="px-4 py-1.5 rounded-xl backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <span className="text-xl font-black text-white tabular-nums font-mono">
              {phase === "fight" ? formatTime(roundTimer) : phase === "rest" ? `REST ${restTimer}s` : "--:--"}
            </span>
          </div>
        </div>

        {/* HP Bars */}
        <div className="w-full max-w-sm flex items-center gap-3">
          {/* User HP */}
          <div className="flex-1 flex flex-col items-start gap-1">
            <span className="text-[9px] font-mono text-white/50 uppercase">YOU</span>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                animate={{ width: `${Math.max(0, userHp)}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="h-full rounded-full"
                style={{
                  background: userHp > 60
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : userHp > 30
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
                  boxShadow: "0 0 8px rgba(74,222,128,0.4)",
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-white/40">{Math.max(0, Math.round(userHp))} HP</span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <Swords className="w-4 h-4 text-yellow-400" />
          </div>

          {/* AI HP */}
          <div className="flex-1 flex flex-col items-end gap-1">
            <span className="text-[9px] font-mono text-white/50 uppercase">AI</span>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                animate={{ width: `${Math.max(0, aiHp)}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="h-full rounded-full ml-auto"
                style={{
                  background: aiHp > 60
                    ? "linear-gradient(90deg, #60a5fa, #3b82f6)"
                    : aiHp > 30
                    ? "linear-gradient(90deg, #fb923c, #f97316)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
                  boxShadow: "0 0 8px rgba(59,130,246,0.4)",
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-white/40">{Math.max(0, Math.round(aiHp))} HP</span>
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center gap-6 mt-2">
          <span className="font-black text-lg text-yellow-400 tabular-nums">{userScore}</span>
          <span className="text-[9px] text-white/30 font-mono">PTS</span>
          <span className="font-black text-lg text-blue-400 tabular-nums">{aiScore}</span>
        </div>
      </div>

      {/* ── Side stats ── */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-none">
        {[
          { icon: Zap, label: "Punches", val: punchCount },
          { icon: Shield, label: "Landed", val: hitCount },
        ].map((m, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.55)", borderLeft: "3px solid rgba(59,130,246,0.7)" }}
          >
            <m.icon className="w-3 h-3 text-blue-400" />
            <div>
              <p className="font-black text-sm text-white tabular-nums">{m.val}</p>
              <p className="text-[8px] font-mono text-white/40 uppercase">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-14 left-4 z-30 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <ArrowLeft className="w-4 h-4 text-white/70" />
      </button>

      {/* ── Punch label flash ── */}
      <AnimatePresence>
        {lastPunchLabel && (
          <motion.div
            key={lastPunchLabel + Date.now()}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -15 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute bottom-[20%] left-1/2 -translate-x-1/2 z-25 pointer-events-none"
          >
            <div
              className="px-5 py-2.5 rounded-2xl backdrop-blur-xl font-black text-xl text-white uppercase tracking-widest"
              style={{
                background: "rgba(239,68,68,0.2)",
                border: "2px solid rgba(239,68,68,0.6)",
                boxShadow: "0 0 30px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.05)",
                textShadow: "0 0 20px rgba(255,100,100,0.8)",
              }}
            >
              {lastPunchLabel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Countdown overlay ── */}
      <AnimatePresence>
        {phase === "countdown" && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <span
              className="font-black text-[120px] tabular-nums"
              style={{
                color: "var(--ac, #00f0ff)",
                textShadow: "0 0 60px rgba(0,240,255,0.8), 0 0 120px rgba(0,240,255,0.4)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {countdown}
            </span>
          </motion.div>
        )}
        {phase === "countdown" && countdown === 0 && (
          <motion.div
            key="fight"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1] }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <span
              className="font-black text-7xl uppercase"
              style={{
                color: "#ff4444",
                textShadow: "0 0 40px rgba(255,68,68,0.9)",
              }}
            >
              FIGHT!
            </span>
          </motion.div>
        )}
        {phase === "rest" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <span className="font-black text-4xl text-white mb-2">Round {round} Over</span>
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-widest mb-4">
              Next round in…
            </span>
            <span className="font-black text-7xl text-yellow-400 tabular-nums">{restTimer}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result overlay ── */}
      <AnimatePresence>
        {phase === "result" && fightResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-end backdrop-blur-xl"
            style={{ background: "rgba(4,9,20,0.92)" }}
          >
            <div className="w-full max-w-sm px-6 pb-16 flex flex-col items-center gap-4">
              {/* Winner announcement */}
              <div className="flex flex-col items-center mb-2">
                <Trophy
                  className="w-12 h-12 mb-3"
                  style={{ color: fightResult.winner === "user" ? "#facc15" : fightResult.winner === "draw" ? "#9ca3af" : "#ef4444" }}
                />
                <span
                  className="font-black text-4xl uppercase tracking-widest"
                  style={{
                    color: fightResult.winner === "user" ? "#facc15" : fightResult.winner === "draw" ? "#9ca3af" : "#ef4444",
                    textShadow: `0 0 30px ${fightResult.winner === "user" ? "rgba(250,204,21,0.6)" : "rgba(239,68,68,0.6)"}`,
                  }}
                >
                  {fightResult.winner === "user" ? "Victory!" : fightResult.winner === "draw" ? "Draw" : "Defeat"}
                </span>
                {fightResult.winner === "user" && (
                  <span className="text-white/50 text-xs font-mono mt-1">
                    KO! The AI is down!
                  </span>
                )}
              </div>

              {/* Score row */}
              <div
                className="w-full grid grid-cols-3 py-4 px-5 rounded-2xl gap-2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex flex-col items-center">
                  <span className="font-black text-xl text-white tabular-nums">{fightResult.userScore}</span>
                  <span className="text-[9px] font-mono text-white/40 mt-0.5">YOU</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-xl text-white/30">vs</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-xl text-blue-400 tabular-nums">{fightResult.aiScore}</span>
                  <span className="text-[9px] font-mono text-white/40 mt-0.5">AI</span>
                </div>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-3 gap-2">
                {([
                  ["Punches", fightResult.totalPunches],
                  ["Landed", hitCount],
                  ["Accuracy", `${fightResult.accuracy}%`],
                ] as const).map(([label, val]) => (
                  <div
                    key={label}
                    className="flex flex-col items-center py-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="font-black text-base text-white tabular-nums">{val}</span>
                    <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              {/* Continue */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(-1)}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest mt-2"
                style={{
                  background: "linear-gradient(135deg, var(--ac, #00f0ff) 0%, #0088cc 100%)",
                  color: "#040914",
                }}
              >
                Exit Arena
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
