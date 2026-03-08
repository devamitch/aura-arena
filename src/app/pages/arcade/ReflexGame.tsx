// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Reflex Challenge
// Tap as fast as you can when the signal fires
// ═══════════════════════════════════════════════════════════════════════════════

import { useStore } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Phase = "idle" | "wait" | "go" | "result";

const AI_REACTION_MS = () => 180 + Math.random() * 220; // 180–400ms

const GRADE = (ms: number) => {
  if (ms < 200) return { label: "GODLIKE", color: "#00f0ff", xp: 20 };
  if (ms < 280) return { label: "ELITE",   color: "#a855f7", xp: 15 };
  if (ms < 380) return { label: "FAST",    color: "#10b981", xp: 10 };
  if (ms < 500) return { label: "DECENT",  color: "#f59e0b", xp: 5 };
  return         { label: "SLOW",          color: "#f43f5e", xp: 0 };
};

const AI_LINES = {
  win:  ["My neurons are digital. 😏", "400ms — try harder.", "I'll always be faster.", "Aria: 0ms lag. 😤"],
  lose: ["Impressive reflexes! 🎉", "You're almost human-fast.", "Lucky timing!", "You caught me off guard!"],
};

export default function ReflexGame() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [phase, setPhase] = useState<Phase>("idle");
  const [playerMs, setPlayerMs] = useState<number | null>(null);
  const [aiMs, setAiMs] = useState<number | null>(null);
  const [aiLine, setAiLine] = useState("");
  const [score, setScore] = useState({ wins: 0, losses: 0 });
  const [earlyTap, setEarlyTap] = useState(false);

  const goTimeRef = useRef<number>(0);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWaitTimer = () => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
  };

  const startRound = useCallback(() => {
    setPhase("wait");
    setPlayerMs(null);
    setAiMs(null);
    setAiLine("");
    setEarlyTap(false);

    const delay = 2000 + Math.random() * 3000; // 2–5s
    waitTimerRef.current = setTimeout(() => {
      goTimeRef.current = Date.now();
      setPhase("go");
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === "idle" || phase === "result") return;

    if (phase === "wait") {
      // Early tap — penalty
      clearWaitTimer();
      setEarlyTap(true);
      setPhase("result");
      setPlayerMs(null);
      const ai = Math.round(AI_REACTION_MS());
      setAiMs(ai);
      setScore((s) => ({ ...s, losses: s.losses + 1 }));
      const lines = AI_LINES.win;
      setAiLine(lines[Math.floor(Math.random() * lines.length)]);
      return;
    }

    if (phase === "go") {
      const reaction = Date.now() - goTimeRef.current;
      setPlayerMs(reaction);
      const ai = Math.round(AI_REACTION_MS());
      setAiMs(ai);
      setPhase("result");

      const won = reaction < ai;
      const lines = won ? AI_LINES.lose : AI_LINES.win;
      setAiLine(lines[Math.floor(Math.random() * lines.length)]);

      setScore((s) => ({
        wins:   s.wins   + (won ? 1 : 0),
        losses: s.losses + (won ? 0 : 1),
      }));
      if (won) {
        const grade = GRADE(reaction);
        addXP(grade.xp);
      }
    }
  }, [phase, addXP]);

  useEffect(() => () => clearWaitTimer(), []);

  const grade = playerMs !== null ? GRADE(playerMs) : null;
  const won = playerMs !== null && aiMs !== null && playerMs < aiMs;
  const lost = earlyTap || (playerMs !== null && aiMs !== null && playerMs >= aiMs);

  const BG_COLOR =
    phase === "go"    ? "#00f0ff" :
    phase === "wait"  ? "#f59e0b" :
    phase === "result" && won ? "rgba(0,240,255,0.08)" :
    phase === "result" && lost ? "rgba(244,63,94,0.08)" :
    "rgba(255,255,255,0.04)";

  const BORDER_COLOR =
    phase === "go"    ? "rgba(0,240,255,0.8)" :
    phase === "wait"  ? "rgba(245,158,11,0.5)" :
    "rgba(255,255,255,0.1)";

  return (
    <div className="page pb-safe text-white flex flex-col" style={{ background: "#040914" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div className="flex-1">
          <p className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ac)" }}>Arcade</p>
          <h1 className="text-xl font-black">Reflex Challenge</h1>
        </div>
        {phase === "result" && (
          <motion.button whileTap={{ scale: 0.9 }} onClick={startRound} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <RotateCcw className="w-4 h-4 text-white/60" />
          </motion.button>
        )}
      </div>

      {/* Score */}
      <div className="flex gap-2 px-5 mb-6 flex-shrink-0">
        {[
          { label: "Your Wins", val: score.wins,   color: "#00f0ff" },
          { label: "Aria Wins", val: score.losses, color: "#f43f5e" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI bar */}
      <div className="flex items-center gap-3 px-5 mb-6 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
          <img src={PREMIUM_ASSETS.COACHES.ARIA} alt="Aria" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">Aria AI</p>
          <AnimatePresence mode="wait">
            <motion.p key={phase + aiLine} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] text-white/40 italic">
              {aiLine || (phase === "idle" ? "Ready when you are..." : phase === "wait" ? "Waiting for the signal..." : phase === "go" ? "GO GO GO!" : `Reacted in ${aiMs}ms`)}
            </motion.p>
          </AnimatePresence>
        </div>
        {aiMs !== null && (
          <div className="px-2 py-1 rounded-lg text-[11px] font-black"
            style={{ background: "rgba(244,63,94,0.1)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}>
            {aiMs}ms
          </div>
        )}
      </div>

      {/* Main tap zone */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
        <motion.button
          onClick={handleTap}
          whileTap={phase === "go" ? { scale: 0.93 } : {}}
          className="w-64 h-64 rounded-[40px] flex flex-col items-center justify-center gap-3 select-none"
          style={{
            background: BG_COLOR,
            border: `2px solid ${BORDER_COLOR}`,
            boxShadow: phase === "go" ? "0 0 60px rgba(0,240,255,0.4)" : "none",
            cursor: phase === "go" || phase === "wait" ? "pointer" : "default",
          }}
          animate={phase === "go" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div key="idle" className="flex flex-col items-center gap-3">
                <Zap className="w-16 h-16 text-white/20" />
                <p className="text-white/30 font-black uppercase tracking-widest text-sm">Tap to Start</p>
              </motion.div>
            )}
            {phase === "wait" && (
              <motion.div key="wait" className="flex flex-col items-center gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                  className="text-6xl">⏳</motion.div>
                <p className="text-[#f59e0b] font-black uppercase tracking-widest text-sm">Wait for it…</p>
                <p className="text-white/20 text-[10px]">Don't tap yet!</p>
              </motion.div>
            )}
            {phase === "go" && (
              <motion.div key="go" className="flex flex-col items-center gap-3"
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                <Zap className="w-20 h-20" style={{ color: "#040914" }} />
                <p className="text-[#040914] font-black uppercase tracking-widest text-xl">TAP NOW!</p>
              </motion.div>
            )}
            {phase === "result" && (
              <motion.div key="result" className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                {earlyTap ? (
                  <>
                    <span className="text-5xl">💥</span>
                    <p className="text-[#f43f5e] font-black uppercase text-base">Too Early!</p>
                    <p className="text-white/30 text-[11px]">Wait for the signal</p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-black" style={{ color: won ? "#00f0ff" : "#f43f5e" }}>
                      {playerMs}ms
                    </p>
                    {grade && (
                      <p className="text-lg font-black" style={{ color: grade.color }}>{grade.label}</p>
                    )}
                    <p className="text-[11px] text-white/30 mt-1">
                      {won ? `Beat Aria by ${aiMs! - playerMs!}ms 🎉` : `Aria beat you by ${playerMs! - aiMs!}ms`}
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Grade XP info */}
        {phase === "idle" && (
          <div className="flex gap-2 flex-wrap justify-center">
            {[
              { label: "GODLIKE", color: "#00f0ff", ms: "<200ms", xp: "+20 XP" },
              { label: "ELITE",   color: "#a855f7", ms: "<280ms", xp: "+15 XP" },
              { label: "FAST",    color: "#10b981", ms: "<380ms", xp: "+10 XP" },
            ].map((g) => (
              <div key={g.label} className="px-2 py-1 rounded-lg text-[10px] font-black"
                style={{ background: `${g.color}10`, border: `1px solid ${g.color}20`, color: g.color }}>
                {g.label} {g.ms} · {g.xp}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-6 flex-shrink-0">
        {phase === "idle" && (
          <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }} onClick={startRound}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
            style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)" }}>
            Start Round →
          </motion.button>
        )}
        {phase === "result" && (
          <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }} onClick={startRound}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
            style={{ background: "linear-gradient(135deg, var(--ac), #3b82f6)" }}>
            Play Again →
          </motion.button>
        )}
        {(phase === "wait" || phase === "go") && (
          <p className="text-center text-[10px] text-white/20 font-mono">
            {phase === "wait" ? "🟡 Waiting for signal — don't tap yet!" : "🟢 TAP NOW!"}
          </p>
        )}
      </div>
    </div>
  );
}
