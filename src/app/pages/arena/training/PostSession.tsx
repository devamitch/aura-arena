import { MetricsPanel } from "@features/arena/components/MetricsPanel";
import type { CoachFeedback } from "@hooks/useAI";
import type { Score } from "@hooks/useCamera";
import type { Personalization } from "@hooks/usePersonalization";
import { ArcGauge } from "@shared/components/ui/ArcGauge";
import { useSelectedDifficulty, useSelectedDrill, useStore } from "@store";
import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PostSessionProps {
  personalization: Personalization;
  coachAI: CoachFeedback;
  currentScore: Score;
  sessionTimer: number;
}

const DIFF = ["", "Beginner", "Easy", "Medium", "Hard", "Elite"] as const;

export function PostSession({
  personalization,
  coachAI,
  currentScore,
  sessionTimer,
}: PostSessionProps) {
  const navigate = useNavigate();
  const { resetSession } = useStore();
  const drill = useSelectedDrill();
  const diff = useSelectedDifficulty();
  const { statLabels } = personalization;

  const mm = String(Math.floor(sessionTimer / 60)).padStart(2, "0");
  const ss = String(sessionTimer % 60).padStart(2, "0");

  return (
    <div className="flex-1 overflow-y-auto scroll-none pb-safe pb-8 px-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="space-y-4 pt-4"
      >
        {/* score card */}
        <div
          className="rounded-[32px] p-8 text-center relative overflow-hidden group border border-[#00f0ff]/30 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(0,240,255,0.05)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(8, 20, 25, 0.95), rgba(4, 10, 15, 0.98))",
          }}
        >
          <div className="absolute top-0 inset-x-8 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/80 to-transparent" />

          <p className="text-[12px] font-bold text-[#00f0ff] uppercase tracking-widest mb-6">
            Session Complete
          </p>
          <ArcGauge
            value={currentScore.overall}
            size={160}
            strokeWidth={12}
            color="#00f0ff"
          />
          <p className="text-[14px] font-bold text-white mt-6 tracking-wide drop-shadow-md">
            {mm}:{ss} · {DIFF[diff]} ·{" "}
            <span className="text-[#00f0ff]">{drill?.name ?? "Freestyle"}</span>
          </p>
        </div>

        {/* metrics */}
        <div
          className="rounded-[24px] p-5 border border-[#00f0ff]/20 bg-[#06191f]/40 relative overflow-hidden"
          style={{
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,240,255,0.02)",
          }}
        >
          <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />
          <p className="text-[11px] font-bold text-[#00f0ff]/80 tracking-widest uppercase mb-4 px-1">
            Breakdown
          </p>
          <MetricsPanel
            score={currentScore}
            statLabels={Object.values(statLabels)}
          />
        </div>

        {/* AI coach */}
        <div
          className="rounded-[24px] overflow-hidden border border-[#00f0ff]/30 relative shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          style={{
            background:
              "linear-gradient(180deg, rgba(6, 25, 31, 0.8) 0%, rgba(2, 10, 13, 0.9) 100%)",
          }}
        >
          <div className="px-5 py-4 flex items-center gap-3 border-b border-[#00f0ff]/20 bg-[#00f0ff]/5">
            <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" />
            <p className="text-[11px] font-bold text-[#00f0ff] tracking-widest uppercase">
              AI Coach
            </p>
          </div>
          <div className="p-5">
            {coachAI.loading ? (
              <div className="space-y-3">
                <div className="h-3 rounded anim-shimmer bg-[#00f0ff]/20" />
                <div className="h-3 w-3/4 rounded anim-shimmer bg-[#00f0ff]/10" />
              </div>
            ) : (
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                {coachAI.text ||
                  "Complete another session to get personalised feedback."}
              </p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              resetSession();
            }}
            className="py-4 rounded-[20px] font-bold text-sm flex flex-col items-center gap-1.5 border border-[#00f0ff]/30 bg-[#020a0d] text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.1)]"
          >
            <RotateCcw className="w-5 h-5" />
            Again
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              resetSession();
              navigate("/arena");
            }}
            className="py-4 rounded-[20px] font-bold text-[15px] col-span-2 tracking-wide shadow-[0_5px_20px_rgba(0,240,255,0.4)] hover:shadow-[0_5px_30px_rgba(0,240,255,0.6)] transition-shadow"
            style={{
              background: "#00f0ff",
              color: "#020a0d",
            }}
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
