import { usePersonalization } from "@hooks/usePersonalization";
import { cn } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { useUser, useXP } from "@store";
import { getTier } from "@utils/constants";
import { getDiscipline } from "@utils/constants/disciplines";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── Mock leaderboard data ────────────────────────────────────────────────────
const MOCK_BOARD = [
  {
    rank: 1,
    name: "DragonFist",
    discipline: "martialarts",
    tier: "elite",
    pts: 98420,
    country: "🇯🇵",
  },
  {
    rank: 2,
    name: "PriyaDev",
    discipline: "dance",
    tier: "elite",
    pts: 94180,
    country: "🇮🇳",
  },
  {
    rank: 3,
    name: "EliteElena",
    discipline: "gymnastics",
    tier: "champ",
    pts: 91050,
    country: "🇷🇺",
  },
  {
    rank: 4,
    name: "ShadowPunch",
    discipline: "boxing",
    tier: "champ",
    pts: 88900,
    country: "🇺🇸",
  },
  {
    rank: 5,
    name: "ZenMaster",
    discipline: "yoga",
    tier: "champ",
    pts: 85600,
    country: "🇮🇳",
  },
  {
    rank: 6,
    name: "KataKenji",
    discipline: "martialarts",
    tier: "plat",
    pts: 79200,
    country: "🇰🇷",
  },
  {
    rank: 7,
    name: "NeonDancer",
    discipline: "dance",
    tier: "plat",
    pts: 74800,
    country: "🇧🇷",
  },
  {
    rank: 8,
    name: "IronWill",
    discipline: "fitness",
    tier: "plat",
    pts: 71300,
    country: "🇬🇧",
  },
  {
    rank: 9,
    name: "FlexGod",
    discipline: "bodybuilding",
    tier: "gold",
    pts: 65000,
    country: "🇺🇸",
  },
  {
    rank: 10,
    name: "CalisthenX",
    discipline: "calisthenics",
    tier: "gold",
    pts: 61400,
    country: "🇩🇪",
  },
];

const DISC_FILTERS = [
  { id: null, label: "🌍 All" },
  { id: "boxing", label: "🥊 Boxing" },
  { id: "dance", label: "💃 Dance" },
  { id: "martialarts", label: "🥋 Martial Arts" },
  { id: "yoga", label: "🧘 Yoga" },
  { id: "gymnastics", label: "🤸 Gymnastics" },
];

export default function LeaguePage() {
  const navigate = useNavigate();
  const user = useUser();
  const xp = useXP();
  const { accentColor, currentTier } = usePersonalization();
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = MOCK_BOARD.filter((e) => {
    if (filter && e.discipline !== filter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const RANK_COLORS = ["#ffd700", "#c0c0c0", "#cd7f32"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-void">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-card/60 backdrop-blur-xl border-white/10 shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-t2" />
        </button>
        <div>
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">
            Season Leaderboard
          </p>
          <h1 className="font-black text-t1 text-xl">League</h1>
        </div>
      </div>

      {/* My rank card */}
      <div className="px-5 mb-3">
        <div
          className="bg-s1 rounded-2xl p-4 border border-b1 flex items-center gap-4"
          style={{
            borderColor: `${accentColor}30`,
            background: `${accentColor}08`,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `${accentColor}20` }}
          >
            {currentTier.icon}
          </div>
          <div className="flex-1">
            <p className="font-black text-t1">{user?.arenaName ?? "You"}</p>
            <p className="text-xs text-t3">
              {currentTier.name} · {xp.toLocaleString()} XP
            </p>
          </div>
          <div className="text-right">
            <p className="font-black text-t1 text-lg">—</p>
            <p className="text-[10px] text-t3">Your Rank</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-3">
        <div className="flex items-center gap-2 bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-t3 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search athletes…"
            className="flex-1 bg-transparent text-sm text-t1 placeholder:text-t3 outline-none"
          />
        </div>
      </div>

      {/* Discipline filter pills */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-none">
        {DISC_FILTERS.map((f) => (
          <button
            key={String(f.id)}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex-shrink-0 text-[11px] font-mono px-3 py-1.5 rounded-full transition-all",
              filter === f.id
                ? "text-void font-bold"
                : "bg-card/60 backdrop-blur-xl border-white/10 shadow-sm text-t3",
            )}
            style={filter === f.id ? { background: accentColor } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-2">
        {filtered.map((entry, i) => {
          const disc = getDiscipline(entry.discipline as any);
          const tierData = getTier(entry.tier as any);
          const isTop3 = entry.rank <= 3;
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                isTop3 ? "bg-s1" : "bg-s0 border-b1",
              )}
              style={
                isTop3
                  ? { borderColor: `${RANK_COLORS[entry.rank - 1]}40` }
                  : {}
              }
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {isTop3 ? (
                  <Crown
                    className="w-5 h-5 mx-auto"
                    style={{ color: RANK_COLORS[entry.rank - 1] }}
                  />
                ) : (
                  <span className="font-mono text-xs text-t3">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{ background: `${disc.color}20`, color: disc.color }}
              >
                {entry.name[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-t1 truncate">
                  {entry.name}
                </p>
                <p className="text-[10px] text-t3">
                  {entry.country}{" "}
                  <DynamicIcon
                    name={disc.icon}
                    className="w-3 h-3 inline-block -mt-0.5 mx-0.5 opacity-80"
                  />{" "}
                  {disc.name}
                </p>
              </div>

              {/* Score + tier */}
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-sm font-bold text-t1">
                  {entry.pts.toLocaleString()}
                </p>
                <p className="text-[10px]" style={{ color: tierData.color }}>
                  {tierData.name}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
