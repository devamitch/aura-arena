import { CameraView } from "@features/arena/components/CameraView";
import { DrillLibrary } from "@features/arena/components/DrillLibrary";
import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import type { CameraControls } from "@hooks/useCamera";
import type { Personalization } from "@hooks/usePersonalization";
import { useSelectedDifficulty, useSelectedDrill, useStore } from "@store";
import type { Discipline, SubDisciplineId } from "@types";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";

type Tab = "drill" | "style";

interface PreSessionProps {
  camera: CameraControls;
  personalization: Personalization;
  handleStart: () => void;
  lastGesture: {
    label: string;
    time: number;
  } | null;
  tab: Tab;
  setTab: (tab: Tab) => void;
  subId: SubDisciplineId | undefined;
  setSubId: (subId: SubDisciplineId | undefined) => void;
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

export function PreSession({
  camera,
  personalization,
  handleStart,
  lastGesture,
  tab,
  setTab,
  subId,
  setSubId,
}: PreSessionProps) {
  const drill = useSelectedDrill();
  const diff = useSelectedDifficulty();
  const { setDrill, setDifficulty } = useStore();
  const { discipline: disc, accentColor } = personalization;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* tab selector */}
      <div className="flex items-center gap-1 px-4 mb-3 flex-shrink-0">
        {(["drill", "style"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-2xl font-display font-bold text-sm transition-all"
            style={{
              background: tab === t ? accentColor : "var(--s2)",
              color: tab === t ? "#030510" : "var(--t3)",
              boxShadow: tab === t ? `0 0 24px ${accentColor}40` : "none",
              border: `1px solid ${tab === t ? "transparent" : "var(--b1)"}`,
            }}
          >
            {t === "drill" ? "Drill" : "Style"}
          </button>
        ))}
      </div>

      {/* tab content */}
      <div className="flex-1 overflow-y-auto px-4 scroll-none pb-4">
        <AnimatePresence mode="wait">
          {tab === "drill" ? (
            <motion.div
              key="drill"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
            >
              <DrillLibrary
                discipline={disc as Discipline}
                subDisciplineId={subId}
                selectedId={drill?.id}
                onSelect={setDrill}
                selectedDifficulty={diff}
                onDifficultyChange={setDifficulty}
              />
            </motion.div>
          ) : (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <SubDisciplineSelector
                disciplineId={disc.id}
                selected={subId}
                onSelect={setSubId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Camera Preview in Pre-phase */}
      <div className="px-4 mb-4 h-48 flex-shrink-0 relative">
        <CameraView
          camera={camera}
          accentColor={accentColor}
          showScore={false}
        />

        {/* Gesture Feedback Overlay */}
        <AnimatePresence>
          {lastGesture && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.2, y: -20 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <div className="glass-heavy border-white/20 rounded-[2rem] px-8 py-4 flex flex-col items-center gap-2 shadow-[0_0_50px_rgba(0,0,240,0.3)]">
                <Sparkles
                  className="w-10 h-10 animate-pulse"
                  style={{ color: accentColor }}
                />
                <p className="font-display font-black text-2xl text-white uppercase tracking-tighter">
                  {lastGesture.label.replace("_", " ")}!
                </p>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-60">
                  Aura Boost Activated
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* difficulty + start */}
      <div
        className="px-4 pb-safe pb-6 pt-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--b1)" }}
      >
        <div className="flex items-center gap-2 mb-3 overflow-x-auto scroll-none">
          {([1, 2, 3, 4, 5] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all"
              style={{
                background: diff === d ? DIFF_C[d] + "28" : "var(--s2)",
                border: `1px solid ${diff === d ? DIFF_C[d] + "55" : "var(--b1)"}`,
                color: diff === d ? DIFF_C[d] : "var(--t3)",
              }}
            >
              {DIFF[d]}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleStart}
          className="w-full py-4 rounded-[20px] font-display font-extrabold text-[17px] text-[#040610] flex items-center justify-center gap-2.5"
          style={{
            background: `linear-gradient(145deg,${accentColor},${accentColor}bb)`,
            boxShadow: `0 0 32px ${accentColor}55`,
          }}
        >
          <Play className="w-5 h-5 fill-current" />
          Start Session
        </motion.button>
      </div>
    </div>
  );
}
