/**
 * Central connected data model for T4P (Training 4 Performance).
 * One player record -> everything connected (training, GPS, wellness, testing, medical).
 * Deterministic mock data so every screen reads from the same source of truth.
 */

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
  id: "team-apoel-1",
  name: "First Team",
  club: "APOEL FC",
  season: "2026/27",
  competition: "Cyta Championship",
  ageGroup: "Senior",
  gender: "Male",
  headCoach: "A. Georgiou",
  fitnessCoach: "M. Papadopoulos",
};

export const squadName = "First Team Squad";

const raw: Array<
  [
    string,
    string,
    string,
    string,
    Position,
    "Right" | "Left",
    string,
    number,
    number,
    number,
    number,
    Availability,
    string?,
  ]
> = [
  ["p01", "Nikolas", "Andreou", "1997-03-11", "GK", "Right", "CYP", 1, 191, 86, 11.2, "available"],
  ["p02", "Elias", "Konstantinou", "2001-07-02", "GK", "Right", "CYP", 22, 188, 83, 11.8, "available"],
  ["p03", "Marco", "Ferreira", "1995-01-24", "CB", "Right", "POR", 4, 187, 82, 10.1, "available"],
  ["p04", "Tomas", "Vrba", "1998-11-09", "CB", "Left", "CZE", 5, 185, 81, 10.4, "partial", "Managing calf tightness"],
  ["p05", "Andreas", "Charalambous", "2000-05-18", "CB", "Right", "CYP", 15, 184, 79, 9.8, "available"],
  ["p06", "Loukas", "Michael", "1999-09-30", "FB", "Right", "CYP", 2, 178, 72, 8.9, "available"],
  ["p07", "Diego", "Ramos", "1996-02-14", "FB", "Left", "ARG", 3, 176, 71, 9.1, "available"],
  ["p08", "Petros", "Ioannou", "2003-06-21", "FB", "Right", "CYP", 24, 175, 69, 8.6, "individual", "RTP week 2"],
  ["p09", "Samuel", "Okoro", "1997-12-05", "CM", "Right", "NGA", 6, 181, 76, 9.4, "available"],
  ["p10", "Georgios", "Stavrou", "1998-04-17", "CM", "Left", "GRE", 8, 179, 74, 9.0, "available"],
  ["p11", "Ivan", "Petrovic", "2002-08-28", "CM", "Right", "SRB", 16, 180, 75, 9.3, "available"],
  ["p12", "Kyriakos", "Demetriou", "2001-10-12", "AM", "Left", "CYP", 10, 174, 68, 8.2, "available"],
  ["p13", "Luca", "Bianchi", "1999-01-08", "AM", "Right", "ITA", 20, 176, 70, 8.5, "available"],
  ["p14", "Jean", "Mbaye", "2000-03-26", "W", "Right", "SEN", 7, 177, 73, 7.9, "available"],
  ["p15", "Ricardo", "Alves", "1996-07-19", "W", "Left", "BRA", 11, 173, 69, 8.1, "available"],
  ["p16", "Christos", "Panayi", "2004-02-03", "W", "Right", "CYP", 27, 172, 66, 8.4, "available"],
  ["p17", "Viktor", "Larsen", "1995-05-22", "ST", "Right", "DEN", 9, 186, 83, 9.6, "injured", "Grade 2 hamstring"],
  ["p18", "Omar", "Haddad", "1998-08-15", "ST", "Left", "MAR", 19, 182, 79, 9.2, "available"],
  ["p19", "Stelios", "Kyprianou", "2002-12-01", "ST", "Right", "CYP", 29, 180, 77, 9.9, "available"],
  ["p20", "Adam", "Kowalski", "1997-06-09", "CM", "Right", "POL", 14, 183, 78, 9.5, "ill", "Upper respiratory"],
  ["p21", "Marios", "Elia", "2003-09-14", "CB", "Left", "CYP", 23, 186, 80, 10.6, "available"],
  ["p22", "Yannis", "Papas", "2000-11-27", "W", "Left", "GRE", 17, 175, 71, 8.3, "rehab", "Ankle, week 4"],
];

export const players: Player[] = raw.map(
  ([id, firstName, lastName, dob, position, dominantLeg, nationality, number, heightCm, weightKg, bodyFat, availability, note]) => ({
    id,
    firstName,
    lastName,
    dob,
    position,
    dominantLeg,
    nationality,
    number,
    heightCm,
    weightKg,
    bodyFat,
    availability,
    note,
  }),
);

export const fullName = (p: Player) => `${p.firstName} ${p.lastName}`;
export const initials = (p: Player) => `${p.firstName[0]}${p.lastName[0]}`;

export const age = (dob: string) => {
  const d = new Date(dob);
  const now = new Date("2026-08-10");
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

export const bmi = (p: Player) => +(p.weightKg / Math.pow(p.heightCm / 100, 2)).toFixed(1);

export const getPlayer = (id: string) => players.find((p) => p.id === id);

/* ---------- deterministic pseudo random ---------- */
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

const DAYS = 42;
export const today = "2026-08-10";

function dateNAgo(n: number) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const sessionCalendar: Session[] = [
  { id: "s1", date: dateNAgo(3), label: "MD+1", title: "Recovery & Regeneration", durationMin: 55, objective: "Flush, mobility, low load", plannedRpe: 3, actualRpe: 3, drills: ["d1", "d7"] },
  { id: "s2", date: dateNAgo(2), label: "MD-4", title: "Extensive Aerobic + Possession", durationMin: 85, objective: "Volume, ball circulation", plannedRpe: 6, actualRpe: 7, drills: ["d1", "d2", "d3"] },
  { id: "s3", date: dateNAgo(1), label: "MD-3", title: "High Intensity + Conditioning", durationMin: 80, objective: "High intensity + aerobic conditioning", plannedRpe: 7, actualRpe: 8, drills: ["d1", "d4", "d3", "d7"] },
  { id: "s4", date: today, label: "MD-2", title: "Speed & Finishing", durationMin: 70, objective: "Max velocity exposure, finishing patterns", plannedRpe: 6, drills: ["d1", "d5", "d6"] },
  { id: "s5", date: dateNAgo(-1), label: "MD-1", title: "Activation & Set Pieces", durationMin: 55, objective: "Sharpness, tactical review", plannedRpe: 4, drills: ["d1", "d8"] },
  { id: "s6", date: dateNAgo(-2), label: "MD", title: "Matchday — Omonia (H)", durationMin: 95, objective: "Match", plannedRpe: 9, drills: [] },
];

export const drills: Drill[] = [
  { id: "d1", name: "Dynamic Warm-Up + Activation", categories: ["Mobility", "Coordination", "Injury Prevention"], intensity: "Low", rpe: 2, duration: "12 min", area: "20 × 20 m", players: 22 },
  { id: "d2", name: "Rondo 6v2 — Two Touch", categories: ["Rondo", "Possession", "Technical"], intensity: "Moderate", rpe: 5, duration: "3 × 4 min", area: "12 × 12 m", players: 8 },
  { id: "d3", name: "Positional Play 8v8+3", categories: ["Possession", "Tactical", "Aerobic"], intensity: "Moderate", rpe: 6, duration: "4 × 5 min", area: "50 × 40 m", players: 19 },
  { id: "d4", name: "4v4 + 2 Neutral Players", categories: ["Aerobic", "Anaerobic", "Decision Making", "Small-Sided Game"], intensity: "High", rpe: 7, duration: "4 × 4 min", area: "30 × 25 m", players: 12 },
  { id: "d5", name: "Max Velocity Runs — 5 × 25 m", categories: ["Speed", "Maximum Speed", "Acceleration"], intensity: "High", rpe: 7, duration: "5 reps / 2 min rec", area: "40 m lane", players: 22 },
  { id: "d6", name: "Finishing Circuit — 3 Stations", categories: ["Finishing", "Technical", "Power"], intensity: "Moderate", rpe: 6, duration: "18 min", area: "Half pitch", players: 18 },
  { id: "d7", name: "Nordic + Copenhagen Core Block", categories: ["Strength", "Core", "Injury Prevention"], intensity: "Moderate", rpe: 5, duration: "10 min", area: "Gym / touchline", players: 22 },
  { id: "d8", name: "Attacking Set Pieces", categories: ["Tactical", "Attacking"], intensity: "Low", rpe: 3, duration: "15 min", area: "Half pitch", players: 22 },
];

export const getDrill = (id: string) => drills.find((d) => d.id === id)!;

/* ---------- GPS history ---------- */
const statusFor = (p: Player): TrainingStatus => {
  switch (p.availability) {
    case "injured":
      return "Injured";
    case "ill":
      return "Ill";
    case "rehab":
      return "Rehabilitation";
    case "individual":
      return "Individual Training";
    case "partial":
      return "Partial Training";
    default:
      return "Full Training";
  }
};

export const gpsHistory: GpsDay[] = [];

players.forEach((p, pi) => {
  const rnd = seeded(1000 + pi * 37);
  const prof = positionProfile[p.position];
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = dateNAgo(i);
    const dow = new Date(date).getDay();
    if (dow === 1) continue; // day off
    const isMatch = dow === 0;
    const recent = i <= 3;
    const status: TrainingStatus = recent ? statusFor(p) : "Full Training";
    const factor =
      status === "Injured" || status === "Ill"
        ? 0
        : status === "Rehabilitation"
          ? 0.25
          : status === "Individual Training"
            ? 0.45
            : status === "Partial Training"
              ? 0.6
              : 1;
    const matchBoost = isMatch ? 1.55 : 1;
    const noise = 0.85 + rnd() * 0.3;
    const minutes = Math.round((isMatch ? 90 : 72) * factor * (0.9 + rnd() * 0.2));
    if (factor === 0) {
      gpsHistory.push({ date, playerId: p.id, minutes: 0, distance: 0, hsr: 0, sprint: 0, maxSpeed: 0, accel: 0, decel: 0, rpe: 0, status });
      continue;
    }
    gpsHistory.push({
      date,
      playerId: p.id,
      minutes,
      distance: Math.round(prof.dist * factor * matchBoost * noise),
      hsr: Math.round(prof.hsr * factor * matchBoost * (0.8 + rnd() * 0.45)),
      sprint: Math.round(prof.sprint * factor * matchBoost * (0.7 + rnd() * 0.6)),
      maxSpeed: +(prof.speed * (0.9 + rnd() * 0.1)).toFixed(1),
      accel: Math.round(28 * factor * matchBoost * (0.8 + rnd() * 0.4)),
      decel: Math.round(31 * factor * matchBoost * (0.8 + rnd() * 0.4)),
      rpe: Math.min(10, Math.max(1, Math.round((isMatch ? 8 : 6) * factor * (0.85 + rnd() * 0.35)))),
      status,
    });
  }
});

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
    chronicReliable: days.filter((d) => d.date >= dateNAgo(chronicWindow - 1)).length >= 16,
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

/* ---------- wellness ---------- */
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

export const wellnessScore = (w: Wellness) => +(((w.sleep + w.fatigue + w.soreness + w.stress + w.mood) / 25) * 100).toFixed(0);
export const playerWellness = (id: string) => wellnessToday.find((w) => w.playerId === id)!;

/* ---------- testing ---------- */
export function testingHistory(id: string): TestResult[] {
  const p = getPlayer(id)!;
  const prof = positionProfile[p.position];
  const rnd = seeded(900 + Number(id.slice(1)) * 11);
  const dates = ["2026-02-10", "2026-04-14", "2026-06-16", "2026-07-28"];
  let cmj = 36 + rnd() * 8;
  let s10 = 1.78 - rnd() * 0.12;
  let s30 = 4.25 - rnd() * 0.22;
  let yoyo = 1800 + rnd() * 700;
  return dates.map((date, i) => {
    cmj += (rnd() - 0.4) * 2.2;
    s10 -= (rnd() - 0.45) * 0.03;
    s30 -= (rnd() - 0.45) * 0.06;
    yoyo += (rnd() - 0.35) * 220;
    return {
      date,
      cmj: +cmj.toFixed(1),
      sprint10: +s10.toFixed(2),
      sprint30: +s30.toFixed(2),
      maxSpeed: +(prof.speed * (0.94 + i * 0.015)).toFixed(1),
      yoyo: Math.round(yoyo),
    };
  });
}

/* ---------- medical ---------- */
export const medicalEvents: MedicalEvent[] = [
  { playerId: "p17", type: "Injury", area: "Hamstring (biceps femoris)", from: "2026-07-30", to: "2026-09-05", daysLost: 37, notes: "Grade 2 strain during max velocity block.", stage: "Rehabilitation" },
  { playerId: "p22", type: "Injury", area: "Ankle (lateral ligament)", from: "2026-07-13", to: "2026-08-24", daysLost: 42, notes: "Grade 1 sprain, progressing to individual training.", stage: "Individual Training" },
  { playerId: "p08", type: "Injury", area: "Adductor", from: "2026-06-28", to: "2026-08-06", daysLost: 39, notes: "Returned to modified team training.", stage: "Partial Team Training" },
  { playerId: "p20", type: "Illness", area: "Upper respiratory", from: "2026-08-08", to: "2026-08-12", daysLost: 4, notes: "Symptomatic, no training.", stage: "Rest" },
  { playerId: "p04", type: "Injury", area: "Calf", from: "2026-05-02", to: "2026-05-16", daysLost: 14, notes: "Fully resolved, monitoring load.", stage: "Full Training" },
];

export const playerMedical = (id: string) => medicalEvents.filter((m) => m.playerId === id);

export const RTP_STAGES = ["Injury", "Rehabilitation", "Individual Training", "Partial Team Training", "Full Training", "Match Available"];

/* ---------- availability ---------- */
export function availabilitySummary(id: string) {
  const days = playerDays(id).filter((d) => new Date(d.date).getDay() !== 0);
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

/* ---------- squad availability today ---------- */
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
  const hsrMean = squadStats((m) => m.hsr7).mean;
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

/* ---------- GPS import simulation ---------- */
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
    const hasLast = parts.some((t) => t === last);
    const hasFirst = parts.some((t) => t === first);
    const initialFirst = parts.some((t) => t.length <= 2 && t[0] === first[0]);
    if (hasLast && hasFirst) score = 1;
    else if (hasLast && initialFirst) score = 0.82;
    else if (hasLast) score = 0.6;
    if (score > best.confidence) best = { id: p.id, confidence: score };
  });
  return best.confidence >= 0.6 ? best : { id: null, confidence: best.confidence };
}

export const sampleImportNames = [
  "Andreou, Nikolas",
  "Marco Ferreira",
  "Vrba, Tomas",
  "A. Charalambous",
  "Loukas Michael",
  "Ramos, Diego",
  "Samuel Okoro",
  "G. Stavrou",
  "Ivan Petrovic",
  "Demetriou, Kyriakos",
  "Luca Bianchi",
  "Mbaye, Jean",
  "Ricardo Alves",
  "C. Panayi",
  "Omar Haddad",
  "Kyprianou, Stelios",
  "Marios Elia",
  "Petros Ioannou",
  "R. Nunes",
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
