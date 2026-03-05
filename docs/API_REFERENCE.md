# AURA ARENA — API & Store Reference

## Store Selectors

All selectors live in `src/store/index.ts`. Import individual selectors to prevent unnecessary re-renders.

### User Slice Selectors
```ts
import {
  useUser,             // User | null
  useIsAuthenticated,  // boolean
  useUserLoading,      // boolean
  useSavedAccounts,    // SavedAccount[]
  useSignOut,          // () => void
  // Setter actions
  useSetUser,          // (user: User | null) => void
  useUpdateUser,       // (updates: Partial<User>) => void
} from '@/store';
```

### Game Slice Selectors
```ts
import {
  useXP,                   // number
  useTier,                 // TierId
  useTotalPoints,          // number
  useDailyStreak,          // number
  useStreakFreezeCount,     // number
  useDailyMissions,        // DailyMission[]
  useWeeklyChallenges,     // WeeklyChallenge[]
  useEarnedAchievements,   // string[] (achievement IDs)
  useNotifications,        // Notification[]
  useUnreadCount,          // number
  usePendingTierUp,        // TierId | null
  // Setter actions
  useAddXP,                // (amount: number) => void
  useAddPoints,            // (amount: number) => void
  useMarkNotificationRead, // (id: string) => void
  useMarkAllRead,          // () => void
  useUnlockAchievement,    // (id: string) => void
  useClearTierUp,          // () => void
  useUpdateMissionProgress,// (type, amount) => void
} from '@/store';
```

### League Slice Selectors
```ts
import {
  useCurrentSession,       // SessionData | null
  useSessionHistory,       // SessionData[]
  useSessionPhase,         // SessionPhase
  useMetrics,              // SessionMetrics
  useSelectedDrill,        // Drill | null
  useSelectedDifficulty,   // 1|2|3|4|5
  useBattlePhase,          // BattlePhase
  useSelectedOpponent,     // AiOpponent | null
  usePlayerScore,          // number
  useOpponentScore,        // number
  useBattleTime,           // number
  useBattleResult,         // BattleResult | null
  useLiveComments,         // LiveComment[]
  useViewerCount,          // number
  // Actions
  useSetSessionPhase,      // (phase: SessionPhase) => void
  useUpdateMetrics,        // (metrics: Partial<SessionMetrics>) => void
  useSetDrill,             // (drill: Drill) => void
  useSetDifficulty,        // (d: 1|2|3|4|5) => void
  useStartSession,         // () => void
  useEndSession,           // (score: number) => void
  useResetBattle,          // () => void
} from '@/store';
```

### Feed Slice Selectors
```ts
import {
  useFeedTab,       // 'reels' | 'league'
  useActiveReelIndex, // number
  useLikedReels,    // Set<string>
  useSavedReels,    // Set<string>
  useIsLiked,       // (reelId: string) => boolean
  useIsSaved,       // (reelId: string) => boolean
  useToggleLike,    // (reelId: string) => void
  useToggleSave,    // (reelId: string) => void
} from '@/store';
```

### Detection Slice Selectors
```ts
import {
  useCameraPermission,  // 'idle'|'requesting'|'granted'|'denied'
  useMirrorCamera,      // boolean
  useToggleMirror,      // () => void
  useGestureLabel,      // string
  useFaceExpression,    // string
  useDetectionActive,   // boolean
} from '@/store';
```

### User Preferences (in UserSlice)
```ts
import {
  useSoundEnabled,       // boolean
  useReduceMotion,       // boolean
  useMasterVolume,       // number (0–1)
  useHapticsEnabled,     // boolean
  useTheme,              // 'dark' | 'amoled'
  // Setters
  useSoundEnabled,       // also setter via second return value
  useSetSoundEnabled,    // (v: boolean) => void
  useSetReduceMotion,    // (v: boolean) => void
  useSetMasterVolume,    // (v: number) => void
  useDismissInstall,     // () => void
  useShowInstallBanner,  // boolean
} from '@/store';
```

---

## Hooks Reference

### `useAI` — Gemini AI Hooks

```ts
// Daily coaching tip for current discipline
const { tip, loading } = useDailyTip(disciplineId, subDisciplineId?);

// Post-session feedback
const { getFeedback, loading } = useCoachFeedback();
const feedback = await getFeedback({ score, combo, discipline, drillName, metrics });

// 7-day training plan
const { plan, loading, refetch } = useTrainingPlan(disciplineId, experienceLevel);

// Battle-time coaching (on score change)
const { note, loading } = useBattleCoach(playerScore, opponentScore, discipline);

// Auto-generate reel caption
const { caption, loading } = useReelCaption(discipline, drillName, score);

// Sub-discipline cultural description
const { description, loading } = useSubDisciplineDescription(subDisciplineId);

// Device AI capability check
const { supported, gpuAvailable } = useDeviceAIStatus();
```

### `useAuth` — Authentication

```ts
const {
  login,           // (googleToken: string) => Promise<void>
  logout,          // () => Promise<void>
  hydrateUser,     // () => Promise<void> — restore session from Supabase
  loading,         // boolean
  error,           // string | null
} = useAuth();
```

### `useCamera` — Camera Management

```ts
const {
  videoRef,         // RefObject<HTMLVideoElement>
  canvasRef,        // RefObject<HTMLCanvasElement>
  startCamera,      // () => Promise<void>
  stopCamera,       // () => void
  permission,       // CameraPermission
  error,            // string | null
  facingMode,       // 'user' | 'environment'
  switchCamera,     // () => Promise<void>
} = useCamera();
```

### `usePersonalization` — Discipline Context

```ts
const {
  accentColor,     // string — current discipline's hex color
  disciplineEmoji, // string — e.g., '🥊'
  disciplineName,  // string — e.g., 'Boxing'
  subDiscipline,   // SubDiscipline | undefined
  currentTier,     // Tier
  tierProgress,    // number (0–100)
  nextTier,        // Tier | null
  xpToNext,        // number
} = usePersonalization();
```

### `useAchievements` — Achievement System

```ts
const {
  check,                   // (trigger, context?) => string[] — returns newly unlocked IDs
  isEarned,                // (id: string) => boolean
  getEarnedAchievements,   // () => Achievement[]
  getLockedAchievements,   // () => Achievement[]
} = useAchievements();

// Call after significant actions:
check('session_complete', { score: 94, combo: 7 });
check('pve_win', { difficulty: 4 });
check('streak_update', { dailyStreak: 7 });
```

---

## Services

### `achievementService`

```ts
import { checkAchievements, type AchievementContext } from '@/services/achievementService';

const ctx: AchievementContext = {
  trigger: 'session_complete',
  xp: 1500,
  dailyStreak: 7,
  sessionsCompleted: 25,
  earnedAchievements: ['first-rep'],
  score: 94,
  combo: 7,
  discipline: 'boxing',
};

const newlyUnlocked: string[] = checkAchievements(ctx);
// ['week-warrior', 'combo-starter']
```

### `scoreEngine`

```ts
import {
  calcFrameScore,    // (landmarks, disciplineId, prevLandmarks?) => FrameScore
  calcSessionScore,  // (frames: FrameScore[]) => SessionScore
  calcXPEarned,      // (score, difficulty, discipline) => number
  calcPointsEarned,  // (score, difficulty, discipline) => number
  getDisciplineWeights, // (disciplineId) => ScoringWeights
} from '@/lib/scoreEngine';
```

### `audioService`

```ts
import {
  playSound,    // (soundId: SoundId) => void
  setSoundEnabled, // (v: boolean) => void
  setVolume,    // (level: number) => void
} from '@/lib/audio/audioService';

// Sound IDs:
type SoundId =
  | 'btn-press' | 'combo-3x' | 'combo-7x' | 'combo-15x'
  | 'countdown' | 'battle-start' | 'victory' | 'defeat'
  | 'tier-up' | 'achievement' | 'reel-like' | 'session-start'
  | 'session-end' | 'error' | 'notification' | 'ambient-loop';
```

### `offlineQueue`

```ts
import {
  saveOfflineSession,    // (session: SessionData) => Promise<void>
  getPendingSessions,    // () => Promise<SessionData[]>
  deletePendingSession,  // (id: string) => Promise<void>
  getQueueCount,         // () => Promise<number>
  initOfflineSync,       // () => void — call once on app mount
} from '@/lib/pwa/offlineQueue';
```

---

## TanStack Query Hooks

From `src/lib/queryClient.ts`:

```ts
// Profile
const { data: profile } = useProfileQuery(userId);
const updateProfile = useUpdateProfileMutation();

// Sessions
const { data: sessions } = useSessionsQuery(userId, limit?);
const saveSession = useSaveSessionMutation();

// Reels
const { data, fetchNextPage } = useReelsFeedQuery(discipline?);
const { data: myReels } = useMyReelsQuery(userId);
const toggleLike = useToggleLikeMutation();

// Leaderboard
const { data: leaderboard } = useLeaderboardQuery(discipline?, country?);

// Daily Missions
const { data: missions } = useMissionsQuery(userId, date);
const updateMission = useUpdateMissionMutation();

// Notifications
const { data: notifications } = useNotificationsQuery(userId);
const markRead = useMarkNotificationReadMutation();
```

---

## Gemini Model Reference

```ts
// Import
import { GoogleGenAI } from '@google/genai';
const genai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Model fallback waterfall
const GEMINI_FALLBACKS = [
  'gemini-2.5-flash',   // Primary: latest, best quality
  'gemini-2.0-flash',   // Fallback 1: stable, fast
  'gemini-1.5-flash',   // Fallback 2: older but reliable
] as const;

// All calls are cached with 5-minute TTL
// Cache key: `${functionName}:${JSON.stringify(params)}`
```

---

## Supabase Realtime Channels

```ts
import {
  subscribeToNotifications, // (userId, callback) => RealtimeChannel
  subscribeToReelLikes,     // (reelId, callback) => RealtimeChannel
  subscribeToLeaderboard,   // (callback) => RealtimeChannel
  subscribeToBattle,        // (battleId, callback) => RealtimeChannel
} from '@/lib/supabase/realtime';

// Usage
const channel = subscribeToNotifications(userId, (notification) => {
  store.addNotification(notification);
});

// Cleanup
return () => channel.unsubscribe();
```

---

## Constants Reference

```ts
import {
  DISCIPLINES,        // Discipline[] — all 10 with drills
  TIERS,              // Tier[] — Bronze through Elite
  ACHIEVEMENTS,       // Achievement[] — all 26
  AI_OPPONENTS,       // AiOpponent[] — 5 difficulties
  MISSION_TEMPLATES,  // DailyMission templates
  WEEKLY_TEMPLATES,   // WeeklyChallenge templates
  XP_CONFIG,          // XP amounts per action
  POINTS_CONFIG,      // Points amounts per action
  // Helpers
  getDiscipline,      // (id: DisciplineId) => Discipline
  getSubDiscipline,   // (id: string) => SubDiscipline | undefined
  getDrillById,       // (disciplineId, drillId) => Drill | undefined
  getAllDrills,        // (disciplineId) => Drill[]
  getTier,            // (id: TierId) => Tier
  getNextTier,        // (id: TierId) => Tier | null
  getTierProgress,    // (xp, tierId) => number (0-100)
} from '@/constants';
```
