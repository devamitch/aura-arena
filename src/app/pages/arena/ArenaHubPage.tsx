// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Arena Hub (MusicX-inspired)
// Mode selection: Training, PvE, Live, Detection Lab
// ═══════════════════════════════════════════════════════════════════════════════

import { useDailyTip } from "@hooks/useAI";
import { usePersonalization } from "@hooks/usePersonalization";
import { ArcGauge } from "@shared/components/ui/ArcGauge";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { TierBadge } from "@shared/components/ui/TierBadge";
import { useUser } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Eye,
  Lock,
  Play,
  Radio,
  RefreshCw,
  Swords,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ArenaHubPage() {
  const navigate = useNavigate();
  const user = useUser();
  const {
    discipline: disc,
    subDiscipline,
    currentTier,
    pveUnlocked,
    liveUnlocked,
    avgScore,
    sessionsCount,
  } = usePersonalization();
  const {
    text: tip,
    loading: tipLoading,
    refresh,
  } = useDailyTip(disc.id, subDiscipline?.id);

  const modes = [
    {
      label: "Training Session",
      sub: "AI-scored drills",
      icon: <Play className="w-6 h-6 fill-current" />,
      color: "var(--ac)",
      path: "/arena/drills",
      locked: false,
      lockMsg: "",
      desc: "Select a specific drill or freestyle.",
    },
    {
      label: "PvE Battle",
      sub: "Beat an AI opponent",
      icon: <Swords className="w-6 h-6" />,
      color: "#a855f7",
      path: "/battle/pve/select",
      locked: !pveUnlocked,
      lockMsg: `Complete ${Math.max(0, 3 - sessionsCount)} more sessions`,
      desc: "Go head-to-head against AI athletes.",
    },
    {
      label: "Live Battle",
      sub: "Real-time 1v1",
      icon: <Radio className="w-6 h-6" />,
      color: "#60a5fa",
      path: "/battle/live/lobby",
      locked: !liveUnlocked,
      lockMsg: "Win 1 PvE battle to unlock",
      desc: "Battle real athletes globally, live.",
    },
    {
      label: "Detection Lab",
      sub: "Test CV models",
      icon: <Eye className="w-6 h-6" />,
      color: "#8b5cf6",
      path: "/arena/lab",
      locked: false,
      lockMsg: "",
      desc: "Debug view for MediaPipe vision models.",
    },
  ];

  return (
    <div
      className="page pb-safe relative"
      style={{ background: "var(--background)" }}
    >
      <img
        src={PREMIUM_ASSETS.ATMOSPHERE.TRAINING_HUB_HERO}
        alt=""
        className="absolute inset-0 w-full h-[55vh] object-cover opacity-40 mix-blend-screen pointer-events-none"
      />
      <div className="absolute inset-0 h-[55vh] bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent pointer-events-none" />

      {/* ── Hero ── */}
      <div className="relative px-5 pt-8 pb-5">
        {/* Glow */}
        <div
          className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "var(--ac)" }}
        />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p
              className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
              style={{ color: "var(--ac)" }}
            >
              The Arena
            </p>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <DynamicIcon
                name={disc.icon}
                className="w-5 h-5"
                style={{ color: "var(--ac)" }}
              />
              {subDiscipline?.name ?? disc.name}
            </h1>
          </div>
          <TierBadge tier={currentTier.id} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 relative z-10">
          <ArcGauge
            value={avgScore}
            size={72}
            strokeWidth={7}
            color={"var(--ac)"}
          />
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[
              { v: sessionsCount, l: "Sessions" },
              { v: user?.pveWins ?? 0, l: "PvE Wins" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-2xl font-black text-white leading-none">
                  {s.v}
                </p>
                <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/25 mt-1">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Coach tip ── */}
      {(tip || tipLoading) && (
        <div className="px-5 mb-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">
                Coach Says
              </p>
              <motion.button
                whileTap={{ scale: 0.8, rotate: 180 }}
                onClick={refresh}
                className="w-6 h-6 flex items-center justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white/20" />
              </motion.button>
            </div>
            <p className="px-4 py-3 text-sm text-white/40 italic leading-relaxed">
              {tipLoading ? (
                <span className="block h-3 rounded bg-white/5 animate-pulse" />
              ) : (
                `"${tip}"`
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Mode cards ── */}
      <div className="px-5 space-y-3 mb-5">
        {modes.map((m, i) => (
          <motion.button
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.06,
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            whileTap={!m.locked ? { scale: 0.97 } : {}}
            onClick={() => !m.locked && navigate(m.path)}
            className={`w-full flex items-center gap-4 p-4 rounded-[20px] text-left relative overflow-hidden transition-all ${m.locked ? "opacity-45" : ""}`}
            style={{
              background: m.locked ? "rgba(255,255,255,0.02)" : `${m.color}08`,
              border: `1px solid ${m.locked ? "rgba(255,255,255,0.04)" : `${m.color}20`}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: m.locked
                  ? "rgba(255,255,255,0.04)"
                  : `${m.color}12`,
                color: m.locked ? "rgba(255,255,255,0.2)" : m.color,
              }}
            >
              {m.locked ? <Lock className="w-5 h-5" /> : m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-white leading-tight">
                {m.label}
              </p>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/25 mt-0.5">
                {m.locked ? m.lockMsg : m.sub}
              </p>
              {!m.locked && (
                <p className="text-xs text-white/30 mt-1 leading-snug">
                  {m.desc}
                </p>
              )}
            </div>
            {!m.locked && (
              <ChevronRight className="w-4 h-4 text-white/15 flex-shrink-0" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
