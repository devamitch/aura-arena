// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Root Store
// GameSlice + LeagueSlice + FeedSlice + DetectionSlice + UserSlice
// Zustand + Immer + Persist
// ═══════════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createAvatarSlice, type AvatarSlice } from "./slices/avatarSlice";
import {
  createDetectionSlice,
  type DetectionSlice,
} from "./slices/detectionSlice";
import { createFeedSlice, type FeedSlice } from "./slices/feedSlice";
import { createGameSlice, type GameSlice } from "./slices/gameSlice";
import { createLeagueSlice, type LeagueSlice } from "./slices/leagueSlice";
import { createUserSlice, type UserSlice } from "./slices/userSlice";

export type AppStore = GameSlice &
  LeagueSlice &
  FeedSlice &
  DetectionSlice &
  UserSlice &
  AvatarSlice;

export const useStore = create<AppStore>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    immer((set, get, api) => ({
      ...createGameSlice(set as any, get as any, api as any),
      ...createLeagueSlice(set as any, get as any, api as any),
      ...createFeedSlice(set as any, get as any, api as any),
      ...createDetectionSlice(set as any, get as any, api as any),
      ...createUserSlice(set as any, get as any, api as any),
      ...createAvatarSlice(set as any, get as any, api as any),
    })),
    {
      name: "aura-arena-v4",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        savedAccounts: s.savedAccounts,
        xp: s.xp,
        totalPoints: s.totalPoints,
        tier: s.tier,
        dailyStreak: s.dailyStreak,
        streakFreezeCount: s.streakFreezeCount,
        lastActiveDate: s.lastActiveDate,
        earnedAchievements: s.earnedAchievements,
        notifications: s.notifications.slice(0, 50),
        unreadCount: s.unreadCount,
        dailyMissions: s.dailyMissions,
        weeklyChallenges: s.weeklyChallenges,
        sessionHistory: s.sessionHistory.slice(0, 50),
        selectedDifficulty: s.selectedDifficulty,
        soundEnabled: s.soundEnabled,
        reduceMotion: s.reduceMotion,
        masterVolume: s.masterVolume,
        hapticsEnabled: s.hapticsEnabled,
        theme: s.theme,
        mirrorCamera: s.mirrorCamera,
        installPromptDismissed: s.installPromptDismissed,
        likedReels: [...s.likedReels],
        savedReels: [...s.savedReels],
        avatarConfig: s.avatarConfig,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (Array.isArray((state as any).likedReels))
          (state as any).likedReels = new Set((state as any).likedReels);
        if (Array.isArray((state as any).savedReels))
          (state as any).savedReels = new Set((state as any).savedReels);
        if (Array.isArray((state as any).loadedTasks))
          (state as any).loadedTasks = new Set((state as any).loadedTasks);
      },
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────
// UserSlice
export const useUser = () => useStore((s) => s.user);
export const useSavedAccounts = () => useStore((s) => s.savedAccounts);
export const useIsLoading = () => useStore((s) => s.isLoading);
export const useAuthError = () => useStore((s) => s.authError);
export const useActiveTab = () => useStore((s) => s.activeTab);
export const useShowPlusSheet = () => useStore((s) => s.showPlusSheet);
export const useSoundEnabled = () => useStore((s) => s.soundEnabled);
export const useReduceMotion = () => useStore((s) => s.reduceMotion);
export const useMasterVolume = () => useStore((s) => s.masterVolume);
export const useHapticsEnabled = () => useStore((s) => s.hapticsEnabled);
export const useOfflineMode = () => useStore((s) => s.offlineMode);
export const useTheme = () => useStore((s) => s.theme);
// GameSlice
export const useXP = () => useStore((s) => s.xp);
export const useTotalPoints = () => useStore((s) => s.totalPoints);
export const useTier = () => useStore((s) => s.tier);
export const useDailyStreak = () => useStore((s) => s.dailyStreak);
export const useStreakFreezeCount = () => useStore((s) => s.streakFreezeCount);
export const useDailyMissions = () => useStore((s) => s.dailyMissions);
export const useWeeklyChallenges = () => useStore((s) => s.weeklyChallenges);
export const useEarnedAchievements = () =>
  useStore((s) => s.earnedAchievements);
export const useNotifications = () => useStore((s) => s.notifications);
export const useUnreadCount = () => useStore((s) => s.unreadCount);
export const usePendingTierUp = () => useStore((s) => s.pendingTierUp);
// LeagueSlice
export const useSessionPhase = () => useStore((s) => s.sessionPhase);
export const useMetrics = () => useStore((s) => s.metrics);
export const useSelectedDrill = () => useStore((s) => s.selectedDrill);
export const useSelectedDifficulty = () =>
  useStore((s) => s.selectedDifficulty);
export const useSessionHistory = () => useStore((s) => s.sessionHistory);
export const useCurrentSession = () => useStore((s) => s.currentSession);
export const usePoseLandmarks = () => useStore((s) => s.poseLandmarks);
export const useCameraActive = () => useStore((s) => s.cameraActive);
export const useBattlePhase = () => useStore((s) => s.battlePhase);
export const useSelectedOpponent = () => useStore((s) => s.selectedOpponent);
export const usePlayerScore = () => useStore((s) => s.playerScore);
export const useOpponentScore = () => useStore((s) => s.opponentScore);
export const useBattleTime = () => useStore((s) => s.battleTime);
export const useBattleResult = () => useStore((s) => s.battleResult);
export const useLiveComments = () => useStore((s) => s.liveComments);
export const useViewerCount = () => useStore((s) => s.viewerCount);
// DetectionSlice
export const useCameraPermission = () => useStore((s) => s.cameraPermission);
export const useMirrorCamera = () => useStore((s) => s.mirrorCamera);
export const useLoadedTasks = () => useStore((s) => s.loadedTasks);
export const useOnDeviceLLMState = () => useStore((s) => s.onDeviceLLMState);
export const useLastGesture = () => useStore((s) => s.lastGesture);
export const useSkeletonVisible = () => useStore((s) => s.skeletonVisible);
// FeedSlice
export const useFeedTab = () => useStore((s) => s.feedTab);
export const useDiscoverFilter = () => useStore((s) => s.discoverFilter);
export const useActiveReelIndex = () => useStore((s) => s.activeReelIndex);

// AvatarSlice
export const useAvatarConfig = () => useStore((s) => s.avatarConfig);

// ─── Action shortcuts (for components that prefer direct destructuring) ───────
export const useMarkNotificationRead = () =>
  useStore((s) => s.markNotificationRead);
export const useMarkAllRead = () => useStore((s) => s.markAllRead);
export const useSignOut = () => useStore((s) => s.signOut);
export const useDismissInstall = () => useStore((s) => s.dismissInstall);
export const useToggleMirror = () => useStore((s) => s.toggleMirror);
export const useShowInstallBanner = () => useStore((s) => s.showInstallBanner);
// export const usePendingTierUp = () => useStore((s) => s.pendingTierUp);
export const useClearTierUp = () => useStore((s) => s.clearTierUp);
// export const useSelectedDifficulty = () =>
// useStore((s) => s.selectedDifficulty);
// export const useCurrentSession = () => useStore((s) => s.currentSession);
// export const useCameraPermission = () => useStore((s) => s.cameraPermission);

// Feed convenience selectors
export const useIsLiked = (reelId: string) =>
  useStore((s) => s.likedReels.has(reelId));
export const useIsSaved = (reelId: string) =>
  useStore((s) => s.savedReels.has(reelId));
