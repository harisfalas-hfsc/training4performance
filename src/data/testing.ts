import { useSyncExternalStore } from "react";
import { getPlayer, gpsHistory, players } from "@/data/performance";
import { guardWrite } from "@/lib/access";
import { getWorkspaceScope, scopedStorageKey, subscribeWorkspaceScope } from "@/lib/workspace-scope";

/* ------------------------------------------------------------------ */
/* Test catalogue — every KPI the fitness coach can record             */
/* ------------------------------------------------------------------ */

export type TestGroup = "Anthropometry" | "FMS" | "Screen" | "Jump" | "Speed" | "Endurance" | "Strength" | "Custom";

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
  /** built by the coach in the custom test builder */
  custom?: boolean;
}

const BASE_TEST_CATALOG: TestDef[] = [

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

  // Screen (SMS) — usable as a 3-movement or 5-movement battery
  { id: "smsSquat", name: "SMS · Squat pattern", group: "Screen", unit: "score", higher: true, score: true },
  { id: "smsLunge", name: "SMS · Lunge pattern", group: "Screen", unit: "score", higher: true, score: true },
  { id: "smsHinge", name: "SMS · Hinge pattern", group: "Screen", unit: "score", higher: true, score: true },
  { id: "smsPush", name: "SMS · Push / pull pattern", group: "Screen", unit: "score", higher: true, score: true },
  { id: "smsRotation", name: "SMS · Rotation / anti-rotation", group: "Screen", unit: "score", higher: true, score: true },
  { id: "smsTotal", name: "SMS · Total score", group: "Screen", unit: "score", higher: true },


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
  { id: "sprint15", name: "15 m sprint", group: "Speed", unit: "s", higher: false },

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

export const TEST_GROUPS: TestGroup[] = [
  "Anthropometry",
  "FMS",
  "Screen",
  "Jump",
  "Speed",
  "Endurance",
  "Strength",
  "Custom",
];

/** The three-movement and five-movement SMS presets. */
export const SMS_FORMATS = {
  3: ["smsSquat", "smsLunge", "smsHinge"],
  5: ["smsSquat", "smsLunge", "smsHinge", "smsPush", "smsRotation"],
} as const;

/** Sprint gates in metres, used for split-speed maths. */
export const SPRINT_GATES: Array<{ testId: string; metres: number }> = [
  { testId: "sprint5", metres: 5 },
  { testId: "sprint10", metres: 10 },
  { testId: "sprint15", metres: 15 },
  { testId: "sprint20", metres: 20 },
  { testId: "sprint30", metres: 30 },
];

/**
 * Coach-defined tests. They live alongside the presets and behave exactly the
 * same way everywhere: history, trends, personal bests, asymmetry, reports.
 */
export const customTests: TestDef[] = [];

/** Presets + the coach's own tests. Rebuilt whenever the library changes. */
export const TEST_CATALOG: TestDef[] = [...BASE_TEST_CATALOG];

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

const STORAGE_KEY = "t4p.tests.v4";
const listeners = new Set<() => void>();
let version = 0;

export function subscribeTests(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  version++;
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

/** No historical seed data — every workspace starts empty. */
function seed(): TestRecord[] {
  return [];
}

/* ------------------------------------------------------------------ */
/* Custom test builder                                                 */
/* ------------------------------------------------------------------ */

const CUSTOM_KEY = "t4p.customtests.v4";

/** What kind of number the coach records for a custom test. */
export type CustomTestKind = "number" | "time" | "score" | "strength";

export interface CustomTestInput {
  name: string;
  /** free text unit — cm, s, kg, reps, score, m/s… */
  unit: string;
  kind: CustomTestKind;
  /** true = a bigger number is a better result */
  higher: boolean;
  /** record left and right separately and derive asymmetry */
  sided: boolean;
}

function rebuildCatalog() {
  TEST_CATALOG.splice(0, TEST_CATALOG.length, ...BASE_TEST_CATALOG, ...customTests);
}

function persistCustomTests() {
  // Never retain account test definitions in a browser cache.
}

function hydrateCustomTests(userId: string | null) {
  customTests.splice(0, customTests.length);
  rebuildCatalog();
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32) || "test";

/**
 * Creates a coach-defined test. When `sided` is set two linked definitions are
 * produced (left / right) so asymmetry works out of the box.
 */
export function addCustomTest(input: CustomTestInput): TestDef[] {
  if (!guardWrite()) return [];
  const base = `custom-${slug(input.name)}`;
  const unique = customTests.some((t) => t.id === base || t.id === `${base}-r`)
    ? `${base}-${Math.random().toString(36).slice(2, 6)}`
    : base;
  const shared = {
    group: "Custom" as const,
    unit: input.unit || (input.kind === "time" ? "s" : input.kind === "strength" ? "kg" : "score"),
    higher: input.kind === "time" ? false : input.higher,
    ...(input.kind === "score" ? { score: true } : {}),
    ...(input.kind === "strength" ? { strength: true } : {}),
    custom: true as const,
  };
  const created: TestDef[] = input.sided
    ? [
        { ...shared, id: `${unique}-r`, name: `${input.name} — right`, side: "R", pairWith: `${unique}-l` },
        { ...shared, id: `${unique}-l`, name: `${input.name} — left`, side: "L", pairWith: `${unique}-r` },
      ]
    : [{ ...shared, id: unique, name: input.name }];
  customTests.push(...created);
  persistCustomTests();
  rebuildCatalog();
  emit();
  return created;
}

/** Removes a coach-defined test and every result recorded against it. */
export function removeCustomTest(id: string) {
  if (!guardWrite()) return;
  const def = customTests.find((t) => t.id === id);
  if (!def) return;
  const ids = [id, ...(def.pairWith ? [def.pairWith] : [])];
  for (const tid of ids) {
    const i = customTests.findIndex((t) => t.id === tid);
    if (i >= 0) customTests.splice(i, 1);
    for (let r = testRecords.length - 1; r >= 0; r--) {
      if (testRecords[r]!.testId === tid) testRecords.splice(r, 1);
    }
  }
  persistCustomTests();
  rebuildCatalog();
  emit();
}

function hydrate(userId: string | null, _migrateLegacy: boolean) {
  testRecords.splice(0, testRecords.length);
  hydrateCustomTests(userId);
  version++;
  listeners.forEach((listener) => listener());
}

subscribeWorkspaceScope(hydrate);
const initialScope = getWorkspaceScope();
hydrate(initialScope.userId, initialScope.migrateLegacy);

/** Full copy of the coach's test records (used for cloud sync + player portal). */
export function testRecordsSnapshot(): TestRecord[] {
  return testRecords.map((r) => ({ ...r }));
}

/** Replaces the local test records with the cloud copy. */
export function applyTestRecords(list: TestRecord[]) {
  testRecords.splice(0, testRecords.length, ...list);
  version++;
  listeners.forEach((l) => l());
}

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

/** Results from the club workbook that this player is still missing. */
export function missingBatteryFor(playerId: string) {
  return seed().filter(
    (s) =>
      s.playerId === playerId &&
      !testRecords.some((r) => r.playerId === playerId && r.testId === s.testId && r.date === s.date),
  );
}

/** Re-import the club workbook battery for one player (nothing existing is overwritten). */
export function importBatteryFor(playerId: string) {
  if (!guardWrite()) return 0;
  const missing = missingBatteryFor(playerId);
  if (!missing.length) return 0;
  testRecords.push(...missing);
  emit();
  return missing.length;
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

/**
 * Sprint gates recorded on a date, converted into split times and split
 * speeds between consecutive gates (5→10 m, 10→15 m, …). The coach types the
 * cumulative gate times only; every derived number comes from here.
 */
export function sprintSplits(playerId: string, date?: string) {
  const gates = SPRINT_GATES.map((g) => {
    const rows = playerRecords(playerId, g.testId);
    const row = date ? rows.filter((r) => r.date === date).pop() : rows[rows.length - 1];
    return row ? { ...g, time: row.value, date: row.date } : null;
  }).filter((g): g is { testId: string; metres: number; time: number; date: string } => !!g && g.time > 0);

  return gates.map((g, i) => {
    const prev = gates[i - 1];
    const dMetres = g.metres - (prev?.metres ?? 0);
    const dTime = g.time - (prev?.time ?? 0);
    const splitSpeed = dTime > 0 ? dMetres / dTime : 0;
    return {
      testId: g.testId,
      label: prev ? `${prev.metres}–${g.metres} m` : `0–${g.metres} m`,
      metres: g.metres,
      date: g.date,
      cumulativeTime: +g.time.toFixed(3),
      splitTime: +dTime.toFixed(3),
      splitSpeed: +splitSpeed.toFixed(2),
      splitKmh: +(splitSpeed * 3.6).toFixed(2),
      averageSpeed: +(g.metres / g.time).toFixed(2),
    };
  });
}

/** Dates on which at least one sprint gate was recorded. */
export const sprintTestDates = (playerId: string) =>
  Array.from(
    new Set(
      testRecords
        .filter((r) => r.playerId === playerId && SPRINT_GATES.some((g) => g.testId === r.testId))
        .map((r) => r.date),
    ),
  ).sort();


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
