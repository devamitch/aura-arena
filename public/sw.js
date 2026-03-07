// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Service Worker
// Push notifications, offline caching, background sync, training reminders.
// ═══════════════════════════════════════════════════════════════════════════════

const CACHE_NAME = "aura-arena-v2";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ─── FETCH (Network-first, cache fallback) ───────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/rest/") || url.hostname.includes("supabase"))
    return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((r) => r || new Response("Offline", { status: 503 })),
      ),
  );
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "🔥 AURA ARENA";
  const options = {
    body: data.body || "Time to train!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    tag: data.tag || "aura-notification",
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "🎯 Open Arena" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── NOTIFICATION CLICK ──────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});

// ─── BACKGROUND SYNC ─────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-sessions")
    event.waitUntil(syncPending("pending_sessions", "sessions"));
  if (event.tag === "sync-analytics")
    event.waitUntil(syncPending("pending_analytics", "analytics_events"));
  if (event.tag === "sync-pose-frames")
    event.waitUntil(syncPending("pending_poses", "pose_frames"));
});

async function syncPending(storeName, tableName) {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const all = await idbGetAll(store);
    if (!all.length) return;

    for (const item of all) {
      try {
        await fetch(item.supabaseUrl + "/rest/v1/" + tableName, {
          method: "POST",
          headers: {
            apikey: item.supabaseKey,
            Authorization: "Bearer " + item.supabaseKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(item.data),
        });
        const delTx = db.transaction(storeName, "readwrite");
        delTx.objectStore(storeName).delete(item.id);
      } catch (e) {
        /* retry next sync */
      }
    }
  } catch (e) {
    /* IndexedDB not available */
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("aura-arena-sw", 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      ["pending_sessions", "pending_analytics", "pending_poses"].forEach(
        (s) => {
          if (!db.objectStoreNames.contains(s))
            db.createObjectStore(s, { keyPath: "id" });
        },
      );
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── MESSAGE FROM MAIN THREAD ────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title || "🔥 AURA ARENA", {
      body: event.data.body,
      icon: "/icons/icon-192x192.png",
      tag: event.data.tag || "local-notification",
      data: { url: event.data.url || "/" },
    });
  }
});
