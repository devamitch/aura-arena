// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AppShell
// Floating glassmorphism bottom nav + Plus quick-start sheet
// ═══════════════════════════════════════════════════════════════════════════════

import { TierUpCelebration } from "@features/gamification/components/TierUpCelebration";
import { InstallBanner } from "@features/pwa/components/InstallBanner";
import { usePersonalization } from "@hooks/usePersonalization";
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
  Home,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Swords,
  User as UserIcon,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useRef, type TouchEvent as RTE, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

// Pages that hide the bottom nav (full-screen camera/battle/feed)
const FULLSCREEN_PREFIXES = ["/arena/train", "/battle/live", "/discover/reels"];

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
    icon: MessageSquare,
    label: "AI Coach Chat",
    sub: "Get coaching tips",
    path: "/chat",
    color: "#f59e0b",
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
  {
    icon: Home,
    label: "Home",
    path: "/home",
    match: (p: string) => p === "/home" || p === "/",
  },
  {
    icon: Shield,
    label: "Arena",
    path: "/arena",
    match: (p: string) => p.startsWith("/arena") || p.startsWith("/battle"),
  },
  { icon: Plus, label: "Quick", path: null, match: () => false },
  {
    icon: Search,
    label: "Discover",
    path: "/discover",
    match: (p: string) => p.startsWith("/discover"),
  },
  {
    icon: UserIcon,
    label: "Profile",
    path: "/profile",
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/chat"),
  },
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
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
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
          className="rounded-t-[32px] pt-3 pb-10"
          style={{
            background: "rgba(8, 10, 22, 0.98)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.9)",
          }}
        >
          <div className="w-9 h-1 bg-white/15 rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between px-5 mb-5">
            <div>
              <p
                className="text-[9px] font-mono uppercase tracking-[0.3em] mb-0.5"
                style={{ color: "var(--ac)" }}
              >
                Quick Start
              </p>
              <p className="text-base font-black text-white">
                What are you doing?
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 px-5">
            {QUICK.map((q, i) => {
              const Icon = q.icon;
              return (
                <motion.button
                  key={q.label}
                  initial={{ opacity: 0, scale: 0.88, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 440,
                    damping: 26,
                  }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => {
                    onClose();
                    navigate(q.path);
                  }}
                  className="relative overflow-hidden rounded-[22px] p-5 text-left"
                  style={{
                    background: `${q.color}08`,
                    border: `1px solid ${q.color}18`,
                  }}
                >
                  <div
                    className="absolute top-0 left-4 right-4 h-[1px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${q.color}60, transparent)`,
                    }}
                  />
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 relative z-10"
                    style={{
                      background: `${q.color}14`,
                      border: `1px solid ${q.color}20`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: q.color }} />
                  </div>
                  <p className="text-sm font-black text-white leading-none mb-1 relative z-10">
                    {q.label}
                  </p>
                  <p
                    className="text-[11px] relative z-10"
                    style={{ color: `${q.color}90` }}
                  >
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

  const path = location.pathname;

  // Hide nav only in full-screen modes
  // /battle/pve/select is a lobby page (keep nav); /battle/pve/:id is fullscreen
  const isFS =
    FULLSCREEN_PREFIXES.some((p) => path.startsWith(p)) ||
    (path.startsWith("/battle/pve/") && path !== "/battle/pve/select");

  return (
    <div
      className="flex flex-col h-full w-full text-white"
      style={{ background: "#040610" }}
    >
      <div className="flex-1 flex flex-col min-h-0">{children}</div>

      {/* ── Floating Bottom Navigation ── */}
      <AnimatePresence>
        {!isFS && (
          <motion.nav
            key="bottomnav"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-[50]"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            <div
              className="flex items-center justify-around relative"
              style={{
                background: "rgba(6, 8, 22, 0.94)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                borderRadius: "28px",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow:
                  "0 8px 40px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.05) inset",
                height: 66,
                padding: "0 6px",
              }}
            >
              {/* Subtle top glow line */}
              <div
                className="absolute top-0 left-[20%] right-[20%] h-[1px] rounded-full pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
                }}
              />

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.match(path);
                const isPlus = item.path === null;

                if (isPlus) {
                  return (
                    <button
                      key="plus"
                      onClick={() => setShowPlusSheet(!showSheet)}
                      className="flex-1 flex flex-col items-center justify-center relative"
                    >
                      <motion.div
                        whileTap={{ scale: 0.88 }}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-95"
                        style={{
                          background: `linear-gradient(145deg, ${accentColor}, ${accentColor}bb)`,
                          boxShadow: `0 0 22px ${accentColor}55, 0 4px 14px rgba(0,0,0,0.5)`,
                        }}
                      >
                        <motion.div
                          animate={showSheet ? { rotate: 45 } : { rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                        >
                          <Plus
                            className="w-5 h-5"
                            style={{ color: "#040914" }}
                            strokeWidth={2.8}
                          />
                        </motion.div>
                      </motion.div>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.label}
                    onClick={() => item.path && navigate(item.path)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 relative py-2 select-none group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-x-0.5 inset-y-1 rounded-[18px]"
                        style={{ background: `${accentColor}14` }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center gap-[3px]">
                      <Icon
                        className="w-[21px] h-[21px] transition-all duration-300 group-active:scale-90"
                        style={{
                          color: isActive
                            ? accentColor
                            : "rgba(255,255,255,0.32)",
                          filter: isActive
                            ? `drop-shadow(0 0 5px ${accentColor}90)`
                            : "none",
                        }}
                        strokeWidth={isActive ? 2.3 : 1.8}
                      />
                      <span
                        className="text-[9.5px] font-semibold tracking-wide transition-colors duration-200"
                        style={{
                          color: isActive
                            ? accentColor
                            : "rgba(255,255,255,0.28)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
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
