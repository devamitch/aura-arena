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
  const currentPath = location.pathname;

  return (
    <div
      className="flex flex-col h-full w-full text-white"
      style={{ background: "#040610" }}
    >
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
            className="fixed bottom-6 left-6 right-6 z-[60] flex justify-center"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* ── Outer Floating Track ── */}
            <div
              className="relative w-full max-w-md rounded-full p-2 flex items-center justify-between shadow-2xl"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Outer Glow Highlight */}
              <div
                className="absolute top-0 inset-x-12 h-[1px] opacity-80"
                style={{ background: "var(--primary-gradient)" }}
              />

              {/* Navigation Items overlaying the Pill */}
              <div className="relative w-full h-16 flex justify-between items-center pointer-events-auto z-20 px-2">
                {/* 1. Home */}
                <button
                  onClick={() => navigate("/home")}
                  className="relative group w-14 h-14 flex items-center justify-center rounded-[20px] transition-all"
                >
                  {/* Active Background Box */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[20px] transition-all duration-300",
                      currentPath === "/home" || currentPath === "/"
                        ? "opacity-100 shadow-md"
                        : "bg-transparent opacity-0 group-hover:bg-white/5 border border-transparent group-hover:border-white/10",
                    )}
                    style={
                      currentPath === "/home" || currentPath === "/"
                        ? {
                            background: "var(--s2)",
                            borderColor: "var(--b2)",
                            borderWidth: "1px",
                          }
                        : {}
                    }
                  />
                  <Home
                    className={cn(
                      "w-[22px] h-[22px] relative z-10 transition-colors duration-300",
                      currentPath === "/home" || currentPath === "/"
                        ? ""
                        : "text-white/40 group-hover:text-white/80",
                    )}
                    style={
                      currentPath === "/home" || currentPath === "/"
                        ? { color: "var(--ac)" }
                        : {}
                    }
                    strokeWidth={
                      currentPath === "/home" || currentPath === "/" ? 2.5 : 2
                    }
                  />
                </button>

                {/* 2. Calendar / Events */}
                <button
                  onClick={() => navigate("/arena")}
                  className="relative group w-14 h-14 flex items-center justify-center rounded-[20px] transition-all"
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[20px] transition-all duration-300",
                      currentPath.startsWith("/arena")
                        ? "opacity-100 shadow-md"
                        : "bg-transparent opacity-0 group-hover:bg-white/5 border border-transparent group-hover:border-white/10",
                    )}
                    style={
                      currentPath.startsWith("/arena")
                        ? {
                            background: "var(--s2)",
                            borderColor: "var(--b2)",
                            borderWidth: "1px",
                          }
                        : {}
                    }
                  />
                  <Calendar
                    className={cn(
                      "w-[22px] h-[22px] relative z-10 transition-colors duration-300",
                      currentPath.startsWith("/arena")
                        ? ""
                        : "text-white/40 group-hover:text-white/80",
                    )}
                    style={
                      currentPath.startsWith("/arena")
                        ? { color: "var(--ac)" }
                        : {}
                    }
                    strokeWidth={currentPath.startsWith("/arena") ? 2.5 : 2}
                  />
                </button>

                {/* 3. Central Add Button */}
                <button
                  onClick={() => setShowPlusSheet(!showSheet)}
                  className="relative group w-14 h-14 flex justify-center items-center rounded-full border shadow-md"
                  style={{ background: "var(--s1)", borderColor: "var(--b2)" }}
                >
                  {/* Swirling glow inside central button */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div
                      className="absolute -inset-4 opacity-30 animate-[spin_4s_linear_infinite]"
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0%, var(--ac) 30%, transparent 60%)",
                      }}
                    />
                  </div>
                  <div
                    className="absolute inset-1 rounded-full border"
                    style={{
                      background: "var(--s2)",
                      borderColor: "var(--b1)",
                    }}
                  />
                  <Plus
                    className="w-5 h-5 relative z-10 hover:scale-110 transition-transform"
                    style={{ color: "var(--ac)" }}
                    strokeWidth={3}
                  />
                </button>

                {/* 4. Global Search / Explore */}
                <button
                  onClick={() => navigate("/discover")}
                  className="relative group w-14 h-14 flex items-center justify-center rounded-[20px] transition-all"
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[20px] transition-all duration-300",
                      currentPath.startsWith("/discover")
                        ? "opacity-100 shadow-md"
                        : "bg-transparent opacity-0 group-hover:bg-white/5 border border-transparent group-hover:border-white/10",
                    )}
                    style={
                      currentPath.startsWith("/discover")
                        ? {
                            background: "var(--s2)",
                            borderColor: "var(--b2)",
                            borderWidth: "1px",
                          }
                        : {}
                    }
                  />
                  <Search
                    className={cn(
                      "w-[22px] h-[22px] relative z-10 transition-colors duration-300",
                      currentPath.startsWith("/discover")
                        ? ""
                        : "text-white/40 group-hover:text-white/80",
                    )}
                    style={
                      currentPath.startsWith("/discover")
                        ? { color: "var(--ac)" }
                        : {}
                    }
                    strokeWidth={currentPath.startsWith("/discover") ? 2.5 : 2}
                  />
                </button>

                {/* 5. Settings / Profile */}
                <button
                  onClick={() => navigate("/profile")}
                  className="relative group w-14 h-14 flex items-center justify-center rounded-[20px] transition-all"
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[20px] transition-all duration-300",
                      currentPath.startsWith("/profile")
                        ? "opacity-100 shadow-md"
                        : "bg-transparent opacity-0 group-hover:bg-white/5 border border-transparent group-hover:border-white/10",
                    )}
                    style={
                      currentPath.startsWith("/profile")
                        ? {
                            background: "var(--s2)",
                            borderColor: "var(--b2)",
                            borderWidth: "1px",
                          }
                        : {}
                    }
                  />
                  <SettingsIcon
                    className={cn(
                      "w-[22px] h-[22px] relative z-10 transition-colors duration-300",
                      currentPath.startsWith("/profile")
                        ? ""
                        : "text-white/40 group-hover:text-white/80",
                    )}
                    style={
                      currentPath.startsWith("/profile")
                        ? { color: "var(--ac)" }
                        : {}
                    }
                    strokeWidth={currentPath.startsWith("/profile") ? 2.5 : 2}
                  />
                </button>
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
