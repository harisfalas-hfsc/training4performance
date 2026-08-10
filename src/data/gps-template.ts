/**
 * Coach-owned GPS template engine.
 *
 * Every club exports a different file with different KPI names. T4P therefore
 * reads the real header row of whatever file is uploaded, guesses what each
 * column means, lets the coach correct the guess once, and then remembers that
 * mapping as *his* template. Columns that do not map to a core metric are kept
 * as custom KPIs and stay available to analytics, alerts and reports.
 */

export type CoreField =
  | "name"
  | "date"
  | "minutes"
  | "distance"
  | "hsr"
  | "sprint"
  | "maxSpeed"
  | "avgSpeed"
  | "accel"
  | "decel"
  | "jumps"
  | "sprintEvents"
  | "energy"
  | "rpe";

export type FieldTarget = CoreField | "custom" | "ignore";

export interface CoreFieldDef {
  id: CoreField;
  label: string;
  unit?: string;
  aliases: string[];
}

/** Core metrics T4P models directly (load, ACWR, alerts, PB detection). */
export const CORE_FIELDS: CoreFieldDef[] = [
  { id: "name", label: "Player name", aliases: ["player", "name", "athlete", "player name", "athlete name", "surname", "full name"] },
  { id: "date", label: "Date", aliases: ["date", "session date", "day", "datetime"] },
  { id: "minutes", label: "Minutes", unit: "min", aliases: ["minutes", "duration", "time", "session time", "mins", "total time"] },
  { id: "distance", label: "Total distance", unit: "m", aliases: ["distance", "total distance", "total distance (m)", "dist", "tdist", "distance m"] },
  { id: "hsr", label: "High speed running", unit: "m", aliases: ["hsr", "hsr distance", "high speed running", "high speed distance", "hsd", "hi distance", "running distance"] },
  { id: "sprint", label: "Sprint distance", unit: "m", aliases: ["sprint", "sprint distance", "sprinting distance", "very high speed", "vhsr", "velocity band 6 distance"] },
  { id: "maxSpeed", label: "Max speed", unit: "km/h", aliases: ["max speed", "maximum speed", "top speed", "peak speed", "speed max", "vmax", "max velocity"] },
  { id: "avgSpeed", label: "Average speed", unit: "km/h", aliases: ["avg speed", "average speed", "mean speed"] },
  { id: "accel", label: "Accelerations", unit: "count", aliases: ["accel", "accelerations", "acc", "acc events", "high accelerations", "acc count"] },
  { id: "decel", label: "Decelerations", unit: "count", aliases: ["decel", "decelerations", "dec", "dec events", "high decelerations", "dec count"] },
  { id: "jumps", label: "Jumps", unit: "count", aliases: ["jumps", "jump count", "impacts"] },
  { id: "sprintEvents", label: "Sprint efforts", unit: "count", aliases: ["sprints", "sprint efforts", "sprint count", "number of sprints"] },
  { id: "energy", label: "Energy / player load", aliases: ["energy", "player load", "playerload", "dynamic stress load", "dsl", "metabolic power", "load"] },
  { id: "rpe", label: "RPE", aliases: ["rpe", "srpe", "perceived exertion", "rpe 1-10"] },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Best-guess target for a raw header, with a confidence score. */
export function guessField(header: string): { target: FieldTarget; confidence: number } {
  const h = norm(header);
  if (!h) return { target: "ignore", confidence: 0 };
  for (const f of CORE_FIELDS) {
    if (f.aliases.some((a) => norm(a) === h)) return { target: f.id, confidence: 1 };
  }
  for (const f of CORE_FIELDS) {
    if (f.aliases.some((a) => h.includes(norm(a)) || norm(a).includes(h))) return { target: f.id, confidence: 0.75 };
  }
  return { target: "custom", confidence: 0 };
}

export interface ColumnMapping {
  header: string;
  target: FieldTarget;
  confidence: number;
  /** Key used when the column is stored as a custom KPI. */
  customKey?: string;
}

export const customKeyFor = (header: string) => norm(header).replace(/\s+/g, "_") || "kpi";

export function buildMapping(headers: string[]): ColumnMapping[] {
  const used = new Set<string>();
  return headers.map((header) => {
    const g = guessField(header);
    // one core field can only be filled by one column
    let target = g.target;
    if (target !== "custom" && target !== "ignore" && used.has(target)) target = "custom";
    if (target !== "custom" && target !== "ignore") used.add(target);
    return {
      header,
      target,
      confidence: g.confidence,
      ...(target === "custom" ? { customKey: customKeyFor(header) } : {}),
    };
  });
}

/* ---------- parsing ---------- */

export interface ParsedFile {
  fileName: string;
  headers: string[];
  rows: Record<string, unknown>[];
}

/** Read a real CSV / XLSX / XLS file in the browser. */
export async function parseGpsFile(file: File): Promise<ParsedFile> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("The file has no readable sheet.");
  const sheet = wb.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false })[0] ?? [];
  const headers = headerRow.map((h) => String(h ?? "").trim()).filter(Boolean);
  if (!headers.length) throw new Error("No header row found — the first row must contain the column names.");
  return { fileName: file.name, headers, rows };
}

export const toNumber = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** Normalise whatever date format the export used into YYYY-MM-DD. */
export function toIsoDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return s.slice(0, 10);
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(s);
  if (dmy) {
    const [, d, m, y] = dmy;
    const yyyy = y!.length === 2 ? `20${y}` : y!;
    return `${yyyy}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

/* ---------- saved coach templates ---------- */

export interface SavedTemplate {
  id: string;
  name: string;
  headers: string[];
  mapping: ColumnMapping[];
  savedAt: string;
}

const TEMPLATE_KEY = "t4p.gps.templates.v1";

const signature = (headers: string[]) => headers.map((h) => norm(h)).sort().join("|");

export function loadTemplates(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(TEMPLATE_KEY) ?? "[]") as SavedTemplate[];
  } catch {
    return [];
  }
}

export function saveTemplate(name: string, headers: string[], mapping: ColumnMapping[]) {
  if (typeof window === "undefined") return;
  const id = signature(headers);
  const next = loadTemplates().filter((t) => t.id !== id);
  next.push({ id, name, headers, mapping, savedAt: new Date().toISOString() });
  window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(next));
}

export function removeTemplate(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(loadTemplates().filter((t) => t.id !== id)));
}

/** A previously saved mapping for the exact same column set, if any. */
export function findTemplate(headers: string[]): SavedTemplate | undefined {
  const id = signature(headers);
  return loadTemplates().find((t) => t.id === id);
}
