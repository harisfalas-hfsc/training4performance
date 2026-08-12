/**
 * T4P demo workspace — a ready-made team any visitor can play with.
 *
 * One team ("T4P"), five players, one full week of training (four blocks per
 * day), GPS rows per session AND per block, manual RPE for the gym work that
 * has no GPS, plus a small fitness-test battery. Everything is generated
 * relative to the current week so the demo always looks fresh.
 */

import type {
  GpsBlockRow,
  GpsDay,
  ManualTest,
  MedicalEvent,
  Player,
  RpeEntry,
  Session,
  Team,
  WorkspaceData,
} from "@/data/performance";
import type { TestRecord } from "@/data/testing";

export const DEMO_TEAM: Team = {
  id: "team-demo",
  name: "First Team",
  club: "T4P",
  season: "2025/26",
  competition: "Demo League",
  ageGroup: "Senior",
  gender: "Male",
  headCoach: "Demo Head Coach",
  fitnessCoach: "Demo S&C Coach",
  configured: true,
  createdAt: new Date().toISOString(),
};

const DEMO_PLAYERS: Player[] = [
  { id: "p01", firstName: "Andreas", lastName: "Georgiou", dob: "1996-03-14", position: "GK", dominantLeg: "Right", nationality: "CY", number: 1, heightCm: 190, weightKg: 84, bodyFat: 11.2, availability: "available" },
  { id: "p02", firstName: "Marios", lastName: "Christou", dob: "1997-07-02", position: "CB", dominantLeg: "Right", nationality: "CY", number: 4, heightCm: 186, weightKg: 81, bodyFat: 10.4, availability: "available" },
  { id: "p03", firstName: "Nikos", lastName: "Pavlou", dob: "1999-01-25", position: "CM", dominantLeg: "Left", nationality: "GR", number: 8, heightCm: 178, weightKg: 72, bodyFat: 9.1, availability: "available" },
  { id: "p04", firstName: "Loukas", lastName: "Demetriou", dob: "2001-11-09", position: "W", dominantLeg: "Right", nationality: "CY", number: 11, heightCm: 175, weightKg: 69, bodyFat: 8.4, availability: "partial" },
  { id: "p05", firstName: "Petros", lastName: "Ioannou", dob: "1995-05-30", position: "ST", dominantLeg: "Right", nationality: "CY", number: 9, heightCm: 183, weightKg: 79, bodyFat: 9.8, availability: "available" },
];

/** Monday of the current week (UTC). */
function mondayOfThisWeek(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - day);
  return d;
}

const iso = (base: Date, addDays: number) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10);
};

/** Deterministic per-player multiplier so numbers differ but never jump around. */
const factor = (playerId: string, seed: number) => {
  const n = playerId.charCodeAt(1) + playerId.charCodeAt(2) * 3 + seed * 7;
  return 0.88 + ((n % 25) / 100);
};

interface DayTemplate {
  offset: number;
  type: string;
  title: string;
  objective: string;
  intensity: number; // 0.4 = recovery, 1.0 = hardest day
  gps: boolean;
  blocks: Array<{
    name: string;
    label: string;
    minutes: number;
    rpe: number;
    tags: string[];
    purpose: string;
    gym?: boolean;
    strength?: { sets: number; reps: number; weightKg: number; restSec: number };
  }>;
}

const TACTICS_DRAWING = JSON.stringify({
  orientation: "landscape",
  view: "half",
  field: "football",
  tokens: [
    { id: "demo-home-1", kind: "player", x: 220, y: 220, color: "#3b82f6", label: "8" },
    { id: "demo-home-2", kind: "player", x: 360, y: 160, color: "#3b82f6", label: "10" },
    { id: "demo-home-3", kind: "player", x: 360, y: 300, color: "#3b82f6", label: "9" },
    { id: "demo-away-1", kind: "player", x: 500, y: 190, color: "#ef4444", label: "4" },
    { id: "demo-away-2", kind: "player", x: 500, y: 290, color: "#ef4444", label: "5" },
    { id: "demo-ball", kind: "ball", x: 390, y: 230, color: "#f8fafc" },
  ],
  shapes: [
    { id: "demo-run", tool: "arrow", color: "#facc15", points: [{ x: 370, y: 160 }, { x: 570, y: 105 }] },
    { id: "demo-pass", tool: "dashed", color: "#f8fafc", points: [{ x: 235, y: 220 }, { x: 370, y: 165 }] },
  ],
});

const WEEK: DayTemplate[] = [
  {
    offset: 0,
    type: "RECOVERY TRAINING",
    title: "Monday — recovery & activation",
    objective: "Flush the weekend load, screen how the squad feels, light activation.",
    intensity: 0.45,
    gps: true,
    blocks: [
      { name: "BLOCK 1", label: "Mobility warm-up", minutes: 15, rpe: 3, tags: ["Mobility", "Warm-up"], purpose: "Joint mobility and hip openers." },
      { name: "BLOCK 2", label: "Rondo 5v2", minutes: 15, rpe: 4, tags: ["Rondo 5v2", "Possession"], purpose: "Low-intensity ball circulation." },
      { name: "BLOCK 3", label: "Core & prehab circuit", minutes: 20, rpe: 5, tags: ["Prehab", "Core"], purpose: "Nordic hamstring, Copenhagen, anti-rotation.", gym: true, strength: { sets: 3, reps: 8, weightKg: 0, restSec: 60 } },
      { name: "BLOCK 4", label: "Cool-down & stretching", minutes: 10, rpe: 2, tags: ["Cool-down"], purpose: "Static stretching and breathing." },
    ],
  },
  {
    offset: 1,
    type: "STRENGTH TRAINING",
    title: "Tuesday — strength & speed",
    objective: "Maximal strength in the gym, short accelerations on the pitch.",
    intensity: 0.7,
    gps: true,
    blocks: [
      { name: "BLOCK 1", label: "Activation & sprint drills", minutes: 15, rpe: 4, tags: ["Warm-up", "Sprint mechanics"], purpose: "Wall drills, A-skips, ankle stiffness." },
      { name: "BLOCK 2", label: "Back squat", minutes: 25, rpe: 8, tags: ["Back squat", "Strength"], purpose: "Heavy bilateral strength.", gym: true, strength: { sets: 4, reps: 4, weightKg: 100, restSec: 180 } },
      { name: "BLOCK 3", label: "Bulgarian split squat", minutes: 20, rpe: 7, tags: ["Bulgarian split squat", "Strength", "Unilateral"], purpose: "Single-leg strength and balance.", gym: true, strength: { sets: 3, reps: 6, weightKg: 40, restSec: 120 } },
      { name: "BLOCK 4", label: "Accelerations 20 m", minutes: 15, rpe: 7, tags: ["Speed", "Acceleration"], purpose: "6 x 20 m from a standing start." },
    ],
  },
  {
    offset: 2,
    type: "FULL TRAINING",
    title: "Wednesday — high intensity",
    objective: "Biggest pitch day of the week: small-sided games and repeated high-speed running.",
    intensity: 1,
    gps: true,
    blocks: [
      { name: "BLOCK 1", label: "Warm-up & Rondo 5v2", minutes: 15, rpe: 4, tags: ["Rondo 5v2", "Warm-up"], purpose: "Raise temperature with the ball." },
      { name: "BLOCK 2", label: "Passing drill — 4 stations", minutes: 20, rpe: 6, tags: ["Passing drill", "Technical"], purpose: "Quality of the first touch under speed." },
      { name: "BLOCK 3", label: "SSG 4v4 + goalkeepers", minutes: 25, rpe: 9, tags: ["SSG 4v4", "Conditioning"], purpose: "High-intensity efforts, 4 x 4 min." },
      { name: "BLOCK 4", label: "Cool-down", minutes: 10, rpe: 3, tags: ["Cool-down"], purpose: "Easy jog and stretching." },
    ],
  },
  {
    offset: 3,
    type: "TACTICAL TRAINING",
    title: "Thursday — tactical & set pieces",
    objective: "Shape work, pressing triggers and attacking corners.",
    intensity: 0.65,
    gps: true,
    blocks: [
      { name: "BLOCK 1", label: "Activation", minutes: 12, rpe: 3, tags: ["Warm-up"], purpose: "Mobility and short passing." },
      { name: "BLOCK 2", label: "11v11 pressing shape", minutes: 25, rpe: 6, tags: ["Tactical", "Pressing"], purpose: "Pressing triggers in the middle third." },
      { name: "BLOCK 3", label: "Set pieces — corners", minutes: 18, rpe: 5, tags: ["Set pieces", "Corners"], purpose: "Attacking and defending routines." },
      { name: "BLOCK 4", label: "Cool-down", minutes: 10, rpe: 2, tags: ["Cool-down"], purpose: "Recovery jog." },
    ],
  },
  {
    offset: 4,
    type: "ACTIVATION",
    title: "Friday — match preparation",
    objective: "Short, sharp, low volume: ready for the weekend.",
    intensity: 0.5,
    gps: true,
    blocks: [
      { name: "BLOCK 1", label: "Warm-up", minutes: 12, rpe: 3, tags: ["Warm-up"], purpose: "Activation and mobility." },
      { name: "BLOCK 2", label: "Rondo 5v2", minutes: 12, rpe: 4, tags: ["Rondo 5v2", "Possession"], purpose: "Rhythm and confidence on the ball." },
      { name: "BLOCK 3", label: "Finishing patterns", minutes: 18, rpe: 5, tags: ["Finishing", "Technical"], purpose: "Crossing and finishing." },
      { name: "BLOCK 4", label: "Set piece walkthrough", minutes: 10, rpe: 2, tags: ["Set pieces"], purpose: "Final reminders before the match." },
    ],
  },
  {
    offset: 5,
    type: "GAME",
    title: "Saturday — match day",
    objective: "Execute the weekly game plan and capture the full match load.",
    intensity: 1,
    gps: true,
    blocks: [
      { name: "BLOCK 1", label: "Match warm-up", minutes: 25, rpe: 5, tags: ["Match day", "Warm-up"], purpose: "Progressive mobility, passing and accelerations." },
      { name: "BLOCK 2", label: "First half", minutes: 45, rpe: 9, tags: ["Match", "Competition"], purpose: "Competitive match exposure." },
      { name: "BLOCK 3", label: "Second half", minutes: 45, rpe: 9, tags: ["Match", "Competition"], purpose: "Competitive match exposure." },
      { name: "BLOCK 4", label: "Post-match recovery", minutes: 10, rpe: 2, tags: ["Recovery", "Cool-down"], purpose: "Walk, mobility and refuelling routine." },
    ],
  },
  {
    offset: 6,
    type: "RECOVERY",
    title: "Sunday — individual recovery",
    objective: "Restore the squad after match day and prepare for the next microcycle.",
    intensity: 0.35,
    gps: false,
    blocks: [
      { name: "BLOCK 1", label: "Bike flush", minutes: 15, rpe: 2, tags: ["Recovery", "Bike"], purpose: "Low-intensity aerobic recovery.", gym: true },
      { name: "BLOCK 2", label: "Mobility flow", minutes: 15, rpe: 2, tags: ["Recovery", "Mobility"], purpose: "Restore hip, ankle and thoracic range.", gym: true },
      { name: "BLOCK 3", label: "Individual prehab", minutes: 15, rpe: 3, tags: ["Prehab", "Individual"], purpose: "Player-specific corrective programme.", gym: true },
      { name: "BLOCK 4", label: "Wellness review", minutes: 10, rpe: 1, tags: ["Wellness", "Review"], purpose: "Review soreness, sleep and readiness." },
    ],
  },
];

const WEEK_OFFSETS = [-21, -14, -7, 0];

function buildSessions(monday: Date, weekShift: number): Session[] {
  return WEEK.map((day, index) => {
    const date = iso(monday, day.offset + weekShift);
    const totalMin = day.blocks.reduce((sum, b) => sum + b.minutes, 0);
    const plannedRpe = Math.round(day.blocks.reduce((sum, b) => sum + b.rpe * b.minutes, 0) / Math.max(1, totalMin));
    return {
      id: `demo-s${weekShift}-${index + 1}`,
      date,
      label: day.title.split(" — ")[0] ?? day.title,
      title: day.title,
      durationMin: totalMin,
      objective: day.objective,
      plannedRpe,
      actualRpe: plannedRpe,
      drills: day.blocks.map((b) => b.label),
      type: day.type,
      group: "First Team",
      status: "completed",
      blockNames: day.blocks.map((b) => b.name),
      plan: day.blocks.map((b) => ({
        drill: b.label,
        purpose: b.purpose,
        durationMin: b.minutes,
        rpe: b.rpe,
        ...(b.gym ? { actualRpe: b.rpe } : {}),
        tags: b.tags,
        block: b.name,
        location: b.gym ? "Gym" : "Pitch",
        ...(b.strength ? { strength: b.strength } : {}),
        ...(/pressing|set pieces|finishing|SSG|passing drill/i.test(b.label) ? { drawing: TACTICS_DRAWING } : {}),
      })),
    } satisfies Session;
  });
}

function buildGps(monday: Date, weekShift: number): { rows: GpsDay[]; blocks: GpsBlockRow[] } {
  const rows: GpsDay[] = [];
  const blocks: GpsBlockRow[] = [];

  WEEK.forEach((day, dayIndex) => {
    if (!day.gps) return;
    const date = iso(monday, day.offset + weekShift);

    DEMO_PLAYERS.forEach((player) => {
      const f = factor(player.id, dayIndex);
      const gk = player.position === "GK";
      const pitchBlocks = day.blocks.filter((b) => !b.gym);
      const minutes = pitchBlocks.reduce((sum, b) => sum + b.minutes, 0);
      const intensity = day.intensity * (gk ? 0.55 : 1) * f;

      const distance = Math.round(minutes * 78 * intensity);
      const hsr = Math.round(distance * (gk ? 0.02 : 0.07) * day.intensity);
      const sprint = Math.round(hsr * 0.35);
      const accel = Math.round(minutes * 0.55 * intensity);
      const decel = Math.round(minutes * 0.5 * intensity);
      const jumps = Math.round(minutes * (gk ? 0.35 : 0.12) * intensity);
      const maxSpeed = Number(((gk ? 24 : 29) * (0.93 + (f - 0.88))).toFixed(1));
      const rpe = Math.min(10, Math.round(day.intensity * 9 * (0.92 + (f - 0.88))));

      rows.push({
        date,
        playerId: player.id,
        minutes,
        distance,
        hsr,
        sprint,
        maxSpeed,
        accel,
        decel,
        jumps,
        rpe,
        status: "Full Training",
        category: day.type,
        avgSpeed: Number(((distance / 1000 / (minutes / 60))).toFixed(1)),
        sprintEvents: Math.round(sprint / 25),
        energy: Math.round(distance * 0.9),
      });

      // Split the same day across its pitch blocks.
      pitchBlocks.forEach((b) => {
        const share = b.minutes / Math.max(1, minutes);
        const blockIntensity = b.rpe / Math.max(1, day.blocks.reduce((m, x) => Math.max(m, x.rpe), 1));
        blocks.push({
          date,
          playerId: player.id,
          block: b.name,
          minutes: b.minutes,
          distance: Math.round(distance * share * (0.7 + blockIntensity * 0.5)),
          hsr: Math.round(hsr * share * (0.5 + blockIntensity)),
          sprint: Math.round(sprint * share * (0.5 + blockIntensity)),
          maxSpeed: Number((maxSpeed * (0.8 + blockIntensity * 0.2)).toFixed(1)),
          accel: Math.round(accel * share * (0.6 + blockIntensity * 0.6)),
          decel: Math.round(decel * share * (0.6 + blockIntensity * 0.6)),
          jumps: Math.round(jumps * share),
        });
      });
    });
  });

  return { rows, blocks };
}

function buildRpe(monday: Date, weekShift: number): RpeEntry[] {
  const out: RpeEntry[] = [];
  WEEK.forEach((day, dayIndex) => {
    const date = iso(monday, day.offset + weekShift);
    day.blocks
      .filter((b) => b.gym)
      .forEach((b) => {
        DEMO_PLAYERS.forEach((player) => {
          const f = factor(player.id, dayIndex + 3);
          out.push({
            id: `demo-rpe-${date}-${b.name.replace(/\s+/g, "")}-${player.id}`,
            date,
            playerId: player.id,
            block: b.name,
            rpe: Math.max(1, Math.min(10, Math.round(b.rpe * (0.9 + (f - 0.88))))),
            minutes: b.minutes,
            note: `${b.label} — entered manually (no GPS in the gym).`,
          });
        });
      });
  });
  return out;
}

function buildTests(monday: Date): TestRecord[] {
  const date = iso(monday, -28);
  const out: TestRecord[] = [];
  const battery: Array<{ testId: string; base: number; spread: number; reps?: number }> = [
    { testId: "weight", base: 76, spread: 8 },
    { testId: "bodyFat", base: 9.8, spread: 2 },
    { testId: "cmj", base: 38, spread: 6 },
    { testId: "sprint10", base: 1.78, spread: 0.12 },
    { testId: "sprint30", base: 4.15, spread: 0.25 },
    { testId: "maxSpeed", base: 31, spread: 2.5 },
    { testId: "yoyoDistance", base: 1840, spread: 400 },
    { testId: "backSquat", base: 120, spread: 25, reps: 3 },
    { testId: "bulgarianR", base: 45, spread: 10, reps: 6 },
    { testId: "bulgarianL", base: 44, spread: 10, reps: 6 },
  ];
  DEMO_PLAYERS.forEach((player, i) => {
    battery.forEach((t, j) => {
      const f = factor(player.id, j + i);
      const value = Number((t.base + (f - 1) * t.spread * 4).toFixed(t.base < 10 ? 2 : 1));
      out.push({
        id: `demo-tr-${player.id}-${t.testId}`,
        playerId: player.id,
        testId: t.testId,
        date,
        value,
        ...(t.reps ? { reps: t.reps } : {}),
        source: "manual",
        note: "Demo pre-season battery",
      });
    });
  });
  return out;
}

function buildMedical(monday: Date): MedicalEvent[] {
  return [
    {
      playerId: "p04",
      type: "Injury",
      area: "Right hamstring",
      from: iso(monday, -21),
      to: iso(monday, -8),
      daysLost: 13,
      notes: "Grade 1 strain — returned to full training, still on partial availability.",
      stage: "Return to play",
    },
  ];
}

/** The complete demo workspace, rebuilt around the current week. */
export function buildDemoWorkspace(): WorkspaceData {
  const monday = mondayOfThisWeek();
  const manualTests: ManualTest[] = [];
  // Four identical weeks of history so ACWR, monotony and trends are realistic
  // from the first second the demo opens.
  const sessions = WEEK_OFFSETS.flatMap((shift) => buildSessions(monday, shift));
  const gpsRows: GpsDay[] = [];
  const gpsBlocks: GpsBlockRow[] = [];
  const rpeEntries: RpeEntry[] = [];
  WEEK_OFFSETS.forEach((shift) => {
    const gps = buildGps(monday, shift);
    gpsRows.push(...gps.rows);
    gpsBlocks.push(...gps.blocks);
    rpeEntries.push(...buildRpe(monday, shift));
  });
  return {
    team: { ...DEMO_TEAM },
    players: DEMO_PLAYERS.map((p) => ({ ...p })),
    sessions,
    gpsHistory: gpsRows,
    gpsBlocks,
    rpeEntries,
    manualTests,
    medicalEvents: buildMedical(monday),
  };
}

export function buildDemoTests(): TestRecord[] {
  return buildTests(mondayOfThisWeek());
}
