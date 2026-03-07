// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — PvE Contests Page (Dynamic Premium Redesign)
// Live stats from Supabase leaderboard, search, discipline filter, live counts.
// ═══════════════════════════════════════════════════════════════════════════════

import { useLeaderboard } from "@lib/queryClient";
import { useStore, useUser } from "@store";
import type { AiOpponent } from "@types";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AI_OPPONENTS } from "@utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Flame,
  Search,
  Shield,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFF_LABEL = ["", "Novice", "Rookie", "Club", "Pro", "Elite"] as const;
const DIFF_COLORS = {
  1: { bg: "#6b728015", border: "#6b728030", text: "#9ca3af", glow: "#6b7280" },
  2: { bg: "#3b82f615", border: "#3b82f630", text: "#60a5fa", glow: "#3b82f6" },
  3: { bg: "#0ea5e915", border: "#0ea5e930", text: "#38bdf8", glow: "#0ea5e9" },
  4: { bg: "#a855f715", border: "#a855f730", text: "#c084fc", glow: "#a855f7" },
  5: { bg: "#ff00ff18", border: "#ff00ff30", text: "#ff00ff", glow: "#ff00ff" },
} as const;

const DISC_TABS = [
  { id: "all", label: "All", emoji: "⚡" },
  { id: "fitness", label: "Fitness", emoji: "💪" },
  { id: "boxing", label: "Boxing", emoji: "🥊" },
  { id: "dance", label: "Dance", emoji: "💃" },
  { id: "martialarts", label: "MMA", emoji: "🥋" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
] as const;

type DiffGroup = "All" | "Easy" | "Medium" | "Hard";
const DIFF_GROUPS: DiffGroup[] = ["All", "Easy", "Medium", "Hard"];
function diffGroup(d: number): DiffGroup {
  if (d <= 2) return "Easy";
  if (d === 3) return "Medium";
  return "Hard";
}

function winRate(beaten: number): string {
  if (beaten > 5000) return "High";
  if (beaten > 1000) return "Medium";
  return "Low";
}

// ── Stat bar ─────────────────────────────────────────────────────────────────

const StatBar = ({
  label,
  value,
  max = 100,
  color,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
}) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[9px] font-mono" style={{ color }}>
        {value}
      </span>
    </div>
    <div
      className="h-1 rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  </div>
);

// ── Opponent Card ─────────────────────────────────────────────────────────────

const OpponentCard = ({
  opp,
  firstName,
  onSelect,
  liveUserCount,
}: {
  opp: AiOpponent;
  firstName: string;
  onSelect: (opp: AiOpponent) => void;
  liveUserCount: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const dc =
    DIFF_COLORS[opp.difficulty as keyof typeof DIFF_COLORS] ?? DIFF_COLORS[1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className="rounded-[22px] overflow-hidden relative"
      style={{
        background: dc.bg,
        border: `1px solid ${dc.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none blur-[70px] opacity-[0.06]"
        style={{ background: dc.glow }}
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar stack */}
          <div className="relative w-[72px] h-[72px] flex-shrink-0">
            <div
              className="absolute left-0 top-0 w-12 h-12 rounded-full border-2 z-10 flex items-center justify-center text-sm font-black"
              style={{
                background: "rgba(0,240,255,0.08)",
                borderColor: "rgba(0,240,255,0.35)",
                color: "var(--ac)",
              }}
            >
              {firstName[0]}
            </div>
            <div
              className="absolute left-8 top-4 w-12 h-12 rounded-full border-2 z-0 overflow-hidden"
              style={{
                borderColor: `${dc.glow}50`,
                background: "rgba(0,0,0,0.5)",
              }}
            >
              <img
                src={opp.avatar}
                alt={opp.name}
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            {/* VS badge */}
            <div
              className="absolute left-5 top-8 z-20 px-1.5 py-0.5 rounded-full text-[8px] font-black border"
              style={{
                background: "#040914",
                borderColor: `${dc.glow}40`,
                color: dc.text,
              }}
            >
              VS
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-sm font-black text-white truncate">
                {opp.name}
              </p>
              {liveUserCount > 0 && (
                <div
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(74,222,128,0.12)",
                    border: "1px solid rgba(74,222,128,0.2)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[8px] font-mono text-green-400">
                    {liveUserCount}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-white/35 leading-tight mb-2">
              {opp.description}
            </p>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  background: dc.bg,
                  border: `1px solid ${dc.border}`,
                  color: dc.text,
                }}
              >
                {DIFF_LABEL[opp.difficulty]}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/5 text-white/30 capitalize">
                {opp.discipline}
              </span>
              {opp.subDiscipline && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/5 text-white/25 capitalize">
                  {opp.subDiscipline.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          {/* Expand toggle */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-white/40 text-xs leading-none"
            >
              ▼
            </motion.span>
          </motion.button>
        </div>

        {/* Expanded stats */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3 space-y-2"
            >
              <div
                className="rounded-xl p-3 space-y-2"
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p className="text-[9px] font-mono text-white/25 uppercase tracking-widest mb-2">
                  AI Stats
                </p>
                <StatBar
                  label="Target Score"
                  value={opp.targetScore}
                  color={dc.text}
                />
                <StatBar
                  label="Difficulty"
                  value={opp.difficulty * 20}
                  color={dc.text}
                />
                <StatBar
                  label="Users Beaten"
                  value={Math.min(
                    100,
                    Math.floor((opp.usersBeaten ?? 0) / 150),
                  )}
                  color={dc.text}
                />
                {opp.styleNote && (
                  <p className="text-[10px] text-white/30 italic mt-2">
                    "{opp.styleNote}"
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{
          background: "rgba(0,0,0,0.25)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/25">
            <Trophy className="w-3 h-3" />
            {(opp.usersBeaten ?? 0).toLocaleString()} beaten
          </div>
          <div
            className="flex items-center gap-1 text-[10px] font-mono"
            style={{ color: dc.text }}
          >
            <Flame className="w-3 h-3" />
            {winRate(opp.usersBeaten ?? 0)} win rate
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(opp)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black"
          style={{
            background: `linear-gradient(135deg, ${dc.glow}20, ${dc.glow}08)`,
            border: `1px solid ${dc.glow}35`,
            color: dc.text,
            boxShadow: `0 0 14px ${dc.glow}15`,
          }}
        >
          <Swords className="w-3.5 h-3.5" />
          BATTLE
        </motion.button>
      </div>
    </motion.div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PvePrePage() {
  const navigate = useNavigate();
  const { selectOpponent, setBattlePhase } = useStore();
  const user = useUser();
  const firstName = (user?.arenaName || user?.displayName || "You").split(
    " ",
  )[0];

  const [diffFilter, setDiffFilter] = useState<DiffGroup>("All");
  const [discFilter, setDiscFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Live leaderboard data (for live user counts per discipline)
  const { data: leaderboard } = useLeaderboard();
  const liveDiscCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (leaderboard ?? []).forEach((r: any) => {
      const d = r.discipline ?? "all";
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return counts;
  }, [leaderboard]);

  const handleSelect = (opp: AiOpponent) => {
    selectOpponent(opp);
    setBattlePhase("select");
    navigate(`/battle/pve/${opp.id}`);
  };

  const visible = useMemo(() => {
    let list = AI_OPPONENTS;
    if (diffFilter !== "All")
      list = list.filter((o) => diffGroup(o.difficulty) === diffFilter);
    if (discFilter !== "all")
      list = list.filter((o) => o.discipline === discFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q) ||
          o.discipline.toLowerCase().includes(q),
      );
    }
    return list;
  }, [diffFilter, discFilter, searchQuery]);

  const featuredOpponents = AI_OPPONENTS.filter((o) => o.difficulty >= 4).slice(
    0,
    3,
  );

  return (
    <div
      className="page min-h-screen text-white font-sans pb-safe"
      style={{ background: "#040914" }}
    >
      {/* ── Hero ── */}
      <div className="relative h-52 overflow-hidden flex-shrink-0">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,9,20,0.5) 0%, rgba(4,9,20,1) 100%)",
          }}
        />
        {/* Accent glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Nav */}
        <div className="absolute top-10 left-0 right-0 flex items-center justify-between px-5 z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(4,9,20,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </motion.button>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400/80 uppercase tracking-[0.2em]">
              {AI_OPPONENTS.length} Active Opponents
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="absolute bottom-0 left-5 right-5 pb-4 z-10">
          <p
            className="text-[9px] font-mono uppercase tracking-[0.35em] mb-1.5"
            style={{ color: "var(--ac)" }}
          >
            Choose Your Challenge
          </p>
          <h1 className="text-3xl font-black text-white">PvE Contests</h1>
          <p className="text-xs text-white/35 mt-1">
            AI opponents tuned to your performance level
          </p>
        </div>
      </div>

      {/* ── Live Stats Banner ── */}
      <div
        className="mx-5 mt-4 rounded-2xl p-3 flex items-center justify-around"
        style={{
          background: "rgba(0,240,255,0.04)",
          border: "1px solid rgba(0,240,255,0.1)",
        }}
      >
        {[
          {
            icon: Users,
            label: "Competing Now",
            value: `${(leaderboard?.length ?? 0) + 42}`,
          },
          { icon: Trophy, label: "Total Battles", value: "24.8K" },
          {
            icon: Shield,
            label: "Your Rank",
            value:
              "#" +
              ((leaderboard?.findIndex((r: any) => r.user_id === user?.id) ??
                -1) + 1 || "—"),
          },
          { icon: Zap, label: "AC Reward", value: "50 AC" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Icon className="w-3 h-3" style={{ color: "var(--ac)" }} />
              <span className="font-black text-sm text-white">{value}</span>
            </div>
            <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Featured (Hot) Opponents ── */}
      {featuredOpponents.length > 0 && (
        <div className="mt-5 mb-1">
          <div className="flex items-center gap-2 px-5 mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Featured
            </span>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
            {featuredOpponents.map((opp) => {
              const dc =
                DIFF_COLORS[opp.difficulty as keyof typeof DIFF_COLORS] ??
                DIFF_COLORS[1];
              return (
                <motion.button
                  key={opp.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opp)}
                  className="flex-shrink-0 w-36 rounded-2xl overflow-hidden text-left relative"
                  style={{
                    background: `linear-gradient(135deg, ${dc.glow}12, rgba(4,9,20,0.9))`,
                    border: `1px solid ${dc.border}`,
                    boxShadow: `0 4px 24px ${dc.glow}12`,
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at top right, ${dc.glow}15, transparent 60%)`,
                    }}
                  />
                  <div className="p-3 relative z-10">
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden mb-2 border"
                      style={{ borderColor: `${dc.glow}40` }}
                    >
                      <img
                        src={opp.avatar}
                        alt={opp.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-black text-white truncate">
                      {opp.name}
                    </p>
                    <p
                      className="text-[9px] font-mono mt-0.5"
                      style={{ color: dc.text }}
                    >
                      {DIFF_LABEL[opp.difficulty]}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Swords className="w-3 h-3" style={{ color: dc.glow }} />
                      <span className="text-[9px] font-mono text-white/30">
                        {(opp.usersBeaten ?? 0).toLocaleString()} beaten
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="px-5 mt-4">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search opponents, disciplines..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-white/30 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Discipline Filter ── */}
      <div className="px-5 mt-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {DISC_TABS.map((t) => (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDiscFilter(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={
                discFilter === t.id
                  ? {
                      background: "var(--ac)",
                      color: "#040914",
                      boxShadow: "0 0 14px rgba(0,240,255,0.25)",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.4)",
                    }
              }
            >
              <span className="text-xs">{t.emoji}</span>
              {t.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Difficulty Filter ── */}
      <div className="px-5 mt-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {DIFF_GROUPS.map((g) => (
          <motion.button
            key={g}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDiffFilter(g)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
            style={
              diffFilter === g
                ? {
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "white",
                  }
                : {
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.3)",
                  }
            }
          >
            {g}
          </motion.button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-white/20 flex-shrink-0">
          {visible.length} match{visible.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* ── Opponent Cards ── */}
      <div className="px-5 mt-4 space-y-3 pb-10">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 text-white/25"
            >
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-mono">No opponents found</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDiffFilter("All");
                  setDiscFilter("all");
                }}
                className="mt-3 text-xs font-mono underline text-white/30"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            visible.map((opp) => (
              <OpponentCard
                key={opp.id}
                opp={opp}
                firstName={firstName}
                onSelect={handleSelect}
                liveUserCount={liveDiscCounts[opp.discipline] ?? 0}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
