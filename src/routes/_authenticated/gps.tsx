import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileWarning, HelpCircle, Save, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import {
  fullName,
  getPlayer,
  matchName,
  players,
  sessionCalendar,
  sessionStatus,
  today,
  updateSession,
  upsertGps,
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
  core: Partial<Record<CoreField, number>>;
  extra: Record<string, number>;
  extraLabels: Record<string, string>;
}

function buildRows(parsed: ParsedFile, mapping: ColumnMapping[]): Row[] {
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
      return { raw, matchedId: match.id, confidence: match.confidence, date, core, extra, extraLabels };
    })
    .filter((r): r is Row => r !== null);
}

function GpsPage() {
  useDataVersion();
  const { can } = useRole();
  const inputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
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
      sessions[0]?.id ??
      "",
  );
  const [markCompleted, setMarkCompleted] = useState(true);
  const session = sessionCalendar.find((s) => s.id === sessionId);

  const matched = rows.filter((r) => r.matchedId && r.confidence >= 0.95).length;
  const needsConfirm = rows.filter((r) => r.matchedId && r.confidence < 0.95).length;
  const unmatched = rows.filter((r) => !r.matchedId).length;
  const customCols = mapping.filter((m) => m.target === "custom");
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
      setParsed(p);
      setMapping(map);
      setRows(buildRows(p, map));
      setTemplateName(saved?.name ?? file.name.replace(/\.[^.]+$/, ""));
      setProgress(100);
      toast.success(
        saved ? `Recognised your saved template “${saved.name}”` : `Read ${p.rows.length} rows and ${p.headers.length} columns`,
        { description: saved ? "Column mapping restored — check and import." : "Check the column mapping below, then import." },
      );
    } catch (err) {
      setParsed(null);
      setRows([]);
      setMapping([]);
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
    if (parsed) setRows(buildRows(parsed, next));
  };

  const confirm = (i: number, accept: boolean) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? (accept ? { ...r, confidence: 1 } : { ...r, matchedId: null, confidence: 0 }) : r)),
    );

  const assign = (i: number, playerId: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, matchedId: playerId || null, confidence: playerId ? 1 : 0 } : r)));

  const persistTemplate = () => {
    if (!parsed) return;
    saveTemplate(templateName || parsed.fileName, parsed.headers, mapping);
    setTemplates(loadTemplates());
    toast.success("Template saved", { description: "Next upload with the same columns is mapped automatically." });
  };

  const runImport = () => {
    if (!session) return;
    const ok = rows.filter((r) => r.matchedId && r.confidence >= 0.95);
    for (const r of ok) {
      const c = r.core;
      const minutes = c.minutes ?? session.durationMin;
      upsertGps({
        date: r.date ?? session.date,
        playerId: r.matchedId!,
        minutes,
        distance: c.distance ?? 0,
        hsr: c.hsr ?? 0,
        sprint: c.sprint ?? 0,
        maxSpeed: c.maxSpeed ?? 0,
        accel: c.accel ?? 0,
        decel: c.decel ?? 0,
        rpe: c.rpe ?? session.actualRpe ?? session.plannedRpe,
        status: "Full Training",
        category: session.type ?? "TRAINING",
        ...(c.jumps !== undefined ? { jumps: c.jumps } : {}),
        ...(c.energy !== undefined ? { energy: c.energy } : {}),
        ...(c.avgSpeed !== undefined ? { avgSpeed: c.avgSpeed } : {}),
        ...(c.sprintEvents !== undefined ? { sprintEvents: c.sprintEvents } : {}),
        ...(Object.keys(r.extra).length ? { extra: r.extra, extraLabels: r.extraLabels } : {}),
      });
    }
    const pbs = detectSpeedPbs().filter((f) => f.date === session.date);
    applyAutoFindings(pbs);
    if (markCompleted) {
      updateSession(session.id, { status: "completed", actualRpe: session.actualRpe ?? session.plannedRpe });
    }
    setImported({
      count: ok.length,
      date: session.date,
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
          : "Select a training session to import into"
      }
      actions={
        <button
          onClick={runImport}
          disabled={needsConfirm > 0 || uploading || !session || !matched || !can("importGps")}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Upload className="size-4" /> Import {matched} rows
        </button>
      }
    >
      <section className="panel mb-4 p-4">
        <SectionTitle
          title="Associate this file with a training"
          hint="GPS data is always written into a specific session — that is what drives load, alerts, reports and the logbook"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="field sm:col-span-2">
            <span className="field-label">Training session</span>
            <select className="control" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              {sessions.length === 0 ? <option value="">No sessions yet — create one on the calendar</option> : null}
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
          {session?.plan?.length
            ? `This session has ${session.plan.length} planned block(s) — totals are split across them automatically.`
            : "This session has no planned blocks — the file is stored as one whole-session record."}{" "}
          If the file has its own date column, that date is used per row.
        </p>
      </section>

      <section className="panel p-4">
        <SectionTitle
          title="Upload your own GPS export"
          hint="Any provider, any columns — T4P reads the real header row of your file"
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
            hint="Tell T4P once what each of your columns means. Anything left as “Club KPI” is stored under its own name and stays available in analytics, alerts and reports."
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

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Rows in file" value={rows.length} />
        <MetricCard label="Matched" value={matched} tone="good" />
        <MetricCard label="Needs confirmation" value={needsConfirm} tone={needsConfirm ? "warn" : "good"} />
        <MetricCard
          label="Unmatched"
          value={unmatched}
          tone={unmatched ? "bad" : "good"}
          hint="Rename in the player profile or in the file — no duplicate player is ever created"
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
            hint="Names must exist in your squad. Fix a mismatch here, or rename the player in his profile so future files match automatically."
          />
          <div className="scroll-pane overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Name in file</th>
                  <th>Match</th>
                  <th className="text-right">Distance</th>
                  <th className="text-right">HSR</th>
                  <th className="text-right">Max spd</th>
                  <th className="text-right">Club KPIs</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
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
                            onChange={(e) => assign(i, e.target.value)}
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
                      <td className="text-right tabular-nums">{(r.core.distance ?? 0).toLocaleString()}</td>
                      <td className="text-right tabular-nums">{r.core.hsr ?? 0}</td>
                      <td className="text-right tabular-nums">{r.core.maxSpeed ?? 0}</td>
                      <td className="text-right tabular-nums">{Object.keys(r.extra).length}</td>
                      <td className="py-2 text-right">
                        {p && !certain ? (
                          <span className="inline-flex gap-1">
                            <button
                              onClick={() => confirm(i, true)}
                              className="rounded-md bg-success/20 px-2 py-1 text-xs font-semibold text-success"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => confirm(i, false)}
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
