// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Offline Queue (IndexedDB)
// Saves sessions when offline, syncs when reconnected
// 100% functional - no classes
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "@lib/supabase/client";

const DB_NAME = "aura-arena-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-sessions";

// ─── IDB HELPERS ──────────────────────────────────────────────────────────────

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbGetAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  const tx = db.transaction(storeName, "readonly");
  const req = tx.objectStore(storeName).getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
};

const idbPut = async (storeName: string, value: unknown): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const req = tx.objectStore(storeName).put(value);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

const idbDelete = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const req = tx.objectStore(storeName).delete(key);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export const saveOfflineSession = async (
  session: Record<string, unknown>,
): Promise<void> => {
  const entry = {
    ...session,
    id: session.id ?? crypto.randomUUID(),
    _savedOffline: Date.now(),
  };
  await idbPut(STORE_NAME, entry);
  console.log("[OfflineQueue] Session saved offline:", entry.id);
};

export const getPendingSessions = (): Promise<Record<string, unknown>[]> =>
  idbGetAll<Record<string, unknown>>(STORE_NAME);

export const deletePendingSession = (id: string): Promise<void> =>
  idbDelete(STORE_NAME, id);

// ─── SYNC (called when back online) ──────────────────────────────────────────

export const syncOfflineSessions = async (): Promise<number> => {
  const pending = await getPendingSessions();
  if (!pending.length) return 0;

  let synced = 0;
  for (const session of pending) {
    try {
      const data = { ...session };
      delete data._savedOffline;
      const { error } = await supabase.from("sessions").insert(data);
      if (error) {
        console.warn(
          `[OfflineQueue] Supabase insert failed for session ${session.id}. Table might be missing. Dropping to prevent queue blockage.`,
          error.message,
        );
      }
      // Always delete to avoid deadlocking the queue when tables are missing
      await deletePendingSession(session.id as string);
      if (!error) synced++;
    } catch (err) {
      console.warn(
        `[OfflineQueue] Exception during sync for session ${session.id}`,
        err,
      );
      // Delete on exception as well to keep the queue flowing
      await deletePendingSession(session.id as string);
    }
  }

  console.log(
    `[OfflineQueue] Synced ${synced}/${pending.length} offline sessions`,
  );
  return synced;
};

// ─── AUTO-SYNC on reconnect ───────────────────────────────────────────────────

export const initOfflineSync = (): (() => void) => {
  const handler = () => {
    if (navigator.onLine) syncOfflineSessions().catch(console.warn);
  };
  window.addEventListener("online", handler);
  // Try immediate sync
  if (navigator.onLine) syncOfflineSessions().catch(console.warn);
  return () => window.removeEventListener("online", handler);
};
