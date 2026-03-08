// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Coin Flip
// ═══════════════════════════════════════════════════════════════════════════════

import { useStore } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Side = "heads" | "tails";
type Result = "win" | "lose" | null;

const AI_LINES: Record<NonNullable<Result>, string[]> = {
  win:  ["Lucky guess! 🍀", "Beginner's luck...", "Enjoy it while it lasts.", "You got me this time!"],
  lose: ["Called it. 😏", "Aria always wins.", "Too predictable!", "Better luck next flip."],
};

export default function CoinFlip() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [pick, setPick] = useState<Side | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<Side | null>(null);
  const [outcome, setOutcome] = useState<Result>(null);
  const [aiLine, setAiLine] = useState("");
  const [score, setScore] = useState({ wins: 0, losses: 0 });
  const [flipCount, setFlipCount] = useState(0);

  const flip = (choice: Side) => {
    if (flipping) return;
    setPick(choice);
    setFlipping(true);
    setResult(null);
    setOutcome(null);
    setAiLine("");

    setTimeout(() => {
      const landed: Side = Math.random() < 0.5 ? "heads" : "tails";
      const res: Result = landed === choice ? "win" : "lose";
      setResult(landed);
      setOutcome(res);
      setFlipping(false);
      setFlipCount((n) => n + 1);

      const lines = AI_LINES[res];
      setAiLine(lines[Math.floor(Math.random() * lines.length)]);

      setScore((s) => ({
        wins:   s.wins   + (res === "win"  ? 1 : 0),
        losses: s.losses + (res === "lose" ? 1 : 0),
      }));
      if (res === "win") addXP(5);
    }, 1200);
  };

  const RESULT_COLOR = outcome === "win" ? "#00f0ff" : outcome === "lose" ? "#f43f5e" : "rgba(255,255,255,0.3)";
  const RESULT_LABEL = outcome === "win" ? "You Win! 🎉 +5 XP" : outcome === "lose" ? "Aria Wins 😤" : "";

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
          <h1 className="text-xl font-black">Coin Flip</h1>
        </div>
        <div className="px-3 py-1 rounded-full text-[10px] font-black"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
          Flips: {flipCount}
        </div>
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

      {/* Coin arena */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">
        {/* Coin */}
        <div className="relative w-48 h-48">
          <motion.div
            animate={flipping ? {
              rotateY: [0, 180, 360, 540, 720, 900, 1080],
              scale: [1, 1.05, 1],
            } : { rotateY: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="w-full h-full rounded-full flex items-center justify-center relative"
            style={{
              background: flipping
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : outcome === "win"
                  ? "linear-gradient(135deg, #00f0ff, #0ea5e9)"
                  : outcome === "lose"
                    ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                    : "linear-gradient(135deg, #f59e0b, #d97706)",
              boxShadow: flipping
                ? "0 0 40px rgba(245,158,11,0.5)"
                : outcome === "win"
                  ? "0 0 40px rgba(0,240,255,0.4)"
                  : outcome === "lose"
                    ? "0 0 40px rgba(244,63,94,0.4)"
                    : "0 0 30px rgba(245,158,11,0.3)",
            }}
          >
            <AnimatePresence mode="wait">
              {flipping ? (
                <motion.span key="flipping" className="text-6xl" animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }}>
                  🪙
                </motion.span>
              ) : result ? (
                <motion.div key={result} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex flex-col items-center gap-1">
                  <span className="text-5xl">{result === "heads" ? "👑" : "⭐"}</span>
                  <span className="text-sm font-black uppercase tracking-wider text-white/90">{result}</span>
                </motion.div>
              ) : (
                <motion.div key="idle" className="flex flex-col items-center gap-1">
                  <span className="text-5xl">🪙</span>
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Pick a side</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Result label */}
        <AnimatePresence mode="wait">
          {RESULT_LABEL && (
            <motion.p key={outcome} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xl font-black" style={{ color: RESULT_COLOR }}>
              {RESULT_LABEL}
            </motion.p>
          )}
          {flipping && (
            <motion.p key="flipping-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-sm font-bold text-white/40 uppercase tracking-widest">
              Flipping…
            </motion.p>
          )}
        </AnimatePresence>

        {/* AI speech */}
        <AnimatePresence>
          {aiLine && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
                <img src={PREMIUM_ASSETS.COACHES.ARIA} alt="Aria" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm italic text-white/60">💬 "{aiLine}"</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Choice buttons */}
      <div className="px-5 pb-6 flex-shrink-0">
        <p className="text-center text-[11px] text-white/30 font-mono uppercase tracking-widest mb-4">
          {flipping ? "Flipping the coin…" : "Pick heads or tails"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: "heads" as Side, emoji: "👑", label: "Heads" },
            { id: "tails" as Side, emoji: "⭐", label: "Tails" },
          ]).map((c) => (
            <motion.button key={c.id} whileTap={{ scale: 0.93 }} onClick={() => flip(c.id)}
              disabled={flipping}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-[20px]"
              style={{
                background: pick === c.id && !flipping ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                border: pick === c.id && !flipping ? "2px solid rgba(245,158,11,0.5)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: pick === c.id && !flipping ? "0 0 20px rgba(245,158,11,0.15)" : "none",
                opacity: flipping ? 0.5 : 1,
              }}>
              <span className="text-4xl">{c.emoji}</span>
              <span className="text-[12px] font-black uppercase tracking-wide text-white/60">{c.label}</span>
            </motion.button>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/20 mt-3">Win = +5 XP · Pure luck!</p>
      </div>
    </div>
  );
}
