# AURA ARENA — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] — 2026-03-05

### 🚀 Complete Functional Rewrite

This is a ground-up functional rewrite of the entire codebase. Every class-based service, store, and utility has been converted to functional patterns. The entire store was migrated from a monolithic architecture to a 5-slice Zustand architecture.

### Added
- **5-slice Zustand store**: `gameSlice`, `leagueSlice`, `feedSlice`, `detectionSlice`, `userSlice` — each independently composed and tested
- **100+ sub-disciplines**: Bharatanatyam, Kathak, Odissi, Kuchipudi, Sattriya, Chhau + all martial arts variants (Shotokan, Goju-Ryu, Wing Chun, Muay Thai, BJJ, etc.) + all yoga styles
- **Detection Lab page**: Standalone camera CV tester with real-time FPS graph, landmark count, model inference time
- **useAchievements hook**: Reactive achievement checking with unlock dispatch and notification creation
- **TikTok-quality ReelsFeed**: Native touch velocity-snap (>18% viewport or >0.6 px/ms), double-tap like with heart animation at tap position, score ring with SVG arc
- **AppShell spring navigation**: `layoutId` shared element transition for nav indicator, drag-to-dismiss plus sheet
- **DashboardPage orb animations**: Spring-animated ambient blobs, personalized greeting, AI daily tip, missions progress
- **MissionCard component**: With animated progress bar, completion state, discipline-specific accent
- **MetricsPanel rebuild**: 6-metric emoji icons, compact + full display modes, AnimatedNumber integration
- **AnimatedNumber component**: 60fps cubic ease-out animation, `CSSProperties` style prop, `reduceMotion` support
- **Design system expansion**: Syne 800 / DM Sans / Space Mono typography hierarchy, cold-plasma color palette, 12+ keyframe animations, glass morphism variants
- **Tailwind custom tokens**: `nav-h`, `safe-b`, `glow`, `card`, `sheet`, `hud` shadows, `spring`/`smooth` timing functions
- `ProfileTabs` component extracted from `ProfilePage`
- All store selectors granularized (zero full-store subscriptions)
- `useIsLiked(reelId)` / `useIsSaved(reelId)` convenience selectors
- `onRehydrateStorage` converts persisted Arrays back to `Set<string>`
- `@mediapipe/tasks-vision`, `@mediapipe/tasks-text`, `@mediapipe/tasks-audio`, `@mediapipe/tasks-genai` packages
- `lib/mediapipe/allTasks.ts`: Comprehensive wrapper for all 15 MediaPipe task types
- `lib/mediapipe/onDeviceLLM.ts`: Gemma on-device inference with WebGPU capability detection

### Fixed
- `BalanceScale` icon (doesn't exist in lucide-react) → replaced with emoji icons `⚖️`
- `@use-gesture` dependency removed — native touch events used throughout
- `style2` invalid JSX prop removed from AppShell
- `AnimatedNumber` was missing `CSSProperties` import
- `react-spring` removed from imports (no longer used — Framer Motion handles all animation)
- `useStreakFreeze` naming conflict (method name vs state value) resolved
- All `as any` casts in JSX removed

### Changed
- `Discipline.drills` array expanded from ~5 to 20-30 per discipline with proper `xpReward` field
- `scoreEngine.ts`: Now computes `expressiveness`, `power`, `balance` in addition to accuracy/stability/timing
- `usePersonalization` returns stable `accentColor` via discipline constant lookup
- `gemini.ts`: Updated to `@google/genai` with 3-model fallback waterfall

---

## [1.5.0] — 2026-03-04

### Added
- **MediaPipe all-tasks engine**: Vision (11 tasks), Text (3 tasks), Audio classification, GenAI/Gemma
- **TanStack Query provider**: All Supabase queries/mutations wrapped with caching, optimistic updates
- **`useAuth` hook**: Google OAuth via `@react-oauth/google`, session restoration, `hydrateUser`
- **Supabase Realtime**: Notifications, reel likes, leaderboard, battle score channels
- **`useCamera` hook**: `getUserMedia`, permission states, facing mode switch, canvas overlay
- **`usePersonalization` hook**: Discipline accent color, tier progress, sub-discipline lookup
- **`audioService`**: 16 sounds, use-sound integration, independent volume per sound category
- **`achievementService`**: All 26 achievements with unlock conditions and trigger system
- **`offlineQueue`**: IndexedDB via `idb`, background sync, pending session management
- **`ProfileStats` component**: Recharts line chart, radar chart, heatmap, personal bests
- **`ProfileCoach` component**: AI coach card, 7-day training plan, coaching history (virtualized)
- **`AiCoachCard` component**: Coach persona, discipline-specific name, Gemini tip display
- All shadcn/ui primitives: Select, Skeleton, AnimatedNumber, ArcGauge, TierBadge, DisciplineBadge, FullScreenLoader
- `lib/queryClient.ts`: All TanStack Query hooks for every Supabase table

### Fixed
- MediaPipe pose engine: was using `setInterval` — converted to `requestAnimationFrame`
- Zustand selectors: all components previously subscribing to full store, now use granular selectors
- Gemini client: was using old `@google/generative-ai` API — migrated to `@google/genai`

---

## [1.0.0] — 2026-03-04 (Initial Build)

### Added
- Complete Vite + React 19 + TypeScript 5 project scaffold
- All 10 disciplines with coaching tone, stat labels, challenge names
- Tier system: Bronze → Silver → Gold → Platinum → Champion → Global Elite
- 26 achievements across 4 rarity levels
- Daily missions + weekly challenges with Supabase storage
- Streak system with freeze tokens
- XP + Points dual-track system
- Google OAuth login with saved accounts UI
- 5-step animated onboarding
- Dashboard with stats, missions, coaching, recent sessions
- Arena Hub with Training, PvE, Live Battle mode cards
- Training page: camera, pose detection loop, 6-metric HUD, combo system
- Post-session Gemini coaching modal
- PvE Battle: opponent selection, countdown, score race, result
- Live Battle: matchmaking sim, Supabase Realtime 1v1 score sync
- Discover Hub → Reels Feed (full-screen swipe) + League (leaderboard)
- Profile with 5 tabs: Overview, Stats, Coach, Trophy Room, Settings
- Data Import: 10 sources (Strava, Apple Health, Garmin, Google Fit, CSV, XLSX, etc.)
- Avatar/profile management page
- Notifications Center with grouped sections
- Offline page (cached + styled)
- PWA manifest + service worker + custom install banner
- TierUpCelebration full-screen animation with confetti
- InstallBanner PWA prompt
- Complete Supabase schema with RLS, triggers, indexes
- Audio system architecture (16 sounds, volume control)
- All Tailwind customization, CSS design tokens
- Recharts integration: score line, radar, heatmap, discipline pie
- TanStack Virtual: leaderboard (1000 rows), coaching history, notifications
- React Router 7 with lazy loading + Suspense

---

## Unreleased

### Planned for v2.1
- [ ] Video clip saving and replay (requires WebRTC recording API)
- [ ] Push notifications via FCM (infrastructure ready, server pending)
- [ ] 3D avatar customization (Three.js integration in AvatarPage)
- [ ] Apple Health OAuth import (requires native iOS wrapper)
- [ ] Creator earnings / AURA Coins system
- [ ] Battle Pass seasonal content system
- [ ] Institutional/studio multi-user dashboard
- [ ] Live spectator mode in battles
- [ ] Custom challenge creation
- [ ] Social following / follower system
