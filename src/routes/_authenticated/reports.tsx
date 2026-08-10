import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Download, FileSpreadsheet, FileText, Image, Lock, Plus, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { MultiLine, TrendBars } from "@/components/charts";
import {
  availabilitySummary,
  avg,
  fullName,
  medicalEvents,
  players,
  playerWellness,
  squadMetrics,
  squadStats,
  squadTrend,
  team,
  wellnessScore,
} from "@/data/performance";
import {
  AUDIENCES,
  DEFAULT_SCHEDULES,
  DEFAULT_TEMPLATES,
  PERIODS,
  SECTIONS,
  type Audience,
  type Cadence,
  type ExportFormat,
  type Period,
  type ReportTemplate,
  type ScheduledExport,
  type SectionId,
} from "@/data/reporting";
import {
  DEFAULT_WEIGHTS,
  LOAD_KPIS,
  pivotMetrics,
  compositeAcwr,
  logbookRows,
  type LoadWeights,
} from "@/data/logbook";
import { MEDICAL_REDACTED, useRole } from "@/lib/roles";


export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Report Templates & Scheduled Exports — T4P" },
      {
        name: "description",
        content:
          "Configurable report templates plus one-click scheduled exports for specific staff audiences and date ranges.",
      },
      { property: "og:title", content: "Report Templates & Scheduled Exports — T4P" },
      { property: "og:description", content: "Choose a template, a date range and an audience — T4P builds and sends the report." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

const CADENCES: Cadence[] = ["Daily", "Weekly (Mon)", "Weekly (Fri)", "Match day -1", "Monthly"];
const FORMATS: Array<{ label: ExportFormat; icon: typeof FileText }> = [
  { label: "PDF", icon: FileText },
  { label: "Excel", icon: FileSpreadsheet },
  { label: "PNG", icon: Image },
  { label: "CSV", icon: Download },
];

function ReportsPage() {
  const { can, def } = useRole();
  const [templates, setTemplates] = useState<ReportTemplate[]>(DEFAULT_TEMPLATES);
  const [schedules, setSchedules] = useState<ScheduledExport[]>(DEFAULT_SCHEDULES);
  const [activeId, setActiveId] = useState<string>(DEFAULT_TEMPLATES[0]!.id);
  const [generated, setGenerated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [from, setFrom] = useState("2026-07-14");
  const [to, setTo] = useState("2026-08-10");
  const [cadence, setCadence] = useState<Cadence>("Weekly (Mon)");
  const [format, setFormat] = useState<ExportFormat>("PDF");
  const [recipients, setRecipients] = useState("head.coach@t4p.club");

  const allowed = templates.filter((t) => t.allowedRoles.includes(def.id));
  const active = allowed.find((t) => t.id === activeId) ?? allowed[0]!;

  const days = active.period === "Last 7 days" ? 7 : active.period === "Last 14 days" ? 14 : 28;
  const trend = useMemo(() => squadTrend(days), [days]);
  const metrics = useMemo(() => squadMetrics(), []);
  const hsr = squadStats((m) => m.hsr7);
  const availability = +avg(players.map((p) => availabilitySummary(p.id).availability)).toFixed(1);
  const wellness = Math.round(avg(players.map((p) => wellnessScore(playerWellness(p.id)))));

  const canSeeMedical = can("viewMedicalDetail");
  const has = (s: SectionId) => active.sections.includes(s);

  /* --- report KPI columns + load model configuration --- */
  const [kpiCols, setKpiCols] = useState<string[]>(["distance", "hsr", "sprintDistance", "accel", "srpe"]);
  const [weights, setWeights] = useState<LoadWeights>(DEFAULT_WEIGHTS);
  const [acuteWindow, setAcuteWindow] = useState(7);
  const [chronicWindow, setChronicWindow] = useState(28);

  const toggleKpi = (key: string) =>
    setKpiCols((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const reportRows = useMemo(
    () =>
      players.map((p) => {
        const rows = logbookRows.filter((r) => r.playerId === p.id && r.date >= from && r.date <= to);
        const values: Record<string, number> = {};
        for (const key of kpiCols) {
          const metric = pivotMetrics().find((m) => m.key === key);
          if (!metric) continue;
          const vals = rows.map((r) => metric.value(r, weights));
          values[key] =
            key === "maxSpeed"
              ? +(vals.length ? Math.max(...vals) : 0).toFixed(1)
              : Math.round(vals.reduce((a, b) => a + b, 0));
        }
        const load = compositeAcwr(p.id, weights, acuteWindow, chronicWindow, to);
        return { player: p, values, load };
      }),
    [kpiCols, weights, acuteWindow, chronicWindow, from, to],
  );


  const update = (patch: Partial<ReportTemplate>) =>
    setTemplates((prev) => prev.map((t) => (t.id === active.id ? { ...t, ...patch } : t)));

  const toggleSection = (id: SectionId) =>
    update({ sections: active.sections.includes(id) ? active.sections.filter((s) => s !== id) : [...active.sections, id] });

  const duplicate = () => {
    const copy: ReportTemplate = {
      ...active,
      id: `tpl-${Date.now()}`,
      name: `${active.name} (copy)`,
      builtIn: false,
      allowedRoles: [def.id],
    };
    setTemplates((prev) => [...prev, copy]);
    setActiveId(copy.id);
  };

  const scheduleExport = () => {
    const s: ScheduledExport = {
      id: `sch-${Date.now()}`,
      templateId: active.id,
      cadence,
      format,
      recipients,
      from,
      to,
      active: true,
    };
    setSchedules((prev) => [s, ...prev]);
    setToast(`Scheduled “${active.name}” · ${cadence} · ${format} → ${recipients}`);
  };

  const sendNow = () => {
    setToast(`“${active.name}” exported as ${format} for ${from} → ${to} and sent to ${recipients}.`);
    setGenerated(true);
  };

  return (
    <AppShell
      title="Reports"
      subtitle={`Templates, audiences and scheduled exports · ${def.label} view`}
      actions={
        <div className="flex gap-2">
          <button onClick={duplicate} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <Plus className="size-4" /> New template
          </button>
          <button
            onClick={() => setGenerated(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Generate report
          </button>
        </div>
      }
    >
      {toast && (
        <div className="mb-4 rounded-md border border-success/40 bg-success/10 p-3 text-sm text-success">{toast}</div>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-4">
          <SectionTitle title="Templates" hint="Only templates cleared for your role are listed" />
          <ul className="space-y-1.5">
            {allowed.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActiveId(t.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    t.id === active.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="block text-xs opacity-80">
                    {t.audience} · {t.period} · {t.sections.length} sections
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {templates.length > allowed.length && (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> {templates.length - allowed.length} template(s) restricted to other roles.
            </p>
          )}
        </div>

        <div className="panel p-4 xl:col-span-2">
          <SectionTitle title="Template configuration" hint="Audience, period, sections and export formats" />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="eyebrow">Template name</span>
              <input
                value={active.name}
                onChange={(e) => update({ name: e.target.value })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Audience</span>
              <select
                value={active.audience}
                onChange={(e) => update({ audience: e.target.value as Audience })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4">
            <p className="eyebrow mb-2">Period</p>
            <div className="flex flex-wrap gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => update({ period: p as Period })}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                    active.period === p ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="eyebrow mb-2">Sections</p>
            <div className="flex flex-wrap gap-1">
              {SECTIONS.map((s) => {
                const locked = s.medical && !canSeeMedical;
                return (
                  <button
                    key={s.id}
                    disabled={locked}
                    onClick={() => toggleSection(s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                      has(s.id) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {locked ? <Lock className="size-3" /> : null}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <p className="eyebrow mb-2">Export formats</p>
            <div className="flex flex-wrap gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f.label}
                  onClick={() =>
                    update({
                      formats: active.formats.includes(f.label)
                        ? active.formats.filter((x) => x !== f.label)
                        : [...active.formats, f.label],
                    })
                  }
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                    active.formats.includes(f.label)
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <f.icon className="size-3.5" /> {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle
            title="Report KPIs"
            hint="Every column of the player summary comes from the imported GPS and session data"
            right={
              <button
                onClick={() => setKpiCols(["distance", "hsr", "sprintDistance", "accel", "srpe"])}
                className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                Reset
              </button>
            }
          />
          <div className="flex flex-wrap gap-1">
            {pivotMetrics().map((m) => (
              <button
                key={m.key}
                onClick={() => toggleKpi(m.key)}
                className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                  kpiCols.includes(m.key) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle
            title="Training load model"
            hint="Choose exactly which components build the load and the acute:chronic ratio"
            right={
              <button
                onClick={() => {
                  setWeights(DEFAULT_WEIGHTS);
                  setAcuteWindow(7);
                  setChronicWindow(28);
                }}
                className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                Reset model
              </button>
            }
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {LOAD_KPIS.map((k) => (
              <div key={k.key} className="rounded-md border border-border p-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {k.label} <span className="opacity-60">· {k.group}</span>
                  </span>
                  <span className="metric-value text-primary">{(weights[k.key] ?? 0).toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.25}
                  value={weights[k.key] ?? 0}
                  onChange={(e) => setWeights((prev) => ({ ...prev, [k.key]: Number(e.target.value) }))}
                  className="mt-1 w-full accent-[var(--color-primary)]"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-muted-foreground">
              Acute window: <span className="text-primary">{acuteWindow} days</span>
              <input
                type="range"
                min={3}
                max={14}
                step={1}
                value={acuteWindow}
                onChange={(e) => setAcuteWindow(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--color-primary)]"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Chronic window: <span className="text-primary">{chronicWindow} days</span>
              <input
                type="range"
                min={14}
                max={56}
                step={7}
                value={chronicWindow}
                onChange={(e) => setChronicWindow(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--color-primary)]"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Load = weighted mean of the selected components, each normalised against the squad reference and scaled to
            100 AU for a typical full session. ACWR = acute sum ÷ chronic sum scaled to the same window length.
          </p>
        </div>
      </section>


      <section className="mt-6 panel p-4">
        <SectionTitle title="One-click export & scheduling" hint="Pick a date range, a cadence and the staff recipients" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="eyebrow">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="eyebrow">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="eyebrow">Cadence</span>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
            >
              {CADENCES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow">Format</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
            >
              {active.formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow">Recipients</span>
            <input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-surface-2 px-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={sendNow}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Send className="size-4" /> Export now
          </button>
          <button
            onClick={scheduleExport}
            disabled={!can("scheduleExports")}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm disabled:opacity-40"
          >
            <CalendarClock className="size-4" /> Schedule export
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Template</th>
                <th>Cadence</th>
                <th>Range</th>
                <th>Format</th>
                <th>Recipients</th>
                <th>Last sent</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => {
                const tpl = templates.find((t) => t.id === s.templateId);
                const visible = tpl?.allowedRoles.includes(def.id);
                return (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-2">{visible ? tpl?.name : MEDICAL_REDACTED}</td>
                    <td>{s.cadence}</td>
                    <td className="tabular-nums text-xs">
                      {s.from} → {s.to}
                    </td>
                    <td>{s.format}</td>
                    <td className="text-xs text-muted-foreground">{visible ? s.recipients : "—"}</td>
                    <td className="text-xs text-muted-foreground">{s.lastSent ?? "—"}</td>
                    <td className="text-right">
                      <button
                        disabled={!can("scheduleExports") || !visible}
                        onClick={() =>
                          setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)))
                        }
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold disabled:opacity-40 ${
                          s.active
                            ? "border-success/30 bg-success/15 text-success"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.active ? "Active" : "Paused"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="eyebrow">{active.audience} report · {active.name}</p>
            <h2 className="text-2xl font-semibold uppercase">
              {team.club} · {team.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {team.season} · {from} → {to} · {team.competition}
            </p>
          </div>
          <div className="flex gap-2">
            {FORMATS.filter((f) => active.formats.includes(f.label)).map((e) => (
              <button
                key={e.label}
                onClick={() => setToast(`“${active.name}” exported as ${e.label}.`)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <e.icon className="size-3.5" /> {e.label}
              </button>
            ))}
          </div>
        </div>

        {generated ? (
          <div className="mt-4 space-y-6">
            {has("headline") && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Squad size" value={players.length} />
                <MetricCard label="Mean HSR 7d" value={hsr.mean} unit="m" />
                {has("availability") && (
                  <MetricCard label="Availability" value={`${availability}%`} tone={availability > 90 ? "good" : "warn"} />
                )}
                {has("wellness") && <MetricCard label="Wellness index" value={`${wellness}%`} />}
              </div>
            )}

            {(has("loadTrend") || has("gpsOutput")) && (
              <div className="grid gap-4 xl:grid-cols-2">
                {has("loadTrend") && (
                  <div>
                    <p className="eyebrow mb-1">Training load</p>
                    <TrendBars data={trend} dataKey="load" height={200} />
                  </div>
                )}
                {has("gpsOutput") && (
                  <div>
                    <p className="eyebrow mb-1">GPS output</p>
                    <MultiLine
                      data={trend}
                      series={[
                        { key: "distance", color: "var(--color-chart-1)", name: "Distance" },
                        { key: "hsr", color: "var(--color-chart-2)", name: "HSR" },
                        { key: "sprint", color: "var(--color-chart-3)", name: "Sprint" },
                      ]}
                      height={200}
                    />
                  </div>
                )}
              </div>
            )}

            {has("playerTable") && (
              <div>
                <p className="eyebrow mb-2">
                  Player summary · {from} → {to} · {kpiCols.length} selected KPI(s)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2">Player</th>
                        {kpiCols.map((k) => (
                          <th key={k} className="text-right">
                            {pivotMetrics().find((m) => m.key === k)?.label ?? k}
                          </th>
                        ))}
                        <th className="text-right">Acute load</th>
                        <th className="text-right">ACWR</th>
                        <th className="text-right">Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((r) => (
                        <tr key={r.player.id} className="border-b border-border/60">
                          <td className="py-1.5">{fullName(r.player)}</td>
                          {kpiCols.map((k) => (
                            <td key={k} className="text-right tabular-nums">
                              {(r.values[k] ?? 0).toLocaleString()}
                            </td>
                          ))}
                          <td className="text-right tabular-nums">{r.load.acute}</td>
                          <td className="text-right tabular-nums">{r.load.acwr || "—"}</td>
                          <td className="text-right tabular-nums">{availabilitySummary(r.player.id).availability}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            <div>
              <p className="eyebrow mb-2">Medical & availability</p>
              {has("medical") && canSeeMedical ? (
                <ul className="space-y-1.5 text-sm">
                  {medicalEvents.map((e, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-2 rounded-md border border-border p-2.5">
                      <span>
                        {fullName(players.find((p) => p.id === e.playerId)!)} · {e.type}: {e.area}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {e.from} → {e.to} · {e.daysLost} days lost · {e.stage}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 rounded-md border border-border p-3 text-sm text-muted-foreground">
                  <Lock className="size-4" /> {MEDICAL_REDACTED}. Availability percentage is reported instead: {availability}%.
                </p>
              )}
            </div>

            {has("observations") && (
              <div>
                <p className="eyebrow mb-2">Key observations</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Mean high-speed running of {hsr.mean} m per player over the last 7 days (sd {hsr.sd} m).</li>
                  <li>
                    {metrics.filter((m) => m.load.acwr > 1.35).length} players above the upper acute:chronic monitoring threshold.
                  </li>
                  <li>Squad availability at {availability}% across recorded sessions.</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Configure the template, set a date range and press Generate report — or schedule it and T4P sends it automatically.
          </p>
        )}
      </section>
    </AppShell>
  );
}
