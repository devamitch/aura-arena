// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — MissionCard + AiCoachCard (sub-export)
// ═══════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { DailyMission } from '@types';
import { cn } from '@lib/utils';

interface MissionCardProps {
  mission: DailyMission;
  accentColor: string;
}

export const MissionCard = ({ mission, accentColor }: MissionCardProps) => {
  const pct = mission.targetValue > 0
    ? Math.round((mission.currentValue / mission.targetValue) * 100)
    : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-2xl border transition-all',
        mission.completed
          ? 'border-green-500/25 bg-green-500/05'
          : 'bg-s1 border-b1'
      )}
    >
      {/* Icon circle */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{
          background: mission.completed ? 'rgba(34,197,94,0.12)' : `${accentColor}12`,
        }}
      >
        {mission.completed ? '✅' : mission.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className={cn('text-sm font-semibold leading-none',
            mission.completed ? 'text-green-400' : 'text-t1'
          )}>
            {mission.name}
          </p>
          <span className="text-[10px] font-mono text-t3 ml-2 flex-shrink-0">
            +{mission.rewardXP} XP
          </span>
        </div>

        {!mission.completed && (
          <div className="mt-1.5">
            <div className="h-1 bg-s2 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-[9px] font-mono text-t3 mt-0.5 tabular-nums">
              {mission.currentValue}/{mission.targetValue}
            </p>
          </div>
        )}
      </div>

      {mission.completed && (
        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
      )}
    </div>
  );
};

// Re-export alias
export const AiCoachCard = MissionCard;
