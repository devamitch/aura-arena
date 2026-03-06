import { cn } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { EmptyState } from "@shared/components/ui/Select";
import { Card, CardContent } from "@shared/components/ui/card";
import {
  useDailyStreak,
  useEarnedAchievements,
  useSessionHistory,
  useStore,
  useUser,
} from "@store";
import type { Achievement } from "@types";
import { ACHIEVEMENTS } from "@utils/constants";
import { getDiscipline } from "@utils/constants/disciplines";
import { format, isThisWeek, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Download,
  Eye,
  Flame,
  Globe,
  Settings,
  Share2,
  Shield,
  Star,
  Target,
  Trash2,
  Trophy,
  User,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

export function ProfileOverviewTab() {
  const user = useUser();
  const streak = useDailyStreak();
  const sessions = useSessionHistory();
  const disc = user ? getDiscipline(user.discipline) : getDiscipline("boxing");

  // This week sessions
  const weekSessions = sessions.filter((s) => {
    try {
      return isThisWeek(parseISO(s.createdAt));
    } catch {
      return false;
    }
  });

  // Recent timeline (last 8 events)
  const timeline = sessions.slice(0, 8).map((s) => ({
    id: s.id,
    type: "session",
    text: `Completed ${disc.name} training — scored ${s.score}`,
    sub: `Accuracy ${s.accuracy}% · ${format(parseISO(s.createdAt), "MMM d, h:mm a")}`,
    icon: disc.icon,
    color: disc.color,
    date: s.createdAt,
  }));

  return (
    <div className="p-4 space-y-5 pb-12">
      {/* Weekly activity summary */}
      <Card className="p-4 bg-card/60 backdrop-blur-xl">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
          This Week
        </p>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: "Sessions",
              value: weekSessions.length,
              icon: Target,
              color: disc.color,
            },
            {
              label: "Streak",
              value: streak,
              icon: Flame,
              color: "#a855f7",
              suffix: "d",
            },
            {
              label: "XP Earned",
              value: weekSessions.reduce((a, s) => a + s.xpEarned, 0),
              icon: Star,
              color: "var(--ac)",
            },
            { label: "Reels", value: 0, icon: Trophy, color: "#a855f7" },
          ].map(({ label, value, icon: Icon, color, suffix = "" }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="font-mono font-black text-t1 text-lg leading-none">
                {value}
                {suffix}
              </p>
              <p className="text-[9px] text-t3 text-center leading-none">
                {label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly goal arc */}
      <Card className="p-4 bg-card/60 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">
            Weekly Goal
          </p>
          <p className="text-xs font-mono" style={{ color: disc.color }}>
            {weekSessions.length} / {user?.trainingFrequency ?? 5} sessions
          </p>
        </div>
        <div className="h-2 bg-s2 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: disc.color }}
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, (weekSessions.length / (user?.trainingFrequency ?? 5)) * 100)}%`,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </Card>

      {/* Discipline card */}
      <Card
        className="overflow-hidden shadow-lg border-white/10"
        style={{
          borderColor: `${disc.color}40`,
          background: `linear-gradient(145deg, ${disc.bg}80, ${disc.bg}40)`,
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${disc.color}20`, color: disc.color }}
            >
              <DynamicIcon name={disc.icon} className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display font-bold text-t1 text-lg">
                {disc.name}
              </p>
              <p className="text-xs text-t2">Primary Discipline</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                label: disc.statLabels.accuracy,
                value: user?.averageScore ?? 0,
              },
              {
                label: disc.statLabels.stability,
                value: Math.min(100, (user?.sessionsCompleted ?? 0) * 2),
              },
              { label: "Sessions", value: user?.sessionsCompleted ?? 0 },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-void/40 rounded-lg p-2 text-center"
              >
                <p
                  className="font-mono text-sm font-bold"
                  style={{ color: disc.color }}
                >
                  {stat.value}
                </p>
                <p className="text-[9px] text-t3 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <div>
        <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-3">
          Recent Activity
        </p>
        {timeline.length === 0 ? (
          <EmptyState
            icon="🏟️"
            title="No activity yet"
            description="Complete your first training session to see your timeline."
          />
        ) : (
          <div className="relative space-y-3 pl-5">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-b1" />
            {timeline.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <div
                  className="absolute -left-3.5 top-3 w-3 h-3 rounded-full border-2 border-void"
                  style={{ background: item.color }}
                />
                <Card className="bg-card/40 backdrop-blur-md p-3 ml-2 border-white/5 shadow-sm">
                  <p className="text-sm text-foreground font-medium flex items-center gap-2">
                    <DynamicIcon name={item.icon} className="w-4 h-4" />{" "}
                    {item.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.sub}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Social counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Followers",
            value: Math.floor(Math.random() * 200),
            icon: User,
          },
          {
            label: "Following",
            value: Math.floor(Math.random() * 80),
            icon: User,
          },
          { label: "Reels", value: 0, icon: Star },
        ].map(({ label, value }) => (
          <Card
            key={label}
            className="bg-card/60 backdrop-blur-xl p-3 text-center border-white/10"
          >
            <p className="font-mono font-black text-foreground text-xl">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── TROPHY ROOM TAB ──────────────────────────────────────────────────────────

const RARITY_GLOW: Record<string, string> = {
  Common: "#ffffff",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#ffd700",
};

interface AchievementTileProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
}

function AchievementTile({
  achievement,
  earned,
  earnedAt,
}: AchievementTileProps) {
  const [expanded, setExpanded] = useState(false);
  const glow = RARITY_GLOW[achievement.rarity] ?? "#ffffff";
  const isSecret = achievement.secret && !earned;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all relative overflow-hidden",
        earned ? "border-opacity-50" : "bg-s1 border-b1 opacity-50 grayscale",
      )}
      style={
        earned
          ? {
              borderColor: `${glow}40`,
              background: `${glow}08`,
              boxShadow: expanded ? `0 0 20px ${glow}30` : undefined,
            }
          : {}
      }
    >
      {/* Legendary animated gradient */}
      {earned && achievement.rarity === "Legendary" && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent, ${glow}, transparent)`,
            backgroundSize: "200% 200%",
            animation: "shimmer 3s infinite",
          }}
        />
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl relative z-10"
        style={
          earned
            ? { background: `${glow}20`, boxShadow: `0 0 12px ${glow}40` }
            : {}
        }
      >
        {isSecret ? "🔒" : achievement.icon}
      </div>

      {/* Name */}
      <p
        className={cn(
          "text-[11px] font-semibold leading-tight relative z-10",
          earned ? "text-t1" : "text-t3",
        )}
      >
        {isSecret ? "???" : achievement.name}
      </p>

      {/* Rarity badge */}
      <span
        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full relative z-10"
        style={{ background: `${glow}20`, color: glow }}
      >
        {achievement.rarity}
      </span>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="pt-2 border-t border-white/10 text-left">
              {!isSecret && (
                <p className="text-[10px] text-t2 leading-relaxed">
                  {achievement.description}
                </p>
              )}
              {earned && earnedAt && (
                <p className="text-[9px] text-t3 mt-1 font-mono">
                  Earned {format(parseISO(earnedAt), "MMM d, yyyy")}
                </p>
              )}
              {earned && (
                <button
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: glow }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.share?.({
                      title: achievement.name,
                      text: `I earned "${achievement.name}" on AURA ARENA!`,
                    });
                  }}
                >
                  <Share2 className="w-3 h-3" /> Share
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function ProfileTrophyRoomTab() {
  const earned = useEarnedAchievements();
  const earnedSet = new Set(earned);

  const earnedCount = ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)).length;

  return (
    <div className="p-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">
            Trophy Room
          </p>
          <p className="text-2xl font-display font-black text-t1 mt-0.5">
            {earnedCount}{" "}
            <span className="text-t3 text-lg font-body font-normal">
              / {ACHIEVEMENTS.length}
            </span>
          </p>
        </div>
        <div className="flex gap-1 items-center">
          {Object.entries(RARITY_GLOW).map(([rarity, color]) => {
            const count = ACHIEVEMENTS.filter(
              (a) => a.rarity === rarity && earnedSet.has(a.id),
            ).length;
            return (
              <div
                key={rarity}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                style={{ background: `${color}15` }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[9px] font-mono" style={{ color }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-3 gap-2">
        {ACHIEVEMENTS.map((achievement) => (
          <AchievementTile
            key={achievement.id}
            achievement={achievement}
            earned={earnedSet.has(achievement.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────

export function ProfileSettingsTab() {
  const user = useUser();
  const navigate = useNavigate();
  const { setSoundEnabled, setReduceMotion, setMasterVolume } = useStore();
  const soundEnabled = useStore((s) => s.soundEnabled);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const masterVolume = useStore((s) => s.masterVolume);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--ac)] shadow-[0_0_8px_var(--ac)]" />
        <p className="text-[11px] font-black font-mono text-white uppercase tracking-[0.2em] relative top-[1px]">
          {title}
        </p>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
      </div>
      <div className="rounded-[24px] overflow-hidden border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-xl relative backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--ac)]/20 to-transparent" />
        <div className="divide-y divide-[var(--glass-border)] flex flex-col pt-1 pb-1">
          {children}
        </div>
      </div>
    </div>
  );

  const Row = ({
    icon: Icon,
    label,
    sub,
    right,
    onClick,
    danger = false,
  }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-300 group",
        danger ? "hover:bg-red-500/10" : "hover:bg-[var(--ac)]/5",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all duration-300",
          danger
            ? "bg-red-500/10 border-red-500/20 text-red-400 group-hover:bg-red-500/20 group-hover:scale-110"
            : "bg-[var(--s2)] border-[var(--glass-border)] text-[var(--t2)] group-hover:border-[var(--ac)]/40 group-hover:text-[var(--ac)] group-hover:scale-110 shadow-[0_0_15px_rgba(0,0,0,0.5)]",
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[15px] font-bold tracking-wide transition-colors duration-300",
            danger ? "text-red-400" : "text-white group-hover:text-[var(--ac)]",
          )}
        >
          {label}
        </p>
        {sub && (
          <p className="text-xs text-[var(--t3)] font-medium mt-0.5 tracking-wide">
            {sub}
          </p>
        )}
      </div>
      {right && (
        <div
          className="flex-shrink-0 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {right}
        </div>
      )}
      {onClick && !right && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[var(--ac)]/10 transition-colors">
          <ChevronRight
            className="w-5 h-5 text-[var(--t3)] group-hover:text-[var(--ac)] flex-shrink-0 transition-colors"
            strokeWidth={2.5}
          />
        </div>
      )}
    </button>
  );

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-12 h-7 rounded-full transition-all duration-500 relative border",
        value
          ? "bg-[var(--ac)]/20 border-[var(--ac)] shadow-[0_0_15px_rgba(var(--ac-rgb,0,240,255),0.4)]"
          : "bg-[var(--s3)] border-[var(--glass-border)] opacity-60",
      )}
    >
      <motion.div
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full border shadow-sm",
          value
            ? "bg-[var(--ac)] border-white/50 shadow-[0_0_10px_var(--ac)]"
            : "bg-[var(--t2)] border-transparent",
        )}
        animate={{ left: value ? 26 : 4 }}
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
      />
    </button>
  );

  return (
    <div className="p-5 pb-10">
      {/* ── Cinematic Header Banner ── */}
      <div className="relative w-full h-[180px] rounded-[32px] overflow-hidden mb-8 shadow-2xl border border-[var(--glass-border)] group">
        <img
          src="/assets/images/generated/training_hub_teal.png"
          alt="Settings Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ac)]/20 to-transparent mix-blend-overlay" />

        {/* Tech Grid Overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: `linear-gradient(to right, var(--ac) 1px, transparent 1px), linear-gradient(to bottom, var(--ac) 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-[var(--ac)] animate-pulse shadow-[0_0_8px_var(--ac)]" />
              <span className="text-[9px] font-mono font-bold tracking-[0.3em] uppercase text-[var(--ac)]">
                SYSTEM_CONFIG
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase drop-shadow-lg">
              Settings
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full border border-[var(--ac)]/30 bg-[var(--ac)]/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(var(--ac-rgb,0,240,255),0.2)]">
            <Settings className="w-6 h-6 text-[var(--ac)] animate-[spin_10s_linear_infinite]" />
          </div>
        </div>
      </div>

      {/* Account */}
      <Section title="Account">
        <Row
          icon={User}
          label="Display Name"
          sub={user?.displayName}
          onClick={() => {}}
        />
        <Row
          icon={User}
          label="Username"
          sub={`@${user?.username}`}
          onClick={() => {}}
        />
        <Row
          icon={Globe}
          label="Country"
          sub={user?.country}
          onClick={() => {}}
        />
        <Row
          icon={User}
          label="Change Avatar"
          onClick={() => navigate("/profile/avatar")}
        />
        <Row
          icon={Target}
          label="Change Discipline"
          sub={user?.discipline}
          onClick={() => {}}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        {[
          "Training Reminders",
          "Battle Challenges",
          "Reel Likes & Comments",
          "Platform Announcements",
        ].map((label) => (
          <Row
            key={label}
            icon={Bell}
            label={label}
            right={<Toggle value={true} onChange={() => {}} />}
          />
        ))}
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Row
          icon={Volume2}
          label="Sound Effects"
          sub={soundEnabled ? "On" : "Off"}
          right={<Toggle value={soundEnabled} onChange={setSoundEnabled} />}
        />
        <Row
          icon={Eye}
          label="Reduce Motion"
          sub="Disables animations"
          right={<Toggle value={reduceMotion} onChange={setReduceMotion} />}
        />
        <Row
          icon={Volume2}
          label="Master Volume"
          sub={`${Math.round(masterVolume * 100)}%`}
          right={
            <div className="relative flex items-center w-28 group">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-[var(--s3)] outline-none relative z-10"
                style={{
                  background: `linear-gradient(to right, var(--ac) ${masterVolume * 100}%, var(--s3) ${masterVolume * 100}%)`,
                }}
              />
            </div>
          }
        />
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <Row
          icon={Shield}
          label="Profile Visibility"
          sub="Public"
          onClick={() => {}}
        />
        <Row
          icon={Eye}
          label="Show on Leaderboard"
          right={<Toggle value={true} onChange={() => {}} />}
        />
        <Row
          icon={Globe}
          label="Show Country Flag"
          right={<Toggle value={true} onChange={() => {}} />}
        />
      </Section>

      {/* Data */}
      <Section title="Data">
        <Row
          icon={Download}
          label="Import Training Data"
          sub="Connect Apple Health, Strava & more"
          onClick={() => navigate("/profile/import")}
        />
        <Row
          icon={Download}
          label="Download My Data"
          sub="Export all your AURA ARENA data as JSON"
          onClick={() => {}}
        />
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <Row
          icon={Trash2}
          label="Delete All Reels"
          danger
          onClick={() => setConfirmDelete("reels")}
        />
        <Row
          icon={Trash2}
          label="Delete Imported Data"
          danger
          onClick={() => setConfirmDelete("imports")}
        />
        <Row
          icon={AlertTriangle}
          label="Delete Account"
          sub="30-day grace period"
          danger
          onClick={() => setConfirmDelete("account")}
        />
      </Section>

      {/* Confirmation dialog - Retained untouched behavior but styled */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end justify-center z-50 p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 200, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 200, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-sm bg-[var(--s1)] border border-red-500/30 rounded-[32px] p-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] mb-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border border-red-500 animate-ping opacity-20" />
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-display font-black text-white text-2xl uppercase tracking-wider">
                  {confirmDelete === "account"
                    ? "Delete Account?"
                    : `Delete ${confirmDelete}?`}
                </h3>
                <p className="text-sm text-[var(--t2)] mt-2 font-medium">
                  {confirmDelete === "account"
                    ? `Type your username "${user?.username}" to confirm.`
                    : "This action cannot be undone."}
                </p>
              </div>
              {confirmDelete === "account" && (
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={user?.username}
                  className="w-full h-14 px-4 rounded-2xl bg-[var(--s2)] border border-[var(--b1)] text-white text-[15px] font-bold tracking-wide mb-6 focus:outline-none focus:border-red-500 focus:bg-red-500/5 transition-all text-center"
                />
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setConfirmDelete(null);
                  }}
                  disabled={
                    confirmDelete === "account" &&
                    deleteConfirmText !== user?.username
                  }
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white text-[15px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="w-full h-14 rounded-2xl bg-transparent border border-[var(--b1)] text-[var(--t1)] text-[15px] font-bold tracking-wider hover:bg-[var(--s2)] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
