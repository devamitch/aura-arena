import { AuthGuard } from "@features/auth/components/AuthGuard";
import { OnboardingGate } from "@features/auth/components/OnboardingGate";
import { AppShell } from "@shared/components/AppShell";
import { FullScreenLoader } from "@shared/components/ui/FullScreenLoader";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";

const lazy_ = (factory: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(factory);
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <C />
    </Suspense>
  );
};

// Auth
const SplashPage = lazy(() => import("@app/pages/auth/SplashPage"));
const LoginPage = lazy(() => import("@app/pages/auth/LoginPage"));
const OnboardingPage = lazy(() => import("@app/pages/auth/OnboardingPage"));

// App
const DashboardPage = lazy(() => import("@app/pages/DashboardPage"));
const ArenaHubPage = lazy(() => import("@app/pages/arena/ArenaHubPage"));
const TrainingPage = lazy(() => import("@app/pages/arena/TrainingPage"));
const PvePrePage = lazy(() => import("@app/pages/battle/PvePrePage"));
const PveBattlePage = lazy(() => import("@app/pages/battle/PveBattlePage"));
const LivePrePage = lazy(() => import("@app/pages/battle/LivePrePage"));
const LiveBattlePage = lazy(() => import("@app/pages/battle/LiveBattlePage"));
const DiscoverPage = lazy(() => import("@app/pages/discover/DiscoverPage"));
const ReelsFeedPage = lazy(() => import("@app/pages/discover/ReelsFeedPage"));
const LeaguePage = lazy(() => import("@app/pages/discover/LeaguePage"));
const ProfilePage = lazy(() => import("@app/pages/profile/ProfilePage"));
const AvatarPage = lazy(() => import("@app/pages/profile/AvatarPage"));
const DataImportPage = lazy(() => import("@app/pages/profile/DataImportPage"));
const NotificationsPage = lazy(() => import("@app/pages/NotificationsPage"));
const DetectionLabPage = lazy(
  () => import("@app/pages/arena/DetectionLabPage"),
);
const OfflinePage = lazy(() => import("@app/pages/OfflinePage"));

const ProtectedLayout = () => (
  <AuthGuard>
    <OnboardingGate>
      <AppShell>
        <Outlet />
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
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: "/arena",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <ArenaHubPage />
          </Suspense>
        ),
      },
      {
        path: "/arena/train",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <TrainingPage />
          </Suspense>
        ),
      },
      {
        path: "/battle/pve/select",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <PvePrePage />
          </Suspense>
        ),
      },
      {
        path: "/battle/pve",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <PveBattlePage />
          </Suspense>
        ),
      },
      {
        path: "/battle/live/lobby",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <LivePrePage />
          </Suspense>
        ),
      },
      {
        path: "/battle/live",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <LiveBattlePage />
          </Suspense>
        ),
      },
      {
        path: "/discover",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <DiscoverPage />
          </Suspense>
        ),
      },
      {
        path: "/discover/reels",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <ReelsFeedPage />
          </Suspense>
        ),
      },
      {
        path: "/discover/league",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <LeaguePage />
          </Suspense>
        ),
      },
      {
        path: "/profile",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "/profile/avatar",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <AvatarPage />
          </Suspense>
        ),
      },
      {
        path: "/profile/import",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <DataImportPage />
          </Suspense>
        ),
      },
      {
        path: "/notifications",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: "/arena/lab",
        element: (
          <Suspense fallback={<FullScreenLoader />}>
            <DetectionLabPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
