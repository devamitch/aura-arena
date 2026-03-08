// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Router
// Dynamic routes for training drills, PvE battles, and live battles
// ═══════════════════════════════════════════════════════════════════════════════

import { AuthGuard } from "@features/auth/components/AuthGuard";
import { OnboardingGate } from "@features/auth/components/OnboardingGate";
import { AppShell } from "@shared/components/AppShell";
import { FullScreenLoader } from "@shared/components/ui/FullScreenLoader";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy } from "react";
import {
  Outlet,
  RouterProvider,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";

const lazy_ = (factory: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(factory);
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <C />
    </Suspense>
  );
};

// Auth & standalone pages (outside ProtectedLayout, use raw Suspense)
const SplashPage = lazy(() => import("@app/pages/auth/SplashPage"));
const LoginPage = lazy(() => import("@app/pages/auth/LoginPage"));
const OnboardingPage = lazy(() => import("@app/pages/auth/OnboardingPage"));
const OfflinePage = lazy(() => import("@app/pages/OfflinePage"));

// Protected pages are inlined via lazy_() in route definitions below

const AnimatedOutlet = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 1.02, filter: "blur(5px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col min-h-0"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};

const ProtectedLayout = () => (
  <AuthGuard>
    <OnboardingGate>
      <AppShell>
        <AnimatedOutlet />
      </AppShell>
    </OnboardingGate>
  </AuthGuard>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<FullScreenLoader />}>
        <SplashPage />
      </Suspense>
    ),
  },
  {
    path: "/intro",
    element: lazy_(() => import("@app/pages/auth/IntroPage")),
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<FullScreenLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/onboarding",
    element: (
      <AuthGuard>
        <Suspense fallback={<FullScreenLoader />}>
          <OnboardingPage />
        </Suspense>
      </AuthGuard>
    ),
  },
  {
    path: "/offline",
    element: (
      <Suspense fallback={<FullScreenLoader />}>
        <OfflinePage />
      </Suspense>
    ),
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/home",
        element: lazy_(() => import("@app/pages/DashboardPage")),
      },
      {
        path: "/arena",
        element: lazy_(() => import("@app/pages/arena/ArenaHubPage")),
      },
      // ── Training: list and details ────────────────────────────
      {
        path: "/arena/drills",
        element: lazy_(() => import("@app/pages/arena/TrainingSelectionPage")),
      },
      {
        path: "/arena/train",
        element: lazy_(() => import("@app/pages/arena/TrainingPage")),
      },
      {
        path: "/arena/train/:drillId",
        element: lazy_(() => import("@app/pages/arena/TrainingPage")),
      },
      // ── PvE Battle: opponent selection + battle with ID ───────
      {
        path: "/battle/pve/select",
        element: lazy_(() => import("@app/pages/battle/PvePrePage")),
      },
      {
        path: "/battle/pve/:opponentId",
        element: lazy_(() => import("@app/pages/battle/PveBattlePage")),
      },
      {
        path: "/battle/pve",
        element: lazy_(() => import("@app/pages/battle/PveBattlePage")),
      },
      // ── Live Battle ────────────────────────────────────────────
      {
        path: "/battle/live/lobby",
        element: lazy_(() => import("@app/pages/battle/LivePrePage")),
      },
      {
        path: "/battle/live",
        element: lazy_(() => import("@app/pages/battle/LiveBattlePage")),
      },
      {
        path: "/battle/live/:matchId",
        element: lazy_(() => import("@app/pages/battle/LiveBattlePage")),
      },
      // ── Discover ───────────────────────────────────────────────
      {
        path: "/discover",
        element: lazy_(() => import("@app/pages/discover/DiscoverPage")),
      },
      {
        path: "/discover/reels",
        element: lazy_(() => import("@app/pages/discover/ReelsFeedPage")),
      },
      {
        path: "/discover/league",
        element: lazy_(() => import("@app/pages/discover/LeaguePage")),
      },
      // ── Profile ────────────────────────────────────────────────
      {
        path: "/profile",
        element: lazy_(() => import("@app/pages/profile/ProfilePage")),
      },
      {
        path: "/profile/avatar",
        element: lazy_(() => import("@app/pages/profile/AvatarPage")),
      },
      {
        path: "/profile/import",
        element: lazy_(() => import("@app/pages/profile/DataImportPage")),
      },
      // ── Other ──────────────────────────────────────────────────
      {
        path: "/notifications",
        element: lazy_(() => import("@app/pages/NotificationsPage")),
      },
      {
        path: "/arena/lab",
        element: lazy_(() => import("@app/pages/arena/DetectionLabPage")),
      },
      {
        path: "/chat",
        element: lazy_(() => import("@app/pages/chat/AIChatPage")),
      },
      // ── Arcade mini-games ──────────────────────────────────────
      {
        path: "/arcade",
        element: lazy_(() => import("@app/pages/arcade/ArcadePage")),
      },
      {
        path: "/arcade/rps",
        element: lazy_(() => import("@app/pages/arcade/RockPaperScissors")),
      },
      {
        path: "/arcade/tictactoe",
        element: lazy_(() => import("@app/pages/arcade/TicTacToe")),
      },
      {
        path: "/arcade/coinflip",
        element: lazy_(() => import("@app/pages/arcade/CoinFlip")),
      },
      {
        path: "/arcade/reflex",
        element: lazy_(() => import("@app/pages/arcade/ReflexGame")),
      },
      {
        path: "/arcade/numguess",
        element: lazy_(() => import("@app/pages/arcade/NumberGuess")),
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
