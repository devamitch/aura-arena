// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Number Hunt
// Find the secret number (1–100) in fewest guesses; fewer = more XP
// ═══════════════════════════════════════════════════════════════════════════════

import { useStore } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Hint = "too-low" | "too-high" | "correct";
type GameState = "playing" | "won" | "lost";

interface GuessRecord {
  n: number;
  hint: Hint;
}

const MAX_GUESSES = 7;
const XP_TABLE = [20, 18, 15, 12, 8, 4, 2]; // xp for guess #1–7

const AI_LINES: Record<Hint | "won" | "lost", string[]> = {
  "too-low":  ["Higher! You can do it.", "Nope, go higher.", "Not even close — up!", "Think bigger."],
  "too-high": ["Too high! Come down.", "Lower… much lower.", "Nope, go lower.", "Think smaller."],
  correct:    ["You found it! 🎉", "Lucky guess...", "Impressive deduction!", "Okay, I'm impressed."],
  won:        ["You got it! +XP earned.", "Nicely done!", "Aria approves. 😎", "Quick thinking!"],
  lost:       ["Game over! Try again.", "Too many guesses!", "Aria wins this round.", "Better luck next time!"],
};

function pickLine(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function NumberGuess() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [secret] = useState(() => Math.floor(Math.random() * 100) + 1);
  const secretRef = useRef(secret);
  secretRef.current = secret;

  const [guess, setGuess] = useState(50);
  const [guesses, setGuesses] = useState<GuessRecord[]>([]);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [aiLine, setAiLine] = useState("I'm thinking of a number between 1 and 100…");
  const [xpEarned, setXpEarned] = useState(0);
  const [wins, setWins] = useState(0);

  const [inputVal, setInputVal] = useState("50");

  const submit = useCallback(() => {
    if (gameState !== "playing") return;
    const n = parseInt(inputVal, 10);
    if (isNaN(n) || n < 1 || n > 100) return;

    const hint: Hint = n === secretRef.current ? "correct" : n < secretRef.current ? "too-low" : "too-high";
    const newGuesses = [...guesses, { n, hint }];
    setGuesses(newGuesses);
    setGuess(n);

    if (hint === "correct") {
      const xp = XP_TABLE[Math.min(newGuesses.length - 1, 6)];
      addXP(xp);
      setXpEarned(xp);
      setAiLine(pickLine(AI_LINES.won));
      setGameState("won");
      setWins((w) => w + 1);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setAiLine(pickLine(AI_LINES.lost));
      setGameState("lost");
    } else {
      setAiLine(pickLine(AI_LINES[hint]));
    }
  }, [gameState, guesses, inputVal, addXP]);

  const reset = () => {
    // force remount by reloading — simpler than managing secret ref across resets
    window.location.reload();
  };

  const guessesLeft = MAX_GUESSES - guesses.length;
  const lastHint = guesses.length > 0 ? guesses[guesses.length - 1].hint : null;

  const HINT_COLOR = lastHint === "correct" ? "#00f0ff" : lastHint === "too-low" ? "#10b981" : lastHint === "too-high" ? "#f43f5e" : "rgba(255,255,255,0.3)";

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
          <h1 className="text-xl font-black">Number Hunt</h1>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RotateCcw className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 px-5 mb-5 flex-shrink-0">
        <div className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.15)" }}>
          <p className="text-2xl font-black" style={{ color: "var(--ac)" }}>{wins}</p>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Wins</p>
        </div>
        <div className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p className="text-2xl font-black text-[#f59e0b]">{guessesLeft}</p>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Guesses Left</p>
        </div>
        <div className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <p className="text-2xl font-black text-[#10b981]">{guesses.length}</p>
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Used</p>
        </div>
      </div>

      {/* AI coach */}
      <div className="flex items-center gap-3 px-5 mb-5 flex-shrink-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
          <img src={PREMIUM_ASSETS.COACHES.ARIA} alt="Aria" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <AnimatePresence mode="wait">
            <motion.p key={aiLine} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[12px] italic text-white/60">
              💬 "{aiLine}"
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Range visualizer */}
      <div className="px-5 mb-5 flex-shrink-0">
        <div className="relative h-10 rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Range fill */}
          <motion.div className="absolute left-0 top-0 h-full rounded-2xl"
            animate={{ width: `${parseInt(inputVal || "50", 10)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{ background: "linear-gradient(90deg, rgba(0,240,255,0.15), rgba(0,240,255,0.05))" }}
          />
          {/* Too-high markers */}
          {guesses.filter((g) => g.hint === "too-high").map((g) => (
            <div key={g.n} className="absolute top-0 h-full w-[2px]"
              style={{ left: `${g.n}%`, background: "rgba(244,63,94,0.5)" }} />
          ))}
          {/* Too-low markers */}
          {guesses.filter((g) => g.hint === "too-low").map((g) => (
            <div key={g.n} className="absolute top-0 h-full w-[2px]"
              style={{ left: `${g.n}%`, background: "rgba(16,185,129,0.5)" }} />
          ))}
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <span className="text-[10px] text-white/20 font-mono">1</span>
            <span className="text-[10px] text-white/20 font-mono">100</span>
          </div>
        </div>
      </div>

      {/* Guess history */}
      <div className="flex-1 px-5 overflow-y-auto min-h-0">
        <div className="flex flex-col-reverse gap-2 pb-2">
          <AnimatePresence>
            {guesses.map((g, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: g.hint === "correct" ? "rgba(0,240,255,0.08)" :
                    g.hint === "too-low" ? "rgba(16,185,129,0.05)" : "rgba(244,63,94,0.05)",
                  border: `1px solid ${g.hint === "correct" ? "rgba(0,240,255,0.2)" : g.hint === "too-low" ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)"}`,
                }}>
                <span className="text-xs font-bold text-white/30 font-mono w-4">#{i + 1}</span>
                <span className="text-2xl font-black text-white">{g.n}</span>
                <div className="flex items-center gap-1 ml-auto">
                  {g.hint === "too-low"  && <ChevronUp className="w-4 h-4 text-[#10b981]" />}
                  {g.hint === "too-high" && <ChevronDown className="w-4 h-4 text-[#f43f5e]" />}
                  {g.hint === "correct"  && <span className="text-[#00f0ff]">✓</span>}
                  <span className="text-[11px] font-black"
                    style={{ color: g.hint === "correct" ? "#00f0ff" : g.hint === "too-low" ? "#10b981" : "#f43f5e" }}>
                    {g.hint === "too-low" ? "Too Low" : g.hint === "too-high" ? "Too High" : "CORRECT!"}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Input area */}
      <div className="px-5 pb-6 flex-shrink-0 mt-4">
        <AnimatePresence mode="wait">
          {gameState === "playing" ? (
            <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Number input row */}
              <div className="flex items-center gap-3 mb-3">
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setInputVal((v) => String(Math.max(1, parseInt(v || "50", 10) - 1)))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  −
                </motion.button>
                <input
                  type="number" min={1} max={100}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="flex-1 text-center text-4xl font-black bg-transparent outline-none"
                  style={{ color: HINT_COLOR || "white" }}
                />
                <motion.button whileTap={{ scale: 0.9 }}
                  onClick={() => setInputVal((v) => String(Math.min(100, parseInt(v || "50", 10) + 1)))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  +
                </motion.button>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submit}
                className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
                style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>
                Guess {parseInt(inputVal || "50", 10)} →
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="game-over" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3">
              <div className="w-full py-3 rounded-2xl text-center"
                style={{
                  background: gameState === "won" ? "rgba(0,240,255,0.08)" : "rgba(244,63,94,0.08)",
                  border: `1px solid ${gameState === "won" ? "rgba(0,240,255,0.3)" : "rgba(244,63,94,0.3)"}`,
                }}>
                <p className="font-black text-lg" style={{ color: gameState === "won" ? "#00f0ff" : "#f43f5e" }}>
                  {gameState === "won" ? `You won in ${guesses.length} guess${guesses.length > 1 ? "es" : ""}! +${xpEarned} XP` : `The number was ${secretRef.current}`}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
                className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
                style={{ background: "linear-gradient(135deg, var(--ac), #3b82f6)" }}>
                New Game →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        {gameState === "playing" && (
          <p className="text-center text-[10px] text-white/20 mt-3 font-mono">
            Fewer guesses = more XP · Max {MAX_GUESSES} guesses
          </p>
        )}
      </div>
    </div>
  );
}
