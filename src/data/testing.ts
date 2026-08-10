import { useSyncExternalStore } from "react";
import { SALAMINA_TESTS } from "@/data/salamina";
import { getPlayer, gpsHistory, players, testPlayerId } from "@/data/performance";
import { guardWrite } from "@/lib/access";
import { getWorkspaceScope, scopedStorageKey, subscribeWorkspaceScope } from "@/lib/workspace-scope";

/* ------------------------------------------------------------------ */
/* Test catalogue — every KPI the fitness coach can record             */
/* ------------------------------------------------------------------ */

export type TestGroup = "Anthropometry" | "FMS" | "Jump" | "Speed" | "Endurance" | "Strength";

export interface TestDef {
  id: string;
  name: string;
  group: TestGroup;
  unit: string;
  /** higher value = better performance */
  higher: boolean;
  /** strength tests accept load + reps and derive an estimated 1RM */
  strength?: boolean;
  /** 0–3 FMS style score */
  score?: boolean;
  /** left/right pair partner, used for asymmetry */
  pairWith?: string;
  side?: "L" | "R";
}

export const TEST_CATALOG: TestDef[] = [
  { id: "weight", name: "Body weight", group: "Anthropometry", unit: "kg", higher: false },
  { id: "bodyFat", name: "Body fat", group: "Anthropometry", unit: "%", higher: false },
  { id: "leanMass", name: "Lean mass", group: "Anthropometry", unit: "kg", higher: true },
  { id: "height", name: "Height", group: "Anthropometry", unit: "cm", higher: true },

  { id: "fmsDeepSquat", name: "Deep squat", group: "FMS", unit: "score", higher: true, score: true },
  { id: "fmsOhs", name: "Overhead squat", group: "FMS", unit: "score", higher: true, score: true },
  { id: "fmsAslR", name: "Active straight leg raise — right", group: "FMS", unit: "score", higher: true, score: true, side: "R", pairWith: "fmsAslL" },
  { id: "fmsAslL", name: "Active straight leg raise — left", group: "FMS", unit: "score", higher: true, score: true, side: "L", pairWith: "fmsAslR" },
  { id: "fmsHurdleR", name: "Hurdle step — right", group: "FMS", unit: "score", higher: true, score: true, side: "R", pairWith: "fmsHurdleL" },
  { id: "fmsHurdleL", name: "Hurdle step — left", group: "FMS", unit: "score", higher: true, score: true, side: "L", pairWith: "fmsHurdleR" },
  { id: "fmsLungeR", name: "In-line lunge — right", group: "FMS", unit: "score", higher: true, score: true, side: "R", pairWith: "fmsLungeL" },
  { id: "fmsLungeL", name: "In-line lunge — left", group: "FMS", unit: "score", higher: true, score: true, side: "L", pairWith: "fmsLungeR" },
  { id: "fmsShoulderR", name: "Shoulder mobility — right", group: "FMS", unit: "score", higher: true, score: true, side: "R", pairWith: "fmsShoulderL" },
  { id: "fmsShoulderL", name: "Shoulder mobility — left", group: "FMS", unit: "score", higher: true, score: true, side: "L", pairWith: "fmsShoulderR" },
  { id: "fmsTrunk", name: "Trunk stability push-up", group: "FMS", unit: "score", higher: true, score: true },
  { id: "fmsRotary", name: "Rotary stability", group: "FMS", unit: "score", higher: true, score: true },

  { id: "sj", name: "Squat jump — two legs", group: "Jump", unit: "cm", higher: true },
  { id: "sjR", name: "Squat jump — right leg", group: "Jump", unit: "cm", higher: true, side: "R", pairWith: "sjL" },
  { id: "sjL", name: "Squat jump — left leg", group: "Jump", unit: "cm", higher: true, side: "L", pairWith: "sjR" },
  { id: "cmj", name: "CMJ — two legs", group: "Jump", unit: "cm", higher: true },
  { id: "cmjR", name: "CMJ — right leg", group: "Jump", unit: "cm", higher: true, side: "R", pairWith: "cmjL" },
  { id: "cmjL", name: "CMJ — left leg", group: "Jump", unit: "cm", higher: true, side: "L", pairWith: "cmjR" },
  { id: "dropJump", name: "Drop jump", group: "Jump", unit: "cm", higher: true },
  { id: "rsi", name: "Reactive strength index", group: "Jump", unit: "m/s", higher: true },

  { id: "sprint5", name: "5 m sprint", group: "Speed", unit: "s", higher: false },
  { id: "sprint10", name: "10 m sprint", group: "Speed", unit: "s", higher: false },
  { id: "sprint20", name: "20 m sprint", group: "Speed", unit: "s", higher: false },
  { id: "sprint30", name: "30 m sprint", group: "Speed", unit: "s", higher: false },
  { id: "maxSpeed", name: "Maximum speed", group: "Speed", unit: "km/h", higher: true },

  { id: "yoyoDistance", name: "Yo-Yo IR1 distance", group: "Endurance", unit: "m", higher: true },
  { id: "yoyoMas", name: "Yo-Yo final speed / MAS", group: "Endurance", unit: "km/h", higher: true },
  { id: "vo2max", name: "Estimated VO2max", group: "Endurance", unit: "ml/kg/min", higher: true },
  { id: "mas", name: "Maximal aerobic speed", group: "Endurance", unit: "km/h", higher: true },

  { id: "backSquat", name: "Back squat", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "frontSquat", name: "Front squat", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "bulgarianR", name: "Bulgarian split squat — right", group: "Strength", unit: "kg", higher: true, strength: true, side: "R", pairWith: "bulgarianL" },
  { id: "bulgarianL", name: "Bulgarian split squat — left", group: "Strength", unit: "kg", higher: true, strength: true, side: "L", pairWith: "bulgarianR" },
  { id: "deadlift", name: "Deadlift", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "sldlR", name: "Single-leg deadlift — right", group: "Strength", unit: "kg", higher: true, strength: true, side: "R", pairWith: "sldlL" },
  { id: "sldlL", name: "Single-leg deadlift — left", group: "Strength", unit: "kg", higher: true, strength: true, side: "L", pairWith: "sldlR" },
  { id: "rdl", name: "Romanian deadlift", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "hipThrust", name: "Hip thrust", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "legPress", name: "Leg press", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "nordic", name: "Nordic hamstring (load)", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "calfRaise", name: "Calf raise", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "benchPress", name: "Bench press", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "inclineBench", name: "Incline bench press", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "overheadPress", name: "Overhead press", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "pullUp", name: "Pull-up (added load)", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "bentOverRow", name: "Bent-over row", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "latPulldown", name: "Lat pulldown", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "powerClean", name: "Power clean", group: "Strength", unit: "kg", higher: true, strength: true },
  { id: "pushPress", name: "Push press", group: "Strength", unit: "kg", higher: true, strength: true },
];

export const TEST_GROUPS: TestGroup[] = ["Anthropometry", "FMS", "Jump", "Speed", "Endurance", "Strength"];

export const getTestDef = (id: string) => TEST_CATALOG.find((t) => t.id === id);
export const testLabel = (id: string) => getTestDef(id)?.name ?? id;
export const testUnit = (id: string) => getTestDef(id)?.unit ?? "";

/* ------------------------------------------------------------------ */
/* Records store                                                       */
/* ------------------------------------------------------------------ */

export interface TestRecord {
  id: string;
  playerId: string;
  testId: string;
  date: string;
  value: number;
  /** strength only — reps performed at that load */
  reps?: number;
  /** where the number came from */
  source: "manual" | "gps" | "session";
  sessionId?: string;
  note?: string;
}

export const testRecords: TestRecord[] = [];

const STORAGE_KEY = "t4p.tests.v1";
const listeners = new Set<() => void>();
let version = 0;

export function subscribeTests(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  version++;
  if (typeof window !== "undefined") {
    const key = scopedStorageKey(STORAGE_KEY);
    try {
      if (key) window.localStorage.setItem(key, JSON.stringify(testRecords));
    } catch {
      /* quota */
    }
  }
  listeners.forEach((l) => l());
}

export function useTestVersion() {
  return useSyncExternalStore(
    (cb) => subscribeTests(cb),
    () => version,
    () => 0,
  );
}

const rid = () => `tr-${Math.random().toString(36).slice(2, 10)}`;

/** Seed the battery recorded in the club workbook. */
function seed(): TestRecord[] {
  const out: TestRecord[] = [];
  for (const t of SALAMINA_TESTS) {
    const pid = testPlayerId(t.first, t.last);
    if (!pid) continue;
    const push = (testId: string, value: number | null | undefined) => {
      if (value === null || value === undefined) return;
      out.push({ id: rid(), playerId: pid, testId, date: t.date, value, source: "manual" });
    };
    push("weight", t.weight);
    push("bodyFat", t.bf);
    push("fmsOhs", t.ohs);
    push("fmsAslR", t.aslR);
    push("fmsAslL", t.aslL);
    push("fmsHurdleR", t.hsR);
    push("fmsHurdleL", t.hsL);
    push("sj", t.sj);
    push("sjR", t.sjR);
    push("sjL", t.sjL);
    push("cmj", t.cmj);
    push("yoyoDistance", t.yoyoDistance);
    push("yoyoMas", t.yoyoMas);
  }
  return out;
}

function hydrate(userId: string | null, migrateLegacy: boolean) {
  testRecords.splice(0, testRecords.length);
  if (typeof window === "undefined" || !userId) return;
  try {
    const key = scopedStorageKey(STORAGE_KEY, userId);
    if (!key) return;
    let raw = window.localStorage.getItem(key);
    if (!raw && migrateLegacy) {
      raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) window.localStorage.setItem(key, raw);
    }
    if (raw) {
      const parsed = JSON.parse(raw) as TestRecord[];
      if (Array.isArray(parsed)) {
        testRecords.push(...parsed);
      }
    }
  } catch {
    /* corrupt */
  }
  if (!testRecords.length && migrateLegacy) testRecords.push(...seed());
  version++;
  listeners.forEach((listener) => listener());
}

subscribeWorkspaceScope(hydrate);
const initialScope = getWorkspaceScope();
hydrate(initialScope.userId, initialScope.migrateLegacy);

export function addTestRecord(input: Omit<TestRecord, "id"> & { id?: string }) {
  if (!guardWrite()) return;
  const rec: TestRecord = { ...input, id: input.id ?? rid() };
  const i = testRecords.findIndex(
    (r) => r.playerId === rec.playerId && r.testId === rec.testId && r.date === rec.date && r.source === rec.source,
  );
  if (i >= 0) testRecords[i] = { ...testRecords[i]!, ...rec };
  else testRecords.push(rec);
  emit();
  return rec;
}

export function removeTestRecord(id: string) {
  if (!guardWrite()) return;
  const i = testRecords.findIndex((r) => r.id === id);
  if (i >= 0) testRecords.splice(i, 1);
  emit();
}

export function resetTestRecords() {
  if (!guardWrite()) return;
  testRecords.splice(0, testRecords.length, ...seed());
  emit();
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

const byDate = (a: TestRecord, b: TestRecord) => a.date.localeCompare(b.date);

export const playerRecords = (playerId: string, testId?: string) =>
  testRecords.filter((r) => r.playerId === playerId && (!testId || r.testId === testId)).sort(byDate);

export function latestRecord(playerId: string, testId: string): TestRecord | undefined {
  const rows = playerRecords(playerId, testId);
  return rows[rows.length - 1];
}

export function bestRecord(playerId: string, testId: string): TestRecord | undefined {
  const rows = playerRecords(playerId, testId);
  if (!rows.length) return undefined;
  const def = getTestDef(testId);
  const score = (r: TestRecord) => (def?.strength ? oneRepMax(r.value, r.reps ?? 1) : r.value);
  return rows.reduce((best, r) =>
    def?.higher === false ? (score(r) < score(best) ? r : best) : score(r) > score(best) ? r : best,
  );
}

/** Tests this player actually has data for. */
export const playerTestIds = (playerId: string) =>
  TEST_CATALOG.filter((d) => testRecords.some((r) => r.playerId === playerId && r.testId === d.id)).map((d) => d.id);

export function testSeries(playerId: string, testId: string) {
  const def = getTestDef(testId);
  return playerRecords(playerId, testId).map((r) => ({
    date: r.date,
    value: r.value,
    oneRm: def?.strength ? oneRepMax(r.value, r.reps ?? 1) : undefined,
  }));
}

export function squadTestRanking(testId: string) {
  const def = getTestDef(testId);
  return players
    .map((p) => {
      const b = bestRecord(p.id, testId);
      const value = b ? (def?.strength ? oneRepMax(b.value, b.reps ?? 1) : b.value) : null;
      return { player: p, value, date: b?.date ?? null };
    })
    .filter((r) => r.value !== null)
    .sort((a, b) => (def?.higher === false ? a.value! - b.value! : b.value! - a.value!));
}

export function squadTestAverage(testId: string) {
  const rows = squadTestRanking(testId);
  if (!rows.length) return 0;
  return +(rows.reduce((a, r) => a + r.value!, 0) / rows.length).toFixed(1);
}

/* ------------------------------------------------------------------ */
/* Derived intelligence — 1RM, asymmetry, prescriptions                */
/* ------------------------------------------------------------------ */

/** Epley estimate; reps <= 1 returns the lifted load. */
export function oneRepMax(load: number, reps: number) {
  if (!load) return 0;
  if (!reps || reps <= 1) return +load.toFixed(1);
  return +(load * (1 + reps / 30)).toFixed(1);
}

export function asymmetry(playerId: string, testId: string): number | null {
  const def = getTestDef(testId);
  if (!def?.pairWith) return null;
  const a = bestRecord(playerId, testId);
  const b = bestRecord(playerId, def.pairWith);
  if (!a || !b) return null;
  const va = def.strength ? oneRepMax(a.value, a.reps ?? 1) : a.value;
  const vb = def.strength ? oneRepMax(b.value, b.reps ?? 1) : b.value;
  const max = Math.max(va, vb);
  if (!max) return null;
  return +(((max - Math.min(va, vb)) / max) * 100).toFixed(1);
}

export type StrengthGoal = "Strength" | "Power" | "Hypertrophy" | "Endurance";

export const STRENGTH_GOALS: StrengthGoal[] = ["Strength", "Power", "Hypertrophy", "Endurance"];

const GOAL_MODEL: Record<StrengthGoal, { pct: [number, number]; reps: string; sets: string; rest: string; cue: string }> = {
  Strength: { pct: [85, 95], reps: "2–5", sets: "4–6", rest: "3–5 min", cue: "Maximal intent, long rest, keep bar speed high." },
  Power: { pct: [40, 60], reps: "3–5", sets: "4–6", rest: "2–3 min", cue: "Move the load as fast as possible; stop the set when speed drops." },
  Hypertrophy: { pct: [67, 80], reps: "8–12", sets: "3–5", rest: "60–90 s", cue: "Control the eccentric, 1–2 reps in reserve." },
  Endurance: { pct: [50, 65], reps: "15–20", sets: "2–3", rest: "45–60 s", cue: "Short rest, tempo work, use as a return-to-play bridge." },
};

export function strengthPrescription(oneRm: number, goal: StrengthGoal) {
  const m = GOAL_MODEL[goal];
  return {
    goal,
    reps: m.reps,
    sets: m.sets,
    rest: m.rest,
    cue: m.cue,
    percent: `${m.pct[0]}–${m.pct[1]}%`,
    loadFrom: Math.round((oneRm * m.pct[0]) / 100 / 2.5) * 2.5,
    loadTo: Math.round((oneRm * m.pct[1]) / 100 / 2.5) * 2.5,
  };
}

/* ------------------------------------------------------------------ */
/* Automatic detection — GPS beats the recorded test                   */
/* ------------------------------------------------------------------ */

export interface AutoFinding {
  playerId: string;
  testId: string;
  date: string;
  previous: number | null;
  value: number;
  text: string;
}

/**
 * Compare live GPS maximum speeds against the recorded speed test and
 * write a new dated test record whenever a player goes faster in training.
 */
export function detectSpeedPbs(): AutoFinding[] {
  const found: AutoFinding[] = [];
  for (const p of players) {
    const days = gpsHistory
      .filter((g) => g.playerId === p.id && g.maxSpeed > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!days.length) continue;
    let best = bestRecord(p.id, "maxSpeed");
    let bestValue = best?.value ?? 0;
    for (const d of days) {
      if (d.maxSpeed > bestValue + 0.05) {
        const previous = bestValue || null;
        bestValue = d.maxSpeed;
        found.push({
          playerId: p.id,
          testId: "maxSpeed",
          date: d.date,
          previous,
          value: d.maxSpeed,
          text: previous
            ? `New maximum speed ${d.maxSpeed.toFixed(1)} km/h on ${d.date} — previous best ${previous.toFixed(1)} km/h.`
            : `First recorded maximum speed ${d.maxSpeed.toFixed(1)} km/h on ${d.date}.`,
        });
        best = undefined;
      }
    }
  }
  return found;
}

/** Persist detected personal bests into the test history. */
export function applyAutoFindings(findings: AutoFinding[]) {
  if (!guardWrite()) return;
  for (const f of findings) {
    addTestRecord({
      playerId: f.playerId,
      testId: f.testId,
      date: f.date,
      value: f.value,
      source: "gps",
      note: "Auto-detected from GPS",
    });
  }
}

/** Strength personal bests, derived from estimated 1RM progression. */
export function detectStrengthPbs(): AutoFinding[] {
  const out: AutoFinding[] = [];
  for (const p of players) {
    for (const def of TEST_CATALOG.filter((d) => d.strength)) {
      const rows = playerRecords(p.id, def.id);
      let best = 0;
      for (const r of rows) {
        const rm = oneRepMax(r.value, r.reps ?? 1);
        if (rm > best + 0.5) {
          const previous = best || null;
          best = rm;
          if (previous) {
            out.push({
              playerId: p.id,
              testId: def.id,
              date: r.date,
              previous,
              value: rm,
              text: `${def.name}: estimated 1RM improved to ${rm} kg (${r.value} kg × ${r.reps ?? 1}) from ${previous} kg.`,
            });
          }
        }
      }
    }
  }
  return out;
}

export function autoFindings(): AutoFinding[] {
  return [...detectSpeedPbs(), ...detectStrengthPbs()].sort((a, b) => b.date.localeCompare(a.date));
}

export const findingPlayerName = (id: string) => {
  const p = getPlayer(id);
  return p ? `${p.firstName} ${p.lastName}` : id;
};
