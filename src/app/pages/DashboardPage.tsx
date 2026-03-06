// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Dashboard (MusicX-inspired clean layout)
// ═══════════════════════════════════════════════════════════════════════════════

import { MissionCard } from "@features/gamification/components/MissionCard";
import { useAuth } from "@hooks/useAuth";
import { usePersonalization } from "@hooks/usePersonalization";
import { formatNumber } from "@lib/utils";
import {
  useDailyMissions,
  useSessionHistory,
  useUnreadCount,
  useUser,
  useViewerCount,
  useXP,
} from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Swords,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Athlete roster (built from ALL available images — loops in the scroll) ──
const ROSTER = [
  { name: "Boxer", image: PREMIUM_ASSETS.ATHLETES.BOXER, status: "IN BATTLE" },
  { name: "Yogi", image: PREMIUM_ASSETS.ATHLETES.YOGI, status: "ONLINE" },
  { name: "Warrior", image: PREMIUM_ASSETS.ATHLETES.WARRIOR, status: "READY" },
  { name: "Fighter", image: PREMIUM_ASSETS.AVATARS.FIGHTER, status: "ONLINE" },
  { name: "Roman", image: PREMIUM_ASSETS.AVATARS.ROMAN, status: "READY" },
  { name: "Zen", image: PREMIUM_ASSETS.AVATARS.ZEN, status: "ONLINE" },
  { name: "Champion", image: PREMIUM_ASSETS.ATHLETES.ARENA, status: "OFFLINE" },
  { name: "Referee", image: PREMIUM_ASSETS.ATHLETES.REFEREE, status: "ONLINE" },
  {
    name: "Boxer II",
    image: PREMIUM_ASSETS.ATHLETES.BOXER_ALT,
    status: "READY",
  },
  {
    name: "Yogi II",
    image: PREMIUM_ASSETS.ATHLETES.YOGI_ALT,
    status: "IN BATTLE",
  },
  {
    name: "Samurai",
    image: PREMIUM_ASSETS.ATHLETES.WARRIOR_ALT,
    status: "ONLINE",
  },
  {
    name: "Arena II",
    image: PREMIUM_ASSETS.ATHLETES.ARENA_ALT,
    status: "READY",
  },
  {
    name: "Judge",
    image: PREMIUM_ASSETS.ATHLETES.REFEREE_ALT,
    status: "ONLINE",
  },
  { name: "Ocean", image: PREMIUM_ASSETS.ATHLETES.OCEAN, status: "READY" },
];

// ── Settings Sheet ──
const SettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const { logout: signOut } = useAuth();
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative rounded-t-[28px] p-6 pb-10"
        style={{
          background: "#0a0d1a",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -16px 60px rgba(0,0,0,0.8)",
        }}
      >
        <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-6" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-white/5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <UserIcon className="w-5 h-5" style={{ color: "var(--ac)" }} />
            <span className="font-semibold text-white flex-1">
              Edit Profile
            </span>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>
          <button
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-white/5"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Shield className="w-5 h-5" style={{ color: "var(--ac)" }} />
            <span className="font-semibold text-white flex-1">
              Privacy & Security
            </span>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </button>
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-colors hover:bg-red-500/10 mt-2"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-red-500">Log Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useUser();
  const xp = useXP();
  const unread = useUnreadCount();
  const [showSettings, setShowSettings] = useState(false);

  const sessionHistory = useSessionHistory();
  const viewerCount = useViewerCount();
  const missions = useDailyMissions();
  const { accentColor } = usePersonalization();

  const firstName = (user?.arenaName || user?.displayName || "Athlete").split(
    " ",
  )[0];

  return (
    <div
      className="page pb-safe text-white font-sans"
      style={{ background: "#040610" }}
    >
      {/* ── Hero Section ── */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.DASHBOARD_HERO}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-1000"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,6,16,0.3) 0%, rgba(4,6,16,0.6) 60%, rgba(4,6,16,1) 100%)",
          }}
        />

        {/* Header row */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-10">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt=""
              className="w-6 h-6 rounded-md object-cover"
            />
            <span className="font-black text-sm tracking-tight text-white">
              AURA<span style={{ color: "var(--ac)" }}>ARENA</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/notifications")}
              className="w-9 h-9 rounded-full flex items-center justify-center relative"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <Bell className="w-4 h-4 text-white" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#040610]" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="px-5 -mt-12 relative z-10">
        <div
          className="rounded-[24px] p-5"
          style={{
            background: "rgba(10,13,26,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-black text-2xl flex-shrink-0"
              style={{
                background: "rgba(0,240,255,0.08)",
                border: "1px solid rgba(0,240,255,0.2)",
                color: "var(--ac)",
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                firstName[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-white truncate">
                {firstName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: "var(--ac)" }}
                >
                  {user?.tier ?? "Bronze"}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] text-white/40 font-mono">
                  {user?.pveWins ?? 0} wins
                </span>
              </div>
            </div>
          </div>

          {/* XP Balance */}
          <div
            className="rounded-2xl p-4 mb-4 flex items-center justify-between"
            style={{
              background: "rgba(0,240,255,0.04)",
              border: "1px solid rgba(0,240,255,0.12)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p
                  className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
                  style={{ color: "var(--ac)", opacity: 0.7 }}
                >
                  Aura Credits
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono tabular-nums text-white">
                    {formatNumber(xp)}
                  </span>
                  <span className="text-xs font-bold font-mono text-white/40 ml-1">
                    AC
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 relative flex-shrink-0 group">
                <div className="absolute inset-0 bg-[var(--ac)] blur-[25px] opacity-20 animate-pulse" />
                <motion.img
                  whileHover={{ rotateY: 180, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  src={PREMIUM_ASSETS.CURRENCY.AURA_COIN}
                  alt=""
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(var(--ac-rgb, 0,240,255),0.4)]"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/arena")}
              className="h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
              style={{
                background: "linear-gradient(135deg, var(--ac), var(--ac2))",
                color: "#040914",
              }}
            >
              <Zap className="w-4 h-4" />
              Train Now
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/battle/live/lobby")}
              className="h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "white",
              }}
            >
              <Swords className="w-4 h-4" />
              Battle
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Sessions", value: sessionHistory.length || 0 },
          { label: "Live Now", value: viewerCount || 0 },
          { label: "Wins", value: user?.pveWins ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Daily Missions ── */}
      {missions.length > 0 && (
        <div className="px-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Daily Missions
            </h2>
            <span
              className="text-[10px] font-mono"
              style={{ color: accentColor }}
            >
              {missions.filter((m) => m.complete).length}/{missions.length} done
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {missions.slice(0, 3).map((m) => (
              <MissionCard key={m.id} mission={m} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}

      {/* ── Athlete Roster ── */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Active Athletes
          </h2>
          <button
            onClick={() => navigate("/discover")}
            className="text-[11px] font-semibold"
            style={{ color: "var(--ac)" }}
          >
            View All
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-5 pb-2">
          {ROSTER.map((athlete, i) => (
            <motion.button
              key={athlete.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
              onClick={() => navigate("/discover")}
            >
              <div
                className="w-16 h-16 rounded-full overflow-hidden relative"
                style={{
                  border: `2px solid ${athlete.status === "IN BATTLE" ? "#ef4444" : athlete.status === "OFFLINE" ? "rgba(255,255,255,0.1)" : "rgba(0,240,255,0.4)"}`,
                }}
              >
                <img
                  src={athlete.image}
                  alt={athlete.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-white">
                  {athlete.name}
                </p>
                <p
                  className={`text-[9px] font-mono ${athlete.status === "IN BATTLE" ? "text-red-500 animate-pulse" : athlete.status === "OFFLINE" ? "text-white/30" : "text-green-400"}`}
                >
                  {athlete.status}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Upcoming Events ── */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            Upcoming Events
          </h2>
          <button
            onClick={() => navigate("/discover")}
            className="text-[11px] font-semibold"
            style={{ color: "var(--ac)" }}
          >
            View All
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            {
              title: "Mankirt vs Dilpreet",
              sub: "Sparring · Tomorrow, 8PM EST",
              image: PREMIUM_ASSETS.EVENTS.BOXING,
              color: "rgba(244,63,94,0.06)",
              border: "rgba(244,63,94,0.12)",
            },
            {
              title: "Yoga Challenge",
              sub: "Endurance · Friday, 12PM EST",
              image: PREMIUM_ASSETS.EVENTS.YOGA,
              color: "rgba(16,185,129,0.06)",
              border: "rgba(16,185,129,0.12)",
            },
            {
              title: "Zen Mastery",
              sub: "Focus · Sun, 9AM EST",
              image: PREMIUM_ASSETS.EVENTS.ZEN,
              color: "rgba(59,130,246,0.06)",
              border: "rgba(59,130,246,0.12)",
            },
          ].map((ev, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/discover")}
              className="w-full overflow-hidden rounded-2xl text-left relative h-24 group"
              style={{
                background: ev.color,
                border: `1px solid ${ev.border}`,
              }}
            >
              <img
                src={ev.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

              <div className="relative z-10 flex items-center h-full px-5 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-white uppercase tracking-tight">
                    {ev.title}
                  </p>
                  <p className="text-[10px] text-white/50 font-mono mt-0.5">
                    {ev.sub}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[var(--ac)] transition-colors">
                  <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-[var(--ac)] transition-colors" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Settings Bottom Sheet */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSheet onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
