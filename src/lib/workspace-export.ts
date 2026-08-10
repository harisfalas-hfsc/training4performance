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

/* ---------- the export ---------- */

export function workspaceExportFiles() {
  const nameOf = (id: string) => {
    const p = players.find((x) => x.id === id);
    return p ? fullName(p) : id;
  };

  const gpsRows = gpsHistory.map((g) => {
    const { extra, ...rest } = g as typeof g & { extra?: Record<string, number> };
    return { player: nameOf(g.playerId), ...rest, ...(extra ?? {}) };
  });

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
    { name: "players.csv", content: toCsv(players as unknown as Array<Record<string, unknown>>) },
    { name: "gps.csv", content: toCsv(gpsRows as unknown as Array<Record<string, unknown>>) },
    {
      name: "sessions.csv",
      content: toCsv(
        sessionCalendar.map((s) => ({ ...s, plan: JSON.stringify(s.plan ?? []) })) as unknown as Array<
          Record<string, unknown>
        >,
      ),
    },
    {
      name: "tests.csv",
      content: toCsv(
        testRecords.map((t) => ({ ...t, player: nameOf(t.playerId) })) as unknown as Array<Record<string, unknown>>,
      ),
    },
    {
      name: "manual-tests.csv",
      content: toCsv(manualTests as unknown as Array<Record<string, unknown>>),
    },
    {
      name: "medical.csv",
      content: toCsv(
        medicalEvents.map((m) => ({ ...m, player: nameOf(m.playerId) })) as unknown as Array<Record<string, unknown>>,
      ),
    },
    {
      name: "README.txt",
      content: [
        "T4P — Training 4 Performance data export",
        "",
        `Club: ${team.club || "—"}`,
        `Team: ${team.name || "—"}`,
        `Season: ${team.season || "—"}`,
        `Exported: ${new Date().toLocaleString()}`,
        "",
        "workspace.json  — complete backup, can be re-imported into T4P.",
        "players.csv     — squad list with anthropometrics and availability.",
        "gps.csv         — every GPS row, including your own club KPIs.",
        "sessions.csv    — planned and completed training sessions with blocks.",
        "tests.csv       — all fitness / athletic test results.",
        "manual-tests.csv, medical.csv — manual entries and medical events.",
        "",
        "This data belongs to you. Keep the ZIP safe.",
      ].join("\n"),
    },
  ];
}

export function downloadWorkspaceZip() {
  const blob = createZip(workspaceExportFiles());
  const slug = (team.club || "t4p").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug || "t4p"}-t4p-export-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
