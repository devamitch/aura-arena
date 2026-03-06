// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — PvE Opponents List (MusicX "Contests" Premium Screen)
// ═══════════════════════════════════════════════════════════════════════════════

import { useStore, useUser } from "@store";
import type { AiOpponent } from "@types";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AI_OPPONENTS } from "@utils/constants";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Swords } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DIFF_LABEL = ["", "Novice", "Rookie", "Club", "Pro", "Elite"] as const;
const DIFF_COLOR = ["", "#6b7280", "#3b82f6", "#0ea5e9", "#a855f7", "#ff00ff"] as const;
const TABS = ["All", "Easy", "Medium", "Hard"] as const;

function diffGroup(d: number) {
  if (d <= 2) return "Easy";
  if (d === 3) return "Medium";
  return "Hard";
}

export default function PvePrePage() {
  const navigate = useNavigate();
  const { selectOpponent, setBattlePhase } = useStore();
  const user = useUser();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");

  const handleSelect = (opp: AiOpponent) => {
    selectOpponent(opp);
    setBattlePhase("select");
    navigate(`/battle/pve/${opp.id}`);
  };

  const firstName = (user?.arenaName || user?.displayName || "You").split(" ")[0];

  const visible =
    activeTab === "All"
      ? AI_OPPONENTS
      : AI_OPPONENTS.filter((o) => diffGroup(o.difficulty) === activeTab);

  return (
    <div
      className="page min-h-screen text-white font-sans pb-safe"
      style={{ background: "var(--background)" }}
    >
      {/* ── Hero Header ── */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(1,6,8,0.3) 0%, rgba(1,6,8,1) 100%)",
          }}
        />
        <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-5 z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(1,6,8,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: "var(--ac)" }} />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "var(--ac)" }}>
              Global Battles
            </span>
          </div>
        </div>
        <div className="absolute bottom-3 left-5 right-5 z-10">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "var(--ac)" }}>
            Choose Opponent
          </p>
          <h1 className="text-2xl font-black text-white">PvE Contests</h1>
        </div>
      </div>

      {/* ── Tab Filter ── */}
      <div className="flex items-center gap-2 px-5 mt-4 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={
              activeTab === tab
                ? {
                    background: "var(--ac)",
                    color: "#040914",
                    boxShadow: "0 0 15px rgba(0,240,255,0.3)",
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                  }
            }
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono text-white/30">{AI_OPPONENTS.length} available</span>
        </div>
      </div>

      {/* ── Opponent Cards ── */}
      <div className="px-5 space-y-3 pb-8">
        {visible.map((opp, i) => {
          const diffColor = DIFF_COLOR[opp.difficulty] ?? "#6b7280";
          return (
            <motion.button
              key={opp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 360, damping: 28 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(opp)}
              className="w-full text-left rounded-[22px] relative overflow-hidden"
              style={{
                background: `${diffColor}06`,
                border: `1px solid ${diffColor}18`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
            >
              {/* Glow */}
              <div
                className="absolute top-0 right-0 w-28 h-28 blur-[60px] opacity-[0.08] pointer-events-none"
                style={{ background: diffColor }}
              />

              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar stack */}
                  <div className="relative w-20 h-14 flex-shrink-0">
                    <div
                      className="absolute left-0 top-0 w-11 h-11 rounded-full border-2 z-10 flex items-center justify-center text-base font-black"
                      style={{
                        background: "rgba(0,240,255,0.08)",
                        borderColor: "rgba(0,240,255,0.3)",
                        color: "var(--ac)",
                      }}
                    >
                      {firstName[0]}
                    </div>
                    <div
                      className="absolute left-0 -bottom-0 z-20 px-1.5 py-0.5 rounded text-[7px] font-bold"
                      style={{
                        background: "rgba(0,240,255,0.1)",
                        border: "1px solid rgba(0,240,255,0.3)",
                        color: "var(--ac)",
                      }}
                    >
                      You
                    </div>
                    <div
                      className="absolute left-7 top-0 w-11 h-11 rounded-full border-2 z-0 overflow-hidden"
                      style={{ borderColor: `${diffColor}40`, background: "rgba(0,0,0,0.4)" }}
                    >
                      <img
                        src={opp.avatar}
                        alt={opp.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <div
                      className="absolute left-9 -bottom-0 z-20 px-1.5 py-0.5 rounded text-[7px] font-bold"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      AI
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-white truncate">
                      {firstName} <span className="text-white/30">vs</span> {opp.name}
                    </p>
                    <p className="text-[11px] text-white/30 mt-0.5 truncate">{opp.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold"
                        style={{ background: "rgba(0,240,255,0.08)", color: "var(--ac)" }}
                      >
                        <img src={PREMIUM_ASSETS.CURRENCY.AURA_COIN} alt="" className="w-3 h-3" />
                        50 AC
                      </div>
                      <div
                        className="px-2 py-1 rounded text-[10px] font-bold"
                        style={{
                          background: `${diffColor}10`,
                          border: `1px solid ${diffColor}30`,
                          color: diffColor,
                        }}
                      >
                        {DIFF_LABEL[opp.difficulty]}
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${diffColor}12`,
                      border: `1px solid ${diffColor}30`,
                    }}
                  >
                    <Swords className="w-4 h-4" style={{ color: diffColor }} />
                  </div>
                </div>
              </div>

              <div
                className="px-4 py-2.5 flex items-center justify-between text-[9px] font-mono"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span className="uppercase tracking-[0.2em] text-white/20">
                  {opp.discipline} · Round 1
                </span>
                <span style={{ color: diffColor }}>
                  {opp.usersBeaten?.toLocaleString() ?? "0"} beaten
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
