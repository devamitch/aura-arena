// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Dashboard (Exact MusicX Match)
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuth } from "@hooks/useAuth";
import { formatNumber } from "@lib/utils";
import { useUnreadCount, useUser, useXP } from "@store";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Settings Bottom Sheet Component ── //
const SettingsSheet = ({ onClose }: { onClose: () => void }) => {
  const { signOut } = useAuth();
  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative bg-[#040610] rounded-t-[32px] p-6 pb-safe border-t border-[#00f0ff]/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">
            Settings
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <UserIcon className="w-5 h-5 text-[#00f0ff]" />
              <span className="font-semibold text-white">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#00f0ff]" />
              <span className="font-semibold text-white">
                Privacy & Security
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </button>
          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors mt-4 border border-red-500/20"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="font-semibold text-red-500">Log Out</span>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useUser();
  const xp = useXP();
  const unread = useUnreadCount();
  const [showSettings, setShowSettings] = useState(false);

  const firstName = (user?.arenaName || user?.displayName || "Athlete").split(
    " ",
  )[0];

  return (
    <div
      className="page min-h-screen text-foreground font-sans pb-safe relative overflow-hidden flex flex-col pt-10"
      style={{
        background: "#02040a",
      }}
    >
      {/* ── Extreme Cinematic Background ── */}
      <div className="absolute inset-x-0 inset-y-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(2, 6, 16, 0.9) 0%, rgba(2, 6, 16, 0.4) 50%, rgba(2, 6, 16, 0.95) 100%)",
          }}
        />
        {/* Tactical UI Grid Lines Overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00f0ff 1px, transparent 1px),
              linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(circle at top, transparent 10%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(circle at top, transparent 10%, black 100%)",
          }}
        />
      </div>

      {/* ── Decorative Sci-Fi Top Bar ── */}
      <div className="relative flex items-center justify-between px-6 mb-8 mt-2 z-20">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="font-black text-2xl tracking-tighter"
              style={{
                color: "white",
                textShadow: "0 0 10px rgba(0,240,255,0.4)",
              }}
            >
              AURA<span className="text-[#00f0ff]">ARENA</span>
            </span>
          </div>
          <div className="h-[2px] w-24 bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[#00f0ff] font-mono text-[9px] tracking-[0.2em] uppercase opacity-70">
              SYS.SYNC // ACTIVE
            </span>
            <div className="flex gap-1">
              <div className="w-1 h-3 bg-[#00f0ff] animate-pulse" />
              <div className="w-1 h-3 bg-[#00f0ff] opacity-40" />
              <div className="w-1 h-3 bg-[#00f0ff] opacity-20" />
            </div>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-full flex items-center justify-center border relative transition-colors shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            style={{
              background: "rgba(0,240,255,0.05)",
              borderColor: "rgba(0,240,255,0.3)",
            }}
          >
            <Bell className="w-4 h-4 text-[#00f0ff]" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-[#02040a]" />
            )}
          </button>
        </div>
      </div>

      {/* ── Active Operatives (Global Roster) ── */}
      <div className="mb-8 pl-6 relative z-10">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pr-6 pb-4">
          {[
            {
              name: "Mankirt",
              image: "https://i.pravatar.cc/150?img=11",
              status: "ONLINE",
            },
            {
              name: "Dilpreet",
              image: "https://i.pravatar.cc/150?img=12",
              status: "IN BATTLE",
            },
            {
              name: "Babbu",
              image: "https://i.pravatar.cc/150?img=33",
              status: "READY",
            },
            {
              name: "Roman",
              image: "https://i.pravatar.cc/150?img=47",
              status: "OFFLINE",
            },
            {
              name: "Zen",
              image: "https://i.pravatar.cc/150?img=59",
              status: "ONLINE",
            },
          ].map((athlete, i) => (
            <motion.button
              key={athlete.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-2 flex-shrink-0 relative group"
              onClick={() => navigate("/discover")}
            >
              {/* Refined MusicX Portrait */}
              <div className="relative w-20 h-20 rounded-full bg-transparent overflow-hidden border-2 border-transparent group-hover:border-[var(--ac)] transition-colors duration-300 shadow-xl">
                <div className="absolute inset-0 bg-[var(--s2)] p-0.5 rounded-full">
                  <div className="w-full h-full rounded-full relative overflow-hidden bg-[var(--s1)]">
                    <img
                      src={athlete.image}
                      alt={athlete.name}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/80 via-transparent to-transparent" />
                  </div>
                </div>
              </div>

              {/* Status and Name */}
              <div className="flex flex-col items-center mt-1">
                <span
                  className={`text-[8px] font-mono tracking-[0.2em] mb-0.5 ${athlete.status === "IN BATTLE" ? "text-red-500 animate-pulse" : athlete.status === "OFFLINE" ? "text-white/30" : "text-[#00f0ff]"}`}
                >
                  {athlete.status}
                </span>
                <span className="text-xs font-bold text-white tracking-widest uppercase shadow-[0_0_5px_rgba(0,0,0,0.8)]">
                  {athlete.name}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── HUD Dashboard Body ── */}
      <div className="flex-1 flex flex-col gap-4 pb-20 z-10 px-5 relative">
        {/* ── Main Profile & Data Block ── */}
        <div
          className="p-6 relative overflow-hidden group border border-[#00f0ff]/30 shadow-[0_0_20px_rgba(0,240,255,0.05),inset_0_0_30px_rgba(0,240,255,0.05)] bg-[#030b14]/80 backdrop-blur-md"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)",
          }}
        >
          {/* Animated Tech Lines Vector */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00f0ff] to-transparent" />
            <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-l from-[#00f0ff] to-transparent" />
          </div>

          {/* Profile Header */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              {/* Smooth Rounded Profile Pic */}
              <div className="w-16 h-16 relative overflow-hidden flex justify-center items-center rounded-2xl border border-[var(--glass-border)] bg-[var(--s2)] shadow-lg">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="font-bold text-2xl text-[var(--ac)] tracking-tighter">
                    {firstName[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <p
                  className="text-xl font-black text-white tracking-widest uppercase"
                  style={{ textShadow: "2px 2px 0px rgba(0,240,255,0.5)" }}
                >
                  {firstName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-sm bg-[#00f0ff] animate-pulse" />
                  <p className="text-[10px] font-mono tracking-[0.2em] text-[#00f0ff]/80 uppercase">
                    IDENT_VERIFIED
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 -mr-2 text-[#00f0ff]/60 hover:text-[#00f0ff] transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Balance Section (MusicX Premium Block) */}
          <div className="p-5 flex items-center justify-between relative overflow-hidden transition-colors mt-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
            {/* Soft background glow */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-[var(--ac)]/10 blur-xl rounded-full" />

            <div className="relative z-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-[#00f0ff] tracking-[0.3em] uppercase opacity-80">
                  CREDITS // AURA
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-[#00f0ff] mr-1">$</span>
                <span
                  className="text-[44px] font-black font-mono tabular-nums tracking-tighter leading-none text-white"
                  style={{ textShadow: "0 0 20px rgba(0,240,255,0.4)" }}
                >
                  {formatNumber(xp)}
                </span>
                <span className="text-sm font-bold text-[#00f0ff]/50 ml-1">
                  .00
                </span>
              </div>
            </div>

            <div className="relative z-10 w-14 h-14 rounded-full border border-[var(--ac)]/40 flex items-center justify-center flex-shrink-0 bg-[var(--s2)] shadow-inner">
              <span className="text-[var(--ac)] font-bold text-xs uppercase text-shadow-sm">
                AURA
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Deposit Button (Clean MusicX style) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/arena/drills")}
            className="h-[68px] px-5 flex items-center justify-between relative overflow-hidden group rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-gradient)] shadow-xl transition-all"
          >
            {/* Gentle Hover Fill */}
            <div className="absolute inset-0 bg-[#00d4ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out z-0" />

            <div className="flex items-center gap-3 relative z-10 w-full group-hover:text-[var(--ac)] transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-[var(--ac)]/40 bg-[var(--s2)] group-hover:bg-[var(--s4)] transition-colors">
                <ArrowDownLeft className="w-5 h-5 text-[var(--foreground)] group-hover:text-[var(--ac)]" />
              </div>
              <span className="font-bold text-[14px] text-[var(--foreground)] tracking-wide">
                Deposit
              </span>
            </div>
          </motion.button>

          {/* Withdraw Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/battle/live/lobby")}
            className="h-[68px] px-5 flex items-center justify-between relative overflow-hidden group rounded-2xl border border-[var(--glass-border)] bg-[var(--surface-gradient)] shadow-xl transition-all"
          >
            <div className="absolute inset-0 bg-[var(--ac)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out z-0" />
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--ac)]/50 to-transparent" />

            <div className="flex items-center gap-3 relative z-10 w-full justify-between pr-1">
              <span className="font-bold text-[14px] text-[var(--foreground)] tracking-wide ml-1">
                Withdraw
              </span>
              <div className="w-10 h-10 rounded-full border border-[var(--ac)]/40 bg-[var(--s2)] flex items-center justify-center group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform">
                <ArrowUpRight className="w-5 h-5 text-[var(--foreground)] group-hover:text-[var(--ac)]" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* ── Extreme HUD Stats Grid ── */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Main Target List HUD Block */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/discover/reels")}
            className="p-5 flex flex-col justify-between cursor-pointer group relative overflow-hidden border border-[#00f0ff]/40 bg-[rgba(0,240,255,0.03)]"
            style={{
              minHeight: "180px",
              clipPath:
                "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
            }}
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
              style={{
                backgroundImage: `linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)`,
                backgroundSize: "15px 15px",
              }}
            />

            <div className="flex justify-between items-start group-hover:opacity-80 transition-opacity relative z-10">
              <span className="text-[10px] font-black font-mono tracking-widest text-[#00f0ff] uppercase shadow-[0_0_10px_#00f0ff]">
                GLOBAL_ROSTER
              </span>
              <div className="w-6 h-6 border-[1px] border-[#00f0ff]/60 flex items-center justify-center bg-transparent group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">
                <ChevronRight className="w-4 h-4 text-[#00f0ff]" />
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <span className="text-[54px] font-black font-mono leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00f0ff]/50 tracking-tighter drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                24
              </span>
              <div
                className="w-full h-0.5 bg-[#00f0ff] mt-2 shadow-[0_0_10px_#00f0ff]"
                style={{ width: "40%" }}
              />
            </div>
          </motion.div>

          {/* Secondary Stats HUD Blocks */}
          <div className="flex flex-col gap-4">
            {/* Stat Block 1 */}
            <div
              className="p-4 flex flex-col justify-center relative overflow-hidden group border border-[#00f0ff]/20 bg-[rgba(0,240,255,0.02)] flex-1 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)]"
              style={{
                clipPath: "polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)",
              }}
            >
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#00f0ff]/80 uppercase relative z-10">
                LOBBIES_LIVE
              </span>
              <span className="text-[36px] font-black font-mono leading-none text-white tracking-tighter relative z-10 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
                3
              </span>
              <div className="absolute right-3 bottom-0 w-[2px] h-1/2 bg-[#00f0ff] opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Stat Block 2 */}
            <div
              className="p-4 flex flex-col justify-center relative overflow-hidden group border border-[#00f0ff]/20 bg-[rgba(0,240,255,0.02)] flex-1 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)]"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
              }}
            >
              <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#00f0ff]/80 uppercase relative z-10">
                WINS_SECURED
              </span>
              <span className="text-[36px] font-black font-mono leading-none text-white tracking-tighter relative z-10 drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]">
                12
              </span>
              <div className="absolute left-3 bottom-0 w-[2px] h-1/2 bg-[#00f0ff] opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* ── Large Horizontal Action Button ── */}
        <div className="px-5 relative z-10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-[24px] p-6 flex items-center justify-between mt-6 relative overflow-hidden group border transition-colors shadow-xl"
            style={{
              background: "var(--s1)",
              borderColor: "var(--glass-border)",
            }}
          >
            {/* Swirling glow inside button */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity">
              <div
                className="w-full h-full rounded-full blur-[30px]"
                style={{ background: "var(--hover-gradient)" }}
              />
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div
                className="w-12 h-12 rounded-full border flex items-center justify-center shadow-md transition-colors"
                style={{ background: "var(--s2)", borderColor: "var(--ac)" }}
              >
                <span
                  className="font-black text-2xl mb-1"
                  style={{ color: "var(--ac)" }}
                >
                  +
                </span>
              </div>
              <div className="text-left">
                <span className="block text-[16px] font-black text-white tracking-wide">
                  Add Funds
                </span>
                <span className="block text-[12px] font-medium text-[var(--t2)] tracking-wider">
                  Deposit Aura-X tokens
                </span>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full border border-[var(--ac)] flex items-center justify-center bg-[var(--s2)] group-hover:scale-110 transition-transform relative z-10 shadow-sm">
              <ChevronRight
                className="w-5 h-5 text-[var(--ac)] transition-colors ml-0.5"
                strokeWidth={3}
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Settings Bottom Sheet */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSheet onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
