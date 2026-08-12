/**
 * Explore layer — the connected question the coach actually asks:
 *
 *   WHO   (whole squad / squad average / picked players)
 *   WHAT  (training & drills / fitness tests / GPS)
 *   WHICH KPI + dates + chart
 *
 * This module answers the "training & drills" half: how many times a drill or
 * exercise was done, how many minutes it took, who attended, and how two
 * tagged drills compare with each other.
 */

import {
  fullName,
  gpsHistory,
  players,
  rpeEntries,
  sessionCalendar,
  type SessionPlanItem,
} from "@/data/performance";

export interface DrillEntry {
  date: string;
  sessionId: string;
  sessionTitle: string;
  block: string;
  drill: string;
  purpose: string;
  tags: string[];
  minutes: number;
  rpe: number;
  strength: SessionPlanItem["strength"];
}

const inRange = (date: string, from?: string, to?: string) =>
  (!from || date >= from) && (!to || date <= to);

/** Every drill/exercise ever planned, flattened out of the calendar. */
export function drillEntries(from?: string, to?: string): DrillEntry[] {
  const out: DrillEntry[] = [];
  for (const session of sessionCalendar) {
    if (!inRange(session.date, from, to)) continue;
    for (const item of session.plan ?? []) {
      out.push({
        date: session.date,
        sessionId: session.id,
        sessionTitle: session.title || session.label || session.type || "Training",
        block: item.block ?? "Session",
        drill: item.drill,
        purpose: item.purpose ?? "",
        tags: (item.tags ?? []).map((t) => t.trim()).filter(Boolean),
        minutes: item.durationMin || 0,
        rpe: item.rpe || 0,
        strength: item.strength,
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Searchable catalogue: every tag and every drill name, with how often it was used. */
export interface DrillCatalogItem {
  key: string;
  label: string;
  kind: "tag" | "drill";
  count: number;
  minutes: number;
}

export function drillCatalog(from?: string, to?: string): DrillCatalogItem[] {
  const tags = new Map<string, DrillCatalogItem>();
  const names = new Map<string, DrillCatalogItem>();
  for (const entry of drillEntries(from, to)) {
    const bump = (map: Map<string, DrillCatalogItem>, label: string, kind: "tag" | "drill") => {
      const key = `${kind}:${label.toLowerCase()}`;
      const current = map.get(key) ?? { key, label, kind, count: 0, minutes: 0 };
      current.count += 1;
      current.minutes += entry.minutes;
      map.set(key, current);
    };
    entry.tags.forEach((tag) => bump(tags, tag, "tag"));
    if (entry.drill) bump(names, entry.drill, "drill");
  }
  return [...tags.values(), ...names.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export const matchesDrill = (entry: DrillEntry, item: DrillCatalogItem) =>
  item.kind === "tag"
    ? entry.tags.some((tag) => tag.toLowerCase() === item.label.toLowerCase())
    : entry.drill.toLowerCase() === item.label.toLowerCase();

const NOT_TRAINED = new Set(["Did Not Train", "Injured", "Ill"]);

/** Did this athlete take part in the session on that date? */
export function attendedOn(playerId: string, date: string) {
  const gps = gpsHistory.find((row) => row.playerId === playerId && row.date === date);
  if (gps) return !NOT_TRAINED.has(gps.status);
  return rpeEntries.some((entry) => entry.playerId === playerId && entry.date === date);
}

export interface AttendanceRow {
  playerId: string;
  name: string;
  sessions: number;
  attended: number;
  pct: number;
  minutes: number;
}

/** Session attendance per athlete over a date range. */
export function attendance(playerIds: string[], from?: string, to?: string): AttendanceRow[] {
  const sessions = sessionCalendar.filter((s) => inRange(s.date, from, to));
  return playerIds
    .map((id) => {
      const player = players.find((p) => p.id === id);
      if (!player) return null;
      const attendedSessions = sessions.filter((s) => attendedOn(id, s.date));
      const minutes = attendedSessions.reduce(
        (sum, s) => sum + (s.plan?.reduce((a, i) => a + (i.durationMin || 0), 0) || s.durationMin || 0),
        0,
      );
      return {
        playerId: id,
        name: fullName(player),
        sessions: sessions.length,
        attended: attendedSessions.length,
        pct: sessions.length ? Math.round((attendedSessions.length / sessions.length) * 100) : 0,
        minutes,
      };
    })
    .filter((row): row is AttendanceRow => row !== null)
    .sort((a, b) => b.pct - a.pct);
}

export interface DrillSummary {
  label: string;
  times: number;
  minutes: number;
  avgMinutes: number;
  avgRpe: number;
  dates: string[];
  /** How many times each selected athlete was present when it was done. */
  perPlayer: Array<{ playerId: string; name: string; times: number; minutes: number }>;
}

/** How many times was this drill/tag done, for how long, and by whom. */
export function drillSummary(
  item: DrillCatalogItem,
  playerIds: string[],
  from?: string,
  to?: string,
): DrillSummary {
  const entries = drillEntries(from, to).filter((entry) => matchesDrill(entry, item));
  const minutes = entries.reduce((a, e) => a + e.minutes, 0);
  const rpeEntriesWithValue = entries.filter((e) => e.rpe > 0);
  return {
    label: item.label,
    times: entries.length,
    minutes,
    avgMinutes: entries.length ? Math.round((minutes / entries.length) * 10) / 10 : 0,
    avgRpe: rpeEntriesWithValue.length
      ? Math.round((rpeEntriesWithValue.reduce((a, e) => a + e.rpe, 0) / rpeEntriesWithValue.length) * 10) / 10
      : 0,
    dates: [...new Set(entries.map((e) => e.date))].sort(),
    perPlayer: playerIds
      .map((id) => {
        const player = players.find((p) => p.id === id);
        if (!player) return null;
        const done = entries.filter((entry) => attendedOn(id, entry.date));
        return {
          playerId: id,
          name: fullName(player),
          times: done.length,
          minutes: done.reduce((a, e) => a + e.minutes, 0),
        };
      })
      .filter((row): row is { playerId: string; name: string; times: number; minutes: number } => row !== null),
  };
}

/** Minutes per training block (warm-up, strength room, SSG…) over a range. */
export function blockMinutes(from?: string, to?: string) {
  const map = new Map<string, { name: string; minutes: number; times: number }>();
  for (const entry of drillEntries(from, to)) {
    const current = map.get(entry.block) ?? { name: entry.block, minutes: 0, times: 0 };
    current.minutes += entry.minutes;
    current.times += 1;
    map.set(entry.block, current);
  }
  return [...map.values()].sort((a, b) => b.minutes - a.minutes);
}
