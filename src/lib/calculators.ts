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
  {
    id: "session-load",
    name: "Session load, monotony & strain",
    category: "Workload",
    summary: "Session RPE load, weekly total, average daily load, monotony and strain.",
    fields: [
      { key: "rpe", label: "Session RPE (0-10)", default: 7, step: 0.5, min: 0, max: 10 },
      { key: "mins", label: "Session duration", unit: "min", default: 90, step: 1, min: 1 },
      { key: "d1", label: "Day 1 load", unit: "AU", default: 630, step: 10, min: 0 },
      { key: "d2", label: "Day 2 load", unit: "AU", default: 450, step: 10, min: 0 },
      { key: "d3", label: "Day 3 load", unit: "AU", default: 720, step: 10, min: 0 },
      { key: "d4", label: "Day 4 load", unit: "AU", default: 300, step: 10, min: 0 },
      { key: "d5", label: "Day 5 load", unit: "AU", default: 560, step: 10, min: 0 },
      { key: "d6", label: "Day 6 load", unit: "AU", default: 0, step: 10, min: 0 },
      { key: "d7", label: "Day 7 load", unit: "AU", default: 900, step: 10, min: 0 },
    ],
    compute: (v) => {
      const days = [v("d1"), v("d2"), v("d3"), v("d4"), v("d5"), v("d6"), v("d7")];
      const weekly = days.reduce((a, b) => a + b, 0);
      const mean = weekly / 7;
      const sd = Math.sqrt(days.reduce((a, b) => a + (b - mean) ** 2, 0) / 7);
      const monotony = sd > 0 ? mean / sd : 0;
      const strain = weekly * monotony;
      return [
        { label: "Session load (RPE × minutes)", value: round(v("rpe") * v("mins")), unit: "AU", emphasis: true },
        { label: "Weekly load", value: round(weekly), unit: "AU", emphasis: true },
        { label: "Average daily load", value: round(mean), unit: "AU" },
        { label: "Daily load SD", value: round(sd), unit: "AU" },
        { label: "Monotony", value: round(monotony, 2), emphasis: true },
        { label: "Strain", value: round(strain), unit: "AU", emphasis: true },
        { label: "Monotony flag", value: monotony >= 2 ? "High — vary daily loads" : "OK" },
      ];
    },
    notes: ["Monotony = weekly mean daily load ÷ SD. Values of 2.0+ with high strain raise illness/injury risk."],
  },
  {
    id: "acwr",
    name: "ACWR — acute:chronic workload ratio",
    category: "Workload",
    summary: "Ratio of the last 7 days against the 28-day chronic average, with the research-backed zone.",
    fields: [
      { key: "acute", label: "Acute load (last 7 days total)", unit: "AU", default: 3560, step: 10, min: 0 },
      { key: "chronic", label: "Chronic load (last 28 days total)", unit: "AU", default: 13000, step: 10, min: 0 },
    ],
    compute: (v) => {
      const chronicWeek = v("chronic") / 4;
      const ratio = chronicWeek > 0 ? v("acute") / chronicWeek : 0;
      const zone =
        ratio < 0.8 ? "Under-training (yellow)" : ratio <= 1.3 ? "Sweet spot (green)" : ratio <= 1.5 ? "Caution (orange)" : "Danger (red)";
      const safeMax = round(chronicWeek * 1.3);
      return [
        { label: "ACWR", value: round(ratio, 2), emphasis: true },
        { label: "Zone", value: zone, emphasis: true },
        { label: "Chronic weekly average", value: round(chronicWeek), unit: "AU" },
        { label: "Max load next week to stay ≤1.3", value: safeMax, unit: "AU" },
        { label: "Minimum load to stay ≥0.8", value: round(chronicWeek * 0.8), unit: "AU" },
      ];
    },
    notes: ["Bands: <0.80 under-training, 0.80–1.30 sweet spot, 1.30–1.50 caution, >1.50 danger."],
  },
  {
    id: "sprint-zones",
    name: "Speed zones from maximum velocity",
    category: "Speed & Power",
    summary: "Individual speed thresholds as percentages of the player's maximum sprinting speed.",
    fields: [
      { key: "mss", label: "Maximum sprinting speed", unit: "km/h", default: 32, step: 0.1, min: 15 },
    ],
    compute: (v) => {
      const mss = v("mss");
      const z = (p: number) => round(mss * p, 1);
      return [
        { label: "Max speed", value: round(mss, 1), unit: "km/h", emphasis: true },
        { label: "Max speed", value: round(mss / 3.6, 2), unit: "m/s" },
        { label: "Zone 1 — walk/jog (<45%)", value: `< ${z(0.45)}`, unit: "km/h" },
        { label: "Zone 2 — running (45–60%)", value: `${z(0.45)} – ${z(0.6)}`, unit: "km/h" },
        { label: "Zone 3 — high speed (60–75%)", value: `${z(0.6)} – ${z(0.75)}`, unit: "km/h", emphasis: true },
        { label: "Zone 4 — very high speed (75–85%)", value: `${z(0.75)} – ${z(0.85)}`, unit: "km/h", emphasis: true },
        { label: "Zone 5 — sprint (>85%)", value: `> ${z(0.85)}`, unit: "km/h", emphasis: true },
        { label: "Sprint threshold", value: z(0.85), unit: "km/h" },
      ];
    },
    notes: ["Individual thresholds beat fixed squad cut-offs; re-test max speed every 6–8 weeks."],
  },
  {
    id: "mas",
    name: "MAS — maximal aerobic speed prescription",
    category: "Aerobic",
    summary: "MAS from a time trial, plus interval distances at chosen %MAS for run and recovery.",
    fields: [
      { key: "distance", label: "Time-trial distance", unit: "m", default: 1500, step: 10, min: 300 },
      { key: "time", label: "Time-trial duration", unit: "min", default: 6, step: 0.5, min: 3 },
      { key: "pct", label: "Prescription intensity", unit: "% MAS", default: 110, step: 5, min: 60, max: 140 },
      { key: "work", label: "Work interval", unit: "s", default: 15, step: 5, min: 5 },
      { key: "rest", label: "Recovery interval", unit: "s", default: 15, step: 5, min: 0 },
      { key: "restPct", label: "Recovery intensity", unit: "% MAS", default: 50, step: 5, min: 0, max: 100 },
    ],
    compute: (v) => {
      const mas = v("distance") / (v("time") * 60);
      const runSpeed = mas * (v("pct") / 100);
      const recSpeed = mas * (v("restPct") / 100);
      return [
        { label: "MAS", value: round(mas, 2), unit: "m/s", emphasis: true },
        { label: "MAS", value: round(mas * 3.6, 1), unit: "km/h" },
        { label: "Estimated VO2 max", value: round(mas * 3.6 * 3.5, 1), unit: "ml/kg/min" },
        { label: `Run speed at ${round(v("pct"), 0)}% MAS`, value: round(runSpeed * 3.6, 1), unit: "km/h", emphasis: true },
        { label: "Run distance per interval", value: round(runSpeed * v("work")), unit: "m", emphasis: true },
        { label: "Recovery distance per interval", value: round(recSpeed * v("rest")), unit: "m" },
        { label: "Distance per work:rest cycle", value: round(runSpeed * v("work") + recSpeed * v("rest")), unit: "m" },
      ];
    },
    notes: ["MAS = time-trial distance ÷ time. VO2 max estimate uses 3.5 ml/kg/min per km/h."],
  },
  {
    id: "load-table",
    name: "%1RM loading table",
    category: "Strength",
    summary: "Working loads from 50% to 95% of 1RM, plus the target reps at your chosen intensity.",
    fields: [
      { key: "orm", label: "1RM", unit: "kg", default: 120, step: 0.5, min: 1 },
      { key: "pct", label: "Working intensity", unit: "% 1RM", default: 80, step: 2.5, min: 40, max: 100 },
    ],
    compute: (v) => {
      const orm = v("orm");
      const l = (p: number) => round(orm * p, 1);
      const pct = v("pct");
      const reps = 173.525 - 6.31 * pct + 0.09576 * pct * pct - 0.0006742 * pct ** 3 + 0.00000175 * pct ** 4;
      return [
        { label: `Working load at ${round(pct, 1)}%`, value: l(pct / 100), unit: "kg", emphasis: true },
        { label: "Estimated reps at that load", value: round(reps, 0), unit: "reps", emphasis: true },
        { label: "50% — speed/technique", value: l(0.5), unit: "kg" },
        { label: "60% — hypertrophy base", value: l(0.6), unit: "kg" },
        { label: "70% — hypertrophy", value: l(0.7), unit: "kg" },
        { label: "75%", value: l(0.75), unit: "kg" },
        { label: "80% — strength", value: l(0.8), unit: "kg" },
        { label: "85% — strength", value: l(0.85), unit: "kg" },
        { label: "90% — max strength", value: l(0.9), unit: "kg" },
        { label: "95% — max strength", value: l(0.95), unit: "kg" },
      ];
    },
  },
  {
    id: "strength-progression",
    name: "Strength progression planner",
    category: "Strength",
    summary: "Weekly load progression from a starting 1RM to a target, with per-week working loads.",
    fields: [
      { key: "start", label: "Current 1RM", unit: "kg", default: 120, step: 0.5, min: 1 },
      { key: "gain", label: "Weekly gain", unit: "%", default: 2, step: 0.5, min: 0, max: 10 },
      { key: "weeks", label: "Block length", unit: "weeks", default: 6, step: 1, min: 1, max: 12 },
      { key: "pct", label: "Training intensity", unit: "% 1RM", default: 80, step: 2.5, min: 40, max: 100 },
    ],
    compute: (v) => {
      const weeks = Math.min(12, Math.max(1, Math.floor(v("weeks"))));
      const g = 1 + v("gain") / 100;
      const rows: CalcResult[] = [];
      for (let w = 1; w <= weeks; w += 1) {
        const orm = v("start") * g ** w;
        rows.push({ label: `Week ${w} — working load`, value: round(orm * (v("pct") / 100), 1), unit: "kg" });
      }
      const final = v("start") * g ** weeks;
      return [
        { label: "Projected 1RM at end of block", value: round(final, 1), unit: "kg", emphasis: true },
        { label: "Total gain", value: round(final - v("start"), 1), unit: "kg", emphasis: true },
        { label: "Start working load", value: round(v("start") * (v("pct") / 100), 1), unit: "kg" },
        ...rows,
      ];
    },
  },
  {
    id: "test-conversions",
    name: "Testing conversions",
    category: "Testing",
    summary: "Sprint time to velocity, CMJ height from flight time, and Yo-Yo IR1 to VO2 max.",
    fields: [
      { key: "sprintD", label: "Sprint distance", unit: "m", default: 30, step: 1, min: 5 },
      { key: "sprintT", label: "Sprint time", unit: "s", default: 4.1, step: 0.01, min: 0.5 },
      { key: "flight", label: "CMJ flight time", unit: "s", default: 0.55, step: 0.01, min: 0.1 },
      { key: "yoyo", label: "Yo-Yo IR1 distance", unit: "m", default: 1800, step: 40, min: 0 },
    ],
    compute: (v) => {
      const vel = v("sprintD") / v("sprintT");
      const jump = (9.81 * v("flight") ** 2) / 8;
      return [
        { label: "Average sprint velocity", value: round(vel, 2), unit: "m/s", emphasis: true },
        { label: "Average sprint velocity", value: round(vel * 3.6, 1), unit: "km/h" },
        { label: "Split per 10 m", value: round(10 / vel, 2), unit: "s" },
        { label: "CMJ height", value: round(jump * 100, 1), unit: "cm", emphasis: true },
        { label: "Yo-Yo IR1 VO2 max", value: round(v("yoyo") * 0.0084 + 36.4, 1), unit: "ml/kg/min", emphasis: true },
      ];
    },
    notes: ["CMJ height = 9.81 × flight time² ÷ 8. Yo-Yo IR1 VO2 max = distance × 0.0084 + 36.4."],
  },
  {
    id: "normative",
    name: "Normative scoring (z-score & percentile)",
    category: "Testing",
    summary: "Where a player's test result sits against the squad or reference mean.",
    fields: [
      { key: "score", label: "Player result", default: 32, step: 0.1 },
      { key: "mean", label: "Reference mean", default: 30, step: 0.1 },
      { key: "sd", label: "Reference SD", default: 1.5, step: 0.1, min: 0.01 },
      { key: "dir", label: "Higher is better? (1 = yes, 0 = no)", default: 1, step: 1, min: 0, max: 1 },
    ],
    compute: (v) => {
      const raw = (v("score") - v("mean")) / v("sd");
      const z = v("dir") >= 0.5 ? raw : -raw;
      const cdf = 0.5 * (1 + Math.tanh(0.7978845608 * (z + 0.044715 * z ** 3)));
      const pct = cdf * 100;
      const band = pct >= 90 ? "Excellent" : pct >= 70 ? "Above average" : pct >= 30 ? "Average" : pct >= 10 ? "Below average" : "Poor";
      return [
        { label: "Z-score", value: round(z, 2), emphasis: true },
        { label: "Percentile", value: round(pct, 1), unit: "%", emphasis: true },
        { label: "Rating", value: band, emphasis: true },
        { label: "T-score (mean 50, SD 10)", value: round(50 + 10 * z, 1) },
        { label: "Difference from mean", value: round(v("score") - v("mean"), 2) },
      ];
    },
    notes: ["Set 'Higher is better' to 0 for tests where a lower number is better, such as sprint times."],
  },
];

export const calculatorCategories = ["Aerobic", "Speed & Power", "Strength", "Heart rate", "Workload", "Testing"] as const;
