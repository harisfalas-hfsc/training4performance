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
import type { WellnessEntry } from "@/data/wellness";

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
  {
    id: "p01",
    firstName: "Andreas",
    lastName: "Georgiou",
    dob: "1996-03-14",
    position: "GK",
    dominantLeg: "Right",
    nationality: "CY",
    number: 1,
    heightCm: 190,
    weightKg: 84,
    bodyFat: 11.2,
    availability: "available",
  },
  {
    id: "p02",
    firstName: "Marios",
    lastName: "Christou",
    dob: "1997-07-02",
    position: "CB",
    dominantLeg: "Right",
    nationality: "CY",
    number: 4,
    heightCm: 186,
    weightKg: 81,
    bodyFat: 10.4,
    availability: "available",
  },
  {
    id: "p03",
    firstName: "Nikos",
    lastName: "Pavlou",
    dob: "1999-01-25",
    position: "CM",
    dominantLeg: "Left",
    nationality: "GR",
    number: 8,
    heightCm: 178,
    weightKg: 72,
    bodyFat: 9.1,
    availability: "available",
  },
  {
    id: "p04",
    firstName: "Loukas",
    lastName: "Demetriou",
    dob: "2001-11-09",
    position: "W",
    dominantLeg: "Right",
    nationality: "CY",
    number: 11,
    heightCm: 175,
    weightKg: 69,
    bodyFat: 8.4,
    availability: "partial",
  },
  {
    id: "p05",
    firstName: "Petros",
    lastName: "Ioannou",
    dob: "1995-05-30",
    position: "ST",
    dominantLeg: "Right",
    nationality: "CY",
    number: 9,
    heightCm: 183,
    weightKg: 79,
    bodyFat: 9.8,
    availability: "available",
  },
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
  return 0.88 + (n % 25) / 100;
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
    drawing?: string;
  }>;
}

type DemoToken = { id: string; kind: string; x: number; y: number; color: string; label?: string };
type DemoShape = { id: string; tool: string; color: string; points: Array<{ x: number; y: number }> };

const home = (id: string, label: string, x: number, y: number): DemoToken => ({
  id,
  kind: "player",
  x,
  y,
  color: "#3b82f6",
  label,
});
const away = (id: string, label: string, x: number, y: number): DemoToken => ({
  id,
  kind: "player",
  x,
  y,
  color: "#ef4444",
  label,
});
const equipment = (id: string, kind: string, x: number, y: number, color = "#facc15"): DemoToken => ({
  id,
  kind,
  x,
  y,
  color,
});
const route = (id: string, tool: string, color: string, from: [number, number], to: [number, number]): DemoShape => ({
  id,
  tool,
  color,
  points: [{ x: from[0], y: from[1] }, { x: to[0], y: to[1] }],
});
const board = (tokens: DemoToken[], shapes: DemoShape[], view: "full" | "half" | "quarter" = "full") =>
  JSON.stringify({ orientation: "landscape", view, field: "football", tokens, shapes });

const RONDO_BOARD = board(
  [
    home("r1", "1", 330, 190), home("r2", "2", 500, 130), home("r3", "3", 670, 190),
    home("r4", "4", 670, 430), home("r5", "5", 330, 430), away("r6", "D1", 470, 275),
    away("r7", "D2", 550, 350), equipment("rb", "ball", 500, 160, "#f8fafc"),
    equipment("rc1", "cone", 285, 105), equipment("rc2", "cone", 715, 105),
    equipment("rc3", "cone", 715, 500), equipment("rc4", "cone", 285, 500),
  ],
  [
    route("rp1", "dashed", "#f8fafc", [330, 190], [500, 130]),
    route("rp2", "dashed", "#f8fafc", [500, 130], [670, 190]),
    route("rp3", "dashed", "#f8fafc", [670, 190], [670, 430]),
    route("rp4", "dashed", "#f8fafc", [670, 430], [330, 430]),
  ],
);

const PASSING_BOARD = board(
  [
    home("p1", "A", 210, 160), home("p2", "B", 790, 160), home("p3", "C", 790, 500),
    home("p4", "D", 210, 500), equipment("pb", "ball", 245, 180, "#f8fafc"),
    equipment("pc1", "cone", 180, 130), equipment("pc2", "cone", 820, 130),
    equipment("pc3", "cone", 820, 530), equipment("pc4", "cone", 180, 530),
    equipment("pm1", "mannequin", 420, 250), equipment("pm2", "mannequin", 580, 410),
  ],
  [
    route("pp1", "dashed", "#f8fafc", [230, 160], [770, 160]),
    route("pp2", "dashed", "#f8fafc", [790, 180], [790, 480]),
    route("pp3", "dashed", "#f8fafc", [770, 500], [230, 500]),
    route("pp4", "dashed", "#f8fafc", [210, 480], [210, 180]),
    route("pr1", "arrow", "#facc15", [210, 160], [380, 245]),
    route("pr2", "arrow", "#facc15", [790, 500], [620, 415]),
  ],
);

const SSG_BOARD = board(
  [
    home("s1", "2", 320, 180), home("s2", "4", 320, 470), home("s3", "7", 470, 250),
    home("s4", "9", 470, 400), away("s5", "3", 680, 180), away("s6", "5", 680, 470),
    away("s7", "8", 530, 250), away("s8", "10", 530, 400),
    equipment("sg1", "keeper", 180, 325, "#22c55e"), equipment("sg2", "keeper", 820, 325, "#22c55e"),
    equipment("sb", "ball", 500, 325, "#f8fafc"), equipment("goal1", "goal", 90, 325, "#e2e8f0"),
    equipment("goal2", "goal", 910, 325, "#e2e8f0"),
  ],
  [
    route("sp1", "dashed", "#f8fafc", [470, 250], [320, 180]),
    route("sr1", "curve", "#facc15", [470, 400], [650, 500]),
    route("sr2", "arrow", "#facc15", [320, 180], [190, 290]),
  ],
);

const PRESSING_BOARD = board(
  [
    home("x1", "9", 620, 335), home("x2", "11", 540, 200), home("x3", "7", 540, 470),
    home("x4", "10", 440, 335), away("x5", "4", 760, 220), away("x6", "5", 760, 450),
    away("x7", "6", 650, 335), equipment("xb", "ball", 785, 205, "#f8fafc"),
  ],
  [
    route("xr1", "arrow", "#facc15", [620, 335], [715, 240]),
    route("xr2", "arrow", "#facc15", [540, 200], [720, 205]),
    route("xr3", "arrow", "#facc15", [540, 470], [710, 440]),
    route("xp1", "dashed", "#f8fafc", [760, 220], [650, 335]),
  ],
);

const CORNER_BOARD = board(
  [
    home("c1", "7", 865, 590), home("c2", "4", 730, 310), home("c3", "5", 790, 360),
    home("c4", "9", 840, 290), away("c5", "D1", 760, 300), away("c6", "D2", 810, 320),
    away("c7", "D3", 850, 380), equipment("cg", "keeper", 920, 335, "#22c55e"),
    equipment("cb", "ball", 890, 610, "#f8fafc"),
  ],
  [
    route("ccross", "curve", "#f8fafc", [875, 585], [760, 330]),
    route("cr1", "arrow", "#facc15", [730, 310], [850, 335]),
    route("cr2", "arrow", "#facc15", [790, 360], [900, 290]),
    route("cr3", "arrow", "#facc15", [840, 290], [775, 390]),
  ],
);

const FINISHING_BOARD = board(
  [
    home("f1", "7", 300, 180), home("f2", "11", 300, 490), home("f3", "9", 650, 335),
    home("f4", "10", 460, 335), equipment("fg", "keeper", 900, 335, "#22c55e"),
    equipment("fb", "ball", 325, 195, "#f8fafc"), equipment("fm1", "mannequin", 570, 250),
    equipment("fm2", "mannequin", 570, 420), equipment("fgoal", "goal", 950, 335, "#e2e8f0"),
  ],
  [
    route("fpass", "dashed", "#f8fafc", [320, 180], [450, 325]),
    route("fwide", "arrow", "#facc15", [460, 335], [700, 150]),
    route("fcross", "curve", "#f8fafc", [700, 150], [790, 320]),
    route("frun", "arrow", "#facc15", [650, 335], [820, 335]),
  ],
);

const WEEK: DayTemplate[] = [
  {
    offset: 0,
    type: "RECOVERY TRAINING",
    title: "Monday — recovery & activation",
    objective: "Flush the weekend load, screen how the squad feels, light activation.",
    intensity: 0.45,
    gps: true,
    blocks: [
      {
        name: "BLOCK 1",
        label: "Mobility warm-up",
        minutes: 15,
        rpe: 3,
        tags: ["Mobility", "Warm-up"],
        purpose: "Joint mobility and hip openers.",
      },
      {
        name: "BLOCK 2",
        label: "Rondo 5v2",
        minutes: 15,
        rpe: 4,
        tags: ["Rondo 5v2", "Possession"],
        purpose: "Low-intensity ball circulation.",
        drawing: RONDO_BOARD,
      },
      {
        name: "BLOCK 3",
        label: "Core & prehab circuit",
        minutes: 20,
        rpe: 5,
        tags: ["Prehab", "Core"],
        purpose: "Nordic hamstring, Copenhagen, anti-rotation.",
        gym: true,
        strength: { sets: 3, reps: 8, weightKg: 0, restSec: 60 },
      },
      {
        name: "BLOCK 4",
        label: "Cool-down & stretching",
        minutes: 10,
        rpe: 2,
        tags: ["Cool-down"],
        purpose: "Static stretching and breathing.",
      },
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
      {
        name: "BLOCK 1",
        label: "Activation & sprint drills",
        minutes: 15,
        rpe: 4,
        tags: ["Warm-up", "Sprint mechanics"],
        purpose: "Wall drills, A-skips, ankle stiffness.",
      },
      {
        name: "BLOCK 2",
        label: "Back squat",
        minutes: 25,
        rpe: 8,
        tags: ["Back squat", "Strength"],
        purpose: "Heavy bilateral strength.",
        gym: true,
        strength: { sets: 4, reps: 4, weightKg: 100, restSec: 180 },
      },
      {
        name: "BLOCK 3",
        label: "Bulgarian split squat",
        minutes: 20,
        rpe: 7,
        tags: ["Bulgarian split squat", "Strength", "Unilateral"],
        purpose: "Single-leg strength and balance.",
        gym: true,
        strength: { sets: 3, reps: 6, weightKg: 40, restSec: 120 },
      },
      {
        name: "BLOCK 4",
        label: "Accelerations 20 m",
        minutes: 15,
        rpe: 7,
        tags: ["Speed", "Acceleration"],
        purpose: "6 x 20 m from a standing start.",
      },
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
      {
        name: "BLOCK 1",
        label: "Warm-up & Rondo 5v2",
        minutes: 15,
        rpe: 4,
        tags: ["Rondo 5v2", "Warm-up"],
        purpose: "Raise temperature with the ball.",
        drawing: RONDO_BOARD,
      },
      {
        name: "BLOCK 2",
        label: "Passing drill — 4 stations",
        minutes: 20,
        rpe: 6,
        tags: ["Passing drill", "Technical"],
        purpose: "Quality of the first touch under speed.",
        drawing: PASSING_BOARD,
      },
      {
        name: "BLOCK 3",
        label: "SSG 4v4 + goalkeepers",
        minutes: 25,
        rpe: 9,
        tags: ["SSG 4v4", "Conditioning"],
        purpose: "High-intensity efforts, 4 x 4 min.",
        drawing: SSG_BOARD,
      },
      {
        name: "BLOCK 4",
        label: "Cool-down",
        minutes: 10,
        rpe: 3,
        tags: ["Cool-down"],
        purpose: "Easy jog and stretching.",
      },
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
      {
        name: "BLOCK 1",
        label: "Activation",
        minutes: 12,
        rpe: 3,
        tags: ["Warm-up"],
        purpose: "Mobility and short passing.",
      },
      {
        name: "BLOCK 2",
        label: "11v11 pressing shape",
        minutes: 25,
        rpe: 6,
        tags: ["Tactical", "Pressing"],
        purpose: "Pressing triggers in the middle third.",
        drawing: PRESSING_BOARD,
      },
      {
        name: "BLOCK 3",
        label: "Set pieces — corners",
        minutes: 18,
        rpe: 5,
        tags: ["Set pieces", "Corners"],
        purpose: "Attacking and defending routines.",
        drawing: CORNER_BOARD,
      },
      {
        name: "BLOCK 4",
        label: "Cool-down",
        minutes: 10,
        rpe: 2,
        tags: ["Cool-down"],
        purpose: "Recovery jog.",
      },
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
      {
        name: "BLOCK 1",
        label: "Warm-up",
        minutes: 12,
        rpe: 3,
        tags: ["Warm-up"],
        purpose: "Activation and mobility.",
      },
      {
        name: "BLOCK 2",
        label: "Rondo 5v2",
        minutes: 12,
        rpe: 4,
        tags: ["Rondo 5v2", "Possession"],
        purpose: "Rhythm and confidence on the ball.",
        drawing: RONDO_BOARD,
      },
      {
        name: "BLOCK 3",
        label: "Finishing patterns",
        minutes: 18,
        rpe: 5,
        tags: ["Finishing", "Technical"],
        purpose: "Crossing and finishing.",
        drawing: FINISHING_BOARD,
      },
      {
        name: "BLOCK 4",
        label: "Set piece walkthrough",
        minutes: 10,
        rpe: 2,
        tags: ["Set pieces"],
        purpose: "Final reminders before the match.",
      },
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
      {
        name: "BLOCK 1",
        label: "Match warm-up",
        minutes: 25,
        rpe: 5,
        tags: ["Match day", "Warm-up"],
        purpose: "Progressive mobility, passing and accelerations.",
      },
      {
        name: "BLOCK 2",
        label: "First half",
        minutes: 45,
        rpe: 9,
        tags: ["Match", "Competition"],
        purpose: "Competitive match exposure.",
      },
      {
        name: "BLOCK 3",
        label: "Second half",
        minutes: 45,
        rpe: 9,
        tags: ["Match", "Competition"],
        purpose: "Competitive match exposure.",
      },
      {
        name: "BLOCK 4",
        label: "Post-match recovery",
        minutes: 10,
        rpe: 2,
        tags: ["Recovery", "Cool-down"],
        purpose: "Walk, mobility and refuelling routine.",
      },
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
      {
        name: "BLOCK 1",
        label: "Bike flush",
        minutes: 15,
        rpe: 2,
        tags: ["Recovery", "Bike"],
        purpose: "Low-intensity aerobic recovery.",
        gym: true,
      },
      {
        name: "BLOCK 2",
        label: "Mobility flow",
        minutes: 15,
        rpe: 2,
        tags: ["Recovery", "Mobility"],
        purpose: "Restore hip, ankle and thoracic range.",
        gym: true,
      },
      {
        name: "BLOCK 3",
        label: "Individual prehab",
        minutes: 15,
        rpe: 3,
        tags: ["Prehab", "Individual"],
        purpose: "Player-specific corrective programme.",
        gym: true,
      },
      {
        name: "BLOCK 4",
        label: "Wellness review",
        minutes: 10,
        rpe: 1,
        tags: ["Wellness", "Review"],
        purpose: "Review soreness, sleep and readiness.",
      },
    ],
  },
];

const WEEK_OFFSETS = [-21, -14, -7, 0];

function buildSessions(monday: Date, weekShift: number): Session[] {
  return WEEK.map((day, index) => {
    const date = iso(monday, day.offset + weekShift);
    const totalMin = day.blocks.reduce((sum, b) => sum + b.minutes, 0);
    const plannedRpe = Math.round(
      day.blocks.reduce((sum, b) => sum + b.rpe * b.minutes, 0) / Math.max(1, totalMin),
    );
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
        ...(b.drawing ? { drawing: b.drawing } : {}),
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
        avgSpeed: Number((distance / 1000 / (minutes / 60)).toFixed(1)),
        sprintEvents: Math.round(sprint / 25),
        energy: Math.round(distance * 0.9),
      });

      // Split the same day across its pitch blocks.
      pitchBlocks.forEach((b) => {
        const share = b.minutes / Math.max(1, minutes);
        const blockIntensity =
          b.rpe /
          Math.max(
            1,
            day.blocks.reduce((m, x) => Math.max(m, x.rpe), 1),
          );
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
  // Two rounds — pre-season baseline and an in-season retest, so the demo
  // shows progression, personal bests and comparisons instead of one flat row.
  const lowerIsBetter = new Set(["sprint10", "sprint30", "bodyFat"]);
  const rounds = [
    { date: iso(monday, -56), gain: 0, note: "Pre-season baseline battery" },
    { date: iso(monday, -7), gain: 0.03, note: "In-season retest" },
  ];
  DEMO_PLAYERS.forEach((player, i) => {
    battery.forEach((t, j) => {
      const f = factor(player.id, j + i);
      const base = Number((t.base + (f - 1) * t.spread * 4).toFixed(t.base < 10 ? 2 : 1));
      rounds.forEach((round, r) => {
        const dir = lowerIsBetter.has(t.testId) ? -1 : 1;
        const value = Number((base * (1 + dir * round.gain)).toFixed(t.base < 10 ? 2 : 1));
        out.push({
          id: `demo-tr-${player.id}-${t.testId}-${r}`,
          playerId: player.id,
          testId: t.testId,
          date: round.date,
          value,
          ...(t.reps ? { reps: t.reps } : {}),
          source: "manual",
          note: round.note,
        });
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

/* ---------------- Wellness + player portal ---------------- */

const clamp5 = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

/**
 * 28 days of daily questionnaires for all five players, so the Wellness page,
 * the alerts and the wellness explorer in Analytics all have something to show.
 * Answers dip on the two hardest days of the week and recover after the day off.
 */
export function buildDemoWellness(): WellnessEntry[] {
  const monday = mondayOfThisWeek();
  const out: WellnessEntry[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);

  WEEK_OFFSETS.forEach((shift) => {
    WEEK.forEach((day, dayIndex) => {
      const date = iso(monday, day.offset + shift);
      if (date > todayIso) return;
      DEMO_PLAYERS.forEach((player, pIndex) => {
        const f = factor(player.id, dayIndex + pIndex + 2);
        // Hard days (high intensity) push fatigue and soreness down.
        const strain = day.intensity * 2.2;
        const lift = (f - 0.88) * 4;
        const entry: WellnessEntry = {
          id: `demo-w-${player.id}-${date}`,
          playerId: player.id,
          date,
          sleepHours: Number((7.4 + lift * 0.5 - day.intensity * 0.4).toFixed(1)),
          sleep: clamp5(4.4 + lift * 0.6 - strain * 0.35),
          fatigue: clamp5(4.6 + lift * 0.5 - strain * 0.6),
          soreness: clamp5(4.5 + lift * 0.5 - strain * 0.7),
          stress: clamp5(4.2 + lift * 0.4 - strain * 0.2),
          mood: clamp5(4.4 + lift * 0.5 - strain * 0.25),
          hydration: clamp5(4.3 + lift * 0.5 - strain * 0.2),
          readiness: clamp5(4.6 + lift * 0.5 - strain * 0.55),
          source: "player",
        };
        // The player coming back from injury reports a niggle now and then.
        if (player.id === "p04" && dayIndex === 2) {
          entry.soreness = clamp5(entry.soreness - 1);
          entry.readiness = clamp5(entry.readiness - 1);
          entry.note = "Hamstring feels a bit tight after the sprints.";
        }
        out.push(entry);
      });
    });
  });
  return out;
}

export interface DemoAccessRow {
  id: string;
  player_id: string;
  player_name: string;
  code: string;
  email: string | null;
  active: boolean;
  last_login_at: string | null;
}

/** Portal logins the demo coach has already handed out. */
export function buildDemoAccess(): DemoAccessRow[] {
  const codes = ["K7M-4RP-2XA", "B3D-9QT-6LN", "V5H-2WY-8FC", "R8J-6KE-3PU", "T2N-7SD-5MB"];
  const now = Date.now();
  return DEMO_PLAYERS.map((p, i) => ({
    id: `demo-access-${p.id}`,
    player_id: p.id,
    player_name: `${p.firstName} ${p.lastName}`,
    code: codes[i] ?? "AAA-111-BBB",
    email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@demo.t4p`,
    active: i !== 4,
    last_login_at: i === 4 ? null : new Date(now - (i + 1) * 3600_000).toISOString(),
  }));
}

/* ------------------------------------------------------------------ */
/* Drills & exercise library (demo)                                    */
/* ------------------------------------------------------------------ */

/**
 * Ready-made T4P blocks the demo shows in the library.
 * In a real account these come from the cloud; in the sandbox they are static
 * so a visitor can browse them, copy them and drop them into a session.
 */
export const DEMO_T4P_LIBRARY: DemoLibraryBlock[] = [
  {
    id: "demo-lib-1",
    category: "STRENGTH",
    name: "Lower body max strength — MD-3",
    description: "Two heavy bilateral lifts plus unilateral and posterior-chain work for the mid-week gym slot.",
    items: [
      {
        drill: "Back squat",
        purpose: "Low push",
        durationMin: 15,
        rpe: 8,
        strength: { sets: 4, reps: 5, intensityPct: 80, restSec: 180 },
      },
      {
        drill: "Romanian deadlift (RDL)",
        purpose: "Low pull",
        durationMin: 12,
        rpe: 7,
        strength: { sets: 4, reps: 6, intensityPct: 65, restSec: 150 },
      },
      {
        drill: "Bulgarian split squat",
        purpose: "Low push",
        durationMin: 10,
        rpe: 6,
        strength: { sets: 3, reps: 8, intensityPct: 40, restSec: 120 },
      },
      {
        drill: "Nordic hamstring curl",
        purpose: "Low pull",
        durationMin: 8,
        rpe: 6,
        strength: { sets: 3, reps: 6, intensityPct: 0, restSec: 120 },
      },
    ],
  },
  {
    id: "demo-lib-2",
    category: "ESD (ENERGY SYSTEM DEVELOPMENT)",
    name: "Aerobic power with the ball — 4v4 SSG",
    description: "Small-sided games above the anaerobic threshold, drawn on the board so the setup takes 30 seconds.",
    items: [
      { drill: "Movement preparation", purpose: "WARM UP", durationMin: 12, rpe: 4 },
      {
        drill: "SSG 4v4 > AT",
        purpose: "METABOLIC",
        durationMin: 16,
        rpe: 8,
        tags: ["SSG", "Aerobic power"],
        drawing: SSG_BOARD,
      },
      { drill: "Rondo 5v2", purpose: "METABOLIC", durationMin: 12, rpe: 6, drawing: RONDO_BOARD },
      { drill: "Cool-down jog & stretching", purpose: "ACTIVATION", durationMin: 8, rpe: 2 },
    ],
  },
  {
    id: "demo-lib-3",
    category: "SPEED",
    name: "Speed & finishing — MD-2",
    description: "Short maximal-intensity efforts finished with a shot, so the sprint has a football reason.",
    items: [
      { drill: "Movement preparation", purpose: "WARM UP", durationMin: 10, rpe: 4 },
      { drill: "POWER - LINEAR SPEED", purpose: "POWER", durationMin: 12, rpe: 7 },
      {
        drill: "Finishing from the wide channel",
        purpose: "POWER",
        durationMin: 15,
        rpe: 7,
        tags: ["Finishing", "Sprint"],
        drawing: FINISHING_BOARD,
      },
    ],
  },
];

export interface DemoLibraryBlock {
  id: string;
  category: string;
  name: string;
  description: string;
  items: SessionPlanItem[];
}

/** Blocks the demo coach has already saved into his own library. */
export function buildDemoLibrary() {
  const savedAt = new Date().toISOString();
  return [
    {
      id: "demo-my-1",
      name: "My activation & prehab circuit",
      savedAt,
      category: "MOBILITY & STABILITY",
      description: "The circuit this squad runs before every pitch session.",
      items: [
        { drill: "MINI BANDS", purpose: "ACTIVATION", durationMin: 8, rpe: 3 },
        { drill: "Copenhagen adduction", purpose: "Low pull", durationMin: 8, rpe: 4 },
        { drill: "Pallof press", purpose: "Core", durationMin: 6, rpe: 4 },
      ] as SessionPlanItem[],
    },
    {
      id: "demo-my-2",
      name: "Match-day corner routine",
      savedAt,
      category: "TECHNICAL / TACTICAL",
      description: "Saved straight off the tactics board after last week's set-piece meeting.",
      items: [
        {
          drill: "Attacking corner — near post",
          purpose: "TACTICS",
          durationMin: 12,
          rpe: 5,
          tags: ["Set pieces"],
          drawing: CORNER_BOARD,
        },
      ] as SessionPlanItem[],
    },
  ];
}
