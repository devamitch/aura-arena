import { useDailyTip, useTrainingPlan } from "@hooks/useAI";
import { usePersonalization } from "@hooks/usePersonalization";
import { Skeleton } from "@shared/components/ui/Skeleton";
import { TierBadge } from "@shared/components/ui/TierBadge";
import { Slider } from "@shared/components/ui/slider";
import { Switch } from "@shared/components/ui/switch";
import {
  useEarnedAchievements,
  useMasterVolume,
  useReduceMotion,
  useSessionHistory,
  useSoundEnabled,
  useStore,
  useUser,
  useXP,
} from "@store";
import { ACHIEVEMENTS } from "@utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  Brain,
  ChevronRight,
  Edit2,
  Eye,
  LogOut,
  Settings,
  Star,
  Trophy,
  Volume2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TABS = [
  { id: "overview", label: "Overview", Icon: Star },
  { id: "stats", label: "Stats", Icon: BarChart2 },
  { id: "coach", label: "Coach", Icon: Brain },
  { id: "trophies", label: "Trophies", Icon: Trophy },
  { id: "settings", label: "Settings", Icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

const RARITY_C: Record<string, string> = {
  Common: "#6b7280",
  Rare: "#60a5fa",
  Epic: "#c084fc",
  Legendary: "#fbbf24",
};

export default function ProfilePage() {
  const [tab, setTab] = useState<TabId>("overview");
  const navigate = useNavigate();
  const user = useUser();
  const xp = useXP();
  const {
    discipline: disc,
    subDiscipline,
    accentColor,
    currentTier,
    nextTier,
    tierProgress,
    avgScore,
  } = usePersonalization();

  return (
    <div className="page pb-safe" style={{ background: "var(--void)" }}>
      {/* header */}
      <div className="px-5 pt-6 pb-3 flex-shrink-0 relative overflow-hidden">
        <div
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: accentColor }}
        />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="label-hud mb-1" style={{ color: accentColor }}>
              Your Profile
            </p>
            <h1 className="font-display font-extrabold text-2xl leading-none text-[var(--t1)]">
              {user?.arenaName || user?.displayName || "Athlete"}
            </h1>
            <p className="text-xs text-[var(--t3)] mt-1">
              {disc.emoji} {subDiscipline?.name ?? disc.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TierBadge tier={currentTier.id} />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate("/profile/avatar")}
              className="btn-icon"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
        {/* tab pills */}
        <div className="flex gap-1.5 overflow-x-auto scroll-none pb-0.5">
          {TABS.map(({ id, label, Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setTab(id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-[14px] text-xs font-bold transition-all font-mono"
              style={
                tab === id
                  ? {
                      background: accentColor,
                      color: "#040610",
                      boxShadow: `0 0 16px ${accentColor}50`,
                    }
                  : {
                      background: "var(--s2)",
                      border: "1px solid var(--b1)",
                      color: "var(--t3)",
                    }
              }
            >
              <Icon className="w-3 h-3" />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto px-5 pb-safe scroll-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {tab === "overview" && (
              <OverviewTab
                accentColor={accentColor}
                xp={xp}
                currentTier={currentTier}
                nextTier={nextTier}
                tierProgress={tierProgress}
                avgScore={avgScore}
              />
            )}
            {tab === "stats" && <StatsTab accentColor={accentColor} />}
            {tab === "coach" && <CoachTab />}
            {tab === "trophies" && <TrophiesTab accentColor={accentColor} />}
            {tab === "settings" && <SettingsTab navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Overview ── */
const OverviewTab = ({
  accentColor,
  xp,
  currentTier,
  nextTier,
  tierProgress,
  avgScore,
}: any) => {
  const user = useUser();
  const history = useSessionHistory();
  const chart = history
    .slice(0, 8)
    .map((s, i) => ({ i: i + 1, score: s.score }))
    .reverse();
  return (
    <div className="space-y-3.5 pt-3 pb-4">
      {/* stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: user?.sessionsCompleted ?? 0, l: "Sessions" },
          { v: user?.pveWins ?? 0, l: "PvE Wins" },
          { v: user?.bestScore ?? 0, l: "Best" },
          {
            v: xp > 999 ? `${(xp / 1000).toFixed(1)}k` : xp,
            l: "XP",
            c: accentColor,
          },
          { v: `${user?.dailyStreak ?? 0}🔥`, l: "Streak" },
          { v: Math.round(avgScore), l: "Avg Score", c: accentColor },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl p-3 text-center card">
            <p
              className="font-display font-extrabold text-2xl leading-none tabular"
              style={{ color: (s as any).c || "var(--t1)" }}
            >
              {s.v}
            </p>
            <p className="label-hud mt-1">{s.l}</p>
          </div>
        ))}
      </div>
      {/* tier progress */}
      {nextTier && (
        <div className="card rounded-2xl p-4">
          <div className="flex justify-between mb-2">
            <span className="label-hud">
              {currentTier.icon} {currentTier.name}
            </span>
            <span className="label-hud">
              {nextTier.icon} {nextTier.name}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--s3)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg,${accentColor}99,${accentColor})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${tierProgress}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}
      {/* chart */}
      {chart.length >= 3 && (
        <div className="card rounded-2xl p-4">
          <p className="label-section mb-3">Score Trend</p>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={chart}>
              <XAxis dataKey="i" hide /> <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  background: "var(--s2)",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 11,
                  color: "var(--t1)",
                }}
                formatter={(v: number) => [v, "Score"]}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke={accentColor}
                strokeWidth={2.5}
                dot={{ fill: accentColor, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

/* ── Stats ── */
const StatsTab = ({ accentColor }: { accentColor: string }) => {
  const sessions = useSessionHistory();
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = d.toISOString().split("T")[0];
    const s = sessions.filter((s) => s.createdAt.startsWith(day));
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      count: s.length,
      avg: s.length
        ? Math.round(s.reduce((a, x) => a + x.score, 0) / s.length)
        : 0,
    };
  });
  return (
    <div className="space-y-3.5 pt-3 pb-4">
      <div className="card rounded-2xl p-4">
        <p className="label-section mb-3">This Week</p>
        <div className="flex items-end justify-between gap-1.5 h-20">
          {weekly.map((d) => (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <motion.div
                className="w-full rounded-t-md flex-1"
                style={{
                  background: d.count ? accentColor : "var(--s3)",
                  minHeight: 4,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: 0.05,
                  duration: 0.5,
                  transformOrigin: "bottom",
                }}
              />
              <p className="label-hud">{d.day}</p>
            </div>
          ))}
        </div>
      </div>
      {sessions.length === 0 && (
        <p className="label-hud text-center py-8">Train to see stats</p>
      )}
    </div>
  );
};

/* ── Coach ── */
const CoachTab = () => {
  const { discipline: disc, subDiscipline, accentColor } = usePersonalization();
  const user = useUser();
  const {
    text: tip,
    loading: tipL,
    refresh,
  } = useDailyTip(disc.id, subDiscipline?.id);
  const { plan, loading: planL } = useTrainingPlan(disc.id, subDiscipline?.id);
  return (
    <div className="space-y-3.5 pt-3 pb-4">
      <div className="card rounded-[20px] p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: `${accentColor}18` }}
          >
            {disc.emoji}
          </div>
          <div>
            <p className="font-display font-bold text-base text-[var(--t1)]">
              {user?.aiCoachName ?? "Coach"}
            </p>
            <p className="label-hud mt-0.5 capitalize">
              {disc.coachingTone} · {disc.name}
            </p>
          </div>
        </div>
      </div>
      <div className="card rounded-[20px] overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: `${accentColor}0d`,
            borderBottom: "1px solid var(--b1)",
          }}
        >
          <p className="label-section">Today's Message</p>
          <motion.button
            whileTap={{ scale: 0.8, rotate: 180 }}
            onClick={refresh}
            className="w-6 h-6 flex items-center justify-center text-[var(--t3)]"
          >
            ↻
          </motion.button>
        </div>
        <p className="px-4 py-3 text-sm text-[var(--t2)] leading-relaxed italic">
          {tipL ? (
            <span className="block h-3 rounded anim-shimmer" />
          ) : tip ? (
            `"${tip}"`
          ) : (
            "..."
          )}
        </p>
      </div>
      <div className="card rounded-[20px] overflow-hidden">
        <div
          className="px-4 py-2.5"
          style={{
            background: `${accentColor}0d`,
            borderBottom: "1px solid var(--b1)",
          }}
        >
          <p className="label-section">Weekly Plan</p>
        </div>
        <div className="p-4 space-y-2.5">
          {planL ? (
            Array(3)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)
          ) : plan.length > 0 ? (
            plan.map((day) => (
              <div
                key={day.day}
                className="rounded-xl p-3"
                style={{ background: "var(--s2)" }}
              >
                <p
                  className="font-mono text-[10px] font-bold mb-1.5"
                  style={{ color: accentColor }}
                >
                  DAY {day.day} · {day.goal.toUpperCase()}
                </p>
                {day.drills.map((d, i) => (
                  <p key={i} className="text-xs text-[var(--t3)]">
                    · {d}
                  </p>
                ))}
              </div>
            ))
          ) : (
            <p className="label-hud text-center py-4">Generating plan…</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Trophies ── */
const TrophiesTab = ({
  accentColor: _accentColor,
}: {
  accentColor: string;
}) => {
  const earned = useEarnedAchievements();
  const cats = [
    "training",
    "battle",
    "social",
    "progression",
    "mastery",
    "special",
  ] as const;
  return (
    <div className="space-y-5 pt-3 pb-4">
      <div className="flex items-center justify-between">
        <p className="label-section">
          {earned.length}/{ACHIEVEMENTS.length} Unlocked
        </p>
      </div>
      {cats.map((cat) => {
        const list = ACHIEVEMENTS.filter((a) => a.category === cat);
        if (!list.length) return null;
        const unlocked = list.filter((a) => earned.includes(a.id));
        return (
          <div key={cat}>
            <p className="label-hud mb-2 capitalize">
              {cat} · {unlocked.length}/{list.length}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {list.map((a) => {
                const on = earned.includes(a.id);
                const c = RARITY_C[a.rarity] || "#6b7280";
                return (
                  <motion.div
                    key={a.id}
                    whileTap={{ scale: 0.92 }}
                    className="rounded-2xl p-3 text-center transition-all"
                    style={
                      on
                        ? {
                            background: `${c}10`,
                            border: `1px solid ${c}40`,
                            boxShadow: `0 0 12px ${c}15`,
                          }
                        : {
                            background: "var(--s1)",
                            border: "1px solid var(--b0)",
                            opacity: 0.38,
                          }
                    }
                  >
                    <p className="text-2xl">
                      {a.secret && !on ? "❓" : a.icon}
                    </p>
                    <p
                      className="font-mono text-[9px] font-bold mt-1 leading-tight"
                      style={{ color: on ? c : "var(--t4)" }}
                    >
                      {a.secret && !on ? "???" : a.name}
                    </p>
                    {on && <p className="label-hud mt-0.5">+{a.xpReward}XP</p>}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ── Settings ── */
const SettingsTab = ({ navigate }: { navigate: any }) => {
  const { setSoundEnabled, setReduceMotion, setMasterVolume, signOut } =
    useStore();
  const soundEnabled = useSoundEnabled();
  const reduceMotion = useReduceMotion();
  const masterVolume = useMasterVolume();
  const { accentColor: _accentColor } = usePersonalization();
  return (
    <div className="space-y-3.5 pt-3 pb-4">
      <div className="card rounded-[20px] p-4 space-y-4">
        <p className="label-section">Audio</p>
        <SettingRow
          label="Sound Effects"
          icon={<Volume2 className="w-4 h-4" />}
        >
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </SettingRow>
        {soundEnabled && (
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-xs text-[var(--t3)]">Volume</p>
              <p className="font-mono text-xs text-[var(--t3)]">
                {Math.round(masterVolume * 100)}%
              </p>
            </div>
            <Slider
              value={[masterVolume]}
              onValueChange={([v]) => setMasterVolume(v)}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        )}
      </div>
      <div className="card rounded-[20px] p-4 space-y-4">
        <p className="label-section">Accessibility</p>
        <SettingRow label="Reduce Motion" icon={<Eye className="w-4 h-4" />}>
          <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
        </SettingRow>
      </div>
      <div className="card rounded-[20px] p-4 space-y-2">
        <p className="label-section mb-2">Account</p>
        {[
          { label: "Edit Profile", action: () => navigate("/profile/avatar") },
          { label: "Import Data", action: () => navigate("/profile/import") },
          { label: "Notifications", action: () => navigate("/notifications") },
        ].map((r) => (
          <motion.button
            key={r.label}
            whileTap={{ scale: 0.97 }}
            onClick={r.action}
            className="w-full flex items-center justify-between p-3 rounded-2xl"
            style={{ background: "var(--s2)" }}
          >
            <p className="text-sm text-[var(--t1)]">{r.label}</p>
            <ChevronRight className="w-4 h-4 text-[var(--t3)]" />
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            signOut();
            navigate("/login", { replace: true });
          }}
          className="w-full flex items-center gap-3 p-3 rounded-2xl mt-1 text-destructive bg-destructive/10 border border-destructive/20"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-semibold">Sign Out</p>
        </motion.button>
      </div>
    </div>
  );
};

const SettingRow = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="text-[var(--t2)]">{icon}</span>
      <p className="text-sm text-[var(--t1)]">{label}</p>
    </div>
    {children}
  </div>
);
