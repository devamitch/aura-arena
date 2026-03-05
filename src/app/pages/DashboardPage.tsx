// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Dashboard
// Personalized home with AI tips, missions, streak, recent sessions
// ═══════════════════════════════════════════════════════════════════════════════

import { MissionCard } from "@features/gamification/components/MissionCard";
import { useDailyTip } from "@hooks/useAI";
import { usePersonalization } from "@hooks/usePersonalization";
import { formatNumber, timeAgo } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { Skeleton } from "@shared/components/ui/Skeleton";
import { TierBadge } from "@shared/components/ui/TierBadge";
import {
  useDailyMissions,
  useDailyStreak,
  useSessionHistory,
  useTier,
  useUnreadCount,
  useUser,
  useXP,
} from "@store";
import { motion } from "framer-motion";
import { Bell, ChevronRight, Swords, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatPill = ({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
}) => (
  <div className="glass rounded-2xl px-4 py-3 border border-white/5 flex flex-col gap-0.5 shadow-xl transition-transform active:scale-95">
    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-t3 opacity-70">
      {label}
    </p>
    <p
      className="text-xl font-black tabular-nums leading-none tracking-tight"
      style={{ color, textShadow: `0 0 10px ${color}30` }}
    >
      {value}
      {suffix && <span className="text-sm ml-0.5 opacity-80">{suffix}</span>}
    </p>
  </div>
);

// ─── Orb background ────────────────────────────────────────────────────────────

const OrbBg = ({ color }: { color: string }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{ x: [0, 20, -10, 0], y: [0, -15, 20, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full opacity-[0.12] blur-3xl"
      style={{ background: color }}
    />
    <motion.div
      animate={{ x: [0, -15, 10, 0], y: [0, 20, -10, 0] }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      }}
      className="absolute bottom-[10%] left-[-10%] w-48 h-48 rounded-full opacity-[0.07] blur-3xl"
      style={{ background: color }}
    />
  </div>
);

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useUser();
  const xp = useXP();
  const tier = useTier();
  const streak = useDailyStreak();
  const missions = useDailyMissions();
  const unread = useUnreadCount();
  const sessions = useSessionHistory();

  const {
    discipline: disc,
    subDiscipline,
    accentColor,
    currentTier,
    nextTier,
    tierProgress,
  } = usePersonalization();
  const { text: tip, loading: tipLoading } = useDailyTip(
    disc.id,
    subDiscipline?.id,
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.arenaName || user?.displayName || "Athlete").split(
    " ",
  )[0];
  const recentSess = sessions.slice(0, 3);
  const doneMissions = missions.filter((m) => m.complete).length;

  return (
    <div className="page relative pb-safe bg-void">
      <OrbBg color={accentColor} />

      {/* ── Header ── */}
      <div className="px-5 pt-14 pb-2 relative">
        <div className="flex items-start justify-between mb-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-0.5">
              {greeting}
            </p>
            <h1 className="text-3xl font-black text-t1 leading-none">
              {firstName}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <TierBadge tier={currentTier} size="sm" />
              <div className="h-3 w-px bg-white/10 mx-1" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                <DynamicIcon
                  name={disc.icon}
                  className="w-3 h-3 text-t3"
                  style={{ color: accentColor }}
                />
                <span className="text-[9px] text-t2 font-mono uppercase tracking-widest">
                  {disc.name}
                </span>
              </div>
              {subDiscipline && (
                <span className="text-[9px] text-t3 font-mono opacity-60">
                  {subDiscipline.name}
                </span>
              )}
            </div>
          </motion.div>

          <button
            onClick={() => navigate("/notifications")}
            className="btn-icon relative mt-1"
          >
            <Bell className="w-4.5 h-4.5 text-t2" />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-void"
                style={{ background: accentColor }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        {/* XP bar */}
        {nextTier && (
          <div className="mb-5">
            <div className="flex justify-between text-[10px] font-mono text-t3 mb-1.5">
              <span>{formatNumber(xp)} XP</span>
              <span className="flex items-center gap-1">
                <DynamicIcon name={nextTier.icon} className="w-2.5 h-2.5" />
                {nextTier.name} at {formatNumber(nextTier.xpMin)}
              </span>
            </div>
            <div className="h-1.5 bg-s2 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                  boxShadow: `0 0 8px ${accentColor}60`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stats strip ── */}
      <div className="px-5 grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Total XP", value: formatNumber(xp), color: accentColor },
          { label: "Streak", value: streak, suffix: "🔥", color: "#fb923c" },
          {
            label: "Avg Score",
            value: user?.averageScore ?? 0,
            color: "#34d399",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <StatPill {...s} />
          </motion.div>
        ))}
      </div>

      {/* ── Quick start CTAs ── */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/arena/train")}
        className="relative overflow-hidden rounded-3xl p-6 text-left glass border-white/10 group"
      >
        <div
          className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-50"
          style={{ background: accentColor }}
        />
        <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
          <Zap className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <p className="font-black text-t1 text-base leading-none mb-1 tracking-tight">
          Train
        </p>
        <p className="text-[11px] text-t3 font-mono uppercase tracking-widest opacity-60">
          Start session
        </p>
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/battle/pve/select")}
        className="relative overflow-hidden rounded-3xl p-6 text-left glass border-white/10 group"
      >
        <div
          className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-50"
          style={{ background: "#f97316" }}
        />
        <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
          <Swords className="w-6 h-6 text-orange-400" />
        </div>
        <p className="font-black text-t1 text-base leading-none mb-1 tracking-tight">
          Battle
        </p>
        <p className="text-[11px] text-t3 font-mono uppercase tracking-widest opacity-60">
          vs AI opponent
        </p>
      </motion.button>

      {/* ── Daily tip ── */}
      <div className="px-5 mb-6">
        <div
          className="glass rounded-3xl overflow-hidden border-white/5 shadow-2xl"
          style={{
            background: `linear-gradient(145deg, ${accentColor}08, rgba(255,255,255,0.02))`,
          }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2 border-b border-white/5"
            style={{
              background: `linear-gradient(90deg, ${accentColor}15, transparent)`,
            }}
          >
            <DynamicIcon
              name={disc.icon}
              className="w-3.5 h-3.5"
              style={{ color: accentColor }}
            />
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-t2">
              {user?.aiCoachName ?? "Coach"} insights
            </p>
          </div>
          <div className="px-5 py-4">
            {tipLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            ) : (
              <p className="text-sm font-medium text-t1 leading-relaxed italic opacity-90">
                "{tip}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Daily missions ── */}
      {missions.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono uppercase tracking-widest text-t3">
                Daily Missions
              </p>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-s2 text-t3">
                {doneMissions}/{missions.length}
              </span>
            </div>
            <div className="w-16 h-1.5 bg-s2 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accentColor }}
                animate={{
                  width: `${(doneMissions / missions.length) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {missions.slice(0, 3).map((m) => (
              <MissionCard key={m.id} mission={m} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recent sessions ── */}
      {recentSess.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono uppercase tracking-widest text-t3">
              Recent Sessions
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="text-[11px] text-t3 flex items-center gap-1"
            >
              All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentSess.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-s1 border border-b1"
              >
                <DynamicIcon
                  name={disc.icon}
                  className="w-5 h-5"
                  style={{ color: accentColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-t1 truncate">
                    {s.drillId || "Free Training"}
                  </p>
                  <p className="text-[10px] text-t3 font-mono">
                    {timeAgo(s.createdAt)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="font-black tabular-nums text-base"
                    style={{ color: accentColor }}
                  >
                    {s.score}
                  </p>
                  <p className="text-[9px] text-t3 font-mono">
                    +{s.xpEarned} XP
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-5 flex flex-col items-center py-8 gap-3 text-center"
        >
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mb-2"
            style={{ background: `${accentColor}15` }}
          >
            <DynamicIcon
              name={disc.icon}
              className="w-8 h-8"
              style={{ color: accentColor }}
            />
          </div>
          <p className="font-black text-t1">Ready to begin?</p>
          <p className="text-sm text-t3">Your first session is one tap away</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/arena/train")}
            className="mt-2 px-7 py-3.5 rounded-2xl font-bold text-void text-sm"
            style={{
              background: accentColor,
              boxShadow: `0 0 24px ${accentColor}50`,
            }}
          >
            Start First Session
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
