/**
 * T4P training-load model.
 *
 * Most GPS exports do not contain a "training load" column. This module lets the
 * coach choose which KPIs of his own export build the load number, and estimates
 * it for every imported day.
 *
 * Two formulas are supported:
 *
 * 1. "ratio" — a squad-ratio composite where every metric is divided by the
 *    squad average of that metric:
 *
 *      load = 100 x  Σ ( w_i x  value_i / mean_i ) / Σ w_i
 *
 *    A typical session for a typical player therefore sits near 100 AU, and the
 *    number is unit-free, so metres, counts and joules can be mixed safely.
 *
 * 2. "srpe" — Foster's session RPE:  load = RPE (0-10) x  duration (min).
 */

import { customKpis, gpsHistory, gpsValue, type GpsDay } from "@/data/performance";
import { scopedStorageKey, subscribeWorkspaceScope } from "@/lib/workspace-scope";

export type LoadMethod = "ratio" | "srpe";

export interface LoadModel {
  method: LoadMethod;
  /** KPI key -> weight. Only keys with weight > 0 take part in the ratio formula. */
  weights: Record<string, number>;
  /** Whether the coach has reviewed the model at least once. */
  configured: boolean;
}

export interface LoadKpiOption {
  key: string;
  label: string;
  unit: string;
  group: "Aerobic" | "Anaerobic" | "Power" | "Perceived" | "Your export";
  defaultWeight: number;
}

/** Core KPIs every GPS export can normally provide. */
export const CORE_LOAD_KPIS: LoadKpiOption[] = [
  { key: "distance", label: "Total distance", unit: "m", group: "Aerobic", defaultWeight: 1 },
  { key: "energy", label: "Energy / metabolic work", unit: "J/kg", group: "Aerobic", defaultWeight: 0 },
  { key: "hsr", label: "High speed running", unit: "m", group: "Anaerobic", defaultWeight: 1.5 },
  { key: "sprint", label: "Sprint distance", unit: "m", group: "Anaerobic", defaultWeight: 1.5 },
  { key: "sprintEvents", label: "Sprint efforts", unit: "n", group: "Anaerobic", defaultWeight: 0 },
  { key: "accel", label: "Accelerations", unit: "n", group: "Power", defaultWeight: 1 },
  { key: "decel", label: "Decelerations", unit: "n", group: "Power", defaultWeight: 1 },
  { key: "jumps", label: "Jumps", unit: "n", group: "Power", defaultWeight: 0.75 },
  { key: "minutes", label: "Duration", unit: "min", group: "Perceived", defaultWeight: 0 },
  { key: "rpe", label: "RPE", unit: "0-10", group: "Perceived", defaultWeight: 0 },
];

/** Core KPIs plus the club-specific columns discovered in the coach's own uploads. */
export function loadKpiOptions(): LoadKpiOption[] {
  return [
    ...CORE_LOAD_KPIS,
    ...customKpis().map((k) => ({
      key: k.key,
      label: k.label,
      unit: "",
      group: "Your export" as const,
      defaultWeight: 0,
    })),
  ];
}

export const DEFAULT_LOAD_MODEL: LoadModel = {
  method: "ratio",
  weights: Object.fromEntries(CORE_LOAD_KPIS.filter((k) => k.defaultWeight > 0).map((k) => [k.key, k.defaultWeight])),
  configured: false,
};

/* ------------------------------------------------------------------ */
/* Persisted state                                                     */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "t4p.loadmodel.v1";

let model: LoadModel = { ...DEFAULT_LOAD_MODEL, weights: { ...DEFAULT_LOAD_MODEL.weights } };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function read() {
  if (typeof window === "undefined") return;
  const key = scopedStorageKey(STORAGE_KEY);
  model = { ...DEFAULT_LOAD_MODEL, weights: { ...DEFAULT_LOAD_MODEL.weights } };
  if (key) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LoadModel>;
        model = {
          method: parsed.method === "srpe" ? "srpe" : "ratio",
          weights: parsed.weights && typeof parsed.weights === "object" ? { ...parsed.weights } : model.weights,
          configured: Boolean(parsed.configured),
        };
      }
    } catch {
      /* corrupt entry — keep defaults */
    }
  }
  emit();
}

if (typeof window !== "undefined") {
  subscribeWorkspaceScope(() => read());
  read();
}

export function getLoadModel(): LoadModel {
  return model;
}

export function setLoadModel(next: Partial<LoadModel>) {
  model = { ...model, ...next, weights: { ...(next.weights ?? model.weights) } };
  if (typeof window !== "undefined") {
    const key = scopedStorageKey(STORAGE_KEY);
    if (key) {
      try {
        window.localStorage.setItem(key, JSON.stringify(model));
      } catch {
        /* quota — ignore */
      }
    }
  }
  emit();
}

export function resetLoadModel() {
  setLoadModel({ ...DEFAULT_LOAD_MODEL, weights: { ...DEFAULT_LOAD_MODEL.weights }, configured: true });
}

export function subscribeLoadModel(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ------------------------------------------------------------------ */
/* The formula                                                         */
/* ------------------------------------------------------------------ */

/** Squad reference: mean of every non-zero value of that KPI across all saved GPS days. */
export function kpiMean(key: string): number {
  const vals = gpsHistory.map((r) => gpsValue(r, key)).filter((v) => v > 0);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function kpiMeans(keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map((k) => [k, kpiMean(k)]));
}

/** Weighted KPI list actually used by the current model. */
export function activeLoadKpis(m: LoadModel = model): Array<{ key: string; weight: number }> {
  return Object.entries(m.weights)
    .filter(([, w]) => (w ?? 0) > 0)
    .map(([key, weight]) => ({ key, weight }));
}

/**
 * Estimated training load of one GPS day, in arbitrary units (AU).
 * Pass pre-computed means to avoid recomputing them per row in big tables.
 */
export function estimateLoad(row: GpsDay, m: LoadModel = model, means?: Record<string, number>): number {
  if (m.method === "srpe") return Math.round((row.rpe || 0) * (row.minutes || 0));
  const active = activeLoadKpis(m);
  if (!active.length) return 0;
  let total = 0;
  let wsum = 0;
  for (const { key, weight } of active) {
    const mean = means?.[key] ?? kpiMean(key);
    if (!mean) continue;
    wsum += weight;
    total += weight * (gpsValue(row, key) / mean);
  }
  return wsum ? Math.round((total / wsum) * 100) : 0;
}

/** Load of every row of a set, with the squad means computed once. */
export function estimateLoadRows(rows: GpsDay[], m: LoadModel = model): Array<{ row: GpsDay; load: number }> {
  const means = kpiMeans(activeLoadKpis(m).map((k) => k.key));
  return rows.map((row) => ({ row, load: estimateLoad(row, m, means) }));
}

/** Human readable formula for the current model, used in the UI and the manual. */
export function loadFormulaText(m: LoadModel = model): string {
  if (m.method === "srpe") return "Load (AU) = RPE (0-10) x session duration (min)";
  const parts = activeLoadKpis(m).map(
    ({ key, weight }) =>
      `${weight} x (player's ${loadKpiOptions().find((o) => o.key === key)?.label ?? key} / team reference)`,
  );
  if (!parts.length) return "No KPI selected yet — pick at least one metric.";
  const wsum = activeLoadKpis(m).reduce((a, b) => a + b.weight, 0);
  return `Load (AU) = 100 x [ ${parts.join(" + ")} ] / ${wsum}`;
}


/** Does the coach's own export already contain a load column? */
export function importedLoadColumns(): Array<{ key: string; label: string }> {
  return customKpis().filter((k) => /load|trimp|impulse/i.test(k.label) || /load|trimp|impulse/i.test(k.key));
}

