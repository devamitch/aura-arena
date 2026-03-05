import { CameraView } from "@features/arena/components/CameraView";
import { MetricsPanel } from "@features/arena/components/MetricsPanel";
import type { CameraControls, Score } from "@hooks/useCamera";
import type { Personalization } from "@hooks/usePersonalization";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ActiveSessionProps {
  camera: CameraControls;
  personalization: Personalization;
  handleEnd: () => void;
  metricsOpen: boolean;
  setMetricsOpen: (open: boolean) => void;
  currentScore: Score;
  difficulty: number;
}

const DIFF = ["", "Beginner", "Easy", "Medium", "Hard", "Elite"] as const;
const DIFF_C = [
  "",
  "#3b82f6", // Blue
  "#22d3ee", // Cyan
  "#00f0ff", // Neon Cyan
  "#a855f7", // Purple
  "#ff00ff", // Magenta
] as const;

export function ActiveSession({
  camera,
  personalization,
  handleEnd,
  metricsOpen,
  setMetricsOpen,
  currentScore,
  difficulty,
}: ActiveSessionProps) {
  const { accentColor, statLabels } = personalization;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* camera fills most of the screen */}
      <div className="flex-1 px-3 pb-2">
        <CameraView
          camera={camera}
          score={currentScore}
          accentColor={accentColor}
          showScore
        />
      </div>

      {/* live score row */}
      <div className="flex items-center px-4 gap-3 py-2 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative">
            <p
              className="font-display font-extrabold text-4xl leading-none tabular"
              style={{ color: accentColor }}
            >
              {currentScore.overall}
            </p>
            {currentScore.combo >= 3 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-6 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-lg anim-combo"
                style={{
                  background: `${accentColor}30`,
                  color: accentColor,
                }}
              >
                {currentScore.combo}x
              </motion.span>
            )}
          </div>
          <div>
            <p className="label-hud">SCORE</p>
            <p
              className="label-hud mt-0.5"
              style={{ color: DIFF_C[difficulty] }}
            >
              {DIFF[difficulty]}
            </p>
          </div>
        </div>
        <button
          onClick={() => setMetricsOpen(!metricsOpen)}
          className="btn-icon w-9 h-9"
        >
          {metricsOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* collapsible metrics */}
      <AnimatePresence>
        {metricsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="px-4 overflow-hidden flex-shrink-0"
          >
            <div className="pb-3">
              <MetricsPanel
                score={currentScore}
                statLabels={Object.values(statLabels)}
                compact
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* end btn */}
      <div className="px-4 pb-safe pb-5 pt-2 flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleEnd}
          className="w-full py-3.5 rounded-[18px] font-display font-bold text-sm"
          style={{
            background: "rgba(239,68,68,.12)",
            border: "1px solid rgba(239,68,68,.3)",
            color: "#ef4444",
          }}
        >
          End Session
        </motion.button>
      </div>
    </div>
  );
}
