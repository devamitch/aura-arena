// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Live Battle Lobby (MusicX-inspired)
// ═══════════════════════════════════════════════════════════════════════════════

import { usePersonalization } from "@hooks/usePersonalization";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { useUser } from "@store";
import { PREMIUM_ASSETS, TIER_BADGE } from "@utils/assets";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Users, Wifi, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#00f0ff";

export default function LivePrePage() {
  const navigate = useNavigate();
  const { discipline: disc } = usePersonalization();
  const user = useUser();

  return (
    <div className="page pb-safe" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </button>
        <div>
          <p
            className="text-[9px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "var(--ac)" }}
          >
            Live Battle
          </p>
          <h1 className="font-black text-xl text-white">Find Opponent</h1>
        </div>
      </div>

      <div className="px-5">
        {/* Matchmaking card */}
        <div
          className="rounded-[22px] p-6 text-center relative overflow-hidden"
          style={{
            background: "rgba(0,240,255,0.04)",
            border: "1px solid rgba(0,240,255,0.15)",
            boxShadow: "0 4px 30px rgba(0,240,255,0.06)",
          }}
        >
          {/* Hero background */}
          <img
            src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
          />
          {/* Glow */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-10"
            style={{ background: "var(--ac)" }}
          />

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-[2rem] mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "rgba(0,240,255,0.07)",
              border: "1px solid rgba(0,240,255,0.2)",
              boxShadow: "0 0 30px rgba(0,240,255,0.12)",
            }}
          >
            <DynamicIcon
              name={disc.icon}
              className="w-10 h-10"
              style={{ color: "var(--ac)" }}
            />
          </motion.div>

          <h2 className="font-black text-white text-xl mb-1">Live Match</h2>
          <p className="text-sm text-white/30 mb-6">
            Battle real athletes in real-time. Your camera-scored performance vs
            theirs.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { icon: Globe, label: "Global", desc: "Worldwide" },
              { icon: Users, label: "1v1", desc: "Head-to-head" },
              { icon: Zap, label: "Ranked", desc: "Affects tier" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Icon
                  className="w-5 h-5 mx-auto mb-1"
                  style={{ color: "var(--ac)" }}
                />
                <p className="text-xs font-bold text-white">{label}</p>
                <p className="text-[9px] text-white/20">{desc}</p>
              </div>
            ))}
          </div>

          {/* Find Match CTA */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/battle/live")}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3"
            style={{
              background: "linear-gradient(135deg, var(--ac), var(--ac2))",
              color: "#040914",
              boxShadow: "0 0 30px rgba(0,240,255,0.3)",
            }}
          >
            <Wifi className="w-5 h-5" />
            Find Match
          </motion.button>
        </div>

        {/* Info */}
        <p className="text-center text-[10px] text-white/15 mt-4 font-mono">
          Live battles require a stable internet connection
        </p>

        {/* Your ranking */}
        <div
          className="rounded-2xl p-4 mt-4 flex items-center justify-between"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden relative"
              style={{ border: "1px solid rgba(0,240,255,0.2)" }}
            >
              <img
                src={
                  TIER_BADGE[user?.tier ?? "bronze"] ||
                  PREMIUM_ASSETS.BADGES.BEGINNER
                }
                alt="Tier"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {user?.arenaName ?? "Athlete"}
              </p>
              <p className="text-[10px] text-white/20 font-mono">
                {user?.tier ?? "Bronze"} · {user?.pveWins ?? 0} wins
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-lg font-black tabular-nums"
              style={{ color: ACCENT }}
            >
              {user?.xp ?? 0}
            </p>
            <p className="text-[9px] text-white/15 font-mono">XP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
