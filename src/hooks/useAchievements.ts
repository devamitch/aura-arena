// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useAchievements
// Checks achievement conditions after every significant action and dispatches
// unlock events to the store. Fully functional, zero classes.
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useStore } from '@store';
import { ACHIEVEMENTS } from '@utils/constants';
import type { AchievementTrigger, AchievementContext } from '@services/achievementService';
import { checkAchievements } from '@services/achievementService';

export const useAchievements = () => {
  const earnedAchievements = useStore((s) => s.earnedAchievements);
  const unlockAchievement   = useStore((s) => s.unlockAchievement);
  const addNotification     = useStore((s) => s.addNotification);
  const xp                  = useStore((s) => s.xp);
  const dailyStreak         = useStore((s) => s.dailyStreak);
  const sessionHistory      = useStore((s) => s.sessionHistory);

  const check = useCallback((trigger: AchievementTrigger, extra: Partial<AchievementContext> = {}) => {
    const ctx: AchievementContext = {
      trigger,
      xp,
      dailyStreak,
      sessionsCompleted: sessionHistory.length,
      earnedAchievements,
      ...extra,
    };

    const newlyUnlocked = checkAchievements(ctx);

    newlyUnlocked.forEach((id) => {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      if (!achievement) return;
      unlockAchievement(id);
      addNotification({
        type: 'achievement',
        title: `🏆 ${achievement.name}`,
        body: achievement.description,
        data: { achievementId: id, rarity: achievement.rarity },
        isRead: false,
      });
    });

    return newlyUnlocked;
  }, [xp, dailyStreak, sessionHistory.length, earnedAchievements, unlockAchievement, addNotification]);

  const isEarned = useCallback((id: string) => earnedAchievements.includes(id), [earnedAchievements]);

  const getEarnedAchievements = useCallback(() =>
    ACHIEVEMENTS.filter((a) => earnedAchievements.includes(a.id)),
  [earnedAchievements]);

  const getLockedAchievements = useCallback(() =>
    ACHIEVEMENTS.filter((a) => !earnedAchievements.includes(a.id) && !a.secret),
  [earnedAchievements]);

  return { check, isEarned, getEarnedAchievements, getLockedAchievements };
};
