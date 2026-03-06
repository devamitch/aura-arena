// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AppShell
// Clean bottom nav bar + Plus sheet with drag-to-dismiss
// ═══════════════════════════════════════════════════════════════════════════════

import { TierUpCelebration } from "@features/gamification/components/TierUpCelebration";
import { InstallBanner } from "@features/pwa/components/InstallBanner";
import { usePersonalization } from "@hooks/usePersonalization";
import { cn } from "@lib/utils";
import {
  useClearTierUp,
  usePendingTierUp,
  useShowPlusSheet,
  useStore,
} from "@store";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
} from "framer-motion";
import {
  Bot,
  Calendar,
  Home,
  Plus,
  Search,
  Settings as SettingsIcon,
  Swords,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useRef, type TouchEvent as RTE, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const FULLSCREEN = [
  "/arena/train",
  "/battle/pve",
  "/battle/live",
  "/discover/reels",
];

const QUICK = [
  {
    icon: Zap,
    label: "Quick Train",
    sub: "Select a drill",
    path: "/arena/drills",
    color: "#00f0ff",
  },
  {
    icon: Swords,
    label: "PvE Battle",
    sub: "vs AI",
    path: "/battle/pve/select",
    color: "#a855f7",
  },
  {
    icon: Bot,
    label: "Live Battle",
    sub: "vs Human",
    path: "/battle/live/lobby",
    color: "#60a5fa",
  },
  {
    icon: Video,
    label: "Player Reels",
    sub: "Watch athletes",
    path: "/discover/reels",
    color: "#34d399",
  },
] as const;

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/home", match: (p: string) => p === "/home" || p === "/" },
  { icon: Calendar, label: "Arena", path: "/arena", match: (p: string) => p.startsWith("/arena") },
  { icon: Plus, label: "Quick", path: null, match: () => false },
  { icon: Search, label: "Discover", path: "/discover", match: (p: string) => p.startsWith("/discover") },
  { icon: SettingsIcon, label: "Profile", path: "/profile", match: (p: string) => p.startsWith("/profile") },
];

// ─── Plus Sheet ───────────────────────────────────────────────────────────────

const PlusSheet = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const sheetY = useMotionValue(0);
  const touchStart = useRef(0);

  const onTouchStart = (e: RTE) => {
    touchStart.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: RTE) => {
    const dy = e.touches[0].clientY - touchStart.current;
    if (dy > 0) sheetY.set(dy);
  };
  const onTouchEnd = (e: RTE) => {
    const dy = e.changedTouches[0].clientY - touchStart.current;
    if (dy > 72) {
      onClose();
    } else {
      animate(sheetY, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/70"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
        style={{ y: sheetY }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="fixed bottom-0 left-0 right-0 z-[61] touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-t-[28px] pt-3 pb-10"
          style={{
            background: "#0a0d1a",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -16px 60px rgba(0,0,0,0.8)",
          }}
        >
          <div className="w-8 h-1 bg-white/15 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between px-5 mb-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
              Quick Start
            </p>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5">
            {QUICK.map((q, i) => {
              const Icon = q.icon;
              return (
                <motion.button
                  key={q.label}
                  initial={{ opacity: 0, scale: 0.88, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: i * 0.045,
                    type: "spring",
                    stiffness: 440,
                    damping: 26,
                  }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    onClose();
                    navigate(q.path);
                  }}
                  className="relative overflow-hidden rounded-2xl p-4 text-left"
                  style={{
                    background: `${q.color}0d`,
                    border: `1px solid ${q.color}20`,
                  }}
                >
                  <Icon
                    className="w-6 h-6 mb-3 relative z-10"
                    style={{ color: q.color }}
                  />
                  <p className="text-sm font-black text-white leading-none mb-1 relative z-10">
                    {q.label}
                  </p>
                  <p className="text-[11px] text-white/40 relative z-10">
                    {q.sub}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ─── App Shell ────────────────────────────────────────────────────────────────

export const AppShell = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const showSheet = useShowPlusSheet();
  const pendingTier = usePendingTierUp();
  const clearTier = useClearTierUp();
  const { setShowPlusSheet } = useStore();
  const { accentColor } = usePersonalization();

  const isFS = FULLSCREEN.some((p) => location.pathname.startsWith(p));
  const currentPath = location.pathname;

  return (
    <div
      className="flex flex-col h-full w-full text-white"
      style={{ background: "#040610" }}
    >
      {/* Main scrollable area */}
      <div className="flex-1 flex flex-col min-h-0">{children}</div>

      {/* ── Bottom Navigation ── */}
      <AnimatePresence>
        {!isFS && (
          <motion.nav
            key="bottomnav"
            initial={{ y: 72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 72, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[50]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div
              className="flex items-stretch justify-around"
              style={{
                background: "rgba(4,6,16,0.97)",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                height: 64,
              }}
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(currentPath);
                const isPlus = item.path === null;

                if (isPlus) {
                  return (
                    <button
                      key="plus"
                      onClick={() => setShowPlusSheet(!showSheet)}
                      className="flex-1 flex flex-col items-center justify-center gap-1 relative"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: "var(--ac)",
                          boxShadow: "0 0 20px rgba(0,240,255,0.35)",
                        }}
                      >
                        <Plus
                          className="w-5 h-5"
                          style={{ color: "#040914" }}
                          strokeWidth={2.5}
                        />
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => item.path && navigate(item.path)}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center gap-1 relative transition-opacity",
                      isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                    )}
                  >
                    {/* Active indicator line */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full"
                        style={{
                          background: "var(--ac)",
                          boxShadow: "0 0 8px var(--ac)",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Icon
                      className="w-[22px] h-[22px]"
                      style={{ color: isActive ? "var(--ac)" : "white" }}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                    <span
                      className="text-[10px] font-medium tracking-wide"
                      style={{ color: isActive ? "var(--ac)" : "rgba(255,255,255,0.5)" }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSheet && <PlusSheet onClose={() => setShowPlusSheet(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {pendingTier && (
          <TierUpCelebration
            tier={pendingTier}
            accentColor={accentColor}
            onClose={clearTier}
          />
        )}
      </AnimatePresence>

      <InstallBanner />
    </div>
  );
};
