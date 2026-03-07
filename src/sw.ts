/// <reference lib="webworker" />
// Aura Arena — Service Worker (Vite PWA injectManifest strategy)
// NOTE: To activate, set strategy: 'injectManifest', srcDir: 'src', filename: 'sw.ts'
// in vite.config.ts VitePWA options, and install workbox packages.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — workbox packages installed when using injectManifest strategy
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
// @ts-ignore
import { registerRoute } from 'workbox-routing';
// @ts-ignore
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
// @ts-ignore
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & typeof globalThis & {
  __WB_MANIFEST: { url: string; revision: string | null }[];
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// MediaPipe WASM + Models — cache aggressively (large files, rarely change)
registerRoute(
  ({ url }: { url: URL }) => url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'storage.googleapis.com',
  new CacheFirst({
    cacheName: 'mediapipe-models',
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

// API calls — network first
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/') || url.hostname.includes('supabase'),
  new NetworkFirst({ cacheName: 'api-cache', plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })] }),
);

// Images — stale while revalidate
registerRoute(
  ({ request }: { request: Request }) => request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'images', plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 })] }),
);

// Push notifications
self.addEventListener('push', (event) => {
  const data    = (event as PushEvent).data?.json() as Record<string, string> | undefined ?? {};
  const title   = data['title'] ?? 'AURA ARENA';
  const options: NotificationOptions = {
    body:  data['body']  ?? 'You have a new challenge waiting!',
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    tag:   data['tag']   ?? 'aura-notification',
    data:  data['url']   ?? '/',
  };
  (event as ExtendableEvent).waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const ne = event as NotificationEvent;
  ne.notification.close();
  if (ne.action === 'dismiss') return;
  const url = (ne.notification.data as string) ?? '/';
  ne.waitUntil(self.clients.openWindow(url));
});

// Background sync for saving sessions
// SyncEvent is not in standard TS lib — cast through unknown
self.addEventListener('sync', (event) => {
  const se = event as unknown as { tag: string; waitUntil: (p: Promise<unknown>) => void };
  if (se.tag === 'sync-sessions') {
    se.waitUntil(syncPendingSessions());
  }
});

async function syncPendingSessions(): Promise<void> {
  const cache = await caches.open('pending-sessions');
  const keys  = await cache.keys();
  for (const req of keys) {
    const res = await cache.match(req);
    if (!res) continue;
    const body = await res.json() as Record<string, unknown>;
    try {
      await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      await cache.delete(req);
    } catch { /* retry next sync */ }
  }
}
