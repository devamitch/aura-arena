import type { FrameScore } from "@types";
import { motion } from "framer-motion";
import { Activity, Crosshair, Scale, Target, Wind, Zap } from "lucide-react";

interface MetricsPanelProps {
  score: FrameScore;
  statLabels?: string[];
  compact?: boolean;
}

export function MetricsPanel({
  score,
  statLabels = [],
  compact = false,
}: MetricsPanelProps) {
  const metrics = [
    {
      label: statLabels[0] || "Accuracy",
      value: score.accuracy,
      icon: Target,
      color: "text-blue-400",
    },
    {
      label: statLabels[1] || "Stability",
      value: score.stability,
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: statLabels[2] || "Timing",
      value: score.timing,
      icon: Zap,
      color: "text-accent",
    },
    {
      label: statLabels[3] || "Energy",
      value: score.expressiveness,
      icon: Wind,
      color: "text-purple-400",
    },
    {
      label: statLabels[4] || "Power",
      value: score.power,
      icon: Crosshair,
      color: "text-accent",
    },
    {
      label: statLabels[5] || "Balance",
      value: score.balance,
      icon: Scale,
      color: "text-cyan-400",
    },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {metrics.slice(0, 3).map((m, i) => (
          <div key={i} className="glass rounded-xl p-2 text-center border-none">
            <p className="label-hud text-[8px] mb-1">{m.label}</p>
            <p
              className="font-display font-bold text-lg leading-none"
              style={{ color: "var(--ac)" }}
            >
              {m.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative group"
        >
          <div className="flex justify-between items-center mb-1.5 px-1">
            <div className="flex items-center gap-2">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="label-section text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                {m.label}
              </span>
            </div>
            <span className="font-mono text-xs font-bold tabular">
              {m.value}%
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-s3 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.value}%` }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "var(--primary-gradient)" }}
            />
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
