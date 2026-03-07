import { generateDailyTip, generateTrainingPlan } from "@lib/gemini";
import {
  buildGemmaDailyTipPrompt,
  inferWithBestModel,
} from "@lib/mediapipe/onDeviceLLM";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { Skeleton } from "@shared/components/ui/Skeleton";
import { useSessionHistory, useUser } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import { getDiscipline } from "@utils/constants/disciplines";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Pin, PinOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface CoachingEntry {
  id: string;
  date: string;
  score: number;
  text: string;
  pinned: boolean;
}

// ─── COACH CARD ───────────────────────────────────────────────────────────────

function CoachCard({
  disc,
  onRegenerate,
  loading,
}: {
  disc: ReturnType<typeof getDiscipline>;
  onRegenerate: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="bg-s1 border rounded-xl p-4"
      style={{ borderColor: `${disc.color}30` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: disc.bg, border: `2px solid ${disc.color}50` }}
        >
          <DynamicIcon
            name={disc.icon}
            className="w-7 h-7"
            style={{ color: disc.color }}
          />
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-t1 text-lg">
            Coach {disc.name}
          </p>
          <p className="text-xs text-t2 capitalize">
            {disc.coachingTone} · {disc.name} Specialist
          </p>
          <p className="text-[10px] text-t3 mt-0.5">
            AI-powered · Personalized to you
          </p>
        </div>
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="p-2 rounded-lg border border-b1 text-t2 hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}

// ─── DAILY MESSAGE ────────────────────────────────────────────────────────────

function DailyMessage({
  disc,
  streak,
  avgScore,
}: {
  disc: ReturnType<typeof getDiscipline>;
  streak: number;
  avgScore: number;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prompt = buildGemmaDailyTipPrompt(
      disc.id as any,
      undefined,
      streak,
      avgScore,
    );
    inferWithBestModel(prompt, () =>
      generateDailyTip(disc.id as any, undefined, streak, avgScore),
    ).then((msg) => {
      setMessage(msg);
      setLoading(false);
    });
  }, [disc.id, streak, avgScore]);

  return (
    <div className="bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl overflow-hidden">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white leading-none">
            AI Coach
          </h1>
          <p className="text-[10px] font-mono text-t3 uppercase tracking-[0.3em] mt-1.5 opacity-70">
            Personal Performance Insights
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl glass p-2 border-white/10 overflow-hidden">
          <img
            src={PREMIUM_ASSETS.ATMOSPHERE.AURA_LOGO}
            alt="Coach"
            className="w-full h-full object-contain p-3"
          />
        </div>
      </div>
      <div
        className="px-4 py-2 border-b border-b1 flex items-center gap-2"
        style={{ background: `${disc.color}10` }}
      >
        <DynamicIcon
          name={disc.icon}
          className="w-3.5 h-3.5"
          style={{ color: disc.color }}
        />
        <p className="text-xs font-mono text-t2 uppercase tracking-widest">
          Today's Message from Coach
        </p>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        ) : (
          <p className="text-sm text-t1 leading-relaxed italic">"{message}"</p>
        )}
      </div>
    </div>
  );
}

// ─── 5-DAY PLAN ───────────────────────────────────────────────────────────────

function TrainingPlan({ disc }: { disc: ReturnType<typeof getDiscipline> }) {
  const [plan, setPlan] = useState<{
    days: Array<{ day: string; goal: string; drills: string[] }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await generateTrainingPlan(
        disc.id as any,
        undefined,
        "intermediate",
        5,
        75,
      );
      setPlan({ days: result.map((d) => ({ ...d, day: d.day.toString() })) });
    } catch {
      // Fallback plan
      setPlan({
        days: [
          {
            day: "Monday",
            goal: "Foundation & Form",
            drills: ["Basic Stance", "Core Activation", "Breathing Technique"],
          },
          {
            day: "Tuesday",
            goal: "Power Development",
            drills: ["Power Drills", "Explosive Sets", "Recovery Stretch"],
          },
          {
            day: "Wednesday",
            goal: "Technique Focus",
            drills: ["Slow Motion Practice", "Mirror Work", "Film Review"],
          },
          {
            day: "Thursday",
            goal: "Endurance Building",
            drills: ["Extended Circuits", "Cardio Integration", "Cool Down"],
          },
          {
            day: "Friday",
            goal: "Performance Testing",
            drills: [
              "Max Score Challenge",
              "Competition Simulation",
              "Session Review",
            ],
          },
        ],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disc.id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-mono text-t3 uppercase tracking-widest">
          5-Day Training Plan
        </p>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Regenerate
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : plan ? (
        <div className="space-y-2">
          {plan.days.map((day, i) => (
            <div
              key={i}
              className="bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                  style={{ background: `${disc.color}20`, color: disc.color }}
                >
                  D{i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-t1">{day.day}</p>
                  <p className="text-xs text-t2">{day.goal}</p>
                </div>
                {expanded === i ? (
                  <ChevronUp className="w-4 h-4 text-t3" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-t3" />
                )}
              </button>
              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0 border-t border-b1/50 space-y-1.5">
                      {day.drills.map((drill, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: disc.color }}
                          />
                          <p className="text-sm text-t2">{drill}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── COACHING HISTORY ─────────────────────────────────────────────────────────

function CoachingHistory({
  sessions,
  accentColor,
}: {
  sessions: ReturnType<typeof useSessionHistory>;
  accentColor: string;
}) {
  const [entries, setEntries] = useState<CoachingEntry[]>(() =>
    sessions.slice(0, 10).map((s, i) => ({
      id: s.id,
      date: new Date(s.createdAt).toLocaleDateString(),
      score: s.score,
      text:
        s.coachingText ||
        "Great session! Keep refining your form and push for consistency.",
      pinned: i === 0,
    })),
  );

  const togglePin = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)),
    );
  };

  const sorted = [...entries].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl">
        <p className="text-t3 text-sm">
          Complete sessions to build your coaching history
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-3">
        Coaching History
      </p>
      <div className="space-y-2">
        {sorted.map((entry) => (
          <div
            key={entry.id}
            className="bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl p-3"
            style={entry.pinned ? { borderColor: `${accentColor}40` } : {}}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {entry.pinned && (
                  <Pin className="w-3 h-3" style={{ color: accentColor }} />
                )}
                <span className="text-[10px] font-mono text-t3">
                  {entry.date}
                </span>
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: accentColor }}
                >
                  {entry.score} pts
                </span>
              </div>
              <button
                onClick={() => togglePin(entry.id)}
                className="p-1 text-t3 hover:text-t1 transition-colors"
              >
                {entry.pinned ? (
                  <PinOff className="w-3.5 h-3.5" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-t2 leading-relaxed">{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COACH TAB ───────────────────────────────────────────────────────────

export function ProfileCoachTab() {
  const user = useUser();
  const sessions = useSessionHistory();
  const disc = user ? getDiscipline(user.discipline) : getDiscipline("boxing");
  const [regenLoading, setRegenLoading] = useState(false);

  const avgScore =
    sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.score, 0) / sessions.length)
      : 50;

  const handleRegenerate = async () => {
    setRegenLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setRegenLoading(false);
  };

  return (
    <div className="p-4 space-y-5 pb-12">
      <CoachCard
        disc={disc}
        onRegenerate={handleRegenerate}
        loading={regenLoading}
      />
      <DailyMessage
        disc={disc}
        streak={user?.dailyStreak ?? 0}
        avgScore={avgScore}
      />
      <TrainingPlan disc={disc} />
      <CoachingHistory sessions={sessions} accentColor={disc.color} />
    </div>
  );
}
