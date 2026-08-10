/**
 * T4P Logbook model — mirrors the club logbook workbook
 * (Activity logbook / Activity chart / Training logbook / Tests / Data).
 */
import {
  SALAMINA_TESTS,
} from "@/data/salamina";
import {
  fullName,
  gpsHistory,
  manualTests,
  players,
  sessionCalendar,
  subscribeData,
  testPlayerId,
  today,
  type GpsDay,
  type Player,
} from "@/data/performance";

/* ------------------------------------------------------------------ */
/* DATA tab taxonomies                                                 */
/* ------------------------------------------------------------------ */

export const PLAYER_TRAINING_DESCRIPTIONS = [
  "FULL TRAINING",
  "PARTIAL TRAINING",
  "RECOVERY",
  "PERSONAL TRAINING",
  "REHAB",
  "INDOOR TRAINING",
  "FRIENDLY GAME",
  "GAME",
  "REGENERATION TRAINING",
  "OTHER TRAINING",
] as const;

export const DAY_DESCRIPTIONS = [
  "MD",
  "MD -1",
  "MD -2",
  "MD -3",
  "MD +1",
  "MD +2",
  "MD +3",
  "OFF SEASON TRAINING",
  "TRAINING",
  "SP. GROUP TRAINING",
] as const;

export const TRAINING_PARAMETERS = [
  "TOTAL DISTANCE",
  "TOTAL VELOCITY BAND 1 DISTANCE",
  "TOTAL VELOCITY BAND 2 DISTANCE",
  "TOTAL VELOCITY BAND 3 DISTANCE",
  "VELOCITY BAND 4 DISTANCE",
  "POWER EFFORTS",
  "TOTAL TRAINING LOAD",
] as const;

export const DRILL_PURPOSES = ["FUN", "ACTIVATION", "WARM UP", "METABOLIC", "STRENGTH", "POWER", "TACTICS"] as const;

export const TRAINING_DRILLS = [
  "MINI BANDS",
  "JOGGING",
  "BICYCLE",
  "CORRECTIVES",
  "MOBILITY & STABILITY",
  "STRETCHING",
  "MOVEMENT PREPERATION",
  "BALL MASTERY",
  "ACTIVATION & WARM UP",
  "FUN GAME",
  "STRENGTH LOW PUSH (FOUNDATIONAL)",
  "STRENGTH LOW PULL (FOUNDATIONAL)",
  "STRENGTH LOW PUSH (Max Strength)",
  "STRENGTH LOW PULL (Max Strength)",
  "STRENGTH LOW PUSH (POWER)",
  "STRENGTH LOW PULL (POWER)",
  "STRENGTH UPPER PUSH (FOUNDATIONAL)",
  "STRENGTH UPPER PULL (FOUNDATIONAL)",
  "STRENGTH UPPER PUSH (Max Strength)",
  "STRENGTH UPPER PULL (Max Strength)",
  "STRENGTH UPPER PUSH (POWER)",
  "STRENGTH UPPER PULL (POWER)",
  "STRENGTH CORE",
  "RONDO = AT",
  "RONDO > AT",
  "RONDO < AT",
  "RUNNING DRILLS = AT",
  "RUNNING DRILLS > AT",
  "RUNNING DRILLS < AT",
  "POWER - PLYOMETRICS",
  "POWER - LINEAR SPEED",
  "POWER - MULTIDIRECTIONAL SPEED",
  "POWER - MED BALL",
  "POWER - SHOOTING & FINISHING",
  "1vs1, 2vs2, 3vs2, etc",
  "REACTION TRAINING",
  "PASSING DRILL = AT",
  "PASSING DRILL > AT",
  "PASSING DRILL < AT",
  "POSSESION = AT",
  "POSSESION > AT",
  "POSSESION < AT",
  "SSG = AT",
  "SSG > AT",
  "SSG < AT",
  "GAME DOUBLE BOX",
  "GAME HALF PITCH",
  "GAME BOX 2 BOX",
  "GAME FULL PITCH",
  "TOURNAMENTS",
  "P.O.G",
  "SHADOW GAME",
  "SET PIECES",
  "TACTICAL MOVEMENTS",
  "RECOVERY TRAINING - INDOOR",
  "RECOVERY TRAINING - FIELD",
  "HANDBALL",
  "TENNIS",
  "BASKETBALL",
  "TESTING",
  "MATCH GAME",
  "FULL TRAINING",
  "FULL TRAINING 'LIVE'",
  "OTHER",
] as const;

export const EVALUATION_TESTS = [
  "BODY WEIGHT (kg)",
  "BODY FAT (%)",
  "FMS (O.H.S.)",
  "FMS (A.S.L.)",
  "FMS (Hurtle Step)",
  "FMS (Rotary Stability)",
  "FMS (Inline Lunge)",
  "YO-YO TEST (Distance)",
  "YO-YO TEST (Velocity)",
  "VO2 max (mL/kg/min)",
  "M.A.S. (Velocity)",
  "A / T (Velocity)",
  "RAST TEST POWER (Watts)",
  "RAST TEST ENDURANCE (Fatique Index %)",
  "SPEED (km/h)",
  "S.J. (2 Legs)",
  "S.J. (Right Leg)",
  "S.J. (Left Leg)",
  "C.M.J. (2 Legs)",
  "C.M.J. (Right Leg)",
  "C.M.J. (Left Leg)",
  "DROP JUMP",
  "FOOT TAPPING 30''",
  "LOW PUSH RIGHT LEG 1RM (Split Squat)",
  "LOW PUSH LEFT LEG 1RM (Split Squat)",
  "LOW PULL RIGHT LEG 1RM (R.D.L.)",
  "LOW PULL LEFT LEG 1RM (R.D.L.)",
  "ILLINOIS TEST (sec)",
  "T-TEST (sec)",
] as const;

export const TEAM_TRAINING_GROUPS = [
  "ALL TEAM ATHLETES",
  "ATHLETES WHO PLAYED MORE THAN 60'",
  "ATHLETES WHO PLAYED LESS THAN 60'",
  "OUT OF ROSTER ATHLETES",
  "INJURED ATHLETES",
  "BANNED ATHLETES",
  "OTHER ATHLETES",
] as const;

export type TrainingDrillName = (typeof TRAINING_DRILLS)[number];
export type EvaluationTestName = (typeof EVALUATION_TESTS)[number];

/* ------------------------------------------------------------------ */
/* T4P GPS import template                                             */
/* ------------------------------------------------------------------ */

export interface TemplateColumn {
  key: string;
  header: string;
  required: boolean;
  example: string;
  note: string;
}

export const T4P_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { key: "date", header: "start date/time", required: true, example: "2026-08-10 18:30:00", note: "Session start. Date only is accepted." },
  { key: "category", header: "category", required: true, example: "FULL TRAINING", note: "One of the player training descriptions." },
  { key: "dayDescription", header: "day description", required: false, example: "MD -2", note: "Match-day cycle label." },
  { key: "drill", header: "training drill", required: false, example: "SSG > AT", note: "Leave empty for a whole-session row; fill it to split the session into parts." },
  { key: "athlete", header: "athlete", required: true, example: "PANAYIOTIS ARTYMATAS", note: "Player name, matched against the squad list." },
  { key: "role", header: "role", required: false, example: "CENTER BACK", note: "Position on the day." },
  { key: "starter", header: "starter", required: false, example: "TRUE", note: "TRUE / FALSE." },
  { key: "duration", header: "duration (mm:ss)", required: true, example: "75:32", note: "Minutes are also accepted (75)." },
  { key: "distance", header: "distance (m)", required: true, example: "5140.8", note: "Total distance." },
  { key: "hsr", header: "distance / speed Z4 (m)", required: true, example: "169.2", note: "High speed running distance." },
  { key: "sprintDistance", header: "distance / speed Z5 (m)", required: true, example: "25.5", note: "Sprint distance." },
  { key: "maxSprintDistance", header: "distance / speed Z6 (m)", required: false, example: "0", note: "Max sprint distance." },
  { key: "avgSpeed", header: "avg speed (km/h)", required: false, example: "4.08", note: "" },
  { key: "maxSpeed", header: "max speed (km/h)", required: true, example: "27.13", note: "" },
  { key: "sprints", header: "speed events", required: true, example: "3", note: "Number of sprint efforts." },
  { key: "accel", header: "acc events", required: true, example: "12", note: "Accelerations over threshold." },
  { key: "decel", header: "dec events", required: true, example: "18", note: "Decelerations over threshold." },
  { key: "jumps", header: "jumps", required: false, example: "6", note: "" },
  { key: "metPower", header: "met power events", required: false, example: "70", note: "Metabolic power efforts." },
  { key: "energy", header: "energy (J/kg)", required: false, example: "21762", note: "" },
  { key: "rpe", header: "rpe", required: false, example: "7", note: "0-10. Leave empty and the coach can enter it in the logbook." },
  { key: "notes", header: "notes", required: false, example: "", note: "" },
];

const exampleAthletes = players.slice(0, 3);

/** CSV text for the downloadable T4P import template. */
export function templateCsv(): string {
  const header = T4P_TEMPLATE_COLUMNS.map((c) => c.header).join(",");
  const rows = exampleAthletes.map((p, i) =>
    T4P_TEMPLATE_COLUMNS.map((c) => {
      if (c.key === "athlete") return fullName(p).toUpperCase();
      if (c.key === "role") return p.position;
      if (c.key === "starter") return i === 0 ? "TRUE" : "FALSE";
      return c.example;
    }).join(","),
  );
  const legend = [
    "",
    "# T4P GPS IMPORT TEMPLATE",
    "# Keep the header row exactly as it is and one row per player per session (or per drill part).",
    "# Required columns: " + T4P_TEMPLATE_COLUMNS.filter((c) => c.required).map((c) => c.header).join(" | "),
    "# Any other provider export can still be uploaded - T4P will ask you to map the unknown columns.",
  ];
  return [header, ...rows, ...legend].join("\n");
}

/* ------------------------------------------------------------------ */
/* Configurable load model (composite ACWR)                            */
/* ------------------------------------------------------------------ */

export interface LoadKpi {
  key: string;
  label: string;
  unit: string;
  group: "Aerobic" | "Anaerobic" | "Power" | "Perceived";
  value: (d: LogbookRow) => number;
  defaultWeight: number;
}

export const LOAD_KPIS: LoadKpi[] = [
  { key: "distance", label: "Total distance", unit: "m", group: "Aerobic", value: (d) => d.distance, defaultWeight: 1 },
  { key: "hsr", label: "High speed running", unit: "m", group: "Anaerobic", value: (d) => d.hsr, defaultWeight: 1.5 },
  { key: "sprintDistance", label: "Sprint distance", unit: "m", group: "Anaerobic", value: (d) => d.sprintDistance, defaultWeight: 1.5 },
  { key: "sprints", label: "Sprint efforts", unit: "n", group: "Anaerobic", value: (d) => d.sprints, defaultWeight: 1 },
  { key: "accel", label: "Accelerations", unit: "n", group: "Power", value: (d) => d.accel, defaultWeight: 1 },
  { key: "decel", label: "Decelerations", unit: "n", group: "Power", value: (d) => d.decel, defaultWeight: 1 },
  { key: "jumps", label: "Jumps", unit: "n", group: "Power", value: (d) => d.jumps, defaultWeight: 0.75 },
  { key: "maxSpeed", label: "Max speed", unit: "km/h", group: "Power", value: (d) => d.maxSpeed, defaultWeight: 0 },
  { key: "srpe", label: "Session RPE load", unit: "AU", group: "Perceived", value: (d) => d.rpe * d.minutes, defaultWeight: 1 },
];

export type LoadWeights = Record<string, number>;

export const DEFAULT_WEIGHTS: LoadWeights = Object.fromEntries(LOAD_KPIS.map((k) => [k.key, k.defaultWeight]));

/* ------------------------------------------------------------------ */
/* Activity logbook rows                                               */
/* ------------------------------------------------------------------ */

export interface LogbookRow {
  id: string;
  date: string;
  category: string;
  dayDescription: string;
  drill: string;
  playerId: string;
  athlete: string;
  role: string;
  starter: boolean;
  minutes: number;
  distance: number;
  hsr: number;
  sprintDistance: number;
  maxSprintDistance: number;
  sprints: number;
  accel: number;
  decel: number;
  jumps: number;
  maxSpeed: number;
  avgSpeed: number;
  energy: number;
  rpe: number;
  status: string;
}

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000) / 1000;
};

const dayLabel = (date: string): string => {
  const dow = new Date(date).getDay();
  if (dow === 0) return "MD";
  if (dow === 6) return "MD -1";
  if (dow === 5) return "MD -2";
  if (dow === 4) return "MD -3";
  if (dow === 2) return "MD +2";
  if (dow === 3) return "MD +3";
  return "TRAINING";
};

const categoryFor = (g: GpsDay): string => {
  if (new Date(g.date).getDay() === 0) return "FRIENDLY GAME";
  switch (g.status) {
    case "Injured":
    case "Ill":
      return "REHAB";
    case "Rehabilitation":
      return "REHAB";
    case "Individual Training":
      return "PERSONAL TRAINING";
    case "Partial Training":
      return "PARTIAL TRAINING";
    default:
      return "FULL TRAINING";
  }
};

function rowFromGps(g: GpsDay, p: Player): LogbookRow {
  const r = hash(g.playerId + g.date);
  return {
    id: `${g.playerId}-${g.date}`,
    date: g.date,
    category: g.category ?? categoryFor(g),
    dayDescription: dayLabel(g.date),
    drill: "",
    playerId: g.playerId,
    athlete: fullName(p).toUpperCase(),
    role: p.position,
    starter: r > 0.45,
    minutes: g.minutes,
    distance: g.distance,
    hsr: g.hsr,
    sprintDistance: Math.round(g.sprint),
    maxSprintDistance: Math.round(g.sprint * 0.35),
    sprints: g.sprintEvents ?? 0,
    accel: g.accel,
    decel: g.decel,
    jumps: g.jumps ?? 0,
    maxSpeed: g.maxSpeed,
    avgSpeed: g.avgSpeed ?? (g.minutes ? +(g.distance / 1000 / (g.minutes / 60)).toFixed(2) : 0),
    energy: g.energy ?? Math.round(g.distance * 4.2),
    rpe: g.rpe,
    status: g.status,
  };
}

function buildLogbookRows(): LogbookRow[] {
  const byId = new Map(players.map((p) => [p.id, p]));
  return gpsHistory
    .map((g) => {
      const p = byId.get(g.playerId);
      return p ? rowFromGps(g, p) : null;
    })
    .filter((r): r is LogbookRow => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date) || a.athlete.localeCompare(b.athlete));
}

export const logbookRows: LogbookRow[] = buildLogbookRows();

/** Drill split of a session for one player — the "parts of training" view. */
export const SESSION_SPLIT: Array<{ drill: string; share: number; purpose: string; rpe: number }> = [
  { drill: "ACTIVATION & WARM UP", share: 0.14, purpose: "WARM UP", rpe: 3 },
  { drill: "MOVEMENT PREPERATION", share: 0.08, purpose: "ACTIVATION", rpe: 3 },
  { drill: "RONDO > AT", share: 0.14, purpose: "METABOLIC", rpe: 6 },
  { drill: "POSSESION > AT", share: 0.18, purpose: "METABOLIC", rpe: 7 },
  { drill: "SSG > AT", share: 0.22, purpose: "METABOLIC", rpe: 8 },
  { drill: "POWER - LINEAR SPEED", share: 0.1, purpose: "POWER", rpe: 7 },
  { drill: "SET PIECES", share: 0.09, purpose: "TACTICS", rpe: 4 },
  { drill: "STRETCHING", share: 0.05, purpose: "WARM UP", rpe: 2 },
];

export function splitRow(row: LogbookRow): LogbookRow[] {
  return SESSION_SPLIT.map((part, i) => ({
    ...row,
    id: `${row.id}-d${i}`,
    drill: part.drill,
    minutes: Math.round(row.minutes * part.share),
    distance: Math.round(row.distance * part.share),
    hsr: Math.round(row.hsr * part.share * (part.purpose === "METABOLIC" ? 1.6 : 0.4)),
    sprintDistance: Math.round(row.sprintDistance * part.share * (part.purpose === "POWER" ? 2.4 : 0.6)),
    maxSprintDistance: Math.round(row.maxSprintDistance * part.share),
    sprints: Math.round(row.sprints * part.share * (part.purpose === "POWER" ? 2.4 : 0.6)),
    accel: Math.round(row.accel * part.share),
    decel: Math.round(row.decel * part.share),
    jumps: Math.round(row.jumps * part.share),
    energy: Math.round(row.energy * part.share),
    rpe: part.rpe,
  }));
}

/* ------------------------------------------------------------------ */
/* Composite load + ACWR                                               */
/* ------------------------------------------------------------------ */

/** Squad reference value per KPI (mean of non-zero days) — used to normalise units. */
export const KPI_REFERENCE: Record<string, number> = Object.fromEntries(
  LOAD_KPIS.map((k) => {
    const vals = logbookRows.map(k.value).filter((v) => v > 0);
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
    return [k.key, mean || 1];
  }),
);

/**
 * Composite session load in arbitrary units (AU).
 * Every selected KPI is normalised against the squad reference, weighted, and
 * scaled by 100, so a typical full session for a typical player sits near 100 AU.
 */
export function compositeLoad(row: LogbookRow, weights: LoadWeights = DEFAULT_WEIGHTS): number {
  let total = 0;
  let wsum = 0;
  for (const kpi of LOAD_KPIS) {
    const w = weights[kpi.key] ?? 0;
    if (!w) continue;
    wsum += w;
    total += w * (kpi.value(row) / (KPI_REFERENCE[kpi.key] || 1));
  }
  return wsum ? +((total / wsum) * 100).toFixed(1) : 0;
}

export interface CompositeAcwr {
  acute: number;
  chronic: number;
  acwr: number;
  monotony: number;
  strain: number;
  daily: Array<{ date: string; load: number }>;
}

const dayMs = 86400000;
const shift = (date: string, days: number) => new Date(new Date(date).getTime() + days * dayMs).toISOString().slice(0, 10);

export function compositeAcwr(
  playerId: string,
  weights: LoadWeights = DEFAULT_WEIGHTS,
  acuteWindow = 7,
  chronicWindow = 28,
  asOf = today,
): CompositeAcwr {
  const rows = logbookRows.filter((r) => r.playerId === playerId && r.date <= asOf);
  const daily = rows.map((r) => ({ date: r.date, load: compositeLoad(r, weights) }));
  const acuteFrom = shift(asOf, -(acuteWindow - 1));
  const chronicFrom = shift(asOf, -(chronicWindow - 1));
  const acuteLoads = daily.filter((d) => d.date >= acuteFrom).map((d) => d.load);
  const chronicLoads = daily.filter((d) => d.date >= chronicFrom).map((d) => d.load);
  const acute = acuteLoads.reduce((a, b) => a + b, 0);
  const chronic = chronicLoads.reduce((a, b) => a + b, 0) / (chronicWindow / acuteWindow);
  const mean = acuteLoads.length ? acute / acuteLoads.length : 0;
  const sd = Math.sqrt(acuteLoads.reduce((a, b) => a + (b - mean) ** 2, 0) / (acuteLoads.length || 1)) || 1;
  const monotony = mean / sd;
  return {
    acute: Math.round(acute),
    chronic: Math.round(chronic),
    acwr: chronic ? +(acute / chronic).toFixed(2) : 0,
    monotony: +monotony.toFixed(2),
    strain: Math.round(acute * monotony),
    daily,
  };
}

/* ------------------------------------------------------------------ */
/* Pivot engine (Activity chart tab)                                   */
/* ------------------------------------------------------------------ */

export type PivotMetric = { key: string; label: string; value: (r: LogbookRow, w: LoadWeights) => number };

export const PIVOT_METRICS: PivotMetric[] = [
  { key: "distance", label: "Total distance (m)", value: (r) => r.distance },
  { key: "hsr", label: "High speed running (m)", value: (r) => r.hsr },
  { key: "sprintDistance", label: "Sprint distance (m)", value: (r) => r.sprintDistance },
  { key: "maxSprintDistance", label: "Max sprint distance (m)", value: (r) => r.maxSprintDistance },
  { key: "sprints", label: "Sprint efforts (n)", value: (r) => r.sprints },
  { key: "maxSpeed", label: "Max speed (km/h)", value: (r) => r.maxSpeed },
  { key: "accel", label: "Accelerations (n)", value: (r) => r.accel },
  { key: "decel", label: "Decelerations (n)", value: (r) => r.decel },
  { key: "jumps", label: "Jumps (n)", value: (r) => r.jumps },
  { key: "minutes", label: "Duration (min)", value: (r) => r.minutes },
  { key: "energy", label: "Energy (J/kg)", value: (r) => r.energy },
  { key: "rpe", label: "RPE (0-10)", value: (r) => r.rpe },
  { key: "srpe", label: "Session RPE load (AU)", value: (r) => r.rpe * r.minutes },
  { key: "composite", label: "Composite training load (AU)", value: (r, w) => compositeLoad(r, w) },
];

export type PivotDimension = "athlete" | "role" | "date" | "category" | "dayDescription" | "drill";

export const PIVOT_DIMENSIONS: Array<{ key: PivotDimension; label: string }> = [
  { key: "athlete", label: "Player" },
  { key: "role", label: "Position" },
  { key: "date", label: "Date" },
  { key: "category", label: "Activity type" },
  { key: "dayDescription", label: "Match-day cycle" },
  { key: "drill", label: "Training drill" },
];

export type PivotAgg = "sum" | "avg" | "max" | "count";

export function pivot(
  rows: LogbookRow[],
  dimension: PivotDimension,
  metric: PivotMetric,
  agg: PivotAgg,
  weights: LoadWeights = DEFAULT_WEIGHTS,
): Array<{ label: string; value: number }> {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    const key = String(r[dimension] || "—");
    const arr = groups.get(key) ?? [];
    arr.push(metric.value(r, weights));
    groups.set(key, arr);
  }
  const out = [...groups.entries()].map(([label, vals]) => {
    const total = vals.reduce((a, b) => a + b, 0);
    const value =
      agg === "sum" ? total : agg === "avg" ? total / vals.length : agg === "max" ? Math.max(...vals) : vals.length;
    return { label, value: +value.toFixed(1) };
  });
  return dimension === "date" ? out.sort((a, b) => a.label.localeCompare(b.label)) : out.sort((a, b) => b.value - a.value);
}

/* ------------------------------------------------------------------ */
/* Training logbook (day plan)                                         */
/* ------------------------------------------------------------------ */

export interface TrainingDayDrill {
  drill: string;
  purpose: string;
  durationMin: number;
  rpe: number;
}

export interface TrainingDay {
  date: string;
  dayDescription: string;
  group: string;
  drills: TrainingDayDrill[];
}

function buildTrainingLogbook(): TrainingDay[] {
  return [...sessionCalendar]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((session) => {
      const base = session.durationMin || 78;
      const isMatch = /MATCH|GAME/i.test(session.title);
      return {
        date: session.date,
        dayDescription: session.label || dayLabel(session.date),
        group: session.group ?? "ALL TEAM ATHLETES",
        drills:
          session.plan && session.plan.length
            ? session.plan
            : isMatch
              ? [{ drill: "MATCH GAME", purpose: "TACTICS", durationMin: base || 90, rpe: 9 }]
              : SESSION_SPLIT.map((p) => ({
                  drill: p.drill,
                  purpose: p.purpose,
                  durationMin: Math.round(base * p.share),
                  rpe: p.rpe,
                })),
      };
    });
}

export const trainingLogbook: TrainingDay[] = buildTrainingLogbook();

export const sessionLoadOf = (d: TrainingDay) => d.drills.reduce((a, b) => a + b.durationMin * b.rpe, 0);

/* ------------------------------------------------------------------ */
/* Tests tab                                                           */
/* ------------------------------------------------------------------ */

export interface TestBattery {
  name: EvaluationTestName;
  unit: string;
  higherIsBetter: boolean;
  min: number;
  max: number;
  decimals: number;
}

export const TEST_BATTERY: TestBattery[] = [
  { name: "BODY WEIGHT (kg)", unit: "kg", higherIsBetter: false, min: 68, max: 92, decimals: 1 },
  { name: "BODY FAT (%)", unit: "%", higherIsBetter: false, min: 5, max: 13, decimals: 2 },
  { name: "C.M.J. (2 Legs)", unit: "cm", higherIsBetter: true, min: 34, max: 58, decimals: 1 },
  { name: "S.J. (2 Legs)", unit: "cm", higherIsBetter: true, min: 31, max: 46, decimals: 1 },
  { name: "S.J. (Right Leg)", unit: "cm", higherIsBetter: true, min: 18, max: 31, decimals: 1 },
  { name: "S.J. (Left Leg)", unit: "cm", higherIsBetter: true, min: 18, max: 33, decimals: 1 },
  { name: "YO-YO TEST (Distance)", unit: "m", higherIsBetter: true, min: 1400, max: 2440, decimals: 0 },
  { name: "M.A.S. (Velocity)", unit: "km/h", higherIsBetter: true, min: 15.5, max: 18.5, decimals: 1 },
  { name: "VO2 max (mL/kg/min)", unit: "ml/kg/min", higherIsBetter: true, min: 49, max: 62, decimals: 1 },
  { name: "SPEED (km/h)", unit: "km/h", higherIsBetter: true, min: 28, max: 35, decimals: 2 },
  { name: "ILLINOIS TEST (sec)", unit: "s", higherIsBetter: false, min: 15.1, max: 17.4, decimals: 2 },
  { name: "T-TEST (sec)", unit: "s", higherIsBetter: false, min: 9.1, max: 11.2, decimals: 2 },
  { name: "FMS (O.H.S.)", unit: "0-3", higherIsBetter: true, min: 1, max: 3, decimals: 0 },
  { name: "FMS (A.S.L.)", unit: "0-3", higherIsBetter: true, min: 1, max: 3, decimals: 0 },
  { name: "FMS (Inline Lunge)", unit: "0-3", higherIsBetter: true, min: 1, max: 3, decimals: 0 },
];

/** Test rounds present in the data (workbook rounds + rounds staff add). */
export const TEST_ROUNDS: Array<{ id: string; label: string; date: string }> = [];

export interface TestCell {
  playerId: string;
  athlete: string;
  round: string;
  test: EvaluationTestName;
  value: number;
}

const TEST_FIELD_MAP: Array<{ field: keyof (typeof SALAMINA_TESTS)[number]; test: string }> = [
  { field: "weight", test: "BODY WEIGHT (kg)" },
  { field: "bf", test: "BODY FAT (%)" },
  { field: "cmj", test: "C.M.J. (2 Legs)" },
  { field: "sj", test: "S.J. (2 Legs)" },
  { field: "sjR", test: "S.J. (Right Leg)" },
  { field: "sjL", test: "S.J. (Left Leg)" },
  { field: "yoyoDistance", test: "YO-YO TEST (Distance)" },
  { field: "yoyoMas", test: "M.A.S. (Velocity)" },
  { field: "ohs", test: "FMS (O.H.S.)" },
  { field: "aslR", test: "FMS (A.S.L.)" },
];

function buildTestResults(): TestCell[] {
  const out: TestCell[] = [];
  SALAMINA_TESTS.forEach((row) => {
    const pid = testPlayerId(row.first, row.last);
    if (!pid) return;
    const p = players.find((x) => x.id === pid);
    if (!p) return;
    TEST_FIELD_MAP.forEach(({ field, test }) => {
      const v = row[field];
      if (typeof v !== "number") return;
      out.push({ playerId: pid, athlete: fullName(p).toUpperCase(), round: `Testing ${row.date}`, test: test as EvaluationTestName, value: v });
    });
  });
  manualTests.forEach((m) => {
    const p = players.find((x) => x.id === m.playerId);
    if (!p) return;
    const i = out.findIndex((c) => c.playerId === m.playerId && c.round === m.round && c.test === m.test);
    const cell: TestCell = { playerId: m.playerId, athlete: fullName(p).toUpperCase(), round: m.round, test: m.test as EvaluationTestName, value: m.value };
    if (i >= 0) out[i] = cell;
    else out.push(cell);
  });
  return out;
}

export const testResults: TestCell[] = buildTestResults();

function rebuildRounds() {
  const rounds = [...new Set(testResults.map((t) => t.round))].sort();
  TEST_ROUNDS.splice(
    0,
    TEST_ROUNDS.length,
    ...rounds.map((label, i) => ({ id: `r${i + 1}`, label, date: label.replace(/^Testing\s*/, "") })),
  );
}
rebuildRounds();

/** Recompute every derived collection after a squad/session/test change. */
export function rebuildDerived() {
  logbookRows.splice(0, logbookRows.length, ...buildLogbookRows());
  trainingLogbook.splice(0, trainingLogbook.length, ...buildTrainingLogbook());
  testResults.splice(0, testResults.length, ...buildTestResults());
  rebuildRounds();
}

subscribeData(rebuildDerived);

export const testValue = (playerId: string, test: string, round: string) =>
  testResults.find((t) => t.playerId === playerId && t.test === test && t.round === round)?.value ?? null;
