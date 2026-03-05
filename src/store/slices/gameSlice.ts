// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Game Slice
// XP, tier, missions, achievements, notifications, streaks
// ═══════════════════════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand';
import { nanoid } from 'nanoid';
import { TIERS, MISSION_TEMPLATES, WEEKLY_TEMPLATES, ACHIEVEMENTS } from '@utils/constants';
import { calcSessionXP, calcSessionPoints } from '@lib/scoreEngine';
import type {
  TierId, DailyMission, WeeklyChallenge, Notification,
  Achievement, SessionScoreSummary,
} from '@types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameSlice {
  // State
  xp: number;
  totalPoints: number;
  tier: TierId;
  dailyStreak: number;
  streakFreezeCount: number;
  lastActiveDate: string;
  dailyMissions: DailyMission[];
  weeklyChallenges: WeeklyChallenge[];
  earnedAchievements: string[];
  notifications: Notification[];
  unreadCount: number;
  pendingTierUp: TierId | null;

  // Actions
  addXP: (amount: number) => void;
  addPoints: (amount: number) => void;
  awardSessionXP: (summary: SessionScoreSummary, difficulty: number) => void;
  updateMissionProgress: (type: string, value: number) => void;
  unlockAchievement: (id: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  clearTierUp: () => void;
  updateStreak: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];
const weekStr  = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
};

const getTierForXP = (xp: number): TierId => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].xpMin) return TIERS[i].id;
  }
  return 'bronze';
};

const freshMissions = (): DailyMission[] =>
  [...MISSION_TEMPLATES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((t, i) => ({ ...t, id: i, current: 0, complete: false, missionDate: todayStr() }));

const freshChallenges = (): WeeklyChallenge[] =>
  [...WEEKLY_TEMPLATES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((t, i) => ({ ...t, id: i, current: 0, complete: false, weekStart: weekStr() }));

const staleMissions = (m: DailyMission[]) =>
  !m.length || m[0].missionDate !== todayStr() ? freshMissions() : m;

const staleChallenges = (c: WeeklyChallenge[]) =>
  !c.length || c[0].weekStart !== weekStr() ? freshChallenges() : c;

// ─── Slice Factory ────────────────────────────────────────────────────────────

export const createGameSlice: StateCreator<
  GameSlice,
  [['zustand/immer', never]],
  [],
  GameSlice
> = (set, get) => ({
  xp: 0,
  totalPoints: 0,
  tier: 'bronze',
  dailyStreak: 0,
  streakFreezeCount: 2,
  lastActiveDate: '',
  dailyMissions: freshMissions(),
  weeklyChallenges: freshChallenges(),
  earnedAchievements: [],
  notifications: [],
  unreadCount: 0,
  pendingTierUp: null,

  addXP: (amount) => set((s) => {
    s.xp += amount;
    const newTier = getTierForXP(s.xp);
    if (newTier !== s.tier) {
      s.tier = newTier;
      s.pendingTierUp = newTier;
    }
  }),

  addPoints: (amount) => set((s) => { s.totalPoints += amount; }),

  awardSessionXP: (summary, difficulty) => set((s) => {
    const xpGained     = calcSessionXP(summary, difficulty, s.dailyStreak);
    const pointsGained = calcSessionPoints(summary, difficulty);
    s.xp         += xpGained;
    s.totalPoints += pointsGained;
    const newTier = getTierForXP(s.xp);
    if (newTier !== s.tier) {
      s.tier = newTier;
      s.pendingTierUp = newTier;
      s.notifications.unshift({
        id: nanoid(), isRead: false, createdAt: new Date().toISOString(),
        type: 'tier',
        title: `🎉 Tier Up: ${newTier}!`,
        body: `You've reached ${newTier.toUpperCase()} tier. Keep crushing it!`,
      });
      s.unreadCount++;
    }
  }),

  updateMissionProgress: (type, value) => set((s) => {
    // Refresh stale missions first
    s.dailyMissions    = staleMissions(s.dailyMissions);
    s.weeklyChallenges = staleChallenges(s.weeklyChallenges);

    for (const m of s.dailyMissions) {
      if (m.complete || m.type !== type) continue;
      m.current = type === 'accuracy' || type === 'score'
        ? Math.max(m.current, value)
        : Math.min(m.target, m.current + value);
      if (m.current >= m.target) {
        m.complete = true;
        s.xp += m.reward;
      }
    }
    for (const c of s.weeklyChallenges) {
      if (c.complete || c.type !== type) continue;
      c.current = Math.min(c.target, c.current + value);
      if (c.current >= c.target) {
        c.complete = true;
        s.xp += c.reward;
      }
    }
  }),

  unlockAchievement: (id) => set((s) => {
    if (s.earnedAchievements.includes(id)) return;
    s.earnedAchievements.push(id);
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    s.xp += a.xpReward;
    s.notifications.unshift({
      id: nanoid(), isRead: false, createdAt: new Date().toISOString(),
      type: 'achievement',
      title: `${a.icon} Achievement Unlocked`,
      body: `"${a.name}" — ${a.description}`,
    });
    s.unreadCount++;
  }),

  addNotification: (n) => set((s) => {
    s.notifications.unshift({ ...n, id: nanoid(), isRead: false, createdAt: new Date().toISOString() });
    s.unreadCount++;
  }),

  markNotificationRead: (id) => set((s) => {
    const n = s.notifications.find((x) => x.id === id);
    if (n && !n.isRead) { n.isRead = true; s.unreadCount = Math.max(0, s.unreadCount - 1); }
  }),

  markAllRead: () => set((s) => {
    s.notifications.forEach((n) => { n.isRead = true; });
    s.unreadCount = 0;
  }),

  clearTierUp: () => set((s) => { s.pendingTierUp = null; }),

  updateStreak: () => set((s) => {
    const today     = todayStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];

    if (s.lastActiveDate === today) return;
    if (s.lastActiveDate === yStr) {
      s.dailyStreak++;
    } else if (s.lastActiveDate && s.lastActiveDate !== today) {
      // Missed day — use freeze?
      if (s.streakFreezeCount > 0) {
        s.streakFreezeCount--;
      } else {
        s.dailyStreak = 1;
      }
    } else {
      s.dailyStreak = 1;
    }
    s.lastActiveDate = today;
  }),
});
