// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Notification Service
// Registers service worker, requests push permission, schedules local
// notifications, and sends push notification triggers via Supabase.
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "@lib/supabase/client";

// ─── SERVICE WORKER REGISTRATION ──────────────────────────────────────────────

let _swReg: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    _swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.info("[Notifications] Service worker registered");
    return _swReg;
  } catch (err) {
    console.warn("[Notifications] SW registration failed:", err);
    return null;
  }
}

// ─── PUSH SUBSCRIPTION ───────────────────────────────────────────────────────

export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeToPush(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (!_swReg) await registerServiceWorker();
  if (!_swReg) return null;

  try {
    const sub = await _swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Save subscription to Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: JSON.stringify(sub.toJSON().keys),
        updated_at: new Date().toISOString(),
      });
    }

    return sub;
  } catch (err) {
    console.warn("[Notifications] Push subscription failed:", err);
    return null;
  }
}

// ─── LOCAL NOTIFICATIONS ──────────────────────────────────────────────────────

export function showLocalNotification(
  title: string,
  body: string,
  url?: string,
  tag?: string,
) {
  if (!_swReg) return;
  navigator.serviceWorker.controller?.postMessage({
    type: "SHOW_NOTIFICATION",
    title,
    body,
    url: url ?? "/",
    tag: tag ?? `local-${Date.now()}`,
  });
}

// ─── SCHEDULED NOTIFICATIONS ─────────────────────────────────────────────────

export function scheduleTrainingReminder(hour = 9, minute = 0) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    showLocalNotification(
      "🔥 Time to Train!",
      "Your daily AURA ARENA session awaits. Keep your streak alive!",
      "/train",
      "daily-reminder",
    );
    // Re-schedule for tomorrow
    scheduleTrainingReminder(hour, minute);
  }, delay);
}

// ─── STREAK NOTIFICATIONS ─────────────────────────────────────────────────────

export function notifyStreakMilestone(streak: number) {
  if (streak % 7 === 0) {
    showLocalNotification(
      `🔥 ${streak}-Day Streak!`,
      `Incredible! ${streak} days of consistent training. You're unstoppable!`,
      "/profile",
      "streak-milestone",
    );
  }
}

export function notifyAchievement(name: string, description: string) {
  showLocalNotification(
    `🏆 Achievement Unlocked!`,
    `${name}: ${description}`,
    "/profile",
    "achievement",
  );
}

export function notifyScoreMilestone(score: number, discipline: string) {
  if (score >= 90) {
    showLocalNotification(
      `⚡ Perfect Score in ${discipline}!`,
      `You scored ${score}/100 — Share this as a reel!`,
      "/reels",
      "score-milestone",
    );
  }
}

export function notifyPlanReady(taskCount: number) {
  showLocalNotification(
    "📋 Daily Plan Ready",
    `Your ${taskCount}-task training plan for today is generated. Let's go!`,
    "/planner",
    "plan-ready",
  );
}

// ─── BACKGROUND SYNC REGISTRATION ────────────────────────────────────────────

export async function registerBackgroundSync(tag: string) {
  if (!_swReg) return;
  try {
    await (_swReg as any).sync?.register(tag);
  } catch {
    /* Background Sync not supported */
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
