import { useDailyTip } from "@hooks/useAI";
import { usePersonalization } from "@hooks/usePersonalization";
import { ArcGauge } from "@shared/components/ui/ArcGauge";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { TierBadge } from "@shared/components/ui/TierBadge";
import { useUser } from "@store";
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
    accentColor,
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
      sub: "AI-scored practice",
      icon: <Play className="w-6 h-6 fill-current" />,
      color: "#00f0ff",
      path: "/arena/train",
      locked: false,
      lockMsg: "",
      desc: "Camera-powered rep detection, real-time scoring across 6 dimensions.",
    },
    {
      label: "PvE Battle",
      sub: "Beat an AI opponent",
      icon: <Swords className="w-6 h-6" />,
      color: "#a855f7",
      path: "/battle/pve/select",
      locked: !pveUnlocked,
      lockMsg: `Complete ${Math.max(0, 3 - sessionsCount)} more training sessions`,
      desc: "Go head-to-head against AI athletes. Win to climb the league.",
    },
    {
      label: "Live Battle",
      sub: "Real-time 1v1",
      icon: <Radio className="w-6 h-6" />,
      color: "#60a5fa",
      path: "/battle/live/lobby",
      locked: !liveUnlocked,
      lockMsg: "Win 1 PvE battle to unlock",
      desc: "Battle real athletes globally. Your performance vs theirs, live.",
    },
    {
      path: "/arena/lab",
      label: "Detection Lab",
      sub: "Test CV models",
      icon: <Eye className="w-6 h-6" />,
      color: "#8b5cf6",
      gradient: "from-violet-900/60 to-violet-800/30",
      locked: false,
      lockMsg: "",
      desc: "Debug view for MediaPipe computer vision models.",
    },
  ];

  return (
    <div
      className="page pb-safe scroll-none"
      style={{ background: "var(--void)" }}
    >
      {/* hero */}
      <div className="relative overflow-hidden px-5 pt-6 pb-5">
        <div
          className="absolute -top-8 -right-8 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: accentColor }}
        />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="label-hud mb-1" style={{ color: accentColor }}>
              The Arena
            </p>
            <h1 className="font-display font-extrabold text-2xl leading-none text-[var(--t1)] flex items-center gap-2">
              <DynamicIcon name={disc.icon} className="w-6 h-6 inline-block" />{" "}
              {subDiscipline?.name ?? disc.name}
            </h1>
          </div>
          <TierBadge tier={currentTier.id} />
        </div>

        {/* stats strip */}
        <div className="flex items-center gap-3 relative z-10">
          <ArcGauge
            value={avgScore}
            size={72}
            strokeWidth={7}
            color={accentColor}
          />
          <div className="flex-1 grid grid-cols-2 gap-2">
            {[
              { v: sessionsCount, l: "Sessions" },
              { v: user?.pveWins ?? 0, l: "PvE Wins" },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: "var(--s1)",
                  border: "1px solid var(--b1)",
                }}
              >
                <p className="font-display font-extrabold text-2xl leading-none text-[var(--t1)]">
                  {s.v}
                </p>
                <p className="label-hud mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* daily tip */}
      {(tip || tipLoading) && (
        <div className="px-5 mb-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: `${accentColor}0d`,
                borderBottom: "1px solid var(--b1)",
              }}
            >
              <p className="label-section">Coach Says</p>
              <motion.button
                whileTap={{ scale: 0.8, rotate: 180 }}
                onClick={refresh}
                className="w-6 h-6 flex items-center justify-center"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--t3)]" />
              </motion.button>
            </div>
            <p className="px-4 py-3 text-sm text-[var(--t2)] italic leading-relaxed">
              {tipLoading ? (
                <span className="block h-3 rounded anim-shimmer" />
              ) : (
                `"${tip}"`
              )}
            </p>
          </div>
        </div>
      )}

      {/* mode cards */}
      <div className="px-5 space-y-3 mb-5">
        {modes.map((m, i) => (
          <motion.button
            key={m.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.07,
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            whileTap={!m.locked ? { scale: 0.97 } : {}}
            onClick={() => !m.locked && navigate(m.path)}
            className={`w-full flex items-center gap-4 p-4 rounded-[22px] text-left relative overflow-hidden card-press ${m.locked ? "opacity-55" : ""}`}
            style={{
              background: m.locked ? "var(--s1)" : `${m.color}10`,
              border: `1px solid ${m.locked ? "var(--b1)" : `${m.color}28`}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
              style={{
                background: m.locked ? "var(--s3)" : `${m.color}1e`,
                color: m.locked ? "var(--t4)" : m.color,
              }}
            >
              {m.locked ? <Lock className="w-5 h-5" /> : m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-[16px] text-[var(--t1)] leading-tight">
                {m.label}
              </p>
              <p className="label-hud mt-0.5">{m.locked ? m.lockMsg : m.sub}</p>
              {!m.locked && (
                <p className="text-xs text-[var(--t3)] mt-1 leading-snug">
                  {m.desc}
                </p>
              )}
            </div>
            {!m.locked && (
              <ChevronRight className="w-4 h-4 text-[var(--t3)] flex-shrink-0" />
            )}
            {!m.locked && (
              <div
                className="absolute inset-0 rounded-[22px]"
                style={{
                  background:
                    "linear-gradient(155deg,rgba(255,255,255,.04) 0%,transparent 50%)",
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
