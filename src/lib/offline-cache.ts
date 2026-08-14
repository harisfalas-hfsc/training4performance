/**
 * Offline workspace cache.
 *
 * The coach's workspace (team, players, sessions, GPS, RPE, medical, tests) is
 * cloud-authoritative, but a copy is kept in this browser so the platform keeps
 * working with no connection: everything already inside stays readable and
 * editable, and changes made offline are pushed the moment the connection is
 * back.
 */

import type { WorkspaceData } from "@/data/performance";
import type { TestRecord } from "@/data/testing";

export interface OfflineWorkspace {
  workspace: WorkspaceData;
  tests: TestRecord[];
  /** Local changes not yet accepted by the cloud. */
  pending: boolean;
  savedAt: string;
}

const PREFIX = "t4p.cache.v1.";

function key(userId: string) {
  return `${PREFIX}${userId}`;
}

export function readOfflineWorkspace(userId: string): OfflineWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfflineWorkspace;
    if (!parsed || typeof parsed !== "object" || !parsed.workspace) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeOfflineWorkspace(
  userId: string,
  workspace: WorkspaceData,
  tests: TestRecord[],
  pending: boolean,
) {
  if (typeof window === "undefined") return;
  try {
    const payload: OfflineWorkspace = {
      workspace,
      tests,
      pending,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key(userId), JSON.stringify(payload));
  } catch {
    /* storage full or blocked — offline cache is best-effort */
  }
}

export function markOfflinePending(userId: string, pending: boolean) {
  const cached = readOfflineWorkspace(userId);
  if (!cached) return;
  writeOfflineWorkspace(userId, cached.workspace, cached.tests, pending);
}

export function hasOfflinePending(userId: string): boolean {
  return readOfflineWorkspace(userId)?.pending === true;
}

export function clearOfflineWorkspace(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    /* ignore */
  }
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
