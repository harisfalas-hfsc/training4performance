/**
 * Coaching calculators — rebuilt 1:1 from the coach's original Excel tools.
 * Every formula below is the exact formula found in the source spreadsheet.
 */

export type CalcField = {
  key: string;
  label: string;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  default: number;
  hint?: string;
};

export type CalcResult = {
  label: string;
  value: number | string;
  unit?: string;
  emphasis?: boolean;
};

export type CalculatorSpec = {
  id: string;
  name: string;
  category: "Aerobic" | "Speed & Power" | "Strength" | "Heart rate" | "Workload" | "Testing";
  summary: string;
  fields: CalcField[];
  compute: (v: (key: string) => number) => CalcResult[];
  notes?: string[];
};

const round = (n: number, d = 1) => {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

// Beep test: shuttles per level (levels 1..22) from the original lookup column.
const SHUTTLES_PER_LEVEL = [8, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 16];

export const calculators: CalculatorSpec[] = [
  {
    id: "rast",
    name: "RAST — 35 m sprint power",
    category: "Speed & Power",
    summary: "Six 35 m sprints. Returns peak, minimum and average power plus the fatigue index.",
    fields: [
      { key: "weight", label: "Body weight", unit: "kg", default: 80, step: 0.1, min: 20 },
      { key: "t1", label: "Sprint 1", unit: "s", default: 4.52, step: 0.01, min: 1 },
      { key: "t2", label: "Sprint 2", unit: "s", default: 4.75, step: 0.01, min: 1 },
      { key: "t3", label: "Sprint 3", unit: "s", default: 4.92, step: 0.01, min: 1 },
      { key: "t4", label: "Sprint 4", unit: "s", default: 5.21, step: 0.01, min: 1 },
      { key: "t5", label: "Sprint 5", unit: "s", default: 5.46, step: 0.01, min: 1 },
      { key: "t6", label: "Sprint 6", unit: "s", default: 5.62, step: 0.01, min: 1 },
    ],
    compute: (v) => {
      const times = [v("t1"), v("t2"), v("t3"), v("t4"), v("t5"), v("t6")].filter((t) => t > 0);
      const powers = times.map((t) => (v("weight") * 35 * 35) / (t * t * t));
      const max = Math.max(...powers);
      const min = Math.min(...powers);
      const avg = powers.reduce((a, b) => a + b, 0) / powers.length;
      const total = times.reduce((a, b) => a + b, 0);
      return [
        { label: "Maximum power", value: round(max), unit: "W", emphasis: true },
        { label: "Minimum power", value: round(min), unit: "W" },
        { label: "Average power", value: round(avg), unit: "W", emphasis: true },
        { label: "Fatigue index", value: round((max - min) / total, 2), unit: "W/s" },
        ...powers.map((p, i) => ({ label: `Sprint ${i + 1} power`, value: round(p), unit: "W" })),
      ];
    },
    notes: ["Power = body weight × 35² ÷ time³ for each sprint."],
  },
  {
    id: "beep",
    name: "Beep test — VO2 max",
    category: "Aerobic",
    summary: "Multistage fitness test. Enter the level and shuttles reached to get estimated VO2 max.",
    fields: [
      { key: "level", label: "Level reached", default: 13, step: 1, min: 1, max: 23 },
      { key: "shuttle", label: "Shuttles in that level", default: 2, step: 1, min: 0, max: 17 },
    ],
    compute: (v) => {
      const level = Math.floor(v("level"));
      const shuttle = Math.floor(v("shuttle"));
      if (level > 23 || shuttle > 17) return [{ label: "Level or shuttle is incorrect", value: "—" }];
      let total = shuttle;
      for (let i = 0; i < SHUTTLES_PER_LEVEL.length; i += 1) if (level > i + 1) total += SHUTTLES_PER_LEVEL[i] ?? 0;
      const vo2 = 18.043461 + 0.3689295 * total - 0.000349 * total * total;
      return [
        { label: "VO2 max", value: round(vo2, 2), unit: "ml/kg/min", emphasis: true },
        { label: "Total shuttles completed", value: total },
      ];
    },
    notes: ["Compared with the printed test tables this value can differ by up to ±0.3 ml/kg/min."],
  },
  {
    id: "conconi",
    name: "Conconi — anaerobic threshold",
    category: "Aerobic",
    summary: "From the 200 m step test: threshold O2 usage, VO2 max and the share of VO2 max used.",
    fields: [
      { key: "atSpeed", label: "AT speed (from the graph deflection)", unit: "km/h", default: 15, step: 0.1, min: 5 },
      { key: "hr12", label: "Pulse at 12 km/h", unit: "bpm", default: 165, step: 1, min: 60 },
      { key: "hr17", label: "Pulse at 17 km/h", unit: "bpm", default: 191, step: 1, min: 60 },
      { key: "maxHr", label: "Maximum heart rate", unit: "bpm", default: 186, step: 1, min: 100 },
    ],
    compute: (v) => {
      const o2 = 2.917 * v("atSpeed") + 0.000617 * v("atSpeed") ** 3;
      const vo2max = (v("maxHr") * 16.55 + v("hr17") * 36.07 - v("hr12") * 52.62) / (v("hr17") - v("hr12"));
      return [
        { label: "O2 usage at threshold", value: round(o2, 2), unit: "ml/kg/min", emphasis: true },
        { label: "VO2 max", value: round(vo2max, 2), unit: "ml/kg/min", emphasis: true },
        { label: "% of VO2 max used", value: round((o2 / vo2max) * 100, 1), unit: "%" },
      ];
    },
    notes: ["Run 200 m steps, record pulse each step, then read the AT speed off the deflection point."],
  },
  {
    id: "pace400",
    name: "400 m target pace splits",
    category: "Speed & Power",
    summary: "Predicted 150 m, 300 m and 600 m times for a target 400 m time.",
    fields: [{ key: "target", label: "Target 400 m time", unit: "s", default: 48, step: 0.1, min: 35 }],
    compute: (v) => {
      const t = v("target");
      return [
        { label: "Predicted 150 m", value: round(-0.131152 + 0.3856481 * t - 0.000985 * t * t, 2), unit: "s", emphasis: true },
        { label: "Predicted 300 m", value: round(-12.83117 + 1.2204958 * t - 0.004695 * t * t, 2), unit: "s", emphasis: true },
        { label: "Predicted 600 m", value: round(-31.48858 + 2.818664 * t - 0.010923 * t * t, 2), unit: "s", emphasis: true },
      ];
    },
  },
  {
    id: "hr-zones",
    name: "Heart rate training zones",
    category: "Heart rate",
    summary: "Karvonen zones from age and resting heart rate.",
    fields: [
      { key: "age", label: "Age", unit: "yrs", default: 24, step: 1, min: 10, max: 80 },
      { key: "rhr", label: "Resting heart rate", unit: "bpm", default: 55, step: 1, min: 30, max: 120 },
    ],
    compute: (v) => {
      const mhr = 217 - v("age") * 0.85;
      const whr = mhr - v("rhr");
      const zone = (p: number) => round(whr * p + v("rhr"));
      return [
        { label: "Maximum heart rate", value: round(mhr), unit: "bpm", emphasis: true },
        { label: "Working heart rate", value: round(whr), unit: "bpm" },
        { label: "60% — fat burning, refill glycogen", value: zone(0.6), unit: "bpm" },
        { label: "70% — oxygen transport", value: zone(0.7), unit: "bpm" },
        { label: "80% — lactate threshold", value: zone(0.8), unit: "bpm" },
        { label: "85% — lactate threshold", value: zone(0.85), unit: "bpm" },
        { label: "90% — speed", value: zone(0.9), unit: "bpm" },
      ];
    },
  },
  {
    id: "max-load",
    name: "1RM — max load from reps",
    category: "Strength",
    summary: "Brzycki and alternative 1RM estimates from a submaximal set.",
    fields: [
      { key: "weight", label: "Weight lifted", unit: "kg", default: 100, step: 0.5, min: 1 },
      { key: "reps", label: "Repetitions", default: 8, step: 1, min: 1, max: 11, hint: "Must be less than 12" },
    ],
    compute: (v) => [
      { label: "Max load (Brzycki)", value: round(v("weight") / (1.0278 - 0.0278 * v("reps")), 1), unit: "kg", emphasis: true },
      { label: "Max load (alternative)", value: round(v("weight") * (1 + 0.033 * v("reps")), 1), unit: "kg", emphasis: true },
    ],
  },
  {
    id: "load-reps",
    name: "% load → reps to failure",
    category: "Strength",
    summary: "How many repetitions an athlete should manage at a given percentage of 1RM.",
    fields: [{ key: "load", label: "% of 1RM", unit: "%", default: 85, step: 1, min: 30, max: 100 }],
    compute: (v) => {
      const l = v("load");
      const reps = 173.525 - 6.31 * l + 0.09576 * l * l - 0.0006742 * l ** 3 + 0.00000175 * l ** 4;
      return [{ label: "Repetitions to failure", value: round(reps, 1), unit: "reps", emphasis: true }];
    },
  },
  {
    id: "vo2-mhr",
    name: "%VO2 max → %MHR",
    category: "Heart rate",
    summary: "Convert a target percentage of VO2 max into a percentage of maximum heart rate.",
    fields: [{ key: "vo2", label: "Target % VO2 max", unit: "%", default: 80, step: 1, min: 30, max: 100 }],
    compute: (v) => [
      { label: "% of maximum heart rate", value: round(0.64 * v("vo2") + 37, 1), unit: "%", emphasis: true },
    ],
  },
  {
    id: "vvo2max",
    name: "vVO2 max & interval sessions",
    category: "Aerobic",
    summary: "From a 6-minute time trial distance: velocity at VO2 max plus ready-made 30-30, 60-60 and vVO2max sessions.",
    fields: [{ key: "distance", label: "Distance covered in 6 minutes", unit: "m", default: 1500, step: 10, min: 300 }],
    compute: (v) => {
      const d = v("distance");
      const run30 = (d * 0.5) / 6;
      return [
        { label: "vVO2 max", value: round(d / 360, 2), unit: "m/s", emphasis: true },
        { label: "30-30: run", value: round(run30), unit: "m in 30 s", emphasis: true },
        { label: "30-30: recovery", value: round(run30 / 2), unit: "m in 30 s" },
        { label: "60-60: run", value: round(run30 * 2), unit: "m in 60 s", emphasis: true },
        { label: "60-60: recovery", value: round(run30), unit: "m in 60 s" },
        { label: "vVO2max session: 5 reps of", value: round(d * 0.5), unit: "m" },
        { label: "Time per repetition", value: round((d * 0.5) / (d / 360), 1), unit: "s" },
      ];
    },
    notes: ["vVO2max session: 5 repetitions with 3 minutes recovery between reps."],
  },
];

export const calculatorCategories = ["Aerobic", "Speed & Power", "Strength", "Heart rate"] as const;
