// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — usePersonalization Hook (fully functional)
// Returns all discipline/sub-discipline aware config for the current user.
// ═══════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useUser, useTier, useXP, useDailyStreak, useStore, useEarnedAchievements, useSessionHistory } from '@store';
import { getDiscipline, getSubDiscipline, DISCIPLINES } from '@utils/constants/disciplines';
import { TIERS } from '@utils/constants';
import type { DisciplineId, SubDisciplineId, Discipline, SubDiscipline, Tier } from '@types';

export interface PersonalizationConfig {
  // Discipline
  discipline: Discipline;
  disciplineId: DisciplineId;
  subDiscipline: SubDiscipline | undefined;
  subDisciplineId: SubDisciplineId | undefined;

  // Tier
  currentTier: Tier;
  nextTier: Tier | null;
  tierProgress: number; // 0–100

  // Theme
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  particleColor: string;
  navActiveStyle: { color: string; textShadow: string; filter: string };

  // Content labels
  statLabels: Discipline['statLabels'];
  coachingTone: Discipline['coachingTone'];
  coachingPromptStyle: 'aggressive' | 'calm' | 'technical' | 'motivational' | 'spiritual' | 'rhythmic';
  drillLabel: string;
  challengeNoun: string;
  currentStyle: string;  // display name of current sub-style or discipline

  // Unlock gates
  pveUnlocked: boolean;
  liveUnlocked: boolean;
  leagueQualified: boolean;

  // Progress
  streak: number;
  xp: number;
  sessionsCount: number;
  avgScore: number;
  pveWins: number;
  bestScore: number;

  // Available sub-disciplines for this parent
  availableSubDisciplines: SubDiscipline[];
}

export const usePersonalization = (): PersonalizationConfig => {
  const user     = useUser();
  const tier     = useTier();
  const xp       = useXP();
  const streak   = useDailyStreak();
  const sessions = useSessionHistory();
  const earned   = useEarnedAchievements();

  return useMemo<PersonalizationConfig>(() => {
    const disciplineId: DisciplineId   = user?.discipline ?? 'boxing';
    const subDisciplineId              = user?.subDiscipline;
    const discipline                   = getDiscipline(disciplineId);
    const subDiscipline                = subDisciplineId ? getSubDiscipline(subDisciplineId) : undefined;

    // Tier objects
    const currentTierObj = TIERS.find((t) => t.id === tier) ?? TIERS[0];
    const tierIdx        = TIERS.findIndex((t) => t.id === tier);
    const nextTierObj    = tierIdx < TIERS.length - 1 ? TIERS[tierIdx + 1] : null;
    const tierProgress   = nextTierObj
      ? Math.round(((xp - currentTierObj.xpMin) / (nextTierObj.xpMin - currentTierObj.xpMin)) * 100)
      : 100;

    // Theme
    const accentColor  = discipline.color;
    const glowColor    = discipline.glow;
    const bgGradient   = `radial-gradient(ellipse at top, ${accentColor}15, transparent 60%)`;
    const particleColor = accentColor;
    const navActiveStyle = {
      color: accentColor,
      textShadow: `0 0 12px ${accentColor}`,
      filter: `drop-shadow(0 0 4px ${accentColor})`,
    };

    // Coaching tone mapping
    const coachingPromptStyle: PersonalizationConfig['coachingPromptStyle'] =
      discipline.coachingTone === 'aggressive'  ? 'aggressive'  :
      discipline.coachingTone === 'spiritual'   ? 'spiritual'   :
      discipline.coachingTone === 'rhythmic'    ? 'motivational':
      discipline.coachingTone === 'calm'        ? 'calm'        :
      discipline.coachingTone === 'technical'   ? 'technical'   : 'motivational';

    // Content labels
    const drillLabel    = discipline.id === 'bodybuilding' ? 'Pose-Down' :
                          discipline.id === 'yoga'         ? 'Practice'  :
                          discipline.id === 'dance'        ? 'Routine'   : 'Drill';
    const challengeNoun = discipline.challengeNames[0] ?? 'Challenge';
    const currentStyle  = subDiscipline?.name ?? discipline.name;

    // Unlock gates
    const pveUnlocked    = sessions.length >= 3;
    const liveUnlocked   = (user?.pveWins ?? 0) >= 1;
    const leagueQualified = (user?.averageScore ?? 0) >= 85 && (user?.pveWins ?? 0) >= 3;

    // Stats
    const avgScore   = user?.averageScore ?? 0;
    const pveWins    = user?.pveWins ?? 0;
    const bestScore  = user?.bestScore ?? 0;

    // Sub-disciplines available for this discipline
    const availableSubDisciplines = discipline.subDisciplines;

    return {
      discipline, disciplineId, subDiscipline, subDisciplineId,
      currentTier: currentTierObj, nextTier: nextTierObj, tierProgress,
      accentColor, glowColor, bgGradient, particleColor, navActiveStyle,
      statLabels: discipline.statLabels,
      coachingTone: discipline.coachingTone,
      coachingPromptStyle,
      drillLabel, challengeNoun, currentStyle,
      pveUnlocked, liveUnlocked, leagueQualified,
      streak, xp,
      sessionsCount: sessions.length,
      avgScore, pveWins, bestScore,
      availableSubDisciplines,
    };
  }, [user, tier, xp, streak, sessions.length, earned.length]);
};

// ─── CONVENIENCE HOOKS ────────────────────────────────────────────────────────

export const useAccentColor = () => {
  const user = useUser();
  return getDiscipline(user?.discipline ?? 'boxing').color;
};

export const useSubDisciplineList = (disciplineId: DisciplineId) =>
  useMemo(() => getDiscipline(disciplineId).subDisciplines, [disciplineId]);
