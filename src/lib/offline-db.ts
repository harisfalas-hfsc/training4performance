/**
 * Offline data store.
 *
 * A single IndexedDB store holds a copy of everything the signed-in coach is
 * allowed to see. Each entry is an envelope `{ data, savedAt }` written under a
 * key scoped by user id (`userId::key`), so two accounts on the same device can
 * never read each other's data, and signing out of one account only clears that
 * account's keys.
 *
 * Every read in the platform goes through `offlineFirst()`: try the network,
 * store the fresh copy, and fall back to the last saved copy on any failure.
 */

import { clear, createStore, del, get, keys, set, type UseStore } from "idb-keyval";

export interface Envelope<T> {
  data: T;
  savedAt: string;
}

let store: UseStore | null = null;

function db(): UseStore | null {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return null;
  if (!store) store = createStore("t4p-offline", "cache");
  return store;
}

export function scopedKey(userId: string, key: string) {
  return `${userId}::${key}`;
}

/** Anything in this list is member state and must survive cache trimming. */
const PROTECTED = [
  "account",
  "profile",
  "subscription",
  "roles",
  "workspace",
  "tests",
  "logbook",
  "sessions",
  "players",
  "gps",
  "wellness",
  "notifications",
  "support",
  "library",
  "library-filters",
  "player-access",
  "progress",
  "settings",
];

export function isProtectedKey(key: string) {
  const bare = key.includes("::") ? key.slice(key.indexOf("::") + 2) : key;
  return PROTECTED.some((p) => bare === p || bare.startsWith(`${p}:`) || bare.startsWith(`${p}.`));
}

export async function readCache<T>(userId: string, key: string): Promise<Envelope<T> | null> {
  const s = db();
  if (!s) return null;
  try {
    const raw = (await get(scopedKey(userId, key), s)) as Envelope<T> | undefined;
    if (!raw || typeof raw !== "object" || !("data" in raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export async function writeCache<T>(userId: string, key: string, data: T): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    await set(scopedKey(userId, key), { data, savedAt: new Date().toISOString() } satisfies Envelope<T>, s);
  } catch {
    // Quota exceeded: drop expendable entries and try once more.
    try {
      await trimCache(userId, 40);
      await set(scopedKey(userId, key), { data, savedAt: new Date().toISOString() }, s);
    } catch {
      /* best effort */
    }
  }
}

export async function removeCache(userId: string, key: string) {
  const s = db();
  if (!s) return;
  try {
    await del(scopedKey(userId, key), s);
  } catch {
    /* ignore */
  }
}

export class OfflineNoDataError extends Error {
  constructor() {
    super("You're offline and this device has no saved copy yet. Connect once and it will be stored here.");
    this.name = "OfflineNoDataError";
  }
}

export function browserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * The one read helper. Tries the network first, saves what comes back, and
 * returns the last saved copy whenever the network is unavailable or fails.
 */
export async function offlineFirst<T>(
  key: string,
  loader: () => Promise<T>,
  userId: string | null | undefined,
): Promise<T> {
  const uid = userId ?? "anon";
  if (browserOnline()) {
    try {
      const fresh = await loader();
      await writeCache(uid, key, fresh);
      return fresh;
    } catch (err) {
      const cached = await readCache<T>(uid, key);
      if (cached) return cached.data;
      throw err;
    }
  }
  const cached = await readCache<T>(uid, key);
  if (cached) return cached.data;
  throw new OfflineNoDataError();
}

/** Last time a key was refreshed, for "saved on this device" notes. */
export async function cachedAt(userId: string, key: string): Promise<string | null> {
  return (await readCache(userId, key))?.savedAt ?? null;
}

/**
 * Frees space by deleting only expendable entries (media, one-off detail
 * views), oldest first. Member state on the protected list is never evicted —
 * a growing drills library must never empty somebody's logbook offline.
 */
export async function trimCache(userId: string, keepExpendable = 150) {
  const s = db();
  if (!s) return;
  try {
    const all = (await keys(s)) as string[];
    const mine = all.filter((k) => typeof k === "string" && k.startsWith(`${userId}::`) && !isProtectedKey(k));
    if (mine.length <= keepExpendable) return;
    const dated = await Promise.all(
      mine.map(async (k) => ({ k, at: ((await get(k, s)) as Envelope<unknown> | undefined)?.savedAt ?? "" })),
    );
    dated.sort((a, b) => a.at.localeCompare(b.at));
    const remove = dated.slice(0, dated.length - keepExpendable);
    await Promise.all(remove.map((r) => del(r.k, s)));
  } catch {
    /* ignore */
  }
}

/** Removes only this account's saved copy. Other accounts are untouched. */
export async function clearUserCache(userId: string) {
  const s = db();
  if (!s) return;
  try {
    const all = (await keys(s)) as string[];
    await Promise.all(
      all.filter((k) => typeof k === "string" && k.startsWith(`${userId}::`)).map((k) => del(k, s)),
    );
  } catch {
    /* ignore */
  }
}

export async function clearAllCaches() {
  const s = db();
  if (!s) return;
  try {
    await clear(s);
  } catch {
    /* ignore */
  }
}
