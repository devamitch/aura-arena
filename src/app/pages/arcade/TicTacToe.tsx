// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Tic Tac Toe vs AI (minimax)
// ═══════════════════════════════════════════════════════════════════════════════

import { useStore } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Cell = "X" | "O" | null;
type Board = Cell[];

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6],          // diagonals
];

const checkWinner = (board: Board): { winner: Cell; line: number[] } | null => {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
};

const minimax = (board: Board, isAI: boolean, depth: number): number => {
  const w = checkWinner(board);
  if (w?.winner === "O") return 10 - depth;
  if (w?.winner === "X") return depth - 10;
  if (board.every(Boolean)) return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = isAI ? "O" : "X";
    scores.push(minimax(next, !isAI, depth + 1));
  }
  return isAI ? Math.max(...scores) : Math.min(...scores);
};

const getBestMove = (board: Board): number => {
  // Easy mode: 30% random
  if (Math.random() < 0.3) {
    const empty = board.map((c, i) => c === null ? i : -1).filter((i) => i >= 0);
    if (empty.length) return empty[Math.floor(Math.random() * empty.length)];
  }
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    const next = [...board];
    next[i] = "O";
    const score = minimax(next, false, 0);
    if (score > best) { best = score; move = i; }
  }
  return move;
};

const AI_TAUNTS: Record<string, string[]> = {
  aiWin:    ["Too easy! 😏", "Predicted every move.", "GG — try again?", "Aria: undefeated 💪"],
  playerWin:["Nicely played! 🎉", "You got lucky...", "Impressive! +25 XP for you!", "Okay, you're good."],
  draw:     ["Can't catch me!", "Nobody wins today.", "Stalemate — respect.", "We're equal. For now."],
};

export default function TicTacToe() {
  const navigate = useNavigate();
  const addXP = useStore((s) => s.addXP);

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState<number[]>([]);
  const [status, setStatus] = useState<"playing" | "playerWin" | "aiWin" | "draw">("playing");
  const [score, setScore] = useState({ p: 0, ai: 0, d: 0 });
  const [aiTaunt, setAiTaunt] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const finishGame = useCallback((b: Board) => {
    const w = checkWinner(b);
    if (w) {
      setWinLine(w.line);
      setGameOver(true);
      const key = w.winner === "X" ? "playerWin" : "aiWin";
      setStatus(key);
      const lines = AI_TAUNTS[key];
      setAiTaunt(lines[Math.floor(Math.random() * lines.length)]);
      if (w.winner === "X") { addXP(25); setScore((s) => ({ ...s, p: s.p + 1 })); }
      else setScore((s) => ({ ...s, ai: s.ai + 1 }));
    } else if (b.every(Boolean)) {
      setGameOver(true);
      setStatus("draw");
      const lines = AI_TAUNTS["draw"];
      setAiTaunt(lines[Math.floor(Math.random() * lines.length)]);
      setScore((s) => ({ ...s, d: s.d + 1 }));
    }
  }, [addXP]);

  const doAIMove = useCallback((b: Board) => {
    setAiThinking(true);
    setTimeout(() => {
      const move = getBestMove(b);
      if (move === -1) { setAiThinking(false); return; }
      const next = [...b];
      next[move] = "O";
      setBoard(next);
      setAiThinking(false);
      setIsPlayerTurn(true);
      finishGame(next);
    }, 600);
  }, [finishGame]);

  const handleClick = (i: number) => {
    if (board[i] || gameOver || !isPlayerTurn || aiThinking) return;
    const next = [...board];
    next[i] = "X";
    setBoard(next);
    setIsPlayerTurn(false);
    const won = checkWinner(next);
    if (won || next.every(Boolean)) {
      finishGame(next);
    } else {
      doAIMove(next);
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setGameOver(false);
    setWinLine([]);
    setStatus("playing");
    setAiTaunt("");
    setIsPlayerTurn(true);
    setAiThinking(false);
  };

  // If AI goes first on some rounds, skip for now (player always goes first)
  useEffect(() => { /* player always first */ }, []);

  const STATUS_LABEL: Record<typeof status, string> = {
    playing:   aiThinking ? "Aria is thinking…" : "Your move (✕)",
    playerWin: "You win! 🎉 +25 XP",
    aiWin:     "Aria wins 😤",
    draw:      "Draw! 🤝",
  };

  const STATUS_COLOR: Record<typeof status, string> = {
    playing:   "var(--ac)",
    playerWin: "#00f0ff",
    aiWin:     "#f43f5e",
    draw:      "#f59e0b",
  };

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
          <h1 className="text-xl font-black">Tic Tac Toe</h1>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RotateCcw className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>

      {/* Score */}
      <div className="flex gap-2 px-5 mb-5 flex-shrink-0">
        {[
          { label: "You ✕", val: score.p, color: "#00f0ff" },
          { label: "Draws", val: score.d, color: "#f59e0b" },
          { label: "Aria ○", val: score.ai, color: "#f43f5e" },
        ].map((s) => (
          <div key={s.label} className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* AI head + status */}
      <div className="flex items-center gap-3 px-5 mb-5 flex-shrink-0">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: "1px solid rgba(244,63,94,0.3)" }}>
          <img src={PREMIUM_ASSETS.COACHES.ARIA} alt="Aria" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">Aria AI</p>
          <AnimatePresence mode="wait">
            <motion.p key={status + aiThinking.toString()}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[12px] font-bold"
              style={{ color: STATUS_COLOR[status] }}>
              {aiTaunt || STATUS_LABEL[status]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className="grid grid-cols-3 gap-3 w-full max-w-[320px]">
          {board.map((cell, i) => {
            const isWinCell = winLine.includes(i);
            return (
              <motion.button
                key={i}
                whileTap={!cell && !gameOver ? { scale: 0.92 } : {}}
                onClick={() => handleClick(i)}
                className="aspect-square rounded-[20px] flex items-center justify-center text-5xl font-black relative overflow-hidden"
                style={{
                  background: isWinCell
                    ? "rgba(0,240,255,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: isWinCell
                    ? "2px solid rgba(0,240,255,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: isWinCell ? "0 0 20px rgba(0,240,255,0.2)" : "none",
                  cursor: cell || gameOver || !isPlayerTurn ? "default" : "pointer",
                }}
              >
                <AnimatePresence mode="wait">
                  {cell && (
                    <motion.span key={cell + i}
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      style={{ color: cell === "X" ? "var(--ac)" : "#f43f5e" }}>
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Play again */}
      <div className="px-5 pb-6 flex-shrink-0">
        {gameOver && (
          <motion.button initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }} onClick={reset}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-[#040914]"
            style={{ background: "linear-gradient(135deg, var(--ac), #3b82f6)" }}>
            Play Again →
          </motion.button>
        )}
        {!gameOver && (
          <p className="text-center text-[10px] text-white/20 font-mono">Win = +25 XP · You are ✕ · Aria is ○</p>
        )}
      </div>
    </div>
  );
}
