# AURA ARENA — Complete Feature Specification

## Overview

AURA ARENA is an AI-powered movement performance scoring platform. Athletes perform physical disciplines — boxing, dance, martial arts, yoga, gymnastics, and more — in front of their device camera, and receive real-time AI scoring, coaching, and competitive gameplay.

---

## Core Disciplines (10 + 100+ Sub-disciplines)

| Discipline | Sub-disciplines |
|---|---|
| 🥊 Boxing | Orthodox, Southpaw, Switch, Muay Thai Hybrid |
| 💃 Dance | Bharatanatyam, Kathak, Odissi, Kuchipudi, Manipuri, Mohiniyattam, Sattriya, Chhau, Bharata Natya, Krump, Breaking, Waacking, Voguing, Popping, Locking, Afrobeats, Dancehall, Ballet, Contemporary, Jazz, Hip-Hop, K-Pop Style |
| 🥋 Martial Arts | Shotokan Karate, Goju-Ryu, Wado-Ryu, Taekwondo (WTF), Muay Thai, Wing Chun, Kung Fu, BJJ, Wrestling, Judo, Capoeira, Silat, Kalaripayattu, Escrima, Ninjutsu |
| 🧘 Yoga | Ashtanga, Iyengar, Vinyasa Flow, Bikram, Yin, Restorative, Kundalini, Hatha, Anusara, Jivamukti |
| 🤸 Gymnastics | Floor Exercise, Beam, Vault, Bars, Rhythmic, Tumbling, Trampolining, Acro |
| 💪 Fitness | HIIT, CrossFit, Functional, Kettlebell, Cardio, Strength |
| 🏋️ Bodybuilding | Classic, Modern, Bikini, Men's Physique, Women's Physique |
| 🌿 Calisthenics | Street Workout, Bar Brothers, Prison Style, Freestyle |
| 🏃 Parkour | Precision, Flow, Speed, Freestyle Tricking |
| 🧘‍♀️ Pilates | Mat Pilates, Reformer, Cadillac, Chair |

---

## Scoring Engine

### 6 Dimensions (per discipline, weighted differently)

| Metric | Description |
|---|---|
| **Accuracy** | How precisely movements match reference form |
| **Stability** | Core stability and balance maintenance |
| **Timing** | Rhythm, tempo, and movement cadence |
| **Expressiveness** | Artistic quality and performance presence |
| **Power** | Force and intensity of movements |
| **Balance** | Weight distribution and equilibrium |

### Discipline Score Weights
Each discipline uses a different weighting profile:
- **Boxing**: Power 0.30, Accuracy 0.25, Timing 0.25, Stability 0.20
- **Dance**: Expressiveness 0.30, Timing 0.25, Accuracy 0.25, Balance 0.20
- **Martial Arts**: Accuracy 0.30, Timing 0.25, Power 0.25, Stability 0.20
- **Yoga**: Balance 0.35, Stability 0.30, Accuracy 0.25, Expressiveness 0.10
- **Gymnastics**: Accuracy 0.30, Balance 0.25, Power 0.25, Stability 0.20

### Combo System
- 3x consecutive above-85%: 1.05× multiplier + "Combo 🔥" flash
- 7x consecutive above-85%: 1.15× multiplier + "On Fire 🔥🔥" flash
- 15x consecutive above-85%: 1.30× multiplier + "UNSTOPPABLE" full-screen flash

---

## Tier System

| Tier | XP Required | Color | Description |
|---|---|---|---|
| 🥉 Bronze | 0 | `#cd7f32` | Starting tier |
| 🥈 Silver | 500 | `#9ba8b5` | Consistent performer |
| 🥇 Gold | 1,500 | `#fbbf24` | Committed athlete |
| 💎 Platinum | 3,500 | `#38bdf8` | Elite dedicated |
| 👑 Champion | 7,000 | `#a78bfa` | Competition-ready |
| ⚡ Global Elite | 15,000 | `#f43f5e` | World-class |

### Tier Up Celebration
Full-screen takeover event: current badge shatters → particles → new badge assembles → accent color flood → Gemini-generated coach message → confetti burst.

---

## Gamification

### XP Sources
| Action | XP |
|---|---|
| Training session complete | base × score% × difficulty |
| PvE win | 50 + difficulty × 20 |
| Daily mission complete | 25–75 per mission |
| Weekly challenge complete | 150–300 |
| Achievement unlock | varies by rarity (25/75/200/500) |
| Reel receives likes | 2 per like (capped at 40/day) |
| Login streak day | streak × 5 |

### Daily Missions (3 per day, resets midnight local)
- Complete 2 training sessions today
- Achieve 85%+ accuracy in a session
- Beat an AI opponent
- Post a reel to the feed
- Like 3 reels from your discipline
- Hit a 5x combo during training
- Train at difficulty 3+
- Complete a session lasting 2+ minutes

**Daily Perfect bonus**: Complete all 3 = +100 XP

### Weekly Challenges (3 per week, resets Monday)
- Reach 80+ average score across 5 sessions
- Win 3 PvE battles at difficulty 3+
- Post 2 reels with combined 10 likes
- Train on 5 different days this week
- Set a new personal best score

### Streak System
- Daily streak increments with ≥1 session per day
- Streak Freeze: earned every 7 consecutive days, prevents break on missed day
- Milestone bonuses at: 7, 14, 30, 60, 90, 180, 365 days

---

## Achievements (26 total across 4 rarities)

### Common
- First Rep — Complete your first training session
- Combo Starter — Achieve a 3x combo
- Social Butterfly — Post your first reel
- Explorer — Try 3 different disciplines

### Rare
- Week Warrior — Complete a 7-day streak
- AI Crusher — Beat 10 AI opponents
- Perfect Day — Complete all daily missions in a day
- Score Chaser — Achieve 90+ score in any discipline

### Epic
- Month Master — Complete a 30-day streak
- Battle Legend — Win 50 PvE battles
- Reel Famous — Get 100 total likes on reels
- Discipline Master — Complete 100 sessions in one discipline

### Legendary
- Elite Status — Reach Global Elite tier
- Century Streak — Complete a 100-day streak
- Viral Athlete — Get 1000 total reel likes
- Grand Champion — Win 200 total battles

---

## Modes

### Training Session
- Pre-phase: drill selection, difficulty (1-5), camera permission
- Active phase: live camera, real-time scoring HUD, combo system, AI coaching modal
- Post-phase: score summary, XP earned, coaching feedback, share to reels option

### PvE Battle
- Select AI opponent (5 difficulties, from DragonFist to Ghost Protocol)
- Countdown sequence (3-2-1-FIGHT)
- 60-second battle with score race bar
- AI opponent score updates every 2 seconds with variance
- Result screen with win/loss, XP/points breakdown, coaching note

### Live Battle (1v1)
- Matchmaking lobby with global/regional/same-discipline filters
- Supabase Realtime for live score sync
- Presence API for viewer count
- Live comment stream during battle
- Post-battle: replay clip highlight (coming soon), rematch option

### Detection Lab
- Standalone camera test environment
- All 4 detection modes: Pose (33 pts), Hands (42 pts), Face (468 pts), All (543 pts)
- FPS counter, landmark count, model inference time
- Real-time FPS sparkline history
- Mirror camera toggle

---

## Social Features

### Reels Feed
- TikTok-style full-screen vertical scroll
- Native touch velocity-snap gesture (>18% viewport or >0.6 px/ms)
- Double-tap to like (with heart animation at tap position)
- Actions: Like, Comment, Share, Bookmark, AI Caption
- Score ring with discipline-colored glow
- Swipe position pips on right edge

### League / Leaderboard
- Global, by discipline, by country filters
- Real-time updates via Supabase Realtime on `leaderboard_view`
- Season system with reset
- My Rank card pinned at top
- Top 3 highlighted (gold/silver/bronze borders)

---

## Profile (5 Tabs)

### Overview Tab
- Arena name, tier badge, discipline badge, bio
- XP progress bar to next tier
- Key stats: total XP, sessions, average score, best score, win rate
- Recent session history
- Quick action buttons

### Stats Tab
- Recharts line chart: score over time (last 30 sessions)
- 6-metric radar chart (accuracy/stability/timing/expressiveness/power/balance)
- Weekly activity heatmap (GitHub-style grid)
- Discipline breakdown pie
- Personal bests per metric

### Coach Tab
- AI coach name and personality (discipline-specific)
- Daily personalized tip (Gemini)
- 7-day training plan (Gemini)
- Coaching history (last 10 sessions, virtualized)
- Performance trend analysis

### Trophy Room Tab
- All achievements grid (unlocked + locked/blurred)
- Rarity filters (All/Common/Rare/Epic/Legendary)
- Progress on locked achievements
- Earned date on unlocked

### Settings Tab
- Sound toggle + master volume slider
- Reduce motion toggle
- Theme toggle (Dark / AMOLED)
- Camera mirror toggle
- Haptics toggle
- Notification preferences
- Data import (→ DataImportPage)
- Avatar/profile edit (→ AvatarPage)
- Discipline change (→ AvatarPage)
- Sign out
- App version info

---

## Data Import

Supported sources:
- **Strava** — running, cycling activities
- **Garmin Connect** — all activity types
- **Apple Health** — workouts export
- **Google Fit** — activity data
- **CSV** — custom format
- **Excel (XLSX)** — spreadsheet import

AI-generated insight after import via Gemini: analyzes historical patterns and provides training recommendations.

---

## AI Integration (Gemini)

### Cloud AI (Gemini 2.0 Flash)
- Daily coaching tips (discipline + sub-discipline aware)
- Post-session coaching feedback (score, combo, improvements)
- Battle coaching (opponent strategy, performance)
- Training plan generation (7-day personalized)
- Reel caption generation
- Import insight analysis
- Tier-up celebration message
- Welcome/onboarding message

### Model Fallback Waterfall
```
gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash
```

### On-Device AI (Gemma via MediaPipe GenAI)
- Instant gesture recognition labels
- Expression feedback during training
- Offline coaching when no network

### Caching
All Gemini calls cached with 5-minute TTL in a `Map<string, {text, expires}>`.

---

## MediaPipe Integration

### Vision Tasks
- Pose Landmarker (33 points)
- Hand Landmarker (21 points × 2 hands)
- Face Landmarker (468 points)
- Gesture Recognizer
- Object Detector
- Image Classifier
- Image Segmenter
- Face Detector
- Image Embedding

### Text Tasks
- Text Classifier
- Text Embedder
- Language Detector

### Audio Tasks
- Audio Classifier

### GenAI Tasks
- LLM Inference (Gemma 2B, on-device via WebGPU)

---

## PWA Features

- Installable (custom install banner after 2nd session)
- Offline mode: dashboard, training (no score save), cached reels
- Background sync: IndexedDB → Supabase when reconnected
- Service worker: cache-first static, network-first Supabase, SWR images
- Push notification infrastructure (mocked server in MVP)
- Web Share API for reel sharing
- Haptics: `navigator.vibrate()` on key interactions

---

## Notifications

| Type | Trigger |
|---|---|
| Achievement unlocked | On unlock |
| Tier advancement | On tier-up |
| Reel likes milestone | At 10, 50, 100 likes |
| Battle challenge received | From another user |
| Season ending soon | 48h before reset |
| Weekly performance summary | Monday morning |
| New coaching insight | After 5+ sessions |
| Import completed | On successful import |
| App announcement | From admin |

Organized into sections: Today / This Week / Earlier.
Real-time count badge via Supabase Realtime subscription.

---

## Performance Targets

- Initial bundle: < 150KB gzipped
- Time to Interactive: < 2s on 4G
- MediaPipe loop: < 16ms per frame (rAF only, never setInterval)
- Lighthouse Performance: 90+
- Lighthouse Accessibility: 90+
- Lighthouse Best Practices: 95+
- Lighthouse SEO: 90+

---

## Accessibility

- WCAG 2.1 AA compliant
- All tappable areas: minimum 44×44px
- Focus states: neon outline in discipline accent color
- prefers-reduced-motion: all animations replaced with opacity transitions
- Keyboard navigation: full coverage
- Screen reader: all images have alt, icons have aria-labels, modals trap/restore focus
- Text contrast: 4.5:1 body, 3:1 large text
