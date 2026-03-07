// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Analysis Timeline Component
// Shows a per-second color-coded timeline of a session.
// Tapping a block reveals what happened at that moment.
// ═══════════════════════════════════════════════════════════════════════════════

import type { SecondAnalysis, SessionReport } from "@/lib/poseAnalyzer";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Clock, Star, TrendingUp } from "lucide-react";
import { useState } from "react";

interface AnalysisTimelineProps {
  report: SessionReport;
  accentColor: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#eab308"; // yellow
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
}

export function AnalysisTimeline({
  report,
  accentColor,
}: AnalysisTimelineProps) {
  const [selected, setSelected] = useState<SecondAnalysis | null>(null);

  return (
    <div className="w-full">
      {/* Summary Row */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs font-black uppercase tracking-widest text-white/50">
            Performance Timeline
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-black" style={{ color: accentColor }}>
            {report.overallScore}
          </span>
          <span className="text-[10px] text-white/30 font-mono">/100</span>
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="flex gap-[2px] w-full rounded-xl overflow-hidden mb-3">
        {report.timeline.map((sec) => (
          <motion.button
            key={sec.second}
            whileHover={{ scaleY: 1.5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() =>
              setSelected(selected?.second === sec.second ? null : sec)
            }
            className="flex-1 relative group"
            style={{
              height: 32,
              background: scoreColor(sec.score),
              opacity: sec.score === 0 ? 0.2 : 0.8,
              minWidth: 4,
            }}
          >
            {sec.isHighlight && (
              <Star
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 text-yellow-300"
                fill="currentColor"
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Time labels */}
      <div className="flex justify-between px-1 mb-4">
        <span className="text-[9px] font-mono text-white/25">0:00</span>
        <span className="text-[9px] font-mono text-white/25">
          {Math.floor(report.totalSeconds / 60)}:
          {String(report.totalSeconds % 60).padStart(2, "0")}
        </span>
      </div>

      {/* Selected Second Detail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/40" />
                <span className="text-sm font-mono font-bold text-white/80">
                  {Math.floor(selected.second / 60)}:
                  {String(selected.second % 60).padStart(2, "0")}
                </span>
              </div>
              <div
                className="px-3 py-1 rounded-full text-xs font-black"
                style={{
                  background: `${scoreColor(selected.score)}20`,
                  color: scoreColor(selected.score),
                  border: `1px solid ${scoreColor(selected.score)}40`,
                }}
              >
                {selected.score}/100
              </div>
            </div>

            <p className="text-xs text-white/60 font-medium mb-2">
              Detected:{" "}
              <span className="text-white/90 font-bold">
                {selected.exercise}
              </span>
            </p>

            {selected.issues.length > 0 && (
              <div className="space-y-1.5">
                {selected.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-red-300 leading-tight">
                      {issue}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {selected.issues.length === 0 && (
              <div className="flex items-center gap-2 text-green-400">
                <Star className="w-3 h-3" fill="currentColor" />
                <span className="text-[11px] font-bold">
                  Perfect form at this moment!
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Best & Worst Highlights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-green-400/60 mb-1">
            Best Moment
          </p>
          <p className="text-lg font-black text-green-400">
            {Math.floor(report.bestMoment.second / 60)}:
            {String(report.bestMoment.second % 60).padStart(2, "0")}
          </p>
          <p className="text-[10px] text-green-300/60">
            Score: {report.bestMoment.score}
          </p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[9px] font-mono uppercase tracking-widest text-red-400/60 mb-1">
            Needs Work
          </p>
          <p className="text-lg font-black text-red-400">
            {Math.floor(report.worstMoment.second / 60)}:
            {String(report.worstMoment.second % 60).padStart(2, "0")}
          </p>
          <p className="text-[10px] text-red-300/60">
            Score: {report.worstMoment.score}
          </p>
        </div>
      </div>
    </div>
  );
}
