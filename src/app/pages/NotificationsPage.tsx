import { cn, timeAgo } from "@lib/utils";
import { useNotifications, useStore, useUnreadCount } from "@store";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Heart,
  Star,
  Swords,
  Trophy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  achievement: { icon: Trophy, color: "#00f0ff" },
  battle: { icon: Swords, color: "#a855f7" },
  social: { icon: Heart, color: "#60a5fa" },
  tier: { icon: Star, color: "#00f0ff" },
  challenge: { icon: Star, color: "#34d399" },
  system: { icon: Bell, color: "#64748b" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const unread = useUnreadCount();
  const { markNotificationRead, markAllRead } = useStore();

  return (
    <div className="page pb-safe bg-void">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-card/60 backdrop-blur-xl border-white/10 shadow-sm flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-t2" />
          </button>
          <div>
            <h1 className="font-black text-t1 text-xl">Notifications</h1>
            {unread > 0 && (
              <p className="text-[11px] text-t3">{unread} unread</p>
            )}
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-t3 hover:text-t1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Bell className="w-12 h-12 text-t3 opacity-30" />
          <p className="text-sm text-t3">No notifications yet</p>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {notifications.map((n, i) => {
            const config = TYPE_ICONS[n.type] ?? TYPE_ICONS.system;
            const Icon = config.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markNotificationRead(n.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
                  n.isRead ? "bg-s0 border-b1 opacity-60" : "bg-s1 border-b1",
                )}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${config.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-t1 leading-tight">
                    {n.title}
                  </p>
                  <p className="text-xs text-t3 mt-0.5 leading-snug">
                    {n.body}
                  </p>
                  <p className="text-[10px] text-t3 mt-1 font-mono">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
