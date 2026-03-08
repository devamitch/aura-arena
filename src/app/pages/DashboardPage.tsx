// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Dashboard (Full premium MusicX redesign)
// ═══════════════════════════════════════════════════════════════════════════════

import { MissionCard } from "@features/gamification/components/MissionCard";
import { usePersonalization } from "@hooks/usePersonalization";
import { formatNumber } from "@lib/utils";
import {
  useDailyMissions,
  useDailyStreak,
  useSessionHistory,
  useUnreadCount,
  useUser,
  useViewerCount,
  useXP,
} from "@store";
import {
  COACH_IMAGES,
  DISCIPLINE_BANNERS,
  DISCIPLINE_ATHLETE,
  PREMIUM_ASSETS,
  pickImage,
} from "@utils/assets";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Brain,
  Flame,
  MessageCircle,
  Radio,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Roster for "Who's Online" section ─────────────────────────────────────────
const ROSTER = [
  { name: "Boxer",    img: PREMIUM_ASSETS.ATHLETES.BOXER,       status: "IN BATTLE" },
  { name: "Yogi",     img: PREMIUM_ASSETS.ATHLETES.YOGI,        status: "ONLINE" },
  { name: "Warrior",  img: PREMIUM_ASSETS.ATHLETES.WARRIOR,     status: "READY" },
  { name: "Fighter",  img: PREMIUM_ASSETS.AVATARS.FIGHTER,      status: "ONLINE" },
  { name: "Roman",    img: PREMIUM_ASSETS.AVATARS.ROMAN,        status: "READY" },
  { name: "Zen",      img: PREMIUM_ASSETS.AVATARS.ZEN,          status: "ONLINE" },
  { name: "Boxer II", img: PREMIUM_ASSETS.ATHLETES.BOXER_ALT,   status: "READY" },
  { name: "Yogi II",  img: PREMIUM_ASSETS.ATHLETES.YOGI_ALT,    status: "IN BATTLE" },
  { name: "Samurai",  img: PREMIUM_ASSETS.ATHLETES.WARRIOR_ALT, status: "ONLINE" },
  { name: "Ocean",    img: PREMIUM_ASSETS.ATHLETES.OCEAN,       status: "READY" },
] as const;

// ── Static AI coach tips (rotates each day) ───────────────────────────────────
const COACH_TIPS = [
  "Consistency beats intensity. Show up every day — even for 10 minutes.",
  "Focus on form first. Speed and power come naturally when technique is right.",
  "Breathe through the movement. Control your breath, control your performance.",
  "Rest is training too. Your muscles grow during recovery, not during the session.",
  "Visualise before you execute. See the perfect rep before you feel it.",
];

// ── Quick-action definitions ─────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    label:   "Train",
    sub:     "Start a session",
    path:    "/arena/drills",
    Icon:    Zap,
    primary: true,
    glow:    "rgba(0,240,255,0.25)",
    grad:    "linear-gradient(135deg, var(--ac), var(--ac2))",
    textCol: "#040914",
  },
  {
    label:   "PvE Battle",
    sub:     "vs AI opponent",
    path:    "/battle/pve/select",
    Icon:    Swords,
    primary: false,
    glow:    "rgba(139,92,246,0.2)",
    grad:    "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(99,59,246,0.08))",
    border:  "rgba(139,92,246,0.3)",
    textCol: "#c4b5fd",
  },
  {
    label:   "Live Battle",
    sub:     "Real opponents",
    path:    "/battle/live/lobby",
    Icon:    Radio,
    primary: false,
    glow:    "rgba(244,63,94,0.2)",
    grad:    "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(220,38,38,0.06))",
    border:  "rgba(244,63,94,0.3)",
    textCol: "#fca5a5",
  },
  {
    label:   "AI Coach",
    sub:     "Chat & get tips",
    path:    "/chat",
    Icon:    Brain,
    primary: false,
    glow:    "rgba(251,191,36,0.18)",
    grad:    "linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.06))",
    border:  "rgba(251,191,36,0.3)",
    textCol: "#fde68a",
  },
] as const;

// ── Events ───────────────────────────────────────────────────────────────────
const EVENTS = [
  { title: "Mankirt vs Dilpreet", sub: "Sparring · Tomorrow 8PM", img: PREMIUM_ASSETS.EVENTS.BOXING, accent: "#f43f5e" },
  { title: "Yoga Challenge",      sub: "Endurance · Friday 12PM",  img: PREMIUM_ASSETS.EVENTS.YOGA,  accent: "#10b981" },
  { title: "Zen Mastery",         sub: "Focus · Sunday 9AM",       img: PREMIUM_ASSETS.EVENTS.ZEN,   accent: "#3b82f6" },
];

// ── Tiny glow dot helper ──────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: string }) => (
  <div
    className={`w-2 h-2 rounded-full flex-shrink-0 ${
      status === "IN BATTLE" ? "bg-red-500 animate-pulse"
      : status === "ONLINE"  ? "bg-green-400"
      : status === "READY"   ? "bg-cyan-400"
      : "bg-white/20"
    }`}
  />
);

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate       = useNavigate();
  const user           = useUser();
  const xp             = useXP();
  const unread         = useUnreadCount();
  const streak         = useDailyStreak();
  const missions       = useDailyMissions();
  const sessions       = useSessionHistory();
  const viewerCount    = useViewerCount();
  const { accentColor, discipline: disc, currentTier, nextTier, tierProgress, subDiscipline } = usePersonalization();

  // ── Hero background ────────────────────────────────────────────────────────
  const heroBanners = DISCIPLINE_BANNERS[disc.id] ?? [PREMIUM_ASSETS.ATMOSPHERE.DASHBOARD_HERO];
  const [heroIdx, setHeroIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => i + 1), 6000);
    return () => clearInterval(t);
  }, []);
  const heroImg = pickImage(heroBanners, heroIdx);

  // ── Athlete portrait ───────────────────────────────────────────────────────
  const athleteImg = DISCIPLINE_ATHLETE[disc.id] ?? PREMIUM_ASSETS.ATHLETES.BOXER;

  // ── Coach image ────────────────────────────────────────────────────────────
  const coachName   = user?.aiCoachName || "Sensei";
  const coachImages = COACH_IMAGES[coachName] ?? COACH_IMAGES.Sensei;
  const [coachIdx, setCoachIdx] = useState(0);
  useEffect(() => {
    if (coachImages.length <= 1) return;
    const t = setInterval(() => setCoachIdx(i => i + 1), 4000);
    return () => clearInterval(t);
  }, [coachImages.length]);
  const coachImg = pickImage(coachImages, coachIdx);

  const firstName = (user?.arenaName || user?.displayName || "Athlete").split(" ")[0];
  const tip       = COACH_TIPS[new Date().getDay() % COACH_TIPS.length];
  const todaySessions = sessions.filter(s => s.createdAt?.startsWith(new Date().toISOString().split("T")[0])).length;
  const completedMissions = missions.filter(m => m.complete).length;

  return (
    <div className="page pb-safe text-white font-sans" style={{ background: "#040914" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-[300px] overflow-hidden flex-shrink-0">
        {/* Background image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={heroImg}
            src={heroImg}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(4,9,20,0.55) 0%, rgba(4,9,20,0.2) 40%, rgba(4,9,20,0.85) 80%, #040914 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,240,255,0.07) 0%, transparent 60%)" }} />

        {/* Athlete silhouette (faded right side) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none"
          style={{ maskImage: "linear-gradient(to left, black 0%, transparent 80%)", WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 80%)" }}
        >
          <img src={athleteImg} alt="" className="w-full h-full object-cover object-top opacity-60" />
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-10 z-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.2)" }}
            >
              <img src={PREMIUM_ASSETS.ATMOSPHERE.AURA_LOGO} alt="" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-black text-sm tracking-tight text-white">
              AURA<span style={{ color: "var(--ac)" }}>ARENA</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Live viewer count */}
            {viewerCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{ background: "rgba(244,63,94,0.14)", border: "1px solid rgba(244,63,94,0.25)" }}
              >
                <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                <span className="text-[10px] font-mono text-red-400">{viewerCount} LIVE</span>
              </div>
            )}

            {/* Notifications */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/notifications")}
              className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <Bell className="w-4 h-4 text-white/80" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#040914]" />
              )}
            </motion.button>

            {/* Profile */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: `2px solid ${accentColor}50` }}
            >
              {user?.avatarUrl && !user.avatarUrl.includes("/assets/models")
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center font-black text-sm" style={{ background: `${accentColor}15`, color: accentColor }}>{firstName[0]}</div>
              }
            </motion.button>
          </div>
        </div>

        {/* Hero bottom — greeting + badges */}
        <div className="absolute bottom-0 left-5 right-5 pb-5 z-10">
          <p className="text-[9px] font-mono uppercase tracking-[0.35em] mb-1" style={{ color: `${accentColor}99` }}>
            Welcome back
          </p>
          <h1 className="text-3xl font-black text-white leading-tight">
            {firstName} <span style={{ color: accentColor }}>⚡</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {/* Tier badge */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: `${currentTier.color}18`, border: `1px solid ${currentTier.color}35`, color: currentTier.color }}
            >
              <Trophy className="w-3 h-3" />
              {currentTier.name}
            </div>
            {/* Streak */}
            {streak > 0 && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.28)", color: "#fb923c" }}
              >
                <Flame className="w-3 h-3" />
                {streak} day{streak !== 1 ? "s" : ""}
              </div>
            )}
            {/* Sub-discipline */}
            {subDiscipline && (
              <div
                className="px-2.5 py-1 rounded-full text-[9px] font-mono capitalize"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
              >
                {subDiscipline.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── XP CARD ──────────────────────────────────────────────────────────── */}
      <div className="px-5 -mt-1">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 28, delay: 0.05 }}
          className="rounded-[24px] p-5 relative overflow-hidden"
          style={{ background: "rgba(8,12,30,0.95)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: `0 0 40px ${accentColor}10` }}
        >
          {/* Glow blob */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: `${accentColor}18` }} />

          <div className="flex items-center gap-4 relative z-10">
            {/* Aura Coin */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 blur-[20px] rounded-full animate-pulse" style={{ background: `${accentColor}30` }} />
              <motion.img
                src={PREMIUM_ASSETS.CURRENCY.AURA_COIN}
                alt=""
                className="w-14 h-14 object-contain relative z-10"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: `${accentColor}80` }}>
                Aura Credits · {currentTier.name}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black font-mono tabular-nums text-white">{formatNumber(xp)}</span>
                <span className="text-sm font-bold font-mono text-white/35">XP</span>
              </div>
            </div>

            {/* Orb */}
            <div className="flex-shrink-0">
              <img src={PREMIUM_ASSETS.CURRENCY.AURA_ORB} alt="" className="w-10 h-10 object-contain opacity-70" />
            </div>
          </div>

          {/* Tier progress bar */}
          {nextTier && (
            <div className="mt-4 relative z-10">
              <div className="flex justify-between text-[9px] font-mono mb-1.5">
                <span style={{ color: `${accentColor}60` }}>{currentTier.name}</span>
                <span className="text-white/25">{Math.round(tierProgress)}% → {nextTier.name}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── TODAY SNAPSHOT ────────────────────────────────────────────────────── */}
      <div className="px-5 mt-3 grid grid-cols-4 gap-2">
        {[
          { label: "Today",    value: todaySessions,            icon: Zap,     col: accentColor },
          { label: "Streak",   value: `${streak}🔥`,            icon: Flame,   col: "#fb923c" },
          { label: "PvE Wins", value: user?.pveWins ?? 0,       icon: Trophy,  col: "#c084fc" },
          { label: "Live",     value: viewerCount || 0,         icon: Users,   col: "#4ade80" },
        ].map(({ label, value, icon: Icon, col }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04, type: "spring", stiffness: 340, damping: 28 }}
            className="rounded-2xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Icon className="w-3.5 h-3.5 mx-auto mb-1.5" style={{ color: col }} />
            <p className="font-black text-lg text-white leading-none tabular-nums">{value}</p>
            <p className="text-[9px] font-mono text-white/30 mt-1 uppercase tracking-wider">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────────────── */}
      <div className="px-5 mt-4">
        <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] mb-3">Quick Start</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 + i * 0.05, type: "spring", stiffness: 340, damping: 28 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(a.path)}
              className="relative rounded-[20px] overflow-hidden text-left"
              style={{
                background: a.grad,
                border: `1px solid ${(a as any).border ?? "transparent"}`,
                boxShadow: `0 8px 32px ${a.glow}`,
                minHeight: i === 0 ? 96 : 80,
              }}
            >
              {/* Glow blob */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{ background: a.glow }} />

              <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                <a.Icon
                  className="w-5 h-5"
                  style={{ color: a.primary ? a.textCol : a.textCol }}
                />
                <div className="mt-2">
                  <p className="font-black text-sm leading-tight" style={{ color: a.primary ? a.textCol : "white" }}>
                    {a.label}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: a.primary ? `${a.textCol}99` : "rgba(255,255,255,0.35)" }}>
                    {a.sub}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── DAILY MISSIONS ────────────────────────────────────────────────────── */}
      {missions.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">Daily Missions</p>
              <p className="text-base font-black text-white mt-0.5">
                {completedMissions}/{missions.length} <span className="text-white/30 font-normal text-sm">complete</span>
              </p>
            </div>
            {/* Mini progress ring */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{
                background: `conic-gradient(${accentColor} ${completedMissions / missions.length * 360}deg, rgba(255,255,255,0.07) 0deg)`,
                color: accentColor,
              }}
            >
              {Math.round(completedMissions / missions.length * 100)}%
            </div>
          </div>
          <div className="space-y-2.5">
            {missions.slice(0, 3).map(m => (
              <MissionCard key={m.id} mission={m} accentColor={accentColor} />
            ))}
          </div>
        </div>
      )}

      {/* ── COACH TIP ─────────────────────────────────────────────────────────── */}
      <div className="px-5 mt-6">
        <div
          className="rounded-[22px] overflow-hidden relative"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 0% 50%, ${accentColor}08 0%, transparent 60%)` }}
          />
          <div className="flex items-center gap-4 p-4 relative z-10">
            {/* Coach portrait */}
            <motion.div
              className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img src={coachImg} alt="" className="w-full h-full object-contain" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] mb-1" style={{ color: `${accentColor}80` }}>
                {coachName}'s Tip
              </p>
              <p className="text-xs text-white/55 leading-relaxed italic">"{tip}"</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/chat")}
            className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-bold"
            style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.05)", color: accentColor }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat with {coachName}
          </motion.button>
        </div>
      </div>

      {/* ── WHO'S ONLINE ──────────────────────────────────────────────────────── */}
      <div className="mt-7">
        <div className="flex items-center justify-between px-5 mb-3">
          <div>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">Community</p>
            <p className="text-base font-black text-white">Who's Online</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/discover")}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
          >
            See All
          </motion.button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-5 pb-2">
          {ROSTER.map((athlete, i) => (
            <motion.button
              key={athlete.name}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, type: "spring", stiffness: 300, damping: 26 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/discover")}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="relative">
                <div
                  className="w-[54px] h-[54px] rounded-full overflow-hidden"
                  style={{
                    border: `2px solid ${athlete.status === "IN BATTLE" ? "#ef444480" : athlete.status === "ONLINE" ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.12)"}`,
                    boxShadow: athlete.status === "ONLINE" ? "0 0 12px rgba(74,222,128,0.2)" : athlete.status === "IN BATTLE" ? "0 0 12px rgba(239,68,68,0.2)" : "none",
                  }}
                >
                  <img src={athlete.img} alt={athlete.name} className="w-full h-full object-cover" />
                </div>
                {/* Status dot */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#040914] ${
                    athlete.status === "IN BATTLE" ? "bg-red-500 animate-pulse"
                    : athlete.status === "ONLINE" ? "bg-green-400"
                    : athlete.status === "READY" ? "bg-cyan-400"
                    : "bg-white/20"
                  }`}
                />
              </div>
              <p className="text-[10px] font-semibold text-white/60">{athlete.name}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── EVENTS ───────────────────────────────────────────────────────────── */}
      <div className="mt-7 mb-4">
        <div className="flex items-center justify-between px-5 mb-3">
          <div>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">Schedule</p>
            <p className="text-base font-black text-white">Upcoming Events</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/discover")}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
          >
            View All
          </motion.button>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2">
          {EVENTS.map((ev, i) => (
            <motion.button
              key={ev.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, type: "spring", stiffness: 300, damping: 26 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/discover")}
              className="flex-shrink-0 w-52 h-32 rounded-[20px] overflow-hidden relative text-left group"
            >
              <img
                src={ev.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, transparent 0%, rgba(4,9,20,0.85) 100%)` }} />
              {/* Accent glow line */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${ev.accent}, transparent)` }} />

              <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
                <p className="text-xs font-black text-white leading-tight">{ev.title}</p>
                <p className="text-[10px] font-mono mt-0.5" style={{ color: `${ev.accent}cc` }}>{ev.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── BOTTOM PADDING ───────────────────────────────────────────────────── */}
      <div className="h-4" />
    </div>
  );
}
