// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Notifications Page (MusicX-inspired)
// ═══════════════════════════════════════════════════════════════════════════════

import { useNotifications, useStore } from "@store";
import { motion } from "framer-motion";
import { Bell, CheckCheck, ChevronLeft, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#00f0ff";

const ICON_MAP: Record<string, { icon: typeof Bell; color: string }> = {
  achievement: { icon: Trophy, color: "#a855f7" },
  xp: { icon: Zap, color: ACCENT },
  streak: { icon: Zap, color: "#2dd4bf" },
  default: { icon: Bell, color: "#60a5fa" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { markAllRead } = useStore();

  return (
    <div className="page pb-safe" style={{ background: "#040610" }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
          <div>
            <p
              className="text-[9px] font-mono uppercase tracking-[0.3em] mb-0.5"
              style={{ color: ACCENT }}
            >
              Inbox
            </p>
            <h1 className="text-xl font-black text-white">Notifications</h1>
          </div>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(0,240,255,0.06)",
              border: "1px solid rgba(0,240,255,0.15)",
              color: ACCENT,
            }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Read all
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="px-5 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,240,255,0.06)",
                border: "1px solid rgba(0,240,255,0.12)",
              }}
            >
              <Bell className="w-7 h-7" style={{ color: ACCENT }} />
            </div>
            <p className="text-white/40 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n: any, i: number) => {
            const cfg = ICON_MAP[n.type] || ICON_MAP.default;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3.5 rounded-2xl"
                style={{
                  background: n.read
                    ? "rgba(255,255,255,0.02)"
                    : "rgba(0,240,255,0.03)",
                  border: `1px solid ${n.read ? "rgba(255,255,255,0.04)" : "rgba(0,240,255,0.08)"}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-white/15 font-mono mt-1">
                    {n.time || "Just now"}
                  </p>
                </div>
                {!n.read && (
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ background: ACCENT }}
                  />
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
