# AURA ARENA — Architecture Deep Dive

## Technology Decisions

### React 19 + TypeScript 5.8
- React 19 for concurrent features, `useOptimistic`, improved Suspense
- Strict TypeScript throughout — no `any` except in explicitly marked escape hatches
- All components are functional — zero class components in the codebase

### Zustand 5 + Immer (5-Slice Architecture)

```
useStore = create<AppStore>()(persist(immer((...a) => ({
  ...createGameSlice(...a),     // XP, tiers, missions, achievements, notifications
  ...createLeagueSlice(...a),   // sessions, battles, drill state, history
  ...createFeedSlice(...a),     // reel likes/saves (Set<string>), scroll position
  ...createDetectionSlice(...a), // camera, MediaPipe model states, gestures
  ...createUserSlice(...a),     // auth, profile, saved accounts, UI prefs
}))))
```

**Why slices instead of a monolithic store:**
- Each slice can be developed and tested independently
- Hot reloading works slice-by-slice
- `partialize` in persist middleware lets us choose exactly what to save

**Persist strategy:**
- Sets (likedReels, savedReels, loadedTasks) serialize as arrays, rehydrate back to Set
- Session history capped at 50 entries
- Notifications capped at 50 entries
- Sensitive data (auth tokens) never persisted — Supabase handles session

### React Router 7
- `createBrowserRouter` with lazy-loaded pages
- `AuthGuard` → `OnboardingGate` → `AppShell` layout hierarchy
- Code splitting per route via `React.lazy` + `Suspense`

### TanStack Query 5
- Server state fully separated from UI state
- `staleTime: 30_000` (30s) — avoids over-fetching
- `gcTime: 300_000` (5min) — keeps data in memory for navigation
- Optimistic updates for likes, comments
- Infinite scroll for reels feed via `useInfiniteQuery`

### Framer Motion 12
- Only `transform` and `opacity` in variants — never layout properties
- `layoutId` for shared element transitions (nav indicator, tier badge)
- `useMotionValue` + `animate()` for imperative gesture animations
- `will-change: transform` applied to frequently-animated elements
- All animations respect `reduceMotion` store flag

---

## Directory Structure

```
src/
├── components/
│   ├── arena/          # CameraView, CoachingModal, DrillLibrary, MetricsPanel, PoseEngine, SubDisciplineSelector
│   ├── auth/           # AuthGuard, OnboardingGate
│   ├── gamification/   # AiCoachCard, MissionCard, TierUpCelebration
│   ├── layout/         # AppShell (bottom nav + plus sheet)
│   ├── profile/        # ProfileCoach, ProfileStats, ProfileTabs
│   ├── pwa/            # InstallBanner
│   └── ui/             # shadcn/ui primitives + custom: AnimatedNumber, ArcGauge, TierBadge, DisciplineBadge
├── constants/
│   ├── disciplines.ts  # All 10 disciplines, 100+ sub-disciplines, 300+ drills, tier helpers
│   ├── gamification.ts # Tiers, XP/Points config, Achievements, AI opponents, Mission templates
│   └── index.ts        # Barrel export
├── hooks/
│   ├── useAI.ts        # useDailyTip, useCoachFeedback, useTrainingPlan, useBattleCoach, useReelCaption
│   ├── useAchievements.ts # Achievement checking and unlock dispatching
│   ├── useAuth.ts      # Google OAuth, session restore, hydrateUser
│   ├── useCamera.ts    # getUserMedia, permissions, constraints
│   └── usePersonalization.ts # accentColor, currentTier, tierProgress, discipline config
├── lib/
│   ├── audio/audioService.ts # 16 sounds, use-sound integration, volume control
│   ├── gemini.ts        # Gemini client, model fallback waterfall, TTL cache, all AI functions
│   ├── mediapipe/
│   │   ├── allTasks.ts  # All MediaPipe Vision/Text/Audio/GenAI task wrappers
│   │   ├── engine.ts    # Detection loop, landmark processing, score computation
│   │   └── onDeviceLLM.ts # Gemma on-device inference
│   ├── pwa/offlineQueue.ts # IndexedDB via idb, pending sessions, auto-sync
│   ├── queryClient.ts   # TanStack Query client, all query/mutation hooks
│   ├── scoreEngine.ts   # calcFrameScore, calcSessionScore, combo logic, XP/points calculation
│   ├── supabase/
│   │   ├── client.ts    # createClient, signInWithGoogle, signOut helpers
│   │   └── realtime.ts  # subscribeToNotifications, subscribeToReelLikes, subscribeToLeaderboard
│   └── utils.ts         # cn(), timeAgo(), formatNumber(), clamp(), lerp()
├── pages/
│   ├── DashboardPage.tsx
│   ├── NotificationsPage.tsx
│   ├── OfflinePage.tsx
│   ├── arena/
│   │   ├── ArenaHubPage.tsx
│   │   ├── DetectionLabPage.tsx
│   │   └── TrainingPage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   └── SplashPage.tsx
│   ├── battle/
│   │   ├── LiveBattlePage.tsx
│   │   ├── LivePrePage.tsx
│   │   ├── PveBattlePage.tsx
│   │   └── PvePrePage.tsx
│   ├── discover/
│   │   ├── DiscoverPage.tsx
│   │   ├── LeaguePage.tsx
│   │   └── ReelsFeedPage.tsx
│   └── profile/
│       ├── AvatarPage.tsx
│       ├── DataImportPage.tsx
│       └── ProfilePage.tsx
├── router/index.tsx      # createBrowserRouter, lazy imports, AuthGuard/OnboardingGate wrapping
├── services/achievementService.ts # checkAchievements(), all 26 achievement conditions
├── store/
│   ├── index.ts          # Root store, persist config, all selectors
│   └── slices/
│       ├── detectionSlice.ts
│       ├── feedSlice.ts
│       ├── gameSlice.ts
│       ├── leagueSlice.ts
│       └── userSlice.ts
└── types/index.ts        # All TypeScript interfaces and types
```

---

## Data Flow

### Session Flow
```
TrainingPage (user starts)
  → useCamera (getUserMedia → stream → videoRef)
  → PoseEngine (rAF loop → landmarks → useStore.setPoseLandmarks)
  → scoreEngine.calcFrameScore (landmarks → FrameScore)
  → useStore.updateMetrics (live HUD update)
  → [on end] calcSessionScore → awardSessionXP
  → achievementService.checkAchievements
  → queryClient.useSaveSession (Supabase insert)
  → offlineQueue (if offline → IndexedDB)
```

### Authentication Flow
```
SplashPage (1.8s)
  → useAuth.restoreSession (supabase.auth.getSession)
  → if user + onboarded → /home
  → if user only → /onboarding
  → if no user → /login

LoginPage
  → useGoogleLogin (@react-oauth/google)
  → signInWithGoogle(accessToken) → Supabase
  → onAuthStateChange: SIGNED_IN → hydrateUser
  → hydrateUser: fetch profile → populate store
  → navigate /onboarding or /home
```

### Offline Sync Flow
```
Session complete
  → if online: POST to Supabase directly
  → if offline: saveOfflineSession(idb)

App comes online ('online' event)
  → initOfflineSync listener fires
  → getPendingSessions(idb)
  → forEach: POST to Supabase → deletePendingSession(idb)
  → show toast: "X sessions synced"
```

---

## Performance Architecture

### Bundle Splitting (Rollup chunks)
| Chunk | Contents | Why Separate |
|---|---|---|
| `react-vendor` | react, react-dom | Core runtime, largest chunk |
| `router` | react-router-dom | Route-level splitting |
| `framer` | framer-motion | Animation library, large |
| `supabase` | @supabase/supabase-js | Backend SDK |
| `tanstack` | react-query, virtual, table | Data layer |
| `recharts` | recharts | Charts only on profile/stats |
| `mediapipe` | @mediapipe/pose, hands, face_mesh | Only loaded in camera context |

### Selector Granularity
Every component selects only what it needs:
```ts
// ✅ Good — only re-renders when xp changes
const xp = useStore(s => s.xp);

// ❌ Bad — re-renders on any store change
const { xp, tier, user } = useStore();
```

### Zustand Memoization
All computed selectors use stable references via Zustand's built-in shallow comparison:
```ts
export const useXP = () => useStore(s => s.xp); // stable
```

### Gemini Cache
```ts
const cache = new Map<string, { text: string; expires: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes
```
Prevents redundant API calls for the same coaching context.

---

## Security

- No API keys in client code — `VITE_GEMINI_API_KEY` is used directly in browser (acceptable for Gemini Flash)
- Supabase Row Level Security on all tables
- User can only read/write their own profile, sessions, and reels
- Google OAuth handled by Supabase Auth provider
- No sensitive data in localStorage persist (no tokens, no payment info)
