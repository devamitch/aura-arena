// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AppShell
// Bottom nav with spring-animated tab indicator + Plus sheet with drag-to-dismiss
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
  Compass,
  Home,
  Plus,
  Swords,
  User,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useRef, type TouchEvent as RTE, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ─── Always-cyan accent for bottom nav (never discipline-dependent) ──────────
const NAV_ACCENT = "#00f0ff";

const FULLSCREEN = [
  "/arena/train",
  "/battle/pve",
  "/battle/live",
  "/discover/reels",
];

const TABS = [
  { id: "home", label: "Home", icon: Home, path: "/home" },
  { id: "arena", label: "Arena", icon: Swords, path: "/arena" },
  { id: "discover", label: "Explore", icon: Compass, path: "/discover" },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
] as const;

const QUICK = [
  {
    icon: Zap,
    label: "Quick Train",
    sub: "Start session",
    path: "/arena/train",
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
    label: "Post Reel",
    sub: "Share a clip",
    path: "/discover/reels",
    color: "#34d399",
  },
] as const;

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
        className="fixed inset-0 z-[60]"
        style={{
          background: "rgba(2,4,12,0.78)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
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
            background: "var(--s1)",
            border: "1px solid var(--b1)",
            borderBottom: "none",
            boxShadow: "0 -24px 80px rgba(0,0,0,0.75)",
          }}
        >
          <div className="w-8 h-1 bg-b2 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between px-5 mb-5">
            <p className="label-section">Quick Start</p>
            <button onClick={onClose} className="btn-icon w-8 h-8">
              <X className="w-3.5 h-3.5 text-t2" />
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
                    background: `${q.color}0e`,
                    border: `1px solid ${q.color}22`,
                  }}
                >
                  <div
                    className="absolute -top-5 -right-5 w-20 h-20 rounded-full blur-2xl opacity-25"
                    style={{ background: q.color }}
                  />
                  <Icon
                    className="w-6 h-6 mb-3 relative z-10"
                    style={{ color: q.color }}
                  />
                  <p className="text-sm font-black text-t1 leading-none mb-1 relative z-10">
                    {q.label}
                  </p>
                  <p className="text-[11px] text-t3 relative z-10">{q.sub}</p>
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
  const activeId =
    TABS.find(
      (t) =>
        location.pathname === t.path ||
        location.pathname.startsWith(t.path + "/"),
    )?.id ?? "home";

  return (
    <div className="flex flex-col h-full w-full bg-void text-t1">
      {/* Main scrollable area — each page uses .page class for its own scroll */}
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
            className="fixed bottom-0 left-0 right-0 z-[60]"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-center pt-2.5 pb-4 px-2 rounded-t-[28px] glass-heavy">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.id === activeId;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className="flex-1 flex flex-col items-center gap-1 py-1 relative"
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${NAV_ACCENT}, transparent)`,
                          boxShadow: `0 0 12px ${NAV_ACCENT}`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                    <motion.div
                      animate={{ scale: active ? 1.15 : 1, y: active ? -2 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      <Icon
                        className={cn(
                          "w-[22px] h-[22px] transition-colors duration-200",
                          active ? "" : "opacity-30",
                        )}
                        style={{
                          color: active ? NAV_ACCENT : "rgba(255,255,255,0.5)",
                        }}
                        strokeWidth={active ? 2.4 : 1.6}
                      />
                    </motion.div>
                    <span
                      className={cn(
                        "text-[9px] font-mono uppercase tracking-[0.12em] transition-colors duration-200",
                        active ? "font-bold" : "opacity-30",
                      )}
                      style={{
                        color: active ? NAV_ACCENT : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}

              {/* Center Plus button */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-6">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setShowPlusSheet(!showSheet)}
                  className="w-[54px] h-[54px] rounded-[18px] flex items-center justify-center shadow-2xl"
                  style={{
                    background: showSheet
                      ? "#0a0e1f"
                      : `linear-gradient(145deg, ${NAV_ACCENT}, ${NAV_ACCENT}bb)`,
                    border: showSheet ? `1.5px solid ${NAV_ACCENT}44` : "none",
                    boxShadow: showSheet
                      ? `0 0 20px ${NAV_ACCENT}20`
                      : `0 8px 32px ${NAV_ACCENT}55`,
                    transition: "background 0.2s, box-shadow 0.2s",
                  }}
                >
                  <motion.div
                    animate={{ rotate: showSheet ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 25 }}
                  >
                    <Plus
                      className="w-6 h-6"
                      style={{ color: showSheet ? NAV_ACCENT : "#030510" }}
                      strokeWidth={showSheet ? 2 : 2.8}
                    />
                  </motion.div>
                </motion.button>
              </div>
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
