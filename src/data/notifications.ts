import { useSyncExternalStore } from "react";
import { scopedStorageKey, subscribeWorkspaceScope } from "@/lib/workspace-scope";
import { today } from "@/data/performance";
import {
  DEFAULT_ENABLED,
  DEFAULT_THRESHOLDS,
  evaluateAlerts,
  type AlertCategory,
  type AlertSeverity,
  type RuleId,
  type Thresholds,
} from "@/data/alerts-config";
import { autoFindings, findingPlayerName, testLabel } from "@/data/testing";

export type NotificationSource = "alert" | "record";
export type NotificationCategory = AlertCategory | "Record";

export interface AppNotification {
  id: string;
  source: NotificationSource;
  ruleId?: RuleId;
  category: NotificationCategory;
  severity: AlertSeverity;
  playerId: string;
  playerName: string;
  title: string;
  message: string;
  metric?: string;
  value?: string;
  reference?: string;
  action?: string;
  /** Day the event happened (yyyy-mm-dd). */
  date: string;
  /** When the notification first appeared. */
  createdAt: string;
  read: boolean;
  deleted: boolean;
}

const STORAGE_KEY = "t4p.notifications.v1";
export const notifications: AppNotification[] = [];

const listeners = new Set<() => void>();
let version = 0;

function replace(next: AppNotification[]) {
  notifications.splice(0, notifications.length, ...next);
}

function persist() {
  if (typeof window === "undefined") return;
  const key = scopedStorageKey(STORAGE_KEY);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(notifications));
  } catch {
    /* quota — ignore */
  }
}

function emit() {
  version++;
  persist();
  listeners.forEach((l) => l());
}

export function subscribeNotifications(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useNotificationVersion() {
  return useSyncExternalStore(
    (cb) => subscribeNotifications(cb),
    () => version,
    () => 0,
  );
}

function hydrate(userId: string | null) {
  if (typeof window === "undefined") return;
  replace([]);
  const key = scopedStorageKey(STORAGE_KEY, userId);
  if (key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) replace(JSON.parse(raw) as AppNotification[]);
    } catch {
      /* corrupt — start clean */
    }
  }
  version++;
  listeners.forEach((l) => l());
}

subscribeWorkspaceScope((userId) => hydrate(userId));

/* ------------------------------------------------------------------ */
/* Building the feed                                                    */
/* ------------------------------------------------------------------ */

function buildCurrent(thresholds: Thresholds, enabled: RuleId[]): AppNotification[] {
  const stamp = new Date().toISOString();
  const out: AppNotification[] = [];

  // Threshold alerts (workload, wellness, availability, performance)
  for (const a of evaluateAlerts(thresholds, enabled)) {
    if (a.ruleId === "speedPb") continue; // covered by the record feed below, with its real date
    out.push({
      id: `alert-${a.id}-${today}`,
      source: "alert",
      ruleId: a.ruleId,
      category: a.category,
      severity: a.severity,
      playerId: a.player.id,
      playerName: `${a.player.firstName} ${a.player.lastName}`,
      title: a.metric,
      message: a.message,
      metric: a.metric,
      value: a.value,
      reference: a.threshold,
      action: a.action,
      date: today,
      createdAt: stamp,
      read: false,
      deleted: false,
    });
  }

  // Records broken in training or a game (GPS/strength beating the tested value)
  for (const f of autoFindings()) {
    out.push({
      id: `record-${f.playerId}-${f.testId}-${f.date}`,
      source: "record",
      category: "Record",
      severity: "info",
      playerId: f.playerId,
      playerName: findingPlayerName(f.playerId),
      title: `New record — ${testLabel(f.testId)}`,
      message: f.text,
      metric: testLabel(f.testId),
      value: String(f.value),
      reference: f.previous !== null ? `previous best ${f.previous}` : "first record",
      action: "The test record is updated automatically — rebuild the player's zones and targets from it.",
      date: f.date,
      createdAt: stamp,
      read: false,
      deleted: false,
    });
  }

  return out;
}

/**
 * Merge freshly evaluated alerts and records into the stored feed.
 * Existing entries keep their read/deleted state and their first-seen time,
 * so nothing is ever lost when a threshold stops triggering.
 */
export function syncNotifications(
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
  enabled: RuleId[] = DEFAULT_ENABLED,
) {
  const current = buildCurrent(thresholds, enabled);
  const byId = new Map(notifications.map((n) => [n.id, n]));
  let changed = false;
  for (const n of current) {
    const prev = byId.get(n.id);
    if (!prev) {
      notifications.push(n);
      changed = true;
    } else if (prev.message !== n.message || prev.value !== n.value) {
      Object.assign(prev, { message: n.message, value: n.value, reference: n.reference, action: n.action });
      changed = true;
    }
  }
  if (changed) {
    notifications.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    emit();
  }
}

/* ------------------------------------------------------------------ */
/* Mutations                                                            */
/* ------------------------------------------------------------------ */

const apply = (ids: string[], patch: Partial<AppNotification>) => {
  const set = new Set(ids);
  for (const n of notifications) if (set.has(n.id)) Object.assign(n, patch);
  emit();
};

export const setRead = (id: string, read: boolean) => apply([id], { read });
export const markAllRead = (ids: string[]) => apply(ids, { read: true });
export const softDelete = (id: string) => apply([id], { deleted: true, read: true });
export const restore = (id: string) => apply([id], { deleted: false });
export const deleteMany = (ids: string[]) => apply(ids, { deleted: true, read: true });

/** Permanently remove everything that was already deleted. */
export function emptyBin() {
  replace(notifications.filter((n) => !n.deleted));
  emit();
}

export function clearAllNotifications() {
  replace([]);
  emit();
}

export const unreadCount = () => notifications.filter((n) => !n.deleted && !n.read).length;
