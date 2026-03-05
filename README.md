<div align="center">

# ⚡ AURA ARENA

**AI-powered movement performance scoring for every discipline.**

Score your boxing, dance, martial arts, yoga, gymnastics and 100+ sub-disciplines with real-time MediaPipe CV + Gemini AI coaching.

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-ff0055?style=flat)](https://framer.com/motion)
[![Zustand](https://img.shields.io/badge/Zustand-5-brown?style=flat)](https://zustand-demo.pmnd.rs)
[![Supabase](https://img.shields.io/badge/Supabase-latest-3ecf8e?style=flat&logo=supabase)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8?style=flat)](https://web.dev/progressive-web-apps)

</div>

---

## Quick Start

```bash
git clone https://github.com/your-org/aura-arena.git
cd aura-arena
npm install
cp .env.example .env.local   # Fill in 4 environment variables
npm run dev                  # Opens localhost:5173
```

→ Full setup: **[docs/SETUP.md](docs/SETUP.md)**

---

## Environment Variables

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | [supabase.com](https://supabase.com) → Project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Same page |
| `VITE_GOOGLE_CLIENT_ID` | [console.cloud.google.com](https://console.cloud.google.com) → OAuth credentials |
| `VITE_GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript 5.8 (strict) |
| **Build** | Vite 6 + SWC compiler |
| **Routing** | React Router 7 (lazy routes, code splitting) |
| **Animation** | Framer Motion 12 (spring physics, shared elements) |
| **State** | Zustand 5 + Immer (5 slices, persist middleware) |
| **Server State** | TanStack Query 5 + Virtual 3 + Table 8 |
| **Backend** | Supabase (Auth, Postgres, Realtime, Storage) |
| **AI Cloud** | Gemini 2.5/2.0/1.5 Flash (3-model fallback waterfall) |
| **AI On-Device** | Gemma 2B via MediaPipe GenAI + WebGPU |
| **CV** | MediaPipe Tasks Vision (11 tasks), Audio, Text, GenAI |
| **Design** | Tailwind CSS 3 + shadcn/ui + custom design tokens |
| **Typography** | Syne 800 (display) · DM Sans (body) · Space Mono (HUD) |
| **PWA** | vite-plugin-pwa · Workbox · IndexedDB offline queue |
| **Icons** | lucide-react (exclusively) |
| **Charts** | Recharts |

---

## Disciplines & Sub-Disciplines (100+)

| 🥊 Boxing | 💃 Dance | 🥋 Martial Arts |
|---|---|---|
| Orthodox, Southpaw, Switch, Muay Thai Hybrid | **Classical**: Bharatanatyam, Kathak, Odissi, Kuchipudi, Manipuri, Sattriya | Shotokan, Goju-Ryu, Taekwondo, Muay Thai, Wing Chun, BJJ, Judo, Capoeira |
| | **Urban**: Krump, Breaking, Waacking, Voguing, Popping, Locking | Kalaripayattu, Silat, Escrima, Ninjutsu |
| | **Western**: Ballet, Contemporary, Jazz, Hip-Hop, K-Pop | |

| 🧘 Yoga | 🤸 Gymnastics | 💪 Others |
|---|---|---|
| Ashtanga, Iyengar, Vinyasa, Bikram, Yin, Kundalini, Hatha | Floor, Beam, Vault, Bars, Rhythmic, Tumbling | Fitness, Bodybuilding, Calisthenics, Parkour, Pilates |

---

## Pages (19 total)

```
/ (Splash)
/login
/onboarding

/home           → Dashboard
/arena          → Arena Hub
/arena/train    → Training Session (full-screen)
/arena/lab      → Detection Lab
/battle/pve/select → PvE Pre-Battle
/battle/pve     → PvE Battle (full-screen)
/battle/live/lobby → Live Pre-Battle
/battle/live    → Live Battle (full-screen)

/discover       → Discover Hub
/discover/reels → Reels Feed (full-screen)
/discover/league → League / Leaderboard

/profile        → Profile (5 tabs)
/profile/avatar → Avatar Management
/profile/import → Data Import

/notifications  → Notification Center
/offline        → Offline page
```

---

## Architecture

### 5-Slice Zustand Store

```ts
useStore = create<AppStore>()(
  persist(immer((...a) => ({
    ...createGameSlice(...a),      // XP, tiers, missions, achievements, notifications
    ...createLeagueSlice(...a),    // sessions, battles, drill state, history
    ...createFeedSlice(...a),      // reels (liked/saved as Set<string>)
    ...createDetectionSlice(...a), // camera, MediaPipe model states
    ...createUserSlice(...a),      // auth, profile, preferences
  })))
);
```

### File Structure

```
src/
├── components/      arena/ · auth/ · gamification/ · layout/ · profile/ · pwa/ · ui/
├── constants/       disciplines.ts · gamification.ts · index.ts
├── hooks/           useAI · useAchievements · useAuth · useCamera · usePersonalization
├── lib/             audio/ · gemini · mediapipe/ · pwa/ · supabase/ · scoreEngine · utils
├── pages/           18 pages across auth/ · arena/ · battle/ · discover/ · profile/
├── router/          index.tsx (lazy + Suspense)
├── services/        achievementService.ts
├── store/           index.ts + slices/
└── types/           index.ts (all TypeScript interfaces)
```

---

## Gamification

- **XP + Points** dual-track (XP for tier progression, Points for leaderboard)
- **6 Tiers**: Bronze → Silver → Gold → Platinum → Champion → Global Elite
- **Tier Up Celebration**: Full-screen particle animation + Gemini coach message + confetti
- **26 Achievements** across Common / Rare / Epic / Legendary rarities
- **Daily Missions** (3/day, midnight reset, "Daily Perfect" bonus)
- **Weekly Challenges** (3/week, 7-day window)
- **Streak System** with Freeze tokens (earn 1 per 7 consecutive days)
- **Combo System**: 3× / 7× / 15× with XP multipliers

---

## Scoring Engine

6 dimensions, discipline-weighted:

| | Boxing | Dance | Yoga | Martial Arts |
|---|---|---|---|---|
| Accuracy | 25% | 20% | 25% | 30% |
| Stability | 20% | 10% | 20% | 15% |
| Timing | 25% | 25% | 5% | 25% |
| Expressiveness | 5% | 30% | 10% | 5% |
| Power | 30% | 5% | 0% | 25% |
| Balance | 0% | 10% | 40% | 0% |

→ Deep dive: **[docs/SCORING_ENGINE.md](docs/SCORING_ENGINE.md)**

---

## Documentation

| Document | Description |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Complete setup, Supabase config, deployment |
| [docs/FEATURES.md](docs/FEATURES.md) | Full feature specification |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture deep dive |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colors, typography, motion, components |
| [docs/SCORING_ENGINE.md](docs/SCORING_ENGINE.md) | Scoring algorithm documentation |
| [docs/MONETIZATION.md](docs/MONETIZATION.md) | Revenue model and pricing strategy |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Store selectors, hooks, services API |
| [docs/MEDIAPIPE.md](docs/MEDIAPIPE.md) | MediaPipe tasks integration guide |
| [docs/AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md) | Audio system and sound inventory |
| [docs/PWA.md](docs/PWA.md) | PWA, offline, install, push notifications |
| [supabase/schema.sql](supabase/schema.sql) | Complete database schema (run in Supabase) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Scripts

```bash
npm run dev         # Development server (localhost:5173)
npm run build       # Production build (outputs to dist/)
npm run preview     # Preview production build
npm run type-check  # TypeScript strict check
npm run lint        # ESLint
npm run test        # Vitest (once)
npm run test:watch  # Vitest (watch mode)
```

---

## Known Limitations (v2.0)

- **Mock data**: ReelsFeed and LeaguePage use mock data pending Supabase feed integration
- **MediaPipe**: Scoring engine uses simulated landmarks; swap for real in `PoseEngine.tsx`
- **Push notifications**: Client infrastructure ready; FCM server integration pending
- **Video replay**: Session recording pending WebRTC API implementation
- **Apple Health OAuth**: Requires iOS native wrapper (Capacitor integration planned)
- **3D Avatar**: AvatarPage camera feature pending Three.js integration

---

<div align="center">
Built with ⚡ by the AURA ARENA team · Cold Plasma Aesthetic
</div>
