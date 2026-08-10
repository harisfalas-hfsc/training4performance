/**
 * Central connected data model for T4P (Training 4 Performance).
 *
 * The squad, the GPS sessions and the physical tests are the REAL data exported
 * from SALAMINA_FC_LOGBOOK_TRAINING_MONITOR.xlsx (see src/data/salamina.ts).
 * Everything the staff adds afterwards (new players, transfers out, new training
 * days, manual GPS/RPE entries, new test rounds) is layered on top and persisted
 * in the browser, so the whole platform stays editable and connected.
 */

import { SALAMINA_GPS, SALAMINA_PLAYERS, SALAMINA_TESTS } from "@/data/salamina";
import { useSyncExternalStore } from "react";

export type Position = "GK" | "CB" | "FB" | "CM" | "AM" | "W" | "ST";

export type TrainingStatus =
  | "Full Training"
  | "Partial Training"
  | "Individual Training"
  | "Rehabilitation"
  | "Modified Training"
  | "Did Not Train"
  | "Injured"
  | "Ill";

export type Availability = "available" | "partial" | "individual" | "rehab" | "injured" | "ill";

export interface Team {
  id: string;
  name: string;
  club: string;
  season: string;
  competition: string;
  ageGroup: string;
  gender: string;
  headCoach: string;
  fitnessCoach: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  position: Position;
  dominantLeg: "Right" | "Left";
  nationality: string;
  number: number;
  heightCm: number;
  weightKg: number;
  bodyFat: number;
  availability: Availability;
  note?: string | undefined;
}

export interface TestResult {
  date: string;
  cmj: number;
  sprint10: number;
  sprint30: number;
  maxSpeed: number;
  yoyo: number;
}

export interface GpsDay {
  date: string;
  playerId: string;
  minutes: number;
  distance: number;
  hsr: number;
  sprint: number;
  maxSpeed: number;
  accel: number;
  decel: number;
  rpe: number;
  status: TrainingStatus;
  /** Real workbook extras */
  category?: string;
  jumps?: number;
  energy?: number;
  avgSpeed?: number;
  sprintEvents?: number;
}

export interface Drill {
  id: string;
  name: string;
  categories: string[];
  intensity: "Low" | "Moderate" | "High";
  rpe: number;
  duration: string;
  area: string;
  players: number;
}

/** Ordered parts of a training day. */
export const TRAINING_BLOCKS = [
  "Warm-up",
  "Activation / Prehab",
  "Strength room",
  "Technical",
  "Tactical",
  "Conditioning",
  "Speed & power",
  "Small-sided games",
  "Set pieces",
  "Cool-down / Recovery",
] as const;
export type TrainingBlock = (typeof TRAINING_BLOCKS)[number];

export const TRAINING_LOCATIONS = ["Pitch", "Gym", "Pool", "Indoor", "Classroom"] as const;
export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];

export type SessionStatus = "scheduled" | "pending" | "completed";

export interface SessionPlanItem {
  drill: string;
  purpose: string;
  durationMin: number;
  rpe: number;
  block?: TrainingBlock;
  location?: TrainingLocation;
  notes?: string;
}

export interface Session {
  id: string;
  date: string;
  label: string;
  title: string;
  durationMin: number;
  objective: string;
  plannedRpe: number;
  actualRpe?: number;
  drills: string[];
  /** Drill-by-drill plan of the day (parts of training). */
  plan?: SessionPlanItem[];
  group?: string;
  status?: SessionStatus;
  favorite?: boolean;
}


export interface MedicalEvent {
  playerId: string;
  type: "Injury" | "Illness";
  area: string;
  from: string;
  to: string;
  daysLost: number;
  notes: string;
  stage: string;
}

export const team: Team = {
  id: "team-salamina-1",
  name: "First Team",
  club: "Salamina FC",
  season: "2025/26",
  competition: "Cyprus League",
  ageGroup: "Senior",
  gender: "Male",
  headCoach: "—",
  fitnessCoach: "Haris Falas",
};

export const squadName = "First Team Squad";

/* ------------------------------------------------------------------ */
/* Seed from the workbook                                              */
/* ------------------------------------------------------------------ */

const CATEGORY_RPE: Record<string, number> = {
  "FULL TRAINING": 6,
  "FRIENDLY MATCH": 8,
  "RECOVERY - REGENERATION": 3,
  "RETURN TO PLAY": 4,
};

const CATEGORY_STATUS: Record<string, TrainingStatus> = {
  "FULL TRAINING": "Full Training",
  "FRIENDLY MATCH": "Full Training",
  "RECOVERY - REGENERATION": "Modified Training",
  "RETURN TO PLAY": "Rehabilitation",
};

function seedPlayers(): Player[] {
  return SALAMINA_PLAYERS.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dob: "",
    position: p.position,
    dominantLeg: "Right" as const,
    nationality: "",
    number: p.number,
    heightCm: 0,
    weightKg: p.weightKg ?? 0,
    bodyFat: p.bodyFat ?? 0,
    availability: "available" as Availability,
    note: undefined,
  }));
}

function seedGps(): GpsDay[] {
  return SALAMINA_GPS.map(
    ([date, playerId, category, minutes, distance, hsr, sprint, maxSpeed, accel, decel, jumps, energy, sprintEvents]) => ({
      date,
      playerId,
      minutes,
      distance,
      hsr,
      sprint,
      maxSpeed,
      accel,
      decel,
      rpe: CATEGORY_RPE[category] ?? 5,
      status: CATEGORY_STATUS[category] ?? "Full Training",
      category,
      jumps,
      energy,
      sprintEvents,
      avgSpeed: minutes ? +((distance / 1000 / (minutes / 60))).toFixed(2) : 0,
    }),
  );
}

const seedDates = [...new Set(SALAMINA_GPS.map((r) => r[0]))].sort();

/** Last day with real data — the platform "today". */
export const today = seedDates[seedDates.length - 1] ?? "2025-08-30";

function dominantCategory(date: string) {
  const counts: Record<string, number> = {};
  SALAMINA_GPS.filter((r) => r[0] === date).forEach((r) => {
    counts[r[2]] = (counts[r[2]] ?? 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "FULL TRAINING";
}

function seedSessions(): Session[] {
  return seedDates.map((date, i) => {
    const cat = dominantCategory(date);
    const rows = SALAMINA_GPS.filter((r) => r[0] === date);
    const dur = Math.round(rows.reduce((a, r) => a + r[3], 0) / Math.max(1, rows.length));
    return {
      id: `s-${date}`,
      date,
      label: cat === "FRIENDLY MATCH" ? "MD" : `D${i + 1}`,
      title: cat,
      durationMin: dur,
      objective: cat === "FRIENDLY MATCH" ? "Friendly match" : "Session recorded from GPS export",
      plannedRpe: CATEGORY_RPE[cat] ?? 5,
      actualRpe: CATEGORY_RPE[cat] ?? 5,
      drills: [],
    };
  });
}

/* ------------------------------------------------------------------ */
/* Live, mutable, persisted store                                      */
/* ------------------------------------------------------------------ */

export interface ManualTest {
  id: string;
  playerId: string;
  round: string;
  date: string;
  test: string;
  value: number;
}

export const players: Player[] = seedPlayers();
export const gpsHistory: GpsDay[] = seedGps();
export const sessionCalendar: Session[] = seedSessions();
export const manualTests: ManualTest[] = [];
export const medicalEvents: MedicalEvent[] = [];

const STORAGE_KEY = "t4p.data.v1";
const listeners = new Set<() => void>();
let version = 0;

export function subscribeData(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ players, gpsHistory, sessionCalendar, manualTests, medicalEvents }),
    );
  } catch {
    /* quota — ignore */
  }
}

function emit() {
  version++;
  persist();
  listeners.forEach((l) => l());
}

function replace<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw) as {
      players?: Player[];
      gpsHistory?: GpsDay[];
      sessionCalendar?: Session[];
      manualTests?: ManualTest[];
      medicalEvents?: MedicalEvent[];
    };
    if (s.players?.length) replace(players, s.players);
    if (s.gpsHistory?.length) replace(gpsHistory, s.gpsHistory);
    if (s.sessionCalendar?.length) replace(sessionCalendar, s.sessionCalendar);
    if (s.manualTests) replace(manualTests, s.manualTests);
    if (s.medicalEvents) replace(medicalEvents, s.medicalEvents);
  } catch {
    /* corrupt — ignore */
  }
}

hydrate();

export function useDataVersion() {
  return useSyncExternalStore(
    (cb) => subscribeData(cb),
    () => version,
    () => 0,
  );
}

/* ---------- mutations ---------- */

export function nextPlayerId() {
  let n = players.length + 1;
  while (players.some((p) => p.id === `p${String(n).padStart(2, "0")}`)) n++;
  return `p${String(n).padStart(2, "0")}`;
}

export function addPlayer(input: Partial<Player> & Pick<Player, "firstName" | "lastName" | "position">) {
  const p: Player = {
    id: input.id ?? nextPlayerId(),
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob ?? "",
    position: input.position,
    dominantLeg: input.dominantLeg ?? "Right",
    nationality: input.nationality ?? "",
    number: input.number ?? (players.reduce((a, x) => Math.max(a, x.number), 0) + 1),
    heightCm: input.heightCm ?? 0,
    weightKg: input.weightKg ?? 0,
    bodyFat: input.bodyFat ?? 0,
    availability: input.availability ?? "available",
    note: input.note,
  };
  players.push(p);
  emit();
  return p;
}

export function updatePlayer(id: string, patch: Partial<Player>) {
  const i = players.findIndex((p) => p.id === id);
  if (i < 0) return;
  players[i] = { ...players[i]!, ...patch };
  emit();
}

/** Transfer out / release: removes the player and all of their records. */
export function removePlayer(id: string) {
  replace(players, players.filter((p) => p.id !== id));
  replace(gpsHistory, gpsHistory.filter((g) => g.playerId !== id));
  replace(manualTests, manualTests.filter((t) => t.playerId !== id));
  replace(medicalEvents, medicalEvents.filter((m) => m.playerId !== id));
  emit();
}

export function addSession(input: Omit<Session, "id"> & { id?: string }) {
  const s: Session = { ...input, id: input.id ?? `s-${input.date}-${Math.random().toString(36).slice(2, 7)}` };
  sessionCalendar.push(s);
  sessionCalendar.sort((a, b) => a.date.localeCompare(b.date));
  emit();
  return s;
}

export function updateSession(id: string, patch: Partial<Session>) {
  const i = sessionCalendar.findIndex((s) => s.id === id);
  if (i < 0) return;
  sessionCalendar[i] = { ...sessionCalendar[i]!, ...patch };
  emit();
}

/** Effective status of a session: explicit, else derived from the date. */
export function sessionStatus(s: Session): SessionStatus {
  if (s.status) return s.status;
  const today = new Date().toISOString().slice(0, 10);
  if (s.date > today) return "scheduled";
  return s.actualRpe ? "completed" : "pending";
}

export function setSessionStatus(id: string, status: SessionStatus) {
  updateSession(id, { status });
}

export function toggleSessionFavorite(id: string) {
  const s = sessionCalendar.find((x) => x.id === id);
  if (s) updateSession(id, { favorite: !s.favorite });
}

/** Duplicate a saved session (e.g. a favourite template) onto another date. */
export function duplicateSession(id: string, date: string) {
  const s = sessionCalendar.find((x) => x.id === id);
  if (!s) return;
  const { id: _id, ...rest } = s;
  return addSession({ ...rest, date, status: "scheduled", actualRpe: undefined, favorite: false });
}


export function removeSession(id: string) {
  const s = sessionCalendar.find((x) => x.id === id);
  replace(sessionCalendar, sessionCalendar.filter((x) => x.id !== id));
  if (s) replace(gpsHistory, gpsHistory.filter((g) => g.date !== s.date));
  emit();
}

/** Add or replace one athlete row for one day. */
export function upsertGps(entry: GpsDay) {
  const i = gpsHistory.findIndex((g) => g.date === entry.date && g.playerId === entry.playerId);
  if (i >= 0) gpsHistory[i] = { ...gpsHistory[i]!, ...entry };
  else gpsHistory.push(entry);
  emit();
}

export function removeGps(date: string, playerId: string) {
  replace(gpsHistory, gpsHistory.filter((g) => !(g.date === date && g.playerId === playerId)));
  emit();
}

export function setRpe(date: string, playerId: string, rpe: number) {
  const g = gpsHistory.find((x) => x.date === date && x.playerId === playerId);
  if (!g) return;
  g.rpe = rpe;
  emit();
}

export function addManualTest(t: Omit<ManualTest, "id">) {
  const existing = manualTests.findIndex(
    (x) => x.playerId === t.playerId && x.round === t.round && x.test === t.test,
  );
  if (existing >= 0) manualTests[existing] = { ...manualTests[existing]!, ...t };
  else manualTests.push({ ...t, id: `mt-${Math.random().toString(36).slice(2, 9)}` });
  emit();
}

export function addMedicalEvent(e: MedicalEvent) {
  medicalEvents.push(e);
  emit();
}

export function removeMedicalEvent(playerId: string, from: string) {
  replace(medicalEvents, medicalEvents.filter((m) => !(m.playerId === playerId && m.from === from)));
  emit();
}

/** Wipe every local change and go back to the imported workbook. */
export function resetToWorkbook() {
  replace(players, seedPlayers());
  replace(gpsHistory, seedGps());
  replace(sessionCalendar, seedSessions());
  replace(manualTests, []);
  replace(medicalEvents, []);
  emit();
}

export const fullName = (p: Player) => `${p.firstName} ${p.lastName}`;
export const initials = (p: Player) => `${p.firstName[0] ?? "?"}${p.lastName[0] ?? ""}`;

export const age = (dob: string) => {
  if (!dob) return 0;
  const d = new Date(dob);
  const now = new Date(today);
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

export const bmi = (p: Player) =>
  p.heightCm > 0 ? +(p.weightKg / Math.pow(p.heightCm / 100, 2)).toFixed(1) : 0;

export const getPlayer = (id: string) => players.find((p) => p.id === id);

/* ---------- deterministic pseudo random (wellness only) ---------- */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const positionProfile: Record<Position, { dist: number; hsr: number; sprint: number; speed: number }> = {
  GK: { dist: 3600, hsr: 90, sprint: 15, speed: 24.5 },
  CB: { dist: 5400, hsr: 380, sprint: 70, speed: 30.2 },
  FB: { dist: 6200, hsr: 720, sprint: 165, speed: 32.6 },
  CM: { dist: 6800, hsr: 610, sprint: 105, speed: 30.8 },
  AM: { dist: 6300, hsr: 660, sprint: 140, speed: 31.5 },
  W: { dist: 6100, hsr: 830, sprint: 215, speed: 33.4 },
  ST: { dist: 5800, hsr: 690, sprint: 180, speed: 32.9 },
};

export function dateNAgo(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const drills: Drill[] = [
  { id: "d1", name: "ACTIVATION & WARM UP", categories: ["Mobility", "Coordination"], intensity: "Low", rpe: 3, duration: "12 min", area: "20 × 20 m", players: 22 },
  { id: "d2", name: "RONDO > AT", categories: ["Rondo", "Possession"], intensity: "Moderate", rpe: 6, duration: "3 × 4 min", area: "12 × 12 m", players: 8 },
  { id: "d3", name: "POSSESION > AT", categories: ["Possession", "Aerobic"], intensity: "Moderate", rpe: 7, duration: "4 × 5 min", area: "50 × 40 m", players: 19 },
  { id: "d4", name: "SMALL SIDED GAME", categories: ["Aerobic", "Anaerobic"], intensity: "High", rpe: 8, duration: "4 × 4 min", area: "30 × 25 m", players: 12 },
  { id: "d5", name: "SPEED & AGILITY", categories: ["Speed", "Acceleration"], intensity: "High", rpe: 7, duration: "5 reps", area: "40 m lane", players: 22 },
  { id: "d6", name: "FINISHING", categories: ["Finishing", "Technical"], intensity: "Moderate", rpe: 6, duration: "18 min", area: "Half pitch", players: 18 },
  { id: "d7", name: "MOBILITY & STABILITY", categories: ["Strength", "Core"], intensity: "Moderate", rpe: 4, duration: "10 min", area: "Gym", players: 22 },
  { id: "d8", name: "MATCH GAME", categories: ["Tactical"], intensity: "High", rpe: 9, duration: "90 min", area: "Full pitch", players: 22 },
];

export const getDrill = (id: string) => drills.find((d) => d.id === id) ?? drills[0]!;

export const playerDays = (id: string) => gpsHistory.filter((g) => g.playerId === id);

export const lastNDays = (id: string, n: number) => {
  const cutoff = dateNAgo(n - 1);
  return playerDays(id).filter((g) => g.date >= cutoff && g.date <= today);
};

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
export const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

export interface LoadSummary {
  acute: number;
  chronic: number;
  acwr: number;
  monotony: number;
  strain: number;
  chronicReliable: boolean;
}

export function loadSummary(id: string, acuteWindow = 7, chronicWindow = 28): LoadSummary {
  const days = playerDays(id);
  const sRpe = days.map((d) => ({ date: d.date, load: d.rpe * d.minutes }));
  const acuteDays = sRpe.filter((d) => d.date >= dateNAgo(acuteWindow - 1));
  const chronicDays = sRpe.filter((d) => d.date >= dateNAgo(chronicWindow - 1));
  const acute = sum(acuteDays.map((d) => d.load));
  const chronicTotal = sum(chronicDays.map((d) => d.load));
  const chronic = chronicTotal / (chronicWindow / acuteWindow);
  const loads = acuteDays.map((d) => d.load);
  const mean = avg(loads);
  const sd = Math.sqrt(avg(loads.map((l) => (l - mean) ** 2))) || 1;
  const monotony = mean / sd;
  return {
    acute: Math.round(acute),
    chronic: Math.round(chronic),
    acwr: chronic ? +(acute / chronic).toFixed(2) : 0,
    monotony: +monotony.toFixed(2),
    strain: Math.round(acute * monotony),
    chronicReliable: days.filter((d) => d.date >= dateNAgo(chronicWindow - 1)).length >= 12,
  };
}

export interface PlayerMetrics {
  player: Player;
  distance7: number;
  hsr7: number;
  sprint7: number;
  maxSpeed: number;
  rpe7: number;
  load: LoadSummary;
}

export function playerMetrics(p: Player): PlayerMetrics {
  const d7 = lastNDays(p.id, 7);
  return {
    player: p,
    distance7: Math.round(sum(d7.map((d) => d.distance))),
    hsr7: Math.round(sum(d7.map((d) => d.hsr))),
    sprint7: Math.round(sum(d7.map((d) => d.sprint))),
    maxSpeed: +Math.max(...d7.map((d) => d.maxSpeed), 0).toFixed(1),
    rpe7: +avg(d7.filter((d) => d.rpe > 0).map((d) => d.rpe)).toFixed(1),
    load: loadSummary(p.id),
  };
}

export const squadMetrics = () => players.map(playerMetrics);

export function squadStats(metric: (m: PlayerMetrics) => number) {
  const vals = squadMetrics().map(metric).filter((v) => v > 0);
  const sorted = [...vals].sort((a, b) => a - b);
  const mean = avg(vals);
  return {
    mean: Math.round(mean),
    median: Math.round(sorted[Math.floor(sorted.length / 2)] ?? 0),
    min: Math.round(sorted[0] ?? 0),
    max: Math.round(sorted[sorted.length - 1] ?? 0),
    sd: Math.round(Math.sqrt(avg(vals.map((v) => (v - mean) ** 2)))),
  };
}

export function positionAverage(pos: Position, metric: (m: PlayerMetrics) => number) {
  const vals = squadMetrics()
    .filter((m) => m.player.position === pos)
    .map(metric)
    .filter((v) => v > 0);
  return Math.round(avg(vals));
}

/* ---------- wellness (staff entry — seeded until entered) ---------- */
export interface Wellness {
  playerId: string;
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  mood: number;
}

export const wellnessToday: Wellness[] = players.map((p, i) => {
  const rnd = seeded(500 + i * 17);
  const base = p.availability === "available" ? 3.6 : 2.6;
  const r = () => Math.max(1, Math.min(5, +(base + rnd() * 1.4 - 0.6).toFixed(1)));
  return { playerId: p.id, sleep: r(), fatigue: r(), soreness: r(), stress: r(), mood: r() };
});

export const wellnessScore = (w: Wellness) =>
  +(((w.sleep + w.fatigue + w.soreness + w.stress + w.mood) / 25) * 100).toFixed(0);

export const playerWellness = (id: string): Wellness =>
  wellnessToday.find((w) => w.playerId === id) ?? { playerId: id, sleep: 3, fatigue: 3, soreness: 3, stress: 3, mood: 3 };

/* ---------- testing (real 30/07/2025 battery) ---------- */
const normName = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

export function testPlayerId(first: string, last: string): string | null {
  const l = normName(last);
  const f = normName(first);
  const hit = players.find((p) => normName(p.lastName) === l || normName(p.firstName + p.lastName).includes(l + f));
  return hit?.id ?? players.find((p) => normName(p.lastName).startsWith(l.slice(0, 5)))?.id ?? null;
}

export function testingHistory(id: string): TestResult[] {
  const p = getPlayer(id);
  if (!p) return [];
  const rows = SALAMINA_TESTS.filter((t) => testPlayerId(t.first, t.last) === id);
  return rows.map((t) => ({
    date: t.date,
    cmj: t.cmj ?? 0,
    sprint10: 0,
    sprint30: 0,
    maxSpeed: +Math.max(...playerDays(id).map((d) => d.maxSpeed), 0).toFixed(1),
    yoyo: t.yoyoDistance ?? 0,
  }));
}

export const playerMedical = (id: string) => medicalEvents.filter((m) => m.playerId === id);

export const RTP_STAGES = [
  "Injury",
  "Rehabilitation",
  "Individual Training",
  "Partial Team Training",
  "Full Training",
  "Match Available",
];

/* ---------- availability ---------- */
export function availabilitySummary(id: string) {
  const days = playerDays(id);
  const total = days.length;
  const counts = { full: 0, partial: 0, individual: 0, missed: 0 };
  days.forEach((d) => {
    if (d.status === "Full Training") counts.full++;
    else if (d.status === "Partial Training" || d.status === "Modified Training") counts.partial++;
    else if (d.status === "Individual Training" || d.status === "Rehabilitation") counts.individual++;
    else counts.missed++;
  });
  const pct = total ? ((counts.full + counts.partial * 0.5) / total) * 100 : 0;
  return { total, ...counts, availability: +pct.toFixed(1) };
}

export function squadAvailability() {
  const c: Record<Availability, number> = { available: 0, partial: 0, individual: 0, rehab: 0, injured: 0, ill: 0 };
  players.forEach((p) => c[p.availability]++);
  return c;
}

/* ---------- attention list ---------- */
export interface Alert {
  playerId: string;
  severity: "high" | "medium" | "info";
  kind: "Observation" | "Recommendation";
  text: string;
}

export function alerts(): Alert[] {
  const out: Alert[] = [];
  const hsrMean = squadStats((m) => m.hsr7).mean || 1;
  squadMetrics().forEach((m) => {
    const p = m.player;
    if (m.load.acwr > 1.35 && m.load.acute > 0)
      out.push({ playerId: p.id, severity: "high", kind: "Observation", text: `Seven-day workload is substantially higher than the recent baseline (ACWR ${m.load.acwr}).` });
    if (m.hsr7 > hsrMean * 1.3)
      out.push({ playerId: p.id, severity: "medium", kind: "Observation", text: `HSR over 7 days is ${Math.round(((m.hsr7 - hsrMean) / hsrMean) * 100)}% above squad average.` });
    if (m.sprint7 < 90 && p.position !== "GK" && p.availability === "available")
      out.push({ playerId: p.id, severity: "medium", kind: "Recommendation", text: `Low sprint exposure in the last 7 days (${m.sprint7} m). Consider scheduled max-velocity exposure.` });
    const w = playerWellness(p.id);
    if (wellnessScore(w) < 55)
      out.push({ playerId: p.id, severity: "medium", kind: "Observation", text: `Wellness score ${wellnessScore(w)}% — elevated fatigue and soreness reported today.` });
    if (p.availability === "injured" || p.availability === "rehab")
      out.push({ playerId: p.id, severity: "info", kind: "Observation", text: `Currently in the return-to-play pathway (${p.note ?? "rehabilitation"}).` });
  });
  return out;
}

/* ---------- squad trend series ---------- */
export function squadTrend(days = 28) {
  const dates = Array.from(new Set(gpsHistory.map((g) => g.date)))
    .sort()
    .filter((d) => d >= dateNAgo(days - 1) && d <= today);
  return dates.map((date) => {
    const rows = gpsHistory.filter((g) => g.date === date && g.minutes > 0);
    return {
      date: date.slice(5),
      distance: Math.round(avg(rows.map((r) => r.distance))),
      hsr: Math.round(avg(rows.map((r) => r.hsr))),
      sprint: Math.round(avg(rows.map((r) => r.sprint))),
      rpe: +avg(rows.map((r) => r.rpe)).toFixed(1),
      load: Math.round(avg(rows.map((r) => r.rpe * r.minutes))),
    };
  });
}

export function playerTrend(id: string, days = 28) {
  return playerDays(id)
    .filter((d) => d.date >= dateNAgo(days - 1))
    .map((d) => ({
      date: d.date.slice(5),
      distance: d.distance,
      hsr: d.hsr,
      sprint: d.sprint,
      maxSpeed: d.maxSpeed,
      rpe: d.rpe,
      load: d.rpe * d.minutes,
    }));
}

/* ---------- GPS import matching ---------- */
export interface ImportRow {
  raw: string;
  matchedId: string | null;
  confidence: number;
  distance: number;
  hsr: number;
  sprint: number;
  maxSpeed: number;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z\s,]/g, "")
    .trim();

export function matchName(rawName: string): { id: string | null; confidence: number } {
  let name = normalize(rawName);
  if (name.includes(",")) {
    const [last, first] = name.split(",").map((s) => s.trim());
    name = `${first} ${last}`;
  }
  const parts = name.split(/\s+/).filter(Boolean);
  let best: { id: string | null; confidence: number } = { id: null, confidence: 0 };
  players.forEach((p) => {
    const first = p.firstName.toLowerCase();
    const last = p.lastName.toLowerCase();
    let score = 0;
    const hasLast = parts.some((t) => last.split(/\s+/).includes(t));
    const hasFirst = parts.some((t) => first.split(/\s+/).includes(t));
    const initialFirst = parts.some((t) => t.length <= 2 && t[0] === first[0]);
    if (hasLast && hasFirst) score = 1;
    else if (hasLast && initialFirst) score = 0.82;
    else if (hasLast) score = 0.6;
    if (score > best.confidence) best = { id: p.id, confidence: score };
  });
  return best.confidence >= 0.6 ? best : { id: null, confidence: best.confidence };
}

export const sampleImportNames = [
  ...SALAMINA_PLAYERS.slice(0, 14).map((p) => p.raw),
  "PAPADOPOULOS ANTONIS",
];

export function buildImportRows(): ImportRow[] {
  return sampleImportNames.map((raw, i) => {
    const m = matchName(raw);
    const rnd = seeded(77 + i * 13);
    const prof = m.id ? positionProfile[getPlayer(m.id)!.position] : positionProfile.CM;
    return {
      raw,
      matchedId: m.id,
      confidence: m.confidence,
      distance: Math.round(prof.dist * (0.9 + rnd() * 0.25)),
      hsr: Math.round(prof.hsr * (0.8 + rnd() * 0.5)),
      sprint: Math.round(prof.sprint * (0.7 + rnd() * 0.6)),
      maxSpeed: +(prof.speed * (0.9 + rnd() * 0.1)).toFixed(1),
    };
  });
}

export const PROVIDER_MAP: Array<{ provider: string; raw: string; internal: string }> = [
  { provider: "Catapult", raw: "Total Distance (m)", internal: "DISTANCE" },
  { provider: "STATSports", raw: "HSR Distance", internal: "HSR" },
  { provider: "GPEXE", raw: "High Velocity Running", internal: "HSR" },
  { provider: "Catapult", raw: "Velocity Band 6 Distance", internal: "SPRINT" },
  { provider: "STATSports", raw: "Max Speed (km/h)", internal: "MAX_SPEED" },
  { provider: "GPEXE", raw: "Acc Events > 3 m/s²", internal: "ACCEL" },
  { provider: "Catapult", raw: "Player Load", internal: "PLAYER_LOAD" },
];

export const acwrStatus = (acwr: number) =>
  acwr === 0 ? "no-data" : acwr > 1.35 ? "high" : acwr < 0.8 ? "low" : "optimal";
