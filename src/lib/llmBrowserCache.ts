// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — LLM Browser Cache
// Caches LLM responses in localStorage + IndexedDB for instant offline access.
// ═══════════════════════════════════════════════════════════════════════════════

const LS_PREFIX = "aura_llm_";
const IDB_DB = "aura-llm-cache";
const IDB_STORE = "responses";
const MAX_LS_ENTRIES = 200;
const MAX_IDB_ENTRIES = 2000;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── HASH FUNCTION ────────────────────────────────────────────────────────────

function hashKey(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return `${LS_PREFIX}${Math.abs(h).toString(36)}`;
}

// ─── LOCAL STORAGE CACHE (fast, small responses) ──────────────────────────────

export function getCached(prompt: string): string | null {
  const key = hashKey(prompt);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function setCached(prompt: string, response: string): void {
  const key = hashKey(prompt);
  try {
    // Evict oldest if at capacity
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(LS_PREFIX),
    );
    if (keys.length >= MAX_LS_ENTRIES) {
      // Remove oldest 20%
      const entries = keys
        .map((k) => {
          try {
            return {
              key: k,
              ts: JSON.parse(localStorage.getItem(k) ?? "{}").ts ?? 0,
            };
          } catch {
            return { key: k, ts: 0 };
          }
        })
        .sort((a, b) => a.ts - b.ts);
      entries
        .slice(0, Math.ceil(MAX_LS_ENTRIES * 0.2))
        .forEach((e) => localStorage.removeItem(e.key));
    }

    localStorage.setItem(
      key,
      JSON.stringify({ value: response, ts: Date.now() }),
    );
  } catch {
    /* localStorage full or unavailable */
  }
}

// ─── IndexedDB CACHE (large responses, model outputs) ────────────────────────

let _db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: "key" });
        store.createIndex("ts", "ts", { unique: false });
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedLarge(prompt: string): Promise<string | null> {
  try {
    const db = await getDB();
    const key = hashKey(prompt);
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        if (Date.now() - entry.ts > CACHE_TTL) return resolve(null);
        resolve(entry.value);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedLarge(
  prompt: string,
  response: string,
): Promise<void> {
  try {
    const db = await getDB();
    const key = hashKey(prompt);

    // Evict if at capacity
    const countReq = db
      .transaction(IDB_STORE, "readonly")
      .objectStore(IDB_STORE)
      .count();
    const count: number = await new Promise((r) => {
      countReq.onsuccess = () => r(countReq.result);
    });

    if (count >= MAX_IDB_ENTRIES) {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      const idx = store.index("ts");
      const cursor = idx.openCursor();
      let deleted = 0;
      const toDelete = Math.ceil(MAX_IDB_ENTRIES * 0.2);
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (c && deleted < toDelete) {
          c.delete();
          deleted++;
          c.continue();
        }
      };
    }

    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put({ key, value: response, ts: Date.now() });
  } catch {
    /* IndexedDB unavailable */
  }
}

// ─── UNIFIED CACHE API ───────────────────────────────────────────────────────

export async function getFromCache(prompt: string): Promise<string | null> {
  // Try localStorage first (faster)
  const fast = getCached(prompt);
  if (fast) return fast;
  // Then IndexedDB
  return getCachedLarge(prompt);
}

export async function saveToCache(
  prompt: string,
  response: string,
): Promise<void> {
  // Small responses → localStorage, large → IndexedDB
  if (response.length <= 2000) {
    setCached(prompt, response);
  } else {
    await setCachedLarge(prompt, response);
  }
  // Always save to both for redundancy on critical items
  if (response.length <= 500) {
    setCached(prompt, response);
  }
}

// ─── CACHE STATS ──────────────────────────────────────────────────────────────

export function getCacheStats(): { lsEntries: number; lsBytes: number } {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(LS_PREFIX));
  let bytes = 0;
  keys.forEach((k) => {
    bytes += (localStorage.getItem(k) ?? "").length * 2;
  });
  return { lsEntries: keys.length, lsBytes: bytes };
}

export function clearLLMCache(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(LS_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  getDB()
    .then((db) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).clear();
    })
    .catch(() => {});
}
