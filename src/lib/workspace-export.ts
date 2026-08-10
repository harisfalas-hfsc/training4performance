/**
 * Full data export. Everything a coach creates in T4P is his own property, so
 * he can download his whole workspace at any time — subscription or not —
 * either as separate Excel files or as one ZIP with all of them.
 */

import * as XLSX from "xlsx";
import {
  gpsHistory,
  manualTests,
  medicalEvents,
  players,
  sessionCalendar,
  team,
  fullName,
} from "@/data/performance";
import { testRecords } from "@/data/testing";
import { customDrills, customStrength } from "@/data/presets";


/* ---------- minimal store-only ZIP writer (no dependency) ---------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export function createZip(files: Array<{ name: string; content: string | Uint8Array }>): Blob {
  const enc = new TextEncoder();
  const entries: ZipEntry[] = files.map((f) => ({
    name: f.name,
    data: typeof f.content === "string" ? enc.encode(f.content) : f.content,
  }));
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const u32 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
  const u16 = (n: number) => new Uint8Array([n & 0xff, (n >>> 8) & 0xff]);
  const join = (parts: Uint8Array[]) => {
    const total = parts.reduce((a, p) => a + p.length, 0);
    const out = new Uint8Array(total);
    let i = 0;
    for (const p of parts) {
      out.set(p, i);
      i += p.length;
    }
    return out;
  };

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const crc = crc32(entry.data);
    const local = join([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(entry.data.length),
      u32(entry.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      entry.data,
    ]);
    chunks.push(local);
    central.push(
      join([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(entry.data.length),
        u32(entry.data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBytes,
      ]),
    );
    offset += local.length;
  }

  const centralBytes = join(central);
  const end = join([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralBytes.length),
    u32(offset),
    u16(0),
  ]);
  const blobParts: BlobPart[] = [...chunks, centralBytes, end].map(
    (chunk) => new Uint8Array(chunk).buffer as ArrayBuffer,
  );
  return new Blob(blobParts, { type: "application/zip" });
}

/* ---------- CSV helpers ---------- */

const cell = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return [headers.join(","), ...rows.map((r) => headers.map((h) => cell(r[h])).join(","))].join("\n");
}

/* ---------- datasets ---------- */

type Row = Record<string, unknown>;

export interface ExportSheet {
  /** File-safe key, e.g. "players". */
  key: string;
  /** What the coach sees in the UI. */
  label: string;
  description: string;
  rows: Row[];
}

const flat = (value: unknown) =>
  value === null || value === undefined
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : (value as string | number | boolean);

const flatten = (rows: Row[]): Row[] =>
  rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, flat(v)])));

/** Every dataset a coach owns, one dataset = one Excel file. */
export function workspaceSheets(): ExportSheet[] {
  const nameOf = (id: string) => {
    const p = players.find((x) => x.id === id);
    return p ? fullName(p) : id;
  };

  const gpsRows = gpsHistory.map((g) => {
    const { extra, ...rest } = g as typeof g & { extra?: Record<string, number> };
    return { player: nameOf(g.playerId), ...rest, ...(extra ?? {}) };
  });

  const calendarRows = sessionCalendar.map((s) => ({
    date: s.date,
    title: s.title,
    type: s.type ?? "",
    label: s.label,
    group: s.group ?? "",
    status: s.status ?? "",
    durationMin: s.durationMin,
    plannedRpe: s.plannedRpe,
    actualRpe: s.actualRpe ?? "",
    objective: s.objective,
    blocks: (s.blockNames ?? []).join(" | "),
    drills: (s.drills ?? []).join(" | "),
  }));

  const designRows = sessionCalendar.flatMap((s) =>
    (s.plan ?? []).map((p, i) => ({
      date: s.date,
      session: s.title,
      order: i + 1,
      block: p.block ?? "",
      drill: p.drill,
      purpose: p.purpose,
      location: p.location ?? "",
      durationMin: p.durationMin,
      plannedRpe: p.rpe,
      actualRpe: p.actualRpe ?? "",
      load: p.durationMin * p.rpe,
      sets: p.strength?.sets ?? "",
      reps: p.strength?.reps ?? "",
      kg: p.strength?.weightKg ?? "",
      intensityPct: p.strength?.intensityPct ?? "",
      tempo: p.strength?.tempo ?? "",
      restSec: p.strength?.restSec ?? "",
      hasDrawing: p.drawing ? "yes" : "",
      notes: p.notes ?? "",
    })),
  );

  const libraryRows = [
    ...customDrills().map((d) => ({ kind: "drill", name: d.name, purpose: d.purpose, rpe: d.rpe, minutes: d.minutes })),
    ...customStrength().map((e) => ({ kind: "strength", name: e.name, purpose: (e as { pattern?: string }).pattern ?? "" })),
  ];

  return [
    {
      key: "team",
      label: "Team",
      description: "Club, team, season and staff details.",
      rows: flatten([team as unknown as Row]),
    },
    {
      key: "players",
      label: "Squad",
      description: "Every player with anthropometrics, position and availability.",
      rows: flatten(players as unknown as Row[]),
    },
    {
      key: "gps",
      label: "GPS data",
      description: "Every imported GPS row, including your own club KPIs.",
      rows: flatten(gpsRows as unknown as Row[]),
    },
    {
      key: "calendar",
      label: "Training calendar",
      description: "All planned and completed sessions, day by day.",
      rows: flatten(calendarRows),
    },
    {
      key: "training-designs",
      label: "Training designs",
      description: "Every block and drill you designed, with duration, RPE and gym prescriptions.",
      rows: flatten(designRows),
    },
    {
      key: "drill-library",
      label: "My drill library",
      description: "Drills and strength exercises you added yourself.",
      rows: flatten(libraryRows),
    },
    {
      key: "tests",
      label: "Fitness tests",
      description: "All athletic and fitness test results.",
      rows: flatten(testRecords.map((t) => ({ player: nameOf(t.playerId), ...t })) as unknown as Row[]),
    },
    {
      key: "manual-tests",
      label: "Manual entries",
      description: "Manual test / wellness entries.",
      rows: flatten(manualTests as unknown as Row[]),
    },
    {
      key: "medical",
      label: "Medical",
      description: "Injuries, illnesses and return-to-play records.",
      rows: flatten(medicalEvents.map((m) => ({ player: nameOf(m.playerId), ...m })) as unknown as Row[]),
    },
  ];
}

/* ---------- Excel ---------- */

function sheetToXlsx(sheet: ExportSheet): Uint8Array {
  const ws = XLSX.utils.json_to_sheet(sheet.rows.length ? sheet.rows : [{ note: "No records yet" }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.label.slice(0, 31));
  return new Uint8Array(XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer);
}

function fileSlug() {
  return (
    (team.club || "t4p").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "t4p"
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Download one dataset as its own Excel file. */
export function downloadSheetXlsx(key: string) {
  const sheet = workspaceSheets().find((s) => s.key === key);
  if (!sheet) return false;
  const bytes = sheetToXlsx(sheet);
  saveBlob(new Blob([bytes.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileSlug()}-${sheet.key}.xlsx`);
  return true;
}

/* ---------- the full export ---------- */

export function workspaceExportFiles(): Array<{ name: string; content: string | Uint8Array }> {
  const sheets = workspaceSheets();
  const date = new Date().toISOString().slice(0, 10);

  return [
    {
      name: "workspace.json",
      content: JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          platform: "T4P — Training 4 Performance",
          team,
          players,
          sessions: sessionCalendar,
          gpsHistory,
          manualTests,
          medicalEvents,
          testRecords,
        },
        null,
        2,
      ),
    },
    ...sheets.map((s) => ({ name: `excel/${s.key}.xlsx`, content: sheetToXlsx(s) })),
    ...sheets.map((s) => ({ name: `csv/${s.key}.csv`, content: toCsv(s.rows) })),
    {
      name: "README.txt",
      content: [
        "T4P — Training 4 Performance data export",
        "",
        `Club: ${team.club || "—"}`,
        `Team: ${team.name || "—"}`,
        `Season: ${team.season || "—"}`,
        `Exported: ${date}`,
        "",
        "workspace.json — complete backup, can be re-imported into T4P.",
        "excel/        — one Excel file per dataset:",
        ...sheets.map((s) => `  ${s.key}.xlsx — ${s.description}`),
        "csv/          — the same datasets as plain CSV.",
        "",
        "This data belongs to you. Keep it safe.",
      ].join("\n"),
    },
  ];
}

export function downloadWorkspaceZip() {
  const blob = createZip(workspaceExportFiles());
  saveBlob(blob, `${fileSlug()}-t4p-export-${new Date().toISOString().slice(0, 10)}.zip`);
}

