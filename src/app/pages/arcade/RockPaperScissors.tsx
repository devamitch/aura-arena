// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Rock Paper Scissors vs AI
// ═══════════════════════════════════════════════════════════════════════════════

import { useStore } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Choice = "rock" | "paper" | "scissors";
type Result = "win" | "lose" | "draw" | null;

const CHOICES: { id: Choice; emoji: string; label: string; beats: Choice }[] = [
  { id: "rock",     emoji: "✊", label: "Rock",     beats: "scissors" },
  { id: "paper",    emoji: "✋", label: "Paper",    beats: "rock" },
  { id: "scissors", emoji: "✌️", label: "Scissors", beats: "paper" },
];

const AI_LINES: Record<NonNullable<Result>, string[]> = {
  win:  ["Lucky this time…", "I'll get you next round.", "You got me! 😤", "Beginner's luck!"],
  lose: ["Too easy. 😏", "Aria wins again!", "You can't beat an AI.", "Predicted that one. 😎"],
  draw: ["Interesting move…", "Great minds think alike.", "Call it a draw — for now.", "Same wavelength!"],
};

const getResult = (player: Choice, ai: Choice): Result => {
  if (player === ai) return "draw";
  const p = CHOICES.find((c) => c.id === player)!;
  return p.beats === ai ? "win" : "lose";
};

const RESULT_STYLES: Record<NonNullable<Result>, { color: string; label: string; bg: string }> = {
  win:  { color: "#00f0ff", label: "You Win! 🎉", bg: "rgba(0,240,255,0.08)" },
  lose: { color: "#f43f5e", label: "Aria Wins 😤", bg: "rgba(244,63,94,0.08)" },
  draw: { color: "#f59e0b", label: "Draw! 🤝", bg: "rgba(245,158,11,0.08)" },
};

export default function RockPaperScissors() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [thinking, setThinking] = useState(false);
  const [aiLine, setAiLine] = useState("");
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [aiMoodImg, setAiMoodImg] = useState(PREMIUM_ASSETS.COACHES.ARIA);

  const play = (choice: Choice) => {
    if (thinking) return;
    setPlayerChoice(choice);
    setAiChoice(null);
    setResult(null);
    setThinking(true);
    setAiLine("");

    setTimeout(() => {
      const aiPick = CHOICES[Math.floor(Math.random() * 3)].id;
      const res = getResult(choice, aiPick);
      setAiChoice(aiPick);
      setResult(res);
      setThinking(false);

      const lines = AI_LINES[res as NonNullable<Result>];
      setAiLine(lines[Math.floor(Math.random() * lines.length)]);
      setAiMoodImg(res === "win" ? PREMIUM_ASSETS.COACHES.ARIA_ALT : PREMIUM_ASSETS.COACHES.ARIA);

      setScore((s) => ({
        wins:   s.wins   + (res === "win"  ? 1 : 0),
        losses: s.losses + (res === "lose" ? 1 : 0),
        draws:  s.draws  + (res === "draw" ? 1 : 0),
      }));
      if (res === "win") addXP(10);
    }, 900);
  };

  const reset = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setThinking(false);
    setAiLine("");
  };

  const resultStyle = result ? RESULT_STYLES[result] : null;

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
          <h1 className="text-xl font-black">Rock Paper Scissors</h1>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RotateCcw className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>

      {/* Score bar */}
      <div className="flex gap-2 px-5 mb-6 flex-shrink-0">
        {[
          { label: "Wins",   val: score.wins,   color: "#00f0ff" },
          { label: "Draws",  val: score.draws,  color: "#f59e0b" },
          { label: "Losses", val: score.losses, color: "#f43f5e" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI + VS + Player arena */}
      <div className="flex items-center justify-between px-5 mb-6 flex-shrink-0">
        {/* AI side */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl overflow-hidden relative" style={{ border: "2px solid rgba(244,63,94,0.4)" }}>
            <img src={aiMoodImg} alt="Aria" className="w-full h-full object-cover" />
          </div>
          <p className="text-[11px] font-black text-white/50 uppercase tracking-wide">Aria AI</p>
          <AnimatePresence mode="wait">
            {thinking ? (
              <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-3xl animate-bounce">🤔</motion.div>
            ) : aiChoice ? (
              <motion.div key={aiChoice} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-5xl">{CHOICES.find((c) => c.id === aiChoice)?.emoji}</motion.div>
            ) : (
              <motion.div key="placeholder" className="text-4xl text-white/20">❓</motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* VS badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            VS
          </div>
          <AnimatePresence mode="wait">
            {result && resultStyle && (
              <motion.div key={result} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="text-[10px] font-black px-2 py-1 rounded-full text-center"
                style={{ background: resultStyle.bg, color: resultStyle.color, border: `1px solid ${resultStyle.color}40`, minWidth: "64px" }}>
                {resultStyle.label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player side */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,240,255,0.08)", border: "2px solid rgba(0,240,255,0.3)" }}>
            <p className="text-3xl font-black" style={{ color: "var(--ac)" }}>YOU</p>
          </div>
          <p className="text-[11px] font-black text-white/50 uppercase tracking-wide">You</p>
          <AnimatePresence mode="wait">
            {playerChoice ? (
              <motion.div key={playerChoice} initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-5xl">{CHOICES.find((c) => c.id === playerChoice)?.emoji}</motion.div>
            ) : (
              <motion.div key="placeholder" className="text-4xl text-white/20">❓</motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI speech bubble */}
      <AnimatePresence>
        {aiLine && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-5 mb-5 px-4 py-3 rounded-2xl text-sm italic text-white/60 text-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            💬 Aria: "{aiLine}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice buttons */}
      <div className="px-5 mt-auto pb-4">
        <p className="text-center text-[11px] text-white/30 font-mono uppercase tracking-widest mb-4">
          {thinking ? "AI is thinking…" : result ? "Play again?" : "Choose your move"}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {CHOICES.map((c) => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => play(c.id)}
              disabled={thinking}
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-[20px] transition-all"
              style={{
                background: playerChoice === c.id ? "rgba(0,240,255,0.12)" : "rgba(255,255,255,0.04)",
                border: playerChoice === c.id ? "2px solid rgba(0,240,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: playerChoice === c.id ? "0 0 20px rgba(0,240,255,0.15)" : "none",
                opacity: thinking ? 0.5 : 1,
              }}
            >
              <span className="text-4xl">{c.emoji}</span>
              <span className="text-[11px] font-black uppercase tracking-wide text-white/60">{c.label}</span>
            </motion.button>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/20 mt-3">Win = +10 XP</p>
      </div>
    </div>
  );
}
