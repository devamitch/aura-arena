// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Profile Page (premium rebuild)
// ═══════════════════════════════════════════════════════════════════════════════

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
import {
  COACH_IMAGES,
  DISCIPLINE_ATHLETE,
  PREMIUM_ASSETS,
  TIER_BADGE,
  pickImage,
} from "@utils/assets";
import { ACHIEVEMENTS } from "@utils/constants";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  Bell,
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Shared card style ──────────────────────────────────────────────────────────
const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
};

// ── Page ───────────────────────────────────────────────────────────────────────

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

  const athleteImg =
    DISCIPLINE_ATHLETE[user?.discipline ?? "boxing"] ??
    PREMIUM_ASSETS.ATHLETES.BOXER;
  const firstName = (user?.arenaName || user?.displayName || "Athlete").split(
    " ",
  )[0];

  return (
    <div className="page pb-safe" style={{ background: "#040610" }}>
      {/* ── Hero Header ── */}
      <div className="relative h-52 overflow-hidden flex-shrink-0">
        {/* Background image */}
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,6,16,0.4) 0%, rgba(4,6,16,0.7) 60%, rgba(4,6,16,1) 100%)",
          }}
        />
        {/* Profile glow */}
        <img
          src={PREMIUM_ASSETS.ATMOSPHERE.PROFILE_GLOW}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen pointer-events-none"
        />

        {/* Edit button */}
        <button
          onClick={() => navigate("/profile/avatar")}
          className="absolute top-10 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Edit2 className="w-4 h-4 text-white/70" />
        </button>

        {/* Athlete portrait - right side */}
        <div
          className="absolute right-0 top-0 bottom-0 w-2/5 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to left, black 0%, transparent 80%)",
            WebkitMaskImage:
              "linear-gradient(to left, black 0%, transparent 80%)",
          }}
        >
          <img
            src={athleteImg}
            alt=""
            className="w-full h-full object-cover object-top opacity-80"
          />
        </div>

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <div className="flex items-end gap-3">
            {/* Avatar circle */}
            <div
              className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-xl"
              style={{
                background: `${accentColor}18`,
                border: `2px solid ${accentColor}40`,
                color: accentColor,
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
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-white truncate">
                  {firstName}
                </h1>
                <TierBadge tier={currentTier.id} />
              </div>
              <p className="text-xs text-white/40 font-mono">
                {subDiscipline?.name ?? disc.name} ·{" "}
                <span style={{ color: accentColor }}>
                  {xp.toLocaleString()} XP
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="flex gap-1 px-4 py-2 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <motion.button
            key={id}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTab(id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={
              tab === id
                ? {
                    background: accentColor,
                    color: "#040610",
                    boxShadow: `0 0 16px ${accentColor}50`,
                  }
                : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.35)",
                  }
            }
          >
            <Icon className="w-3 h-3" />
            {label}
          </motion.button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto px-4">
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
            {tab === "coach" && <CoachTab accentColor={accentColor} />}
            {tab === "trophies" && <TrophiesTab accentColor={accentColor} />}
            {tab === "settings" && <SettingsTab navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

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
    <div className="space-y-3 pt-4 pb-4">
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: user?.sessionsCompleted ?? 0, l: "Sessions" },
          { v: user?.pveWins ?? 0, l: "PvE Wins" },
          { v: user?.bestScore ?? 0, l: "Best Score" },
          {
            v: xp > 999 ? `${(xp / 1000).toFixed(1)}k` : xp,
            l: "Total XP",
            c: accentColor,
          },
          { v: `${user?.dailyStreak ?? 0}🔥`, l: "Streak" },
          { v: Math.round(avgScore), l: "Avg Score", c: accentColor },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl p-3 text-center"
            style={cardStyle}
          >
            <p
              className="font-black text-2xl leading-none tabular-nums"
              style={{ color: (s as any).c || "white" }}
            >
              {s.v}
            </p>
            <p className="text-[10px] text-white/35 font-mono uppercase tracking-wider mt-1">
              {s.l}
            </p>
          </div>
        ))}
      </div>

      {/* Tier progress */}
      {nextTier && (
        <div className="rounded-2xl p-4" style={cardStyle}>
          <div className="flex justify-between mb-3">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1">
              <img
                src={
                  TIER_BADGE[currentTier.id] || PREMIUM_ASSETS.BADGES.BEGINNER
                }
                alt=""
                className="w-4 h-4 rounded-full object-cover"
              />{" "}
              {currentTier.name}
            </span>
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1">
              <img
                src={
                  TIER_BADGE[nextTier.id] || PREMIUM_ASSETS.BADGES.INTERMEDIATE
                }
                alt=""
                className="w-4 h-4 rounded-full object-cover"
              />{" "}
              {nextTier.name}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor}99, ${accentColor})`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${tierProgress}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="text-[10px] text-white/30 font-mono mt-2 text-right">
            {Math.round(tierProgress)}% to {nextTier.name}
          </p>
        </div>
      )}

      {/* Score chart */}
      {chart.length >= 3 && (
        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-4">
            Score Trend
          </p>
          <ResponsiveContainer width="100%" height={90}>
            <LineChart data={chart}>
              <XAxis dataKey="i" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                contentStyle={{
                  background: "#0a0d1a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  fontSize: 11,
                  color: "white",
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

// ── Stats Tab ──────────────────────────────────────────────────────────────────

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
    <div className="space-y-3 pt-4 pb-4">
      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-4">
          This Week
        </p>
        <div className="flex items-end justify-between gap-1.5 h-24">
          {weekly.map((d) => (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <motion.div
                className="w-full rounded-t-lg"
                style={{
                  background: d.count ? accentColor : "rgba(255,255,255,0.07)",
                  minHeight: 6,
                  flex: 1,
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.05, duration: 0.5 }}
              />
              <p className="text-[9px] text-white/30 font-mono">{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      {sessions.length === 0 && (
        <p className="text-center text-white/30 text-sm py-12">
          Train to see stats
        </p>
      )}
    </div>
  );
};

// ── Coach Tab ──────────────────────────────────────────────────────────────────

const CoachTab = ({ accentColor }: { accentColor: string }) => {
  const { discipline: disc, subDiscipline } = usePersonalization();
  const user = useUser();
  const {
    text: tip,
    loading: tipL,
    refresh,
  } = useDailyTip(disc.id, subDiscipline?.id);
  const { plan, loading: planL } = useTrainingPlan(disc.id, subDiscipline?.id);

  // Cycle through all images for the selected coach every 3s
  const coachName = user?.aiCoachName || "Sensei";
  const coachImages = COACH_IMAGES[coachName] ?? COACH_IMAGES.Sensei;
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    if (coachImages.length <= 1) return;
    const t = setInterval(() => setImgIdx((i) => i + 1), 3000);
    return () => clearInterval(t);
  }, [coachImages.length]);
  const coachImg = pickImage(coachImages, imgIdx);

  return (
    <div className="space-y-3 pt-4 pb-4">
      {/* Coach card */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={cardStyle}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}25`,
          }}
        >
          <img src={coachImg} alt="" className="w-11 h-11 object-contain" />
        </div>
        <div>
          <p className="font-black text-white text-base">
            {user?.aiCoachName ?? "Coach"}
          </p>
          <p className="text-xs text-white/40 font-mono mt-0.5 capitalize">
            {disc.coachingTone} · {disc.name}
          </p>
        </div>
      </div>

      {/* Daily tip */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Today's Message
          </p>
          <motion.button
            whileTap={{ scale: 0.8, rotate: 180 }}
            onClick={refresh}
            className="text-white/30 text-sm"
          >
            ↻
          </motion.button>
        </div>
        <p className="px-4 py-4 text-sm text-white/55 leading-relaxed italic">
          {tipL ? (
            <span
              className="block h-4 rounded animate-pulse"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          ) : tip ? (
            `"${tip}"`
          ) : (
            "..."
          )}
        </p>
      </div>

      {/* Weekly plan */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Weekly Plan
          </p>
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
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="font-mono text-[10px] font-bold mb-1.5"
                  style={{ color: accentColor }}
                >
                  DAY {day.day} · {day.goal.toUpperCase()}
                </p>
                {day.drills.map((d, i) => (
                  <p key={i} className="text-xs text-white/40">
                    · {d}
                  </p>
                ))}
              </div>
            ))
          ) : (
            <p className="text-center text-white/30 text-sm py-4">
              Generating plan…
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Trophies Tab ───────────────────────────────────────────────────────────────

const TrophiesTab = ({ accentColor: _ }: { accentColor: string }) => {
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
    <div className="space-y-5 pt-4 pb-4">
      <p className="text-xs font-mono text-white/40 uppercase tracking-wider">
        {earned.length}/{ACHIEVEMENTS.length} Unlocked
      </p>
      {cats.map((cat) => {
        const list = ACHIEVEMENTS.filter((a) => a.category === cat);
        if (!list.length) return null;
        const unlocked = list.filter((a) => earned.includes(a.id));
        return (
          <div key={cat}>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2.5">
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
                    className="rounded-2xl p-3 text-center"
                    style={
                      on
                        ? {
                            background: `${c}0f`,
                            border: `1px solid ${c}35`,
                            boxShadow: `0 0 12px ${c}12`,
                          }
                        : {
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            opacity: 0.35,
                          }
                    }
                  >
                    <div className="flex h-8 w-full justify-center opacity-90 items-center">
                      {a.secret && !on ? (
                        <span className="text-2xl">❓</span>
                      ) : (
                        <img
                          src={a.icon}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                          style={{ boxShadow: `0 0 10px ${c}30` }}
                        />
                      )}
                    </div>
                    <p
                      className="font-mono text-[9px] font-bold mt-1 leading-tight"
                      style={{ color: on ? c : "rgba(255,255,255,0.3)" }}
                    >
                      {a.secret && !on ? "???" : a.name}
                    </p>
                    {on && (
                      <p className="text-[9px] text-white/30 font-mono mt-0.5">
                        +{a.xpReward}XP
                      </p>
                    )}
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

// ── Settings Tab ───────────────────────────────────────────────────────────────

const SettingsTab = ({ navigate }: { navigate: any }) => {
  const { setSoundEnabled, setReduceMotion, setMasterVolume, signOut } =
    useStore();
  const soundEnabled = useSoundEnabled();
  const reduceMotion = useReduceMotion();
  const masterVolume = useMasterVolume();

  return (
    <div className="space-y-4 pt-4 pb-4">
      {/* Audio */}
      <Section label="Audio">
        <SettingRow
          label="Sound Effects"
          icon={<Volume2 className="w-4 h-4" />}
        >
          <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
        </SettingRow>
        {soundEnabled && (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <p className="text-xs text-white/40">Volume</p>
              <p className="font-mono text-xs text-white/40">
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
      </Section>

      {/* Accessibility */}
      <Section label="Accessibility">
        <SettingRow label="Reduce Motion" icon={<Eye className="w-4 h-4" />}>
          <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
        </SettingRow>
      </Section>

      {/* Account */}
      <Section label="Account">
        {[
          {
            label: "Edit Profile",
            icon: <Edit2 className="w-4 h-4" />,
            action: () => navigate("/profile/avatar"),
          },
          {
            label: "Notifications",
            icon: <Bell className="w-4 h-4" />,
            action: () => navigate("/notifications"),
          },
        ].map((r) => (
          <motion.button
            key={r.label}
            whileTap={{ scale: 0.97 }}
            onClick={r.action}
            className="w-full flex items-center gap-3 py-3 rounded-xl text-left transition-colors hover:bg-white/5"
          >
            <span className="text-white/40">{r.icon}</span>
            <p className="text-sm text-white flex-1">{r.label}</p>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </motion.button>
        ))}
        {/* Divider */}
        <div
          className="h-px my-1"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            signOut();
            navigate("/login", { replace: true });
          }}
          className="w-full flex items-center gap-3 py-3 rounded-xl text-left"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <p className="text-sm font-semibold text-red-500">Sign Out</p>
        </motion.button>
      </Section>

      {/* Version */}
      <p className="text-center text-[10px] font-mono text-white/15 pt-2">
        Aura Arena v1.0.0
      </p>
    </div>
  );
};

// ── UI Primitives ──────────────────────────────────────────────────────────────

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl p-4" style={cardStyle}>
    <p className="text-[10px] font-mono text-white/35 uppercase tracking-wider mb-4">
      {label}
    </p>
    <div className="space-y-3">{children}</div>
  </div>
);

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
      <span className="text-white/40">{icon}</span>
      <p className="text-sm text-white">{label}</p>
    </div>
    {children}
  </div>
);
