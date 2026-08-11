import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileWarning, HelpCircle, Save, Upload, UserPlus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import {
  addPlayer,
  fullName,
  getPlayer,
  matchName,
  players,
  sessionBlocks,
  addSession,
  sessionCalendar,
  sessionStatus,
  today,
  updateSession,
  upsertGps,
  upsertGpsBlock,
  useDataVersion,
} from "@/data/performance";
import { applyAutoFindings, detectSpeedPbs, findingPlayerName } from "@/data/testing";
import { ACCEPTED_EXTENSIONS, isAcceptedFile } from "@/data/gps-upload";
import {
  buildMapping,
  CORE_FIELDS,
  customKeyFor,
  findTemplate,
  loadTemplates,
  parseGpsFile,
  removeTemplate,
  saveTemplate,
  toIsoDate,
  toNumber,
  type ColumnMapping,
  type CoreField,
  type FieldTarget,
  type ParsedFile,
} from "@/data/gps-template";
import { T4P_TEMPLATE_COLUMNS, templateCsv } from "@/data/logbook";
import { useRole } from "@/lib/roles";
import { T4P } from "@/components/brand-text";

export const Route = createFileRoute("/_authenticated/gps")({
  head: () => ({
    meta: [
      { title: "GPS Upload — Your Own Template & KPIs — T4P" },
      {
        name: "description",
        content:
          "Upload any GPS export: T4P reads your real columns, maps them to training-load metrics, keeps your club-specific KPIs and matches every row to a player in your squad.",
      },
      { property: "og:title", content: "GPS Upload — Your Own Template & KPIs — T4P" },
      { property: "og:description", content: "Every provider is different. T4P learns your export once and reuses it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session?: string } =>
    typeof search["session"] === "string" ? { session: search["session"] as string } : {},
  component: GpsPage,
});

interface Row {
  raw: string;
  matchedId: string | null;
  confidence: number;
  date: string | null;
  segment: string | null;
  core: Partial<Record<CoreField, number>>;
  extra: Record<string, number>;
  extraLabels: Record<string, string>;
}

/** Metrics that add up when several segments of one training are combined. */
const SUM_FIELDS: CoreField[] = ["minutes", "distance", "hsr", "sprint", "accel", "decel", "jumps", "sprintEvents", "energy"];
/** Metrics where the highest / representative value of the day wins. */
const MAX_FIELDS: CoreField[] = ["maxSpeed", "avgSpeed", "rpe"];

const SEGMENT_HINT = /period|segment|drill|block|phase|part|activity|split|section/i;

/** Find a column that looks like it cuts the training into parts. */
function detectSegmentColumn(parsed: ParsedFile, mapping: ColumnMapping[]): string | null {
  const candidates = mapping.filter((m) => m.target === "custom" || m.target === "ignore").map((m) => m.header);
  const hinted = candidates.find((h) => SEGMENT_HINT.test(h));
  const check = (h: string) => {
    const vals = new Set(parsed.rows.map((r) => String(r[h] ?? "").trim()).filter(Boolean));
    const numeric = [...vals].every((v) => /^-?\d+(\.\d+)?$/.test(v));
    return vals.size > 1 && vals.size <= 12 && !numeric ? h : null;
  };
  if (hinted && check(hinted)) return hinted;
  return null;
}

function buildRows(parsed: ParsedFile, mapping: ColumnMapping[], segmentCol: string | null): Row[] {
  const nameCol = mapping.find((m) => m.target === "name")?.header;
  return parsed.rows
    .map((r) => {
      const raw = String(nameCol ? (r[nameCol] ?? "") : "").trim();
      if (!raw) return null;
      const core: Partial<Record<CoreField, number>> = {};
      const extra: Record<string, number> = {};
      const extraLabels: Record<string, string> = {};
      let date: string | null = null;
      for (const m of mapping) {
        const cell = r[m.header];
        if (m.header === segmentCol) continue;
        if (m.target === "ignore" || m.target === "name") continue;
        if (m.target === "date") {
          date = toIsoDate(cell);
          continue;
        }
        if (m.target === "custom") {
          const key = m.customKey ?? customKeyFor(m.header);
          extra[key] = toNumber(cell);
          extraLabels[key] = m.header;
          continue;
        }
        core[m.target] = toNumber(cell);
      }
      const match = matchName(raw);
      const segment = segmentCol ? String(r[segmentCol] ?? "").trim() || null : null;
      return { raw, matchedId: match.id, confidence: match.confidence, date, segment, core, extra, extraLabels };
    })
    .filter((r): r is Row => r !== null);
}

/** One athlete = one imported day. Segment rows are merged into that day. */
interface AthleteRow extends Row {
  parts: Array<{
    segment: string;
    block: string;
    distance: number;
    minutes: number;
    core: Partial<Record<CoreField, number>>;
    extra: Record<string, number>;
    extraLabels: Record<string, string>;
  }>;
}

function partOf(r: Row, seg: string, segmentMap: Record<string, string>): AthleteRow["parts"][number] {
  return {
    segment: seg,
    block: segmentMap[seg] ?? seg,
    distance: r.core.distance ?? 0,
    minutes: r.core.minutes ?? 0,
    core: { ...r.core },
    extra: { ...r.extra },
    extraLabels: { ...r.extraLabels },
  };
}

function groupRows(rows: Row[], combine: boolean, segmentMap: Record<string, string>): AthleteRow[] {
  if (!combine) return rows.map((r) => ({ ...r, parts: [] }));
  const out = new Map<string, AthleteRow>();
  for (const r of rows) {
    const seg = r.segment ?? "";
    if (seg && segmentMap[seg] === "ignore") continue;
    const key = r.raw.toLowerCase();
    const existing = out.get(key);
    if (!existing) {
      out.set(key, {
        ...r,
        core: { ...r.core },
        extra: { ...r.extra },
        extraLabels: { ...r.extraLabels },
        parts: seg ? [partOf(r, seg, segmentMap)] : [],
      });
      continue;
    }
    for (const f of SUM_FIELDS) {
      const v = r.core[f];
      if (v === undefined) continue;
      existing.core[f] = (existing.core[f] ?? 0) + v;
    }
    for (const f of MAX_FIELDS) {
      const v = r.core[f];
      if (v === undefined) continue;
      existing.core[f] = Math.max(existing.core[f] ?? 0, v);
    }
    for (const [k, v] of Object.entries(r.extra)) existing.extra[k] = (existing.extra[k] ?? 0) + v;
    Object.assign(existing.extraLabels, r.extraLabels);
    if (seg) existing.parts.push(partOf(r, seg, segmentMap));
  }
  return [...out.values()];
}

/** Sentinel: no calendar entry yet — create an empty session for the file's date on import. */
const AUTO_SESSION = "__auto__";

function GpsPage() {

  useDataVersion();
  const { can } = useRole();
  const inputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [segmentCol, setSegmentCol] = useState<string | null>(null);
  const [scope, setScope] = useState<"whole" | "segments">("whole");
  const [segmentMap, setSegmentMap] = useState<Record<string, string>>({});
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState(() => loadTemplates());
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imported, setImported] = useState<{ count: number; date: string; kpis: number; pbs: string[] } | null>(null);

  const sessions = useMemo(() => [...sessionCalendar].sort((a, b) => b.date.localeCompare(a.date)), []);
  const search = Route.useSearch();
  const [sessionId, setSessionId] = useState<string>(
    () =>
      (search.session && sessionCalendar.some((s) => s.id === search.session) ? search.session : undefined) ??
      sessionCalendar.find((s) => s.date === today)?.id ??
      AUTO_SESSION,
  );
  const [markCompleted, setMarkCompleted] = useState(true);
  const session = sessionCalendar.find((s) => s.id === sessionId);
  const blocks = session ? sessionBlocks(session) : [];
  /** Date of the file itself (row date column), used when we create the session automatically. */
  const fileDate = useMemo(() => rows.map((r) => r.date).find((d): d is string => !!d) ?? today, [rows]);
  const autoMode = sessionId === AUTO_SESSION || !session;
  const targetDate = session?.date ?? fileDate;


  const segmentValues = useMemo(
    () => [...new Set(rows.map((r) => r.segment).filter((s): s is string => !!s))],
    [rows],
  );
  const combine = scope === "segments" && segmentValues.length > 0;
  const athleteRows = useMemo(() => groupRows(rows, combine, segmentMap), [rows, combine, segmentMap]);

  const matched = athleteRows.filter((r) => r.matchedId && r.confidence >= 0.95).length;
  const needsConfirm = athleteRows.filter((r) => r.matchedId && r.confidence < 0.95).length;
  const unmatched = athleteRows.filter((r) => !r.matchedId).length;
  const customCols = mapping.filter((m) => m.target === "custom" && m.header !== segmentCol);
  const missingCore = ["name", "distance"].filter((f) => !mapping.some((m) => m.target === f));

  const handleFile = async (file: File) => {
    if (!isAcceptedFile(file.name)) {
      setFileError(`Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      return;
    }
    setFileError(null);
    setImported(null);
    setUploading(true);
    setProgress(15);
    try {
      const p = await parseGpsFile(file);
      setProgress(70);
      const saved = findTemplate(p.headers);
      const map = saved ? saved.mapping : buildMapping(p.headers);
      const seg = detectSegmentColumn(p, map);
      const built = buildRows(p, map, seg);
      const segVals = [...new Set(built.map((r) => r.segment).filter((s): s is string => !!s))];
      setParsed(p);
      setMapping(map);
      setSegmentCol(seg);
      setRows(built);
      setScope(seg && segVals.length > 1 ? "segments" : "whole");
      setSegmentMap(Object.fromEntries(segVals.map((v) => [v, v])));
      setTemplateName(saved?.name ?? file.name.replace(/\.[^.]+$/, ""));
      setProgress(100);
      toast.success(
        saved ? `Recognised your saved template “${saved.name}”` : `Read ${p.rows.length} rows and ${p.headers.length} columns`,
        {
          description: seg
            ? `Looks like the file is split into ${segVals.length} parts — confirm how it should be imported.`
            : "Check the column mapping below, then import.",
        },
      );
    } catch (err) {
      setParsed(null);
      setRows([]);
      setMapping([]);
      setSegmentCol(null);
      setFileError(err instanceof Error ? err.message : "Could not read this file.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const setTarget = (header: string, target: FieldTarget) => {
    const next = mapping.map((m) =>
      m.header === header
        ? ({ ...m, target, confidence: 1, ...(target === "custom" ? { customKey: customKeyFor(header) } : {}) } as ColumnMapping)
        : // a core field can only be filled once — release the previous owner
          target !== "custom" && target !== "ignore" && m.target === target
          ? ({ ...m, target: "custom", customKey: customKeyFor(m.header) } as ColumnMapping)
          : m,
    );
    setMapping(next);
    if (parsed) setRows(buildRows(parsed, next, segmentCol));
  };

  /** Change which column cuts the training into parts (or turn that off). */
  const chooseSegmentColumn = (header: string) => {
    const col = header || null;
    setSegmentCol(col);
    if (!parsed) return;
    const built = buildRows(parsed, mapping, col);
    const segVals = [...new Set(built.map((r) => r.segment).filter((s): s is string => !!s))];
    setRows(built);
    setSegmentMap(Object.fromEntries(segVals.map((v) => [v, v])));
    if (!col) setScope("whole");
  };

  const confirm = (raw: string, accept: boolean) =>
    setRows((prev) =>
      prev.map((r) =>
        r.raw.toLowerCase() === raw.toLowerCase()
          ? accept
            ? { ...r, confidence: 1 }
            : { ...r, matchedId: null, confidence: 0 }
          : r,
      ),
    );

  const assign = (raw: string, playerId: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.raw.toLowerCase() === raw.toLowerCase() ? { ...r, matchedId: playerId || null, confidence: playerId ? 1 : 0 } : r,
      ),
    );

  /** Create squad members straight from the file, so a coach never types the names twice. */
  const createMissingPlayers = () => {
    const missing = athleteRows.filter((r) => !r.matchedId);
    if (!missing.length) return;
    const created: Record<string, string> = {};
    for (const r of missing) {
      const parts = r.raw.trim().split(/[\s,]+/).filter(Boolean);
      const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
      const player = addPlayer({ firstName: parts[0] ?? r.raw, lastName: last, position: "CM" });
      if (player) created[r.raw.toLowerCase()] = player.id;
    }
    const count = Object.keys(created).length;
    if (!count) {
      toast.error("A team subscription is needed to add players.");
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        !r.matchedId && created[r.raw.toLowerCase()]
          ? { ...r, matchedId: created[r.raw.toLowerCase()]!, confidence: 1 }
          : r,
      ),
    );
    toast.success(`${count} player(s) added to your squad from the file`);
  };

  const persistTemplate = () => {
    if (!parsed) return;
    saveTemplate(templateName || parsed.fileName, parsed.headers, mapping);
    setTemplates(loadTemplates());
    toast.success("Template saved", { description: "Next upload with the same columns is mapped automatically." });
  };

  const runImport = () => {
    const ok = athleteRows.filter((r) => r.matchedId && r.confidence >= 0.95);
    if (!ok.length) return;
    // No calendar entry for this day: create an empty session so the load has an anchor.
    // It can be opened and designed later in the Training Designer.
    let target = session;
    if (!target) {
      const existing = sessionCalendar.find((s) => s.date === fileDate);
      target =
        existing ??
        addSession({
          date: fileDate,
          label: "Unplanned",
          title: "Unplanned activity",
          durationMin: Math.round(ok.map((r) => r.core.minutes ?? 0).sort((a, b) => a - b)[Math.floor(ok.length / 2)] ?? 0),
          objective: "Created automatically from a GPS upload — open it to add the blocks you actually ran.",
          plannedRpe: 0,
          drills: [],
          type: "TRAINING",
        });
      if (!target) {
        toast.error("Could not create a session for this file");
        return;
      }
      setSessionId(target.id);
    }
    const sessionRef = target;
    for (const r of ok) {
      const c = r.core;
      const minutes = c.minutes ?? sessionRef.durationMin;

      const extra = { ...r.extra };
      const extraLabels = { ...r.extraLabels };
      // keep the per-block breakdown alongside the day total
      for (const p of r.parts) {
        const key = customKeyFor(`${p.block} distance`);
        extra[key] = (extra[key] ?? 0) + p.distance;
        extraLabels[key] = `${p.block} · distance`;
        if (p.minutes) {
          const mk = customKeyFor(`${p.block} minutes`);
          extra[mk] = (extra[mk] ?? 0) + p.minutes;
          extraLabels[mk] = `${p.block} · minutes`;
        }
      }
      const day = r.date ?? sessionRef.date;
      // one GPS record per block of the training, so the same block can be compared across days
      for (const p of r.parts) {
        const c2 = p.core;
        upsertGpsBlock({
          date: day,
          playerId: r.matchedId!,
          block: p.block,
          minutes: c2.minutes ?? 0,
          distance: c2.distance ?? 0,
          hsr: c2.hsr ?? 0,
          sprint: c2.sprint ?? 0,
          maxSpeed: c2.maxSpeed ?? 0,
          accel: c2.accel ?? 0,
          decel: c2.decel ?? 0,
          ...(c2.jumps !== undefined ? { jumps: c2.jumps } : {}),
          ...(c2.energy !== undefined ? { energy: c2.energy } : {}),
          ...(c2.avgSpeed !== undefined ? { avgSpeed: c2.avgSpeed } : {}),
          ...(c2.sprintEvents !== undefined ? { sprintEvents: c2.sprintEvents } : {}),
          ...(Object.keys(p.extra).length ? { extra: p.extra, extraLabels: p.extraLabels } : {}),
        });
      }
      upsertGps({
        date: day,
        playerId: r.matchedId!,
        minutes,
        distance: c.distance ?? 0,
        hsr: c.hsr ?? 0,
        sprint: c.sprint ?? 0,
        maxSpeed: c.maxSpeed ?? 0,
        accel: c.accel ?? 0,
        decel: c.decel ?? 0,
        rpe: c.rpe ?? sessionRef.actualRpe ?? sessionRef.plannedRpe,
        status: "Full Training",
        category: sessionRef.type ?? "TRAINING",
        ...(c.jumps !== undefined ? { jumps: c.jumps } : {}),
        ...(c.energy !== undefined ? { energy: c.energy } : {}),
        ...(c.avgSpeed !== undefined ? { avgSpeed: c.avgSpeed } : {}),
        ...(c.sprintEvents !== undefined ? { sprintEvents: c.sprintEvents } : {}),
        ...(Object.keys(extra).length ? { extra, extraLabels } : {}),
      });
    }
    const pbs = detectSpeedPbs().filter((f) => f.date === sessionRef.date);
    applyAutoFindings(pbs);
    if (markCompleted) {
      updateSession(sessionRef.id, { status: "completed", actualRpe: sessionRef.actualRpe ?? sessionRef.plannedRpe });
    }
    setImported({
      count: ok.length,
      date: sessionRef.date,
      kpis: customCols.length,
      pbs: pbs.map((f) => `${findingPlayerName(f.playerId)} — ${f.text}`),
    });
    toast.success(`Imported ${ok.length} athlete rows`);
  };


  const coreCols = mapping.filter((m) => m.target !== "custom" && m.target !== "ignore" && m.target !== "name");

  return (
    <AppShell
      title="GPS Import"
      subtitle={
        session
          ? `${session.date} · ${session.label} — ${session.title}${parsed ? ` · file: ${parsed.fileName}` : ""}`
          : `No calendar entry — an empty session will be created for ${targetDate}${parsed ? ` · file: ${parsed.fileName}` : ""}`
      }
      actions={
        <button
          onClick={runImport}
          disabled={needsConfirm > 0 || uploading || !matched || !can("importGps")}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Upload className="size-4" /> Import {matched} rows
        </button>
      }
    >
      <section className="panel mb-4 p-4">
        <SectionTitle
          title="Associate this file with a training"
          hint="GPS data is always written into a session — if there is no entry for that day, one is created automatically and you can design it later"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="field sm:col-span-2">
            <span className="field-label">Training session</span>
            <select className="control" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              <option value={AUTO_SESSION}>No calendar entry — create an empty session for {targetDate}</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.date} · {s.label} — {s.title} ({sessionStatus(s)})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={markCompleted}
              onChange={(e) => setMarkCompleted(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span>Mark the session completed after import</span>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {autoMode
            ? `No training was designed for ${targetDate} — T4P creates an empty "Unplanned activity" session, stores the file in it and counts the load in ACWR. Open it later in the Training Designer to add the blocks you actually ran.`
            : session?.plan?.length
              ? `This session has ${session.plan.length} planned block(s) — totals are split across them automatically.`
              : "This session has no planned blocks — the file is stored as one whole-session record."}{" "}
          If the file has its own date column, that date is used per row.
        </p>
      </section>



      <section className="panel p-4">
        <SectionTitle
          title="Upload your own GPS export"
          hint={<>Any provider, any columns — <T4P /> reads the real header row of your file</>}
        />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-2 px-4 py-8 text-center"
        >
          <Upload className="size-6 text-primary" />
          <p className="mt-2 text-sm font-semibold">Drop your GPS export here or click to browse</p>
          <p className="text-xs text-muted-foreground">
            Supported: {ACCEPTED_EXTENSIONS.join(" · ")} — Catapult, STATSports, GPEXE, Polar or your own layout
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>

        {fileError && (
          <p className="mt-3 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
            <FileWarning className="size-4" /> {fileError}
          </p>
        )}

        {(uploading || progress > 0) && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{uploading ? "Reading the file…" : "File read"}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {templates.length > 0 && (
          <div className="mt-4 rounded-md border border-border p-3">
            <p className="eyebrow">Your saved templates</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {templates.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {t.name}{" "}
                    <span className="text-xs text-muted-foreground">· {t.headers.length} columns</span>
                  </span>
                  <button
                    className="text-xs text-destructive"
                    onClick={() => {
                      removeTemplate(t.id);
                      setTemplates(loadTemplates());
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {parsed && (
        <section className="mt-6 panel p-4">
          <SectionTitle
            title="Column mapping"
            hint={<>Tell <T4P /> once what each of your columns means. Anything left as “Club KPI” is stored under its own name and stays available in analytics, alerts and reports.</>}
            right={
              <span className="flex flex-wrap items-center gap-2">
                <input
                  className="control h-9 w-44"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                />
                <button
                  onClick={persistTemplate}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Save className="size-4" /> Save template
                </button>
              </span>
            }
          />
          {missingCore.length > 0 && (
            <p className="mb-3 rounded-md border border-warning/40 bg-warning/10 p-2.5 text-sm text-warning">
              Still unmapped: {missingCore.join(", ")}. A player-name column is mandatory; total distance drives load and ACWR.
            </p>
          )}
          <div className="scroll-pane overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Your column</th>
                  <th className="px-2 py-2 font-medium">First value</th>
                  <th className="px-2 py-2 font-medium">Maps to</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((m) => (
                  <tr key={m.header} className="border-b border-border/50 last:border-0">
                    <td className="px-2 py-1.5 font-mono text-xs">{m.header}</td>
                    <td className="px-2 py-1.5 text-xs text-muted-foreground">
                      {String(parsed.rows[0]?.[m.header] ?? "—")}
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className="control h-8"
                        value={m.target}
                        onChange={(e) => setTarget(m.header, e.target.value as FieldTarget)}
                      >
                        {CORE_FIELDS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                            {f.unit ? ` (${f.unit})` : ""}
                          </option>
                        ))}
                        <option value="custom">Club KPI — keep as “{m.header}”</option>
                        <option value="ignore">Ignore this column</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {coreCols.length} core metric(s) mapped · {customCols.length} club KPI(s) kept · {parsed.rows.length} rows read.
          </p>
        </section>
      )}

      {parsed && (
        <section className="mt-6 panel p-4">
          <SectionTitle
            title="Is this the whole training or separate parts?"
            hint={<>Confirm once — <T4P /> then either stores the file as one session total, or merges the parts and keeps the per-block breakdown.</>}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setScope("whole")}
              className={`rounded-md border p-3 text-left ${scope === "whole" ? "border-primary bg-primary/10" : "border-border bg-surface-2"}`}
            >
              <p className="text-sm font-semibold">Entire training</p>
              <p className="text-xs text-muted-foreground">One row per athlete = his complete session.</p>
            </button>
            <button
              type="button"
              onClick={() => setScope("segments")}
              disabled={segmentValues.length === 0}
              className={`rounded-md border p-3 text-left disabled:opacity-50 ${scope === "segments" ? "border-primary bg-primary/10" : "border-border bg-surface-2"}`}
            >
              <p className="text-sm font-semibold">Separate GPS segments</p>
              <p className="text-xs text-muted-foreground">
                {segmentValues.length
                  ? `${segmentValues.length} parts found — match them to the session blocks.`
                  : "No part/period column detected in this file."}
              </p>
            </button>
          </div>

          <label className="field mt-3 max-w-sm">
            <span className="field-label">Column that splits the training</span>
            <select className="control" value={segmentCol ?? ""} onChange={(e) => chooseSegmentColumn(e.target.value)}>
              <option value="">None — every row is a full session</option>
              {parsed.headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          {combine && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {segmentValues.map((v) => (
                <label key={v} className="field">
                  <span className="field-label">“{v}” belongs to</span>
                  <select
                    className="control"
                    value={segmentMap[v] ?? v}
                    onChange={(e) => setSegmentMap((prev) => ({ ...prev, [v]: e.target.value }))}
                  >
                    {blocks.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value={v}>Keep as “{v}”</option>
                    <option value="ignore">Do not import this part</option>
                  </select>
                </label>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {combine
              ? "Distances, HSR, sprints, accelerations and minutes are added up per athlete; max speed takes the highest value. The per-block distance and minutes are kept as their own KPIs for reports."
              : "Each row is imported as one complete session for that athlete."}
          </p>
        </section>
      )}



      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Rows in file" value={rows.length} />
        <MetricCard label="Matched" value={matched} tone="good" />
        <MetricCard label="Needs confirmation" value={needsConfirm} tone={needsConfirm ? "warn" : "good"} />
        <MetricCard
          label="Unmatched"
          value={unmatched}
          tone={unmatched ? "bad" : "good"}
          hint="Create them from the file in one click, or rename them so future files match automatically"
        />
      </section>

      {imported && (
        <div className="mt-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">
          <p>
            Imported {imported.count} athlete row(s) into the session on {imported.date}, including {imported.kpis} club-specific
            KPI(s). Load, ACWR, alerts, logbook and reports were updated automatically.
          </p>
          {imported.pbs.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {imported.pbs.map((t, i) => (
                <li key={i}>· {t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <section className="mt-6 panel p-4">
          <SectionTitle
            title="Player matching"
            right={
              unmatched ? (
                <button
                  type="button"
                  onClick={createMissingPlayers}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <UserPlus className="size-3.5" /> Create {unmatched} missing player(s)
                </button>
              ) : undefined
            }
            hint={
              combine
                ? "One line per athlete — the parts of the training are already combined into his session total."
                : "Names must exist in your squad. Fix a mismatch here, or rename the player in his profile so future files match automatically."
            }
          />
          <div className="scroll-pane overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Name in file</th>
                  <th>Match</th>
                  {combine ? <th className="text-right">Parts</th> : null}
                  <th className="text-right">Distance</th>
                  <th className="text-right">HSR</th>
                  <th className="text-right">Max spd</th>
                  <th className="text-right">Club KPIs</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {athleteRows.map((r, i) => {
                  const p = r.matchedId ? getPlayer(r.matchedId) : null;
                  const certain = r.confidence >= 0.95;
                  return (
                    <tr key={`${r.raw}-${i}`} className="border-b border-border/60">
                      <td className="py-2 font-mono text-xs">{r.raw}</td>
                      <td>
                        {p && certain ? (
                          <span className="inline-flex items-center gap-1.5 text-success">
                            <CheckCircle2 className="size-4" /> {fullName(p)}
                          </span>
                        ) : p ? (
                          <span className="inline-flex items-center gap-1.5 text-warning">
                            <HelpCircle className="size-4" /> {fullName(p)}?
                          </span>
                        ) : (
                          <select
                            onChange={(e) => assign(r.raw, e.target.value)}
                            defaultValue=""
                            className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs"
                          >
                            <option value="">Unmatched — select player</option>
                            {players.map((pl) => (
                              <option key={pl.id} value={pl.id}>
                                {fullName(pl)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {combine ? (
                        <td className="text-right text-xs text-muted-foreground">
                          {r.parts.length ? r.parts.map((x) => x.block).join(" + ") : "—"}
                        </td>
                      ) : null}
                      <td className="text-right tabular-nums">{(r.core.distance ?? 0).toLocaleString()}</td>
                      <td className="text-right tabular-nums">{r.core.hsr ?? 0}</td>
                      <td className="text-right tabular-nums">{r.core.maxSpeed ?? 0}</td>
                      <td className="text-right tabular-nums">{Object.keys(r.extra).length}</td>
                      <td className="py-2 text-right">
                        {p && !certain ? (
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => confirm(r.raw, true)}
                              className="rounded-md bg-success/20 px-2 py-1 text-xs font-semibold text-success"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => confirm(r.raw, false)}
                              className="rounded-md bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive"
                            >
                              No
                            </button>
                          </span>
                        ) : !p ? (
                          <XCircle className="ml-auto size-4 text-destructive" />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-6 panel p-4">
        <SectionTitle
          title="Optional starting template"
          hint="You do not need this — your own export works. Use it only if you want a clean layout to start from."
          right={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium"
              onClick={() => {
                const url = URL.createObjectURL(new Blob([templateCsv()], { type: "text/csv;charset=utf-8" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = "T4P_GPS_IMPORT_TEMPLATE.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="size-4" /> Download template
            </button>
          }
        />
        <div className="scroll-pane overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-medium">Column</th>
                <th className="px-2 py-2 font-medium">Required</th>
                <th className="px-2 py-2 font-medium">Example</th>
                <th className="px-2 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {T4P_TEMPLATE_COLUMNS.map((c) => (
                <tr key={c.key} className="border-b border-border/50 last:border-0">
                  <td className="px-2 py-1.5 font-medium">{c.header}</td>
                  <td className="px-2 py-1.5 text-xs">
                    {c.required ? <span className="text-primary">required</span> : <span className="text-muted-foreground">optional</span>}
                  </td>
                  <td className="px-2 py-1.5 text-xs tabular-nums text-muted-foreground">{c.example || "—"}</td>
                  <td className="px-2 py-1.5 text-xs text-muted-foreground">{c.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
