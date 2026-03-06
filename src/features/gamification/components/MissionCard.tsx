// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — MissionCard (Premium MusicX-inspired)
// ═══════════════════════════════════════════════════════════════════════════════

import { cn } from "@lib/utils";
import type { DailyMission } from "@types";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface MissionCardProps {
  mission: DailyMission;
  accentColor: string;
}

export const MissionCard = ({ mission, accentColor }: MissionCardProps) => {
  const pct =
    mission.target > 0
      ? Math.min(100, Math.round((mission.current / mission.target) * 100))
      : 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative overflow-hidden rounded-[20px] p-4 border transition-all",
        mission.complete
          ? "border-green-500/20"
          : "border-white/6",
      )}
      style={{
        background: mission.complete
          ? "rgba(34,197,94,0.05)"
          : "rgba(255,255,255,0.025)",
      }}
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 left-4 right-4 h-[1px]"
        style={{
          background: mission.complete
            ? "linear-gradient(to right, transparent, rgba(34,197,94,0.6), transparent)"
            : `linear-gradient(to right, transparent, ${accentColor}40, transparent)`,
        }}
      />

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 relative overflow-hidden"
          style={{
            background: mission.complete
              ? "rgba(34,197,94,0.10)"
              : `${accentColor}10`,
            border: `1px solid ${mission.complete ? "rgba(34,197,94,0.25)" : `${accentColor}20`}`,
          }}
        >
          {mission.complete ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : mission.icon.startsWith("http") ? (
            <img
              src={mission.icon}
              alt=""
              className="absolute inset-0 w-full h-full object-cover p-1.5"
            />
          ) : (
            <span className="text-base">{mission.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <p
              className={cn(
                "text-[13px] font-bold leading-none truncate",
                mission.complete ? "text-green-400" : "text-white",
              )}
            >
              {mission.name}
            </p>
            <span
              className="text-[10px] font-mono ml-2 flex-shrink-0 px-1.5 py-0.5 rounded-full"
              style={{
                background: mission.complete ? "rgba(34,197,94,0.1)" : `${accentColor}10`,
                color: mission.complete ? "#4ade80" : accentColor,
              }}
            >
              +{mission.reward} XP
            </span>
          </div>

          {!mission.complete && (
            <>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                    boxShadow: `0 0 8px ${accentColor}60`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="text-[9px] font-mono text-white/25 tabular-nums">
                {mission.current} / {mission.target}
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Re-export alias
export const AiCoachCard = MissionCard;
