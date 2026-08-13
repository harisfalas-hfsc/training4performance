/**
 * Daily wellness (internal load).
 *
 * Entries are written either by the player from the player portal, or by the
 * coach on the player's behalf. They live in the cloud (player_wellness) so
 * both sides see the same numbers, and are mirrored into the in-memory squad
 * store so alerts, insights and reports react to them immediately.
 */

import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setWellnessToday, today } from "@/data/performance";

export interface WellnessEntry {
  id?: string;
  playerId: string;
  date: string;
  /** hours slept last night */
  sleepHours: number | null;
  /** all 1-5, higher is better */
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  mood: number;
  hydration: number;
  readiness: number;
  note?: string | undefined;
  source: "player" | "coach";
}

export const WELLNESS_FIELDS = [
  { key: "sleep", label: "Sleep quality", low: "Very poor", high: "Excellent" },
  { key: "fatigue", label: "Fatigue", low: "Exhausted", high: "Very fresh" },
  { key: "soreness", label: "Muscle soreness", low: "Very sore", high: "No soreness" },
  { key: "stress", label: "Stress", low: "Very stressed", high: "Very relaxed" },
  { key: "mood", label: "Mood", low: "Very poor", high: "Very good" },
  { key: "hydration", label: "Hydration", low: "Dehydrated", high: "Well hydrated" },
  { key: "readiness", label: "Readiness to train", low: "Not ready", high: "Fully ready" },
] as const;

export type WellnessField = (typeof WELLNESS_FIELDS)[number]["key"];

export const emptyEntry = (playerId: string, date = today): WellnessEntry => ({
  playerId,
  date,
  sleepHours: 8,
  sleep: 3,
  fatigue: 3,
  soreness: 3,
  stress: 3,
  mood: 3,
  hydration: 3,
  readiness: 3,
  source: "player",
});

/** 0-100 index across the seven daily questions. */
export const entryScore = (e: WellnessEntry) =>
  Math.round(
    ((e.sleep + e.fatigue + e.soreness + e.stress + e.mood + e.hydration + e.readiness) / 35) * 100,
  );

export const scoreTone = (score: number) =>
  score >= 75 ? "good" : score >= 60 ? "warn" : "bad";

export const wellnessEntries: WellnessEntry[] = [];

const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  // Keep the squad-wide store (used by alerts + insights) in sync with today.
  setWellnessToday(
    wellnessEntries
      .filter((e) => e.date === today)
      .map((e) => ({
        playerId: e.playerId,
        sleep: e.sleep,
        fatigue: e.fatigue,
        soreness: e.soreness,
        stress: e.stress,
        mood: e.mood,
      })),
  );
  listeners.forEach((l) => l());
}

export function subscribeWellness(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useWellnessVersion() {
  return useSyncExternalStore(
    (cb) => subscribeWellness(cb),
    () => version,
    () => 0,
  );
}

type Row = {
  id: string;
  player_id: string;
  entry_date: string;
  sleep_hours: number | null;
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  mood: number;
  hydration: number;
  readiness: number;
  note: string | null;
  source: string;
};

export const rowToEntry = (r: Row): WellnessEntry => ({
  id: r.id,
  playerId: r.player_id,
  date: r.entry_date,
  sleepHours: r.sleep_hours === null ? null : Number(r.sleep_hours),
  sleep: r.sleep,
  fatigue: r.fatigue,
  soreness: r.soreness,
  stress: r.stress,
  mood: r.mood,
  hydration: r.hydration,
  readiness: r.readiness,
  note: r.note ?? undefined,
  source: r.source === "coach" ? "coach" : "player",
});

let activeCoach: string | null = null;

/**
 * Demo sandbox: wellness lives only in memory, never in the cloud. While this
 * is on, loads are ignored and saves/deletes mutate the local list.
 */
let localOnly = false;

export function setWellnessLocalOnly(on: boolean) {
  localOnly = on;
}

/** Replaces every entry with a locally-built set (demo sandbox). */
export function applyLocalWellness(entries: WellnessEntry[]) {
  wellnessEntries.splice(0, wellnessEntries.length, ...entries);
  emit();
}

export async function loadWellness(coachId: string) {
  if (localOnly) return;
  activeCoach = coachId;
  const { data, error } = await supabase
    .from("player_wellness")
    .select("id,player_id,entry_date,sleep_hours,sleep,fatigue,soreness,stress,mood,hydration,readiness,note,source")
    .eq("coach_id", coachId)
    .order("entry_date", { ascending: false })
    .limit(5000);
  if (error || activeCoach !== coachId) return;
  wellnessEntries.splice(0, wellnessEntries.length, ...(data ?? []).map((r) => rowToEntry(r as Row)));
  emit();
}

export function clearWellness() {
  // The demo keeps its seeded answers in memory; signing state must not wipe it.
  if (localOnly) return;
  activeCoach = null;
  wellnessEntries.splice(0, wellnessEntries.length);
  emit();
}

/** Coach-side upsert (players write through the portal service). */
export async function saveWellness(coachId: string, entry: WellnessEntry) {
  if (localOnly) {
    const idx = wellnessEntries.findIndex((e) => e.playerId === entry.playerId && e.date === entry.date);
    const next: WellnessEntry = { ...entry, id: entry.id ?? `demo-w-${entry.playerId}-${entry.date}` };
    if (idx >= 0) wellnessEntries.splice(idx, 1, next);
    else wellnessEntries.push(next);
    emit();
    return true;
  }
  const payload = {
    coach_id: coachId,
    player_id: entry.playerId,
    entry_date: entry.date,
    sleep_hours: entry.sleepHours,
    sleep: entry.sleep,
    fatigue: entry.fatigue,
    soreness: entry.soreness,
    stress: entry.stress,
    mood: entry.mood,
    hydration: entry.hydration,
    readiness: entry.readiness,
    note: entry.note ?? null,
    source: entry.source,
  };
  const { error } = await supabase
    .from("player_wellness")
    .upsert(payload, { onConflict: "coach_id,player_id,entry_date" });
  if (error) return false;
  await loadWellness(coachId);
  return true;
}

export async function deleteWellness(coachId: string, id: string) {
  if (localOnly) {
    const idx = wellnessEntries.findIndex((e) => e.id === id);
    if (idx >= 0) wellnessEntries.splice(idx, 1);
    emit();
    return;
  }
  await supabase.from("player_wellness").delete().eq("id", id).eq("coach_id", coachId);
  await loadWellness(coachId);
}

/* ---------------- selectors ---------------- */

export const entriesFor = (playerId: string) =>
  wellnessEntries.filter((e) => e.playerId === playerId).sort((a, b) => a.date.localeCompare(b.date));

export const entryOn = (playerId: string, date: string) =>
  wellnessEntries.find((e) => e.playerId === playerId && e.date === date);

export const entriesOn = (date: string) => wellnessEntries.filter((e) => e.date === date);

/** Squad average score per day, for the last n days that have data. */
export function wellnessTrend(days = 21) {
  const dates = Array.from(new Set(wellnessEntries.map((e) => e.date)))
    .sort()
    .slice(-days);
  return dates.map((date) => {
    const rows = entriesOn(date);
    const mean = (pick: (e: WellnessEntry) => number) =>
      rows.length ? +(rows.reduce((s, r) => s + pick(r), 0) / rows.length).toFixed(2) : 0;
    return {
      date,
      score: rows.length ? Math.round(rows.reduce((s, r) => s + entryScore(r), 0) / rows.length) : 0,
      sleep: mean((r) => r.sleep),
      fatigue: mean((r) => r.fatigue),
      soreness: mean((r) => r.soreness),
      readiness: mean((r) => r.readiness),
      responses: rows.length,
    };
  });
}
