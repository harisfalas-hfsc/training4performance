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
  blockDistribution,
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

/* ------------------------------------------------------------------ */
/* GPS per drill / tag                                                 */
/* ------------------------------------------------------------------ */

/**
 * GPS attached to a single drill.
 *
 * The GPS file is recorded per session (and split per block by
 * blockDistribution). A drill gets the slice of its block that matches its
 * share of the block's planned minutes — so "Rondo 5v2" carries the part of
 * the small-sided-games block it actually occupied.
 */
export interface DrillGpsStat {
  key: string;
  label: string;
  kind: "tag" | "drill";
  times: number;
  /** Times where GPS data existed for that day. */
  withGps: number;
  minutes: number;
  avgMinutes: number;
  avgRpe: number;
  totalDistance: number;
  avgDistance: number;
  avgHsr: number;
  avgSprint: number;
  avgAccel: number;
  avgDecel: number;
  avgLoad: number;
  totalLoad: number;
  distancePerMin: number;
  hsrPerMin: number;
  /** Highest max speed recorded on the days this drill was done (session level). */
  peakMaxSpeed: number;
  peakSpeedDate: string;
  dates: string[];
}

/** GPS slice of one drill entry, or null when no GPS exists for that day. */
export function drillGps(entry: DrillEntry, playerId?: string) {
  const session = sessionCalendar.find((s) => s.id === entry.sessionId);
  if (!session) return null;
  const gpsRows = gpsHistory.filter((g) => g.date === entry.date && (!playerId || g.playerId === playerId));
  if (!gpsRows.length) return null;

  const blocks = blockDistribution(session, playerId);
  const row = blocks.find((b) => b.block === entry.block) ?? blocks.find((b) => b.block === "WHOLE SESSION");
  if (!row) return null;

  const blockItems = (session.plan ?? []).filter(
    (i) => (row.block === "WHOLE SESSION" || (i.block ?? "Session") === entry.block) && (i.durationMin || 0) > 0,
  );
  const blockMin = blockItems.reduce((a, i) => a + (i.durationMin || 0), 0);
  const share = blockMin > 0 ? (entry.minutes || 0) / blockMin : 1;

  return {
    minutes: row.minutes * share,
    distance: row.distance * share,
    hsr: row.hsr * share,
    sprint: row.sprint * share,
    accel: row.accel * share,
    decel: row.decel * share,
    load: row.load * share,
    maxSpeed: Math.max(...gpsRows.map((g) => g.maxSpeed ?? 0)),
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** GPS-backed stats for every drill/tag in the catalogue. */
export function drillGpsStats(
  from?: string,
  to?: string,
  playerId?: string,
  catalog: DrillCatalogItem[] = drillCatalog(from, to),
): DrillGpsStat[] {
  const entries = drillEntries(from, to);
  return catalog
    .map((item) => {
      const mine = entries.filter((e) => matchesDrill(e, item));
      const minutes = mine.reduce((a, e) => a + e.minutes, 0);
      const rpes = mine.filter((e) => e.rpe > 0);
      const gps = mine
        .map((e) => ({ entry: e, g: drillGps(e, playerId) }))
        .filter((x): x is { entry: DrillEntry; g: NonNullable<ReturnType<typeof drillGps>> } => x.g !== null);

      const sum = (f: (g: NonNullable<ReturnType<typeof drillGps>>) => number) =>
        gps.reduce((a, x) => a + f(x.g), 0);
      const n = gps.length || 1;
      const gpsMinutes = sum((g) => g.minutes);
      const peak = gps.reduce(
        (best, x) => (x.g.maxSpeed > best.speed ? { speed: x.g.maxSpeed, date: x.entry.date } : best),
        { speed: 0, date: "" },
      );

      return {
        key: item.key,
        label: item.label,
        kind: item.kind,
        times: mine.length,
        withGps: gps.length,
        minutes,
        avgMinutes: mine.length ? r1(minutes / mine.length) : 0,
        avgRpe: rpes.length ? r1(rpes.reduce((a, e) => a + e.rpe, 0) / rpes.length) : 0,
        totalDistance: Math.round(sum((g) => g.distance)),
        avgDistance: Math.round(sum((g) => g.distance) / n),
        avgHsr: Math.round(sum((g) => g.hsr) / n),
        avgSprint: Math.round(sum((g) => g.sprint) / n),
        avgAccel: Math.round(sum((g) => g.accel) / n),
        avgDecel: Math.round(sum((g) => g.decel) / n),
        avgLoad: Math.round(sum((g) => g.load) / n),
        totalLoad: Math.round(sum((g) => g.load)),
        distancePerMin: gpsMinutes ? Math.round(sum((g) => g.distance) / gpsMinutes) : 0,
        hsrPerMin: gpsMinutes ? r1(sum((g) => g.hsr) / gpsMinutes) : 0,
        peakMaxSpeed: r1(peak.speed),
        peakSpeedDate: peak.date,
        dates: [...new Set(mine.map((e) => e.date))].sort(),
      };
    })
    .filter((row) => row.times > 0);
}

export const DRILL_GPS_METRICS = [
  { key: "avgLoad", label: "Average training load (AU)", unit: "AU" },
  { key: "totalLoad", label: "Total training load (AU)", unit: "AU" },
  { key: "avgDistance", label: "Average distance (m)", unit: "m" },
  { key: "totalDistance", label: "Total distance (m)", unit: "m" },
  { key: "distancePerMin", label: "Distance per minute (m/min)", unit: "m/min" },
  { key: "avgHsr", label: "Average high speed running (m)", unit: "m" },
  { key: "hsrPerMin", label: "HSR per minute (m/min)", unit: "m/min" },
  { key: "avgSprint", label: "Average sprint distance (m)", unit: "m" },
  { key: "avgAccel", label: "Average accelerations", unit: "" },
  { key: "avgDecel", label: "Average decelerations", unit: "" },
  { key: "peakMaxSpeed", label: "Peak max speed (km/h)", unit: "km/h" },
  { key: "times", label: "Times performed", unit: "" },
  { key: "minutes", label: "Total minutes", unit: "min" },
] as const;

export type DrillGpsMetric = (typeof DRILL_GPS_METRICS)[number]["key"];
