// AURA ARENA - Kill-Switch Service Worker
// Placed here to force the browser to unregister the stale service worker
// and clear any cached assets that are preventing the new code from loading.

self.addEventListener("install", (e) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("[Kill-Switch SW] Deleting cache:", cacheName);
            return caches.delete(cacheName);
          }),
        );
      })
      .then(() => {
        self.clients.claim();
        console.log("[Kill-Switch SW] Caches cleared. Unregistering self...");
        return self.registration.unregister();
      }),
  );
});

self.addEventListener("fetch", (e) => {
  // Pass through all requests to the network
  e.respondWith(fetch(e.request));
});
