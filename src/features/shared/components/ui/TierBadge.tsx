import { memo } from 'react';
import { TIERS } from '@utils/constants';
import { getDiscipline } from '@utils/constants/disciplines';
import type { TierId, DisciplineId, Tier } from '@types';
import { cn } from '@lib/utils';

// ─── TIER BADGE ───────────────────────────────────────────────────────────────

interface TierBadgeProps {
  tier: TierId | Tier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TierBadge = memo(function TierBadge({ tier, size = 'md', className }: TierBadgeProps) {
  const tierData = typeof tier === 'string'
    ? (TIERS.find((t) => t.id === tier) ?? TIERS[0])
    : tier;
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-bold border', sizes[size], className)}
      style={{ color: tierData.color, borderColor: `${tierData.color}40`, background: `${tierData.color}15` }}
    >
      {tierData.icon} {size !== 'sm' && tierData.name}
    </span>
  );
});

// ─── DISCIPLINE BADGE ─────────────────────────────────────────────────────────

interface DisciplineBadgeProps {
  disciplineId: DisciplineId;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export const DisciplineBadge = memo(function DisciplineBadge({
  disciplineId, size = 'md', showName = true, className,
}: DisciplineBadgeProps) {
  const disc = getDiscipline(disciplineId);
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-bold border', sizes[size], className)}
      style={{ color: disc.color, borderColor: `${disc.color}40`, background: `${disc.color}15` }}
    >
      {disc.emoji} {showName && disc.name}
    </span>
  );
});
