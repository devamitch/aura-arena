// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Unified Combat Arena (ALL disciplines)
// Full 3D opponent (XYZ movement + self-defence + damage marks + lifelines)
// Works for: boxing, MMA, karate, muay thai, martial arts, kickboxing, etc.
// ═══════════════════════════════════════════════════════════════════════════════

import { Fighter3D } from "@/components/combat/Fighter3D";
import {
  CombatOpponent,
  StrikeDetector,
  type DamageMap,
  type DamageZone,
  type OpponentState,
  type StrikeEvent,
  makeDamageMap,
} from "@/lib/combat/combatEngine";
import { bus } from "@/lib/eventBus";
import { useCamera } from "@hooks/useCamera";
import type { DisciplineId } from "@types";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Shield, Swords, Trophy, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── Round config ──────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 3;
const ROUND_DURATION = 90;
const REST_DURATION = 8;

type Phase = "countdown" | "fight" | "rest" | "result";

interface HitFeedback {
  label: string;
  zone: DamageZone;
  isLethal: boolean;
  isCritical: boolean;
  id: number;
}

interface FightResult {
  winner: "user" | "ai" | "draw";
  userScore: number;
  aiScore: number;
  totalStrikes: number;
  landed: number;
  accuracy: number;
  rounds: number;
}

// ── Lifeline hearts display ────────────────────────────────────────────────────
function Lifelines({ total, remaining }: { total: number; remaining: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <Heart
          key={i}
          className={`w-4 h-4 transition-all duration-500 ${i < remaining ? "fill-current text-red-500" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

// ── Damage zone label positions (CSS %) relative to fighter div ──────────────
const ZONE_LABELS: Record<DamageZone, { top: string; left: string }> = {
  head:         { top: "8%",  left: "50%" },
  chin:         { top: "16%", left: "50%" },
  left_face:    { top: "10%", left: "35%" },
  right_face:   { top: "10%", left: "65%" },
  solar_plexus: { top: "35%", left: "50%" },
  body_left:    { top: "38%", left: "33%" },
  body_right:   { top: "38%", left: "67%" },
  left_arm:     { top: "28%", left: "22%" },
  right_arm:    { top: "28%", left: "78%" },
  left_leg:     { top: "65%", left: "38%" },
  right_leg:    { top: "65%", left: "62%" },
};

const ZONE_NAME: Record<DamageZone, string> = {
  head: "HEAD", chin: "CHIN", left_face: "L FACE", right_face: "R FACE",
  solar_plexus: "BODY", body_left: "L BODY", body_right: "R BODY",
  left_arm: "L ARM", right_arm: "R ARM", left_leg: "L LEG", right_leg: "R LEG",
};

const MOVE_LABEL: Record<string, string> = {
  jab: "JAB", cross: "CROSS", hook_l: "L HOOK", hook_r: "R HOOK",
  uppercut: "UPPERCUT", body_shot: "BODY SHOT",
  front_kick: "KICK", side_kick: "SIDE KICK", roundhouse: "ROUNDHOUSE",
  back_kick: "BACK KICK", knee_strike: "KNEE", elbow_strike: "ELBOW",
  chop: "CHOP", palm_strike: "PALM", sweep: "SWEEP", takedown: "TAKEDOWN",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CombatArenaPage() {
  const navigate = useNavigate();
  const { discipline: paramDisc } = useParams<{ discipline?: string }>();
  const discipline = paramDisc ?? "boxing";
  const disciplineLabel = discipline.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // camera
  const camera = useCamera({ discipline: discipline as DisciplineId, showSkeleton: true });

  // game state
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [round, setRound] = useState(1);
  const [roundTimer, setRoundTimer] = useState(ROUND_DURATION);
  const [restTimer, setRestTimer] = useState(REST_DURATION);

  // HP / lifelines
  const [userHp, setUserHp] = useState(100);
  const [aiHp, setAiHp] = useState(100);
  const [userLifelines, setUserLifelines] = useState(3);
  const [aiLifelines, setAiLifelines] = useState(3);

  // Fighter 3D state
  const [aiState, setAiState] = useState<OpponentState>("idle");
  const [aiPos, setAiPos] = useState({ x: 0, y: 0, z: 1.2 });
  const [damageMap, setDamageMap] = useState<DamageMap>(makeDamageMap());
  const [hitFlash, setHitFlash] = useState(false);
  const [userHitFlash, setUserHitFlash] = useState(false);
  const [frustration, setFrustration] = useState<0|1|2|3>(0);

  // Scoring
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore]   = useState(0);
  const [strikeCount, setStrikeCount] = useState(0);
  const [landedCount, setLandedCount] = useState(0);
  const [hitFeedback, setHitFeedback] = useState<HitFeedback | null>(null);
  const [fightResult, setFightResult] = useState<FightResult | null>(null);

  // Refs
  const aiRef = useRef(new CombatOpponent(discipline));
  const detectorRef = useRef(new StrikeDetector());
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackIdRef = useRef(0);

  const phaseRef    = useRef<Phase>("countdown");
  const userHpRef   = useRef(100);
  const userLlRef   = useRef(3);
  const roundRef    = useRef(1);
  const strikeRef   = useRef(0);
  const landedRef   = useRef(0);
  const userScoreRef = useRef(0);
  const aiScoreRef   = useRef(0);
  const userMoveLog  = useRef<Record<string, number>>({});

  phaseRef.current = phase;
  userHpRef.current = userHp;
  userLlRef.current = userLifelines;
  roundRef.current = round;

  // ── Countdown → fight ─────────────────────────────────────────────────────
  useEffect(() => {
    camera.requestCamera();
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(id); setPhase("fight"); return 0; }
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
        if (t <= 1) { clearInterval(timerRef.current!); endRound(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]); // eslint-disable-line

  // ── AI action loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "fight") { if (aiLoopRef.current) clearInterval(aiLoopRef.current); return; }

    const tick = () => {
      if (phaseRef.current !== "fight") return;
      const ai = aiRef.current;
      const action = ai.decide(false, undefined, performance.now());

      setAiState(action.state);
      setAiPos({ ...action.targetPos });
      setFrustration(ai.frustration());

      if (action.isAttack) {
        setTimeout(() => {
          if (phaseRef.current !== "fight") return;
          const newHp = Math.max(0, userHpRef.current - action.damage);
          setUserHp(newHp);
          userHpRef.current = newHp;
          setUserHitFlash(true);
          aiScoreRef.current += Math.round(action.damage * 2.5);
          setAiScore(aiScoreRef.current);
          setTimeout(() => setUserHitFlash(false), 250);

          if (newHp <= 0) {
            if (userLlRef.current > 0) {
              setUserLifelines((l) => { userLlRef.current = l - 1; return l - 1; });
              setUserHp(60); userHpRef.current = 60;
            } else {
              endFight();
            }
          }
        }, 350);
      }
    };

    tick();
    aiLoopRef.current = setInterval(tick, 850 + Math.random() * 600);
    return () => { if (aiLoopRef.current) clearInterval(aiLoopRef.current); };
  }, [phase]); // eslint-disable-line

  // ── Pose detection → strike detection ─────────────────────────────────────
  useEffect(() => {
    const unsub = bus.on("pose:result", ({ poseLandmarks, timestamp }) => {
      if (phaseRef.current !== "fight") return;
      const lms = (poseLandmarks as { x: number; y: number; z?: number; visibility?: number }[][])[0] ?? [];
      if (lms.length < 17) return;

      const lms3D = lms.map((l) => ({ x: l.x, y: l.y, z: l.z ?? 0, visibility: l.visibility }));
      const strikes = detectorRef.current.detect(lms3D, (timestamp as number) ?? performance.now(), discipline);

      for (const strike of strikes) {
        strikeRef.current++;
        setStrikeCount(strikeRef.current);
        userMoveLog.current[strike.moveType] = (userMoveLog.current[strike.moveType] ?? 0) + 1;

        // Check if it hits
        const zone = aiRef.current.checkHit(strike);
        if (zone) {
          processHit(strike, zone);
        }

        // Even if miss, react to the strike
        const aiAction = aiRef.current.decide(true, strike.moveType);
        setAiState(aiAction.state);
        setAiPos({ ...aiAction.targetPos });
      }
    });
    return unsub;
  }, [discipline]); // eslint-disable-line

  const processHit = useCallback((strike: StrikeEvent, zone: DamageZone) => {
    landedRef.current++;
    setLandedCount(landedRef.current);

    const result = aiRef.current.takeDamage(strike);
    setDamageMap({ ...aiRef.current.damageMap });
    setAiHp(aiRef.current.hp);
    setAiLifelines(aiRef.current.lifelines);
    setFrustration(aiRef.current.frustration());

    // Hit flash
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 180);

    // Score
    const pts = Math.round(result.damage * 3 + strike.power * 0.5);
    userScoreRef.current += pts;
    setUserScore(userScoreRef.current);

    // Feedback
    const label = `${MOVE_LABEL[strike.moveType] ?? strike.moveType} → ${ZONE_NAME[zone]}`;
    feedbackIdRef.current++;
    setHitFeedback({
      label,
      zone,
      isLethal: strike.isLethal,
      isCritical: strike.isCritical,
      id: feedbackIdRef.current,
    });
    if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
    fbTimerRef.current = setTimeout(() => setHitFeedback(null), strike.isLethal ? 1800 : 1200);

    // AI lifeline if KO'd
    if (aiRef.current.hp <= 0) {
      if (aiRef.current.lifelines > 0) {
        aiRef.current.useLifeline();
        setAiHp(aiRef.current.hp);
        setAiLifelines(aiRef.current.lifelines);
        setAiState("hurt");
        setTimeout(() => setAiState("idle"), 1200);
      } else {
        setTimeout(() => endFight(), 500);
      }
    } else {
      // Hurt reaction
      if (result.damage > 8) {
        setAiState(result.damage > 14 ? "stagger" : "hurt");
        setTimeout(() => {
          if (phaseRef.current === "fight") setAiState("idle");
        }, result.damage > 14 ? 1000 : 500);
      }
    }
  }, []); // eslint-disable-line

  // ── Round end ─────────────────────────────────────────────────────────────
  const endRound = useCallback(() => {
    if (roundRef.current >= TOTAL_ROUNDS) { endFight(); return; }
    setPhase("rest");
    setAiState("idle");
    aiRef.current.learnFromRound(userMoveLog.current);
    userMoveLog.current = {};

    let t = REST_DURATION;
    setRestTimer(t);
    const id = setInterval(() => {
      t--;
      setRestTimer(t);
      if (t <= 0) {
        clearInterval(id);
        setRound((r) => r + 1);
        setRoundTimer(ROUND_DURATION);
        setUserHp((h) => Math.min(100, h + 25));
        setPhase("fight");
      }
    }, 1000);
  }, []); // eslint-disable-line

  // ── Fight end ─────────────────────────────────────────────────────────────
  const endFight = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiLoopRef.current) clearInterval(aiLoopRef.current);

    const total = strikeRef.current;
    const hits  = landedRef.current;
    const acc   = total > 0 ? Math.round((hits / total) * 100) : 0;
    const userFinal = userScoreRef.current + Math.round(userHpRef.current * 1.5);
    const aiFinal   = aiScoreRef.current  + Math.round(aiRef.current.hp * 1.5);

    const winner: FightResult["winner"] = userFinal > aiFinal ? "user" : aiFinal > userFinal ? "ai" : "draw";
    setAiState(aiRef.current.isKO() ? "ko" : "idle");
    setFightResult({ winner, userScore: userFinal, aiScore: aiFinal, totalStrikes: total, landed: hits, accuracy: acc, rounds: roundRef.current });
    setPhase("result");
  }, []); // eslint-disable-line

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden select-none">
      {/* ── Camera feed ── */}
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

      {/* ── Cinematic gradient ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 85% 65% at 50% 50%, transparent 25%, rgba(0,0,0,0.65) 100%)",
        zIndex: 6,
      }} />

      {/* ── 3D Fighter Canvas (transparent, overlaid) ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 12 }}>
        <Canvas
          camera={{ position: [0, 0.8, 3.5], fov: 55 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent", width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 4, 3]} intensity={1.4} castShadow />
          <directionalLight position={[-2, 1, -1]} intensity={0.4} color="#8888ff" />
          {/* Rim light for drama */}
          <pointLight position={[0, 3, -1]} intensity={0.8} color="#ff4444" />

          <Fighter3D
            state={aiState}
            position={aiPos}
            damageMap={damageMap}
            hitFlash={hitFlash}
            frustration={frustration}
          />
        </Canvas>
      </div>

      {/* ── Damage zone labels (positioned relative to fighter) ── */}
      <AnimatePresence>
        {hitFeedback && (
          <motion.div
            key={hitFeedback.id}
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute pointer-events-none"
            style={{
              zIndex: 20,
              top: ZONE_LABELS[hitFeedback.zone]?.top ?? "40%",
              left: ZONE_LABELS[hitFeedback.zone]?.left ?? "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="px-3 py-1.5 rounded-xl backdrop-blur-sm font-black text-xs uppercase tracking-wider text-white whitespace-nowrap"
              style={{
                background: hitFeedback.isLethal
                  ? "rgba(220,30,30,0.85)"
                  : hitFeedback.isCritical
                  ? "rgba(255,120,0,0.80)"
                  : "rgba(80,80,200,0.75)",
                border: `1px solid ${hitFeedback.isLethal ? "rgba(255,100,100,0.8)" : "rgba(255,255,255,0.3)"}`,
                boxShadow: hitFeedback.isLethal ? "0 0 20px rgba(255,50,50,0.6)" : "none",
                textShadow: "0 0 8px rgba(0,0,0,0.8)",
              }}
            >
              {hitFeedback.isLethal ? "⚡ LETHAL! " : hitFeedback.isCritical ? "💥 HARD! " : ""}
              {hitFeedback.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── User hit red vignette ── */}
      <AnimatePresence>
        {userHitFlash && (
          <motion.div
            key="uhf"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 9, background: "radial-gradient(ellipse at center, transparent 35%, rgba(220,30,30,0.65) 100%)" }}
          />
        )}
      </AnimatePresence>

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-col items-center pt-12 px-4 pointer-events-none gap-2">

        {/* Discipline badge */}
        <div className="px-4 py-1 rounded-full backdrop-blur-md mb-1"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <span className="text-[9px] font-mono text-white/60 uppercase tracking-[0.25em]">
            {disciplineLabel} · Round {round}/{TOTAL_ROUNDS}
          </span>
        </div>

        {/* Timer */}
        <div className="px-5 py-1.5 rounded-xl backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <span className="text-2xl font-black text-white tabular-nums font-mono">
            {phase === "fight" ? formatTime(roundTimer) : phase === "rest" ? `REST ${restTimer}s` : "--:--"}
          </span>
        </div>

        {/* HP bars */}
        <div className="w-full max-w-xs flex items-center gap-3 mt-1">
          {/* User */}
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono text-white/50 uppercase">YOU</span>
              <Lifelines total={3} remaining={userLifelines} />
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                animate={{ width: `${Math.max(0, userHp)}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className="h-full rounded-full"
                style={{
                  background: userHp > 60 ? "linear-gradient(90deg,#22c55e,#4ade80)"
                    : userHp > 30 ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#ef4444,#f87171)",
                }}
              />
            </div>
            <span className="text-[8px] font-mono text-white/30">{Math.round(Math.max(0, userHp))} HP</span>
          </div>

          <Swords className="w-4 h-4 text-yellow-400 flex-shrink-0" />

          {/* AI */}
          <div className="flex-1 flex flex-col items-end gap-1">
            <div className="flex items-center justify-between w-full">
              <Lifelines total={aiRef.current.lifelines + aiLifelines} remaining={aiLifelines} />
              <span className="text-[8px] font-mono text-white/50 uppercase">AI</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                animate={{ width: `${Math.max(0, aiHp)}%` }}
                transition={{ type: "spring", stiffness: 180, damping: 20 }}
                className="h-full rounded-full ml-auto"
                style={{
                  background: aiHp > 60 ? "linear-gradient(90deg,#60a5fa,#3b82f6)"
                    : aiHp > 30 ? "linear-gradient(90deg,#fb923c,#f97316)"
                    : "linear-gradient(90deg,#ef4444,#f87171)",
                  float: "right",
                }}
              />
            </div>
            <span className="text-[8px] font-mono text-white/30">{Math.round(Math.max(0, aiHp))} HP</span>
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center gap-4">
          <span className="font-black text-base text-yellow-400 tabular-nums">{userScore}</span>
          <span className="text-[8px] text-white/30 font-mono">PTS</span>
          <span className="font-black text-base text-blue-400 tabular-nums">{aiScore}</span>
        </div>
      </div>

      {/* ── Side stats ── */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-none">
        {[
          { icon: Zap,    label: "Strikes", val: strikeCount },
          { icon: Shield, label: "Landed",  val: landedCount },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl backdrop-blur-md"
            style={{ background: "rgba(0,0,0,0.55)", borderLeft: "3px solid rgba(59,130,246,0.7)" }}>
            <s.icon className="w-3 h-3 text-blue-400" />
            <div>
              <p className="font-black text-sm text-white tabular-nums">{s.val}</p>
              <p className="text-[8px] font-mono text-white/40 uppercase">{s.label}</p>
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

      {/* ── Countdown ── */}
      <AnimatePresence>
        {phase === "countdown" && countdown > 0 && (
          <motion.div key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-black text-[130px] tabular-nums"
              style={{ color: "var(--ac,#00f0ff)", textShadow: "0 0 60px rgba(0,240,255,0.8)" }}>
              {countdown}
            </span>
            <span className="text-white/40 font-mono text-xs uppercase tracking-[0.4em]">{disciplineLabel}</span>
          </motion.div>
        )}
        {phase === "countdown" && countdown === 0 && (
          <motion.div key="fight-txt" initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: [0.4, 1.4, 1], opacity: [0, 1, 1] }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <span className="font-black text-8xl uppercase"
              style={{ color: "#ff3333", textShadow: "0 0 50px rgba(255,51,51,0.9)" }}>FIGHT!</span>
          </motion.div>
        )}
        {phase === "rest" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none"
            style={{ background: "rgba(0,0,0,0.65)" }}>
            <span className="font-black text-4xl text-white mb-1">Round {round} Over</span>
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-4">Next round in</span>
            <span className="font-black text-8xl text-yellow-400 tabular-nums">{restTimer}</span>
            <div className="mt-4 text-white/50 text-xs text-center">AI is learning your moves…</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result overlay ── */}
      <AnimatePresence>
        {phase === "result" && fightResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-end backdrop-blur-xl"
            style={{ background: "rgba(4,9,20,0.93)" }}>
            <div className="w-full max-w-sm px-6 pb-16 flex flex-col items-center gap-4">
              <Trophy className="w-14 h-14 mb-1"
                style={{ color: fightResult.winner === "user" ? "#facc15" : fightResult.winner === "draw" ? "#9ca3af" : "#ef4444" }} />
              <span className="font-black text-5xl uppercase tracking-wider"
                style={{
                  color: fightResult.winner === "user" ? "#facc15" : fightResult.winner === "draw" ? "#9ca3af" : "#ef4444",
                  textShadow: `0 0 30px ${fightResult.winner === "user" ? "rgba(250,204,21,0.6)" : "rgba(239,68,68,0.6)"}`,
                }}>
                {fightResult.winner === "user" ? "Victory!" : fightResult.winner === "draw" ? "Draw" : "Defeat"}
              </span>

              {/* Score */}
              <div className="w-full grid grid-cols-3 py-4 px-4 rounded-2xl gap-2 mt-1"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex flex-col items-center">
                  <span className="font-black text-xl text-white tabular-nums">{fightResult.userScore}</span>
                  <span className="text-[8px] font-mono text-white/40 mt-0.5">YOU</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="font-black text-white/30">vs</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-black text-xl text-blue-400 tabular-nums">{fightResult.aiScore}</span>
                  <span className="text-[8px] font-mono text-white/40 mt-0.5">AI</span>
                </div>
              </div>

              {/* Stats */}
              <div className="w-full grid grid-cols-4 gap-2">
                {([
                  ["Strikes", fightResult.totalStrikes],
                  ["Landed", fightResult.landed],
                  ["Accuracy", `${fightResult.accuracy}%`],
                  ["Rounds", fightResult.rounds],
                ] as const).map(([label, val]) => (
                  <div key={label} className="flex flex-col items-center py-3 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="font-black text-sm text-white tabular-nums">{val}</span>
                    <span className="text-[8px] font-mono text-white/30 uppercase tracking-wide mt-0.5">{label}</span>
                  </div>
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate(-1)}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest mt-1"
                style={{ background: "linear-gradient(135deg,var(--ac,#00f0ff) 0%,#0088cc 100%)", color: "#040914" }}>
                Exit Arena
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
