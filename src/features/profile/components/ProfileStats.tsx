import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import { useSessionHistory, useUser } from "@store";
import type { SessionData } from "@types";
import { getDiscipline } from "@utils/constants/disciplines";
import { motion } from "framer-motion";
import { useState } from "react";
import { useInView } from "react-intersection-observer";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGES = [7, 30, 90, -1] as const;
const RANGE_LABELS: Record<number, string> = {
  7: "7 sessions",
  30: "30 sessions",
  90: "90 sessions",
  [-1]: "All Time",
};

// ─── HEATMAP ──────────────────────────────────────────────────────────────────

function SessionHeatmap({
  sessions,
  accentColor,
}: {
  sessions: SessionData[];
  accentColor: string;
}) {
  const today = new Date();
  const weeks = 13; // ~3 months
  const days = weeks * 7;

  const sessionDates = new Set(sessions.map((s) => s.createdAt.split("T")[0]));
  const sessionsByDate = sessions.reduce<Record<string, number>>((acc, s) => {
    const d = s.createdAt.split("T")[0];
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});

  const grid: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    grid.push({ date: dateStr, count: sessionsByDate[dateStr] ?? 0 });
  }

  const maxCount = Math.max(...grid.map((g) => g.count), 1);

  return (
    <div>
      <p className="text-xs font-mono text-t3 mb-3 uppercase tracking-widest">
        Activity Last 3 Months
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: weeks }, (_, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-shrink-0">
            {grid.slice(wi * 7, wi * 7 + 7).map((cell, di) => (
              <div
                key={di}
                title={`${cell.date}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
                className="w-3 h-3 rounded-sm"
                style={{
                  background:
                    cell.count === 0
                      ? "#1a1c35"
                      : `${accentColor}${Math.round(
                          (cell.count / maxCount) * 200 + 55,
                        )
                          .toString(16)
                          .padStart(2, "0")}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-t3">Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((o) => (
          <div
            key={o}
            className="w-3 h-3 rounded-sm"
            style={{
              background: `${accentColor}${Math.round(o * 200 + 55)
                .toString(16)
                .padStart(2, "0")}`,
            }}
          />
        ))}
        <span className="text-[10px] text-t3">More</span>
      </div>
    </div>
  );
}

// ─── PERSONAL BESTS ───────────────────────────────────────────────────────────

function PersonalBests({
  sessions,
  accentColor,
}: {
  sessions: SessionData[];
  accentColor: string;
}) {
  if (sessions.length === 0) return null;

  const bests = {
    score: Math.max(...sessions.map((s) => s.score)),
    accuracy: Math.max(...sessions.map((s) => s.accuracy)),
    stability: Math.max(...sessions.map((s) => s.stability)),
    timing: Math.max(...sessions.map((s) => s.timing)),
    combo: Math.max(...sessions.map((s) => s.bestCombo)),
    streak: sessions.length,
  };

  const records = [
    { label: "Best Score", value: bests.score, unit: "pts", icon: "Zap" },
    {
      label: "Best Accuracy",
      value: bests.accuracy,
      unit: "%",
      icon: "Target",
    },
    {
      label: "Best Stability",
      value: bests.stability,
      unit: "%",
      icon: "Flower2",
    },
    { label: "Best Timing", value: bests.timing, unit: "%", icon: "Music" },
    { label: "Best Combo", value: bests.combo, unit: "x", icon: "Flame" },
    { label: "Total Sessions", value: bests.streak, unit: "", icon: "Trophy" },
  ];

  return (
    <div>
      <p className="text-xs font-mono text-t3 mb-3 uppercase tracking-widest">
        Personal Bests
      </p>
      <div className="grid grid-cols-2 gap-3">
        {records.map((r, i) => (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-s1 border border-b1 rounded-xl p-3"
            style={{ borderLeft: `3px solid ${accentColor}60` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <DynamicIcon
                name={r.icon}
                className="w-4 h-4"
                style={{ color: accentColor }}
              />
              <p className="text-[10px] text-t3 uppercase tracking-wide">
                {r.label}
              </p>
            </div>
            <p
              className="font-mono font-black text-t1"
              style={{ fontSize: 22, color: accentColor }}
            >
              {r.value}
              <span className="text-xs text-t3 ml-0.5">{r.unit}</span>
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── RADAR CHART ──────────────────────────────────────────────────────────────

function PerformanceRadar({
  sessions,
  accentColor,
}: {
  sessions: SessionData[];
  accentColor: string;
}) {
  if (sessions.length === 0) return null;

  const avg = (key: keyof SessionData) =>
    Math.round(
      sessions.reduce((a, s) => a + (s[key] as number), 0) / sessions.length,
    );

  const data = [
    { subject: "Score", value: avg("score"), fullMark: 100 },
    { subject: "Accuracy", value: avg("accuracy"), fullMark: 100 },
    { subject: "Stability", value: avg("stability"), fullMark: 100 },
    { subject: "Timing", value: avg("timing"), fullMark: 100 },
    {
      subject: "Combo",
      value: Math.min(100, avg("bestCombo") * 7),
      fullMark: 100,
    },
  ];

  return (
    <div>
      <p className="text-xs font-mono text-t3 mb-3 uppercase tracking-widest">
        Performance Profile
      </p>
      <div className="bg-s1 border border-b1 rounded-xl p-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#1e2035" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#6b7280", fontSize: 10 }}
            />
            <Radar
              dataKey="value"
              stroke={accentColor}
              fill={accentColor}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── COMPARATIVE STATS ────────────────────────────────────────────────────────

function ComparativeStats({
  sessions,
  accentColor,
}: {
  sessions: SessionData[];
  accentColor: string;
}) {
  if (sessions.length === 0) return null;

  const myAvgScore = Math.round(
    sessions.reduce((a, s) => a + s.score, 0) / sessions.length,
  );
  // Simulated discipline average
  const disciplineAvg = 67;

  const metrics = [
    { label: "Score", mine: myAvgScore, avg: disciplineAvg },
    {
      label: "Accuracy",
      mine: Math.round(
        sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length,
      ),
      avg: 65,
    },
    {
      label: "Stability",
      mine: Math.round(
        sessions.reduce((a, s) => a + s.stability, 0) / sessions.length,
      ),
      avg: 70,
    },
  ];

  return (
    <div>
      <p className="text-xs font-mono text-t3 mb-3 uppercase tracking-widest">
        You vs. Discipline Average
      </p>
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-s1 border border-b1 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-t2">{m.label}</span>
              <div className="flex gap-3 text-xs font-mono">
                <span style={{ color: accentColor }}>You: {m.mine}</span>
                <span className="text-t3">Avg: {m.avg}</span>
              </div>
            </div>
            <div className="relative h-2 bg-s2 rounded-full overflow-hidden">
              {/* Average line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-t3/60 z-10"
                style={{ left: `${m.avg}%` }}
              />
              {/* My bar */}
              <motion.div
                className="h-full rounded-full"
                style={{ background: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${m.mine}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN STATS TAB ───────────────────────────────────────────────────────────

export function ProfileStatsTab() {
  const [range, setRange] = useState<number>(30);
  const user = useUser();
  const sessions = useSessionHistory();
  const disc = user ? getDiscipline(user.discipline) : getDiscipline("boxing");
  const accentColor = disc.color;

  const { ref: chartRef, inView: chartVisible } = useInView({
    triggerOnce: true,
  });

  const rangedSessions = range === -1 ? sessions : sessions.slice(0, range);
  const chartData = rangedSessions
    .slice(0, 50)
    .reverse()
    .map((s, i) => ({
      session: i + 1,
      score: s.score,
      accuracy: s.accuracy,
    }));

  return (
    <div className="p-4 space-y-6 pb-12">
      {/* Score History Chart */}
      <div>
        {/* Range selector */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">
            Score History
          </p>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                  range === r ? "text-void" : "text-t3 bg-s1 border border-b1"
                }`}
                style={range === r ? { background: accentColor } : {}}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={chartRef}
          className="bg-s1 border border-b1 rounded-xl p-4 h-48"
        >
          {chartVisible && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={accentColor}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={accentColor}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1c35" />
                <XAxis
                  dataKey="session"
                  tick={{ fill: "#4a4e68", fontSize: 9 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#4a4e68", fontSize: 9 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0d0f1f",
                    border: `1px solid ${accentColor}30`,
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(v: number) => [`${v.toFixed(1)}`, "Score"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={accentColor}
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-t3 text-sm">
                Complete sessions to see your chart
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <SessionHeatmap sessions={sessions} accentColor={accentColor} />
      <PersonalBests sessions={rangedSessions} accentColor={accentColor} />
      <PerformanceRadar sessions={rangedSessions} accentColor={accentColor} />
      <ComparativeStats sessions={rangedSessions} accentColor={accentColor} />
    </div>
  );
}
