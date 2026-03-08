// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Arcade Hub
// Mini-games vs AI: RPS, Tic Tac Toe, Coin Flip, Reflex, Number Guess
// ═══════════════════════════════════════════════════════════════════════════════

import { useXP } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Dices,
  Gamepad2,
  Hash,
  Sigma,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const GAMES = [
  {
    id: "rps",
    title: "Rock Paper Scissors",
    desc: "Classic reflex battle vs AI",
    icon: Sigma,
    emoji: "✊✋✌️",
    color: "#00f0ff",
    path: "/arcade/rps",
    xpReward: 10,
    tag: "HOT",
  },
  {
    id: "tictactoe",
    title: "Tic Tac Toe",
    desc: "Strategy duel — beat the AI",
    icon: Hash,
    emoji: "⬜❌⭕",
    color: "#a855f7",
    path: "/arcade/tictactoe",
    xpReward: 25,
    tag: "STRATEGY",
  },
  {
    id: "coinflip",
    title: "Coin Flip",
    desc: "Heads or tails — pure luck",
    icon: Dices,
    emoji: "🪙",
    color: "#f59e0b",
    path: "/arcade/coinflip",
    xpReward: 5,
    tag: "LUCK",
  },
  {
    id: "reflex",
    title: "Reflex Challenge",
    desc: "Tap faster than the AI",
    icon: Zap,
    emoji: "⚡",
    color: "#f43f5e",
    path: "/arcade/reflex",
    xpReward: 15,
    tag: "REFLEX",
  },
  {
    id: "numguess",
    title: "Number Hunt",
    desc: "Find the secret number in fewest guesses",
    icon: Brain,
    emoji: "🔢",
    color: "#10b981",
    path: "/arcade/numguess",
    xpReward: 20,
    tag: "PUZZLE",
  },
] as const;

export default function ArcadePage() {
  const navigate = useNavigate();
  const xp = useXP();

  return (
    <div className="page pb-safe text-white" style={{ background: "#040914" }}>
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden flex-shrink-0">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-screen"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(4,9,20,0.5) 0%, rgba(4,9,20,1) 100%)" }} />

        <div className="relative px-5 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </motion.button>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ac)" }}>
                Mini Games
              </p>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" style={{ color: "var(--ac)" }} />
                Arcade
              </h1>
            </div>
          </div>

          {/* XP stat */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)" }}
          >
            <img src={PREMIUM_ASSETS.CURRENCY.AURA_COIN} alt="" className="w-4 h-4 object-contain" />
            <span className="text-xs font-black" style={{ color: "var(--ac)" }}>
              {xp.toLocaleString()} XP earned
            </span>
          </div>
        </div>
      </div>

      {/* ── AI Opponent Card ── */}
      <div className="px-5 mb-6">
        <div
          className="rounded-[20px] p-4 flex items-center gap-4 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,240,255,0.12)" }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(0,240,255,0.06) 0%, transparent 60%)" }} />
          <div
            className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
            style={{ border: "1px solid rgba(0,240,255,0.2)" }}
          >
            <img src={PREMIUM_ASSETS.COACHES.ARIA} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "var(--ac)" }}>
              Your Opponent
            </p>
            <p className="text-base font-black text-white">Aria AI</p>
            <p className="text-[11px] text-white/40">
              Undefeated in 2,847 games · Win to earn XP
            </p>
          </div>
        </div>
      </div>

      {/* ── Game Grid ── */}
      <div className="px-5 space-y-3 pb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30 mb-4">
          Choose Your Game
        </p>
        {GAMES.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 24 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(game.path)}
            className="w-full flex items-center gap-4 p-4 rounded-[20px] text-left relative overflow-hidden"
            style={{
              background: `${game.color}08`,
              border: `1px solid ${game.color}22`,
            }}
          >
            {/* Glow */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 20% 50%, ${game.color}10 0%, transparent 60%)` }} />

            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: `${game.color}14`, border: `1px solid ${game.color}30` }}
            >
              {game.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-black text-white text-[15px]">{game.title}</span>
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: `${game.color}20`, color: game.color }}
                >
                  {game.tag}
                </span>
              </div>
              <p className="text-[12px] text-white/40">{game.desc}</p>
              <p className="text-[11px] font-bold mt-1" style={{ color: game.color }}>
                +{game.xpReward} XP per win
              </p>
            </div>

            {/* Arrow */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${game.color}18` }}
            >
              <span style={{ color: game.color }} className="text-sm font-black">→</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
