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
  const { accentColor, statLabels } = personalization;

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
          className="rounded-[24px] p-6 text-center"
          style={{
            background: `${accentColor}0d`,
            border: `1px solid ${accentColor}28`,
          }}
        >
          <p className="label-section mb-3">Session Complete</p>
          <ArcGauge
            value={currentScore.overall}
            size={120}
            strokeWidth={10}
            color={accentColor}
          />
          <p className="label-hud mt-3 text-[var(--t2)]">
            {mm}:{ss} · {DIFF[diff]} · {drill?.name ?? "Freestyle"}
          </p>
        </div>

        {/* metrics */}
        <div
          className="rounded-[20px] p-4"
          style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
        >
          <p className="label-section mb-3">Breakdown</p>
          <MetricsPanel
            score={currentScore}
            statLabels={Object.values(statLabels)}
          />
        </div>

        {/* AI coach */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              background: `${accentColor}0d`,
              borderBottom: "1px solid var(--b1)",
            }}
          >
            <Sparkles
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: accentColor }}
            />
            <p className="label-section">AI Coach</p>
          </div>
          <div className="p-4">
            {coachAI.loading ? (
              <div className="space-y-2">
                <div className="h-3 rounded anim-shimmer" />
                <div className="h-3 w-3/4 rounded anim-shimmer" />
              </div>
            ) : (
              <p className="text-sm text-[var(--t2)] leading-relaxed">
                {coachAI.text ||
                  "Complete another session to get personalised feedback."}
              </p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="grid grid-cols-3 gap-2.5">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              resetSession();
            }}
            className="py-3.5 rounded-2xl font-display font-bold text-sm flex flex-col items-center gap-1"
            style={{
              background: "var(--s2)",
              border: "1px solid var(--b1)",
              color: "var(--t2)",
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Again
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              resetSession();
              navigate("/arena");
            }}
            className="py-3.5 rounded-2xl font-display font-bold text-sm col-span-2"
            style={{
              background: `linear-gradient(145deg,${accentColor},${accentColor}aa)`,
              color: "#040610",
            }}
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
