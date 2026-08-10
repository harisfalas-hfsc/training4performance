import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AcwrPill, MetricCard, SectionTitle } from "@/components/perf-ui";
import { MultiLine, TrendBars } from "@/components/charts";
import {
  addManualTest,
  fullName,
  players,
  removeGps,
  setRpe,
  today,
  upsertGps,
  useDataVersion,
} from "@/data/performance";
import {
  DEFAULT_WEIGHTS,
  LOAD_KPIS,
  PIVOT_DIMENSIONS,
  PIVOT_METRICS,
  SESSION_SPLIT,
  TEST_BATTERY,
  TEST_ROUNDS,
  compositeAcwr,
  compositeLoad,
  logbookRows,
  pivot,
  sessionLoadOf,
  splitRow,
  templateCsv,
  testValue,
  trainingLogbook,
  type LoadWeights,
  type LogbookRow,
  type PivotAgg,
  type PivotDimension,
} from "@/data/logbook";

export const Route = createFileRoute("/_authenticated/logbook")({
  head: () => ({
    meta: [
      { title: "Activity Logbook, Pivot Charts & Testing — T4P" },
      {
        name: "description",
        content:
          "Daily activity logbook, pivot charts for any GPS KPI, the training day logbook with drills and RPE, and the full evaluation test battery.",
      },
      { property: "og:title", content: "Activity Logbook & Training Monitor — T4P" },
      {
        property: "og:description",
        content: "One logbook for GPS activity, session drills, RPE, composite training load and testing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LogbookPage,
});

const TABS = ["Activity logbook", "Activity chart", "Training logbook", "Tests", "Load model"] as const;
type Tab = (typeof TABS)[number];

const num = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 1 });

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, string | number | boolean>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => `${r[k]}`).join(","))].join("\n");
}

function LogbookPage() {
  useDataVersion();
  const [tab, setTab] = useState<Tab>("Activity logbook");
  const [weights, setWeights] = useState<LoadWeights>({ ...DEFAULT_WEIGHTS });

  return (
    <AppShell title="Training Monitor Logbook" subtitle="Activity, drills, RPE, composite load and testing in one book">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
              (tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Activity logbook" && <ActivityLogbook weights={weights} />}
      {tab === "Activity chart" && <ActivityChart weights={weights} />}
      {tab === "Training logbook" && <TrainingLogbookTab />}
      {tab === "Tests" && <TestsTab />}
      {tab === "Load model" && <LoadModelTab weights={weights} setWeights={setWeights} />}
    </AppShell>
  );
}

/* ---------------- Activity logbook ---------------- */

function ActivityLogbook({ weights }: { weights: LoadWeights }) {
  const [player, setPlayer] = useState("all");
  const [from, setFrom] = useState(logbookRows[0]?.date ?? today);
  const [to, setTo] = useState(today);
  const [split, setSplit] = useState(false);
  const [rpeEdits, setRpeEdits] = useState<Record<string, number>>({});
  const [showAdd, setShowAdd] = useState(false);

  const rows = useMemo(() => {
    const base = logbookRows
      .filter((r) => (player === "all" ? true : r.playerId === player))
      .filter((r) => r.date >= from && r.date <= to);
    const expanded = split ? base.flatMap(splitRow) : base;
    return expanded
      .map((r) => (rpeEdits[r.id] !== undefined ? { ...r, rpe: rpeEdits[r.id]! } : r))
      .sort((a, b) => (a.date === b.date ? a.athlete.localeCompare(b.athlete) : b.date.localeCompare(a.date)))
      .slice(0, 400);
  }, [player, from, to, split, rpeEdits]);

  const totals = useMemo(
    () => ({
      distance: rows.reduce((a, r) => a + r.distance, 0),
      hsr: rows.reduce((a, r) => a + r.hsr, 0),
      load: rows.reduce((a, r) => a + compositeLoad(r, weights), 0),
      srpe: rows.reduce((a, r) => a + r.rpe * r.minutes, 0),
    }),
    [rows, weights],
  );

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <Field label="Player">
          <select className="control" value={player} onChange={(e) => setPlayer(e.target.value)}>
            <option value="all">All players</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input type="date" className="control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <input type="date" className="control" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
          Split sessions into training drill parts
        </label>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          onClick={() => download("t4p-activity-logbook.csv", toCsv(rows as unknown as Array<Record<string, string | number | boolean>>))}
        >
          <Download className="size-4" /> Export logbook
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus className="size-4" /> {showAdd ? "Close" : "Add activity"}
        </button>
      </div>

      {showAdd && <AddActivityForm onDone={() => setShowAdd(false)} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Rows" value={rows.length} hint={split ? "drill parts" : "session rows"} />
        <MetricCard label="Total distance" value={num(totals.distance)} unit="m" />
        <MetricCard label="High speed running" value={num(totals.hsr)} unit="m" />
        <MetricCard label="Composite load" value={num(totals.load)} unit="AU" hint="from your load model" />
      </div>

      <div className="panel overflow-x-auto p-0">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {["Date", "Category", "MD", "Drill", "Athlete", "Role", "Min", "Dist (m)", "HSR (m)", "Sprint (m)", "Spr", "Acc", "Dec", "Jumps", "Max spd", "RPE", "sRPE", "Load AU", ""].map(
                (h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-1.5 tabular-nums">{r.date}</td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.category}</td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.dayDescription}</td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.drill || "—"}</td>
                <td className="px-3 py-1.5">{r.athlete}</td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground">{r.role}</td>
                <td className="px-3 py-1.5 tabular-nums">{r.minutes}</td>
                <td className="px-3 py-1.5 tabular-nums">{num(r.distance)}</td>
                <td className="px-3 py-1.5 tabular-nums">{num(r.hsr)}</td>
                <td className="px-3 py-1.5 tabular-nums">{num(r.sprintDistance)}</td>
                <td className="px-3 py-1.5 tabular-nums">{r.sprints}</td>
                <td className="px-3 py-1.5 tabular-nums">{r.accel}</td>
                <td className="px-3 py-1.5 tabular-nums">{r.decel}</td>
                <td className="px-3 py-1.5 tabular-nums">{r.jumps}</td>
                <td className="px-3 py-1.5 tabular-nums">{r.maxSpeed}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={r.rpe}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setRpeEdits((prev) => ({ ...prev, [r.id]: v }));
                      if (!split) setRpe(r.date, r.playerId, v);
                    }}
                    className="w-14 rounded border border-border bg-surface-2 px-1 py-0.5 text-right tabular-nums"
                  />
                </td>
                <td className="px-3 py-1.5 tabular-nums">{r.rpe * r.minutes}</td>
                <td className="px-3 py-1.5 tabular-nums text-primary">{compositeLoad(r, weights)}</td>
                <td className="px-3 py-1.5 text-right">
                  {!split && (
                    <button
                      type="button"
                      aria-label="Delete activity row"
                      onClick={() => removeGps(r.date, r.playerId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        RPE can be typed per row — per session or per drill part. Session RPE load = RPE × minutes; composite load comes from the KPI weights in the Load model tab.
      </p>
    </div>
  );
}

function AddActivityForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({
    date: today,
    playerId: players[0]?.id ?? "",
    category: "TRAINING",
    minutes: "80",
    distance: "5500",
    hsr: "350",
    sprint: "60",
    maxSpeed: "28",
    accel: "20",
    decel: "22",
    jumps: "6",
    rpe: "7",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form
      className="panel grid gap-2 p-4 sm:grid-cols-4 xl:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.playerId) return;
        upsertGps({
          date: f.date,
          playerId: f.playerId,
          category: f.category,
          minutes: Number(f.minutes) || 0,
          distance: Number(f.distance) || 0,
          hsr: Number(f.hsr) || 0,
          sprint: Number(f.sprint) || 0,
          maxSpeed: Number(f.maxSpeed) || 0,
          accel: Number(f.accel) || 0,
          decel: Number(f.decel) || 0,
          jumps: Number(f.jumps) || 0,
          rpe: Number(f.rpe) || 0,
        });
        onDone();
      }}
    >
      <Field label="Date">
        <input className="control" type="date" value={f.date} onChange={set("date")} />
      </Field>
      <Field label="Player">
        <select className="control" value={f.playerId} onChange={set("playerId")}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {fullName(p)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Category">
        <select className="control" value={f.category} onChange={set("category")}>
          {["TRAINING", "MATCH", "RECOVERY", "REHABILITATION", "INDIVIDUAL"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Minutes">
        <input className="control" value={f.minutes} onChange={set("minutes")} />
      </Field>
      <Field label="Distance (m)">
        <input className="control" value={f.distance} onChange={set("distance")} />
      </Field>
      <Field label="HSR (m)">
        <input className="control" value={f.hsr} onChange={set("hsr")} />
      </Field>
      <Field label="Sprint (m)">
        <input className="control" value={f.sprint} onChange={set("sprint")} />
      </Field>
      <Field label="Max speed (km/h)">
        <input className="control" value={f.maxSpeed} onChange={set("maxSpeed")} />
      </Field>
      <Field label="Accels">
        <input className="control" value={f.accel} onChange={set("accel")} />
      </Field>
      <Field label="Decels">
        <input className="control" value={f.decel} onChange={set("decel")} />
      </Field>
      <Field label="Jumps">
        <input className="control" value={f.jumps} onChange={set("jumps")} />
      </Field>
      <Field label="RPE">
        <div className="flex gap-2">
          <input className="control flex-1" value={f.rpe} onChange={set("rpe")} />
          <button type="submit" className="rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </Field>
    </form>
  );
}

/* ---------------- Activity chart (pivot) ---------------- */

function ActivityChart({ weights }: { weights: LoadWeights }) {
  const [metricKey, setMetricKey] = useState(PIVOT_METRICS[0]!.key);
  const [dimension, setDimension] = useState<PivotDimension>("athlete");
  const [agg, setAgg] = useState<PivotAgg>("sum");
  const [category, setCategory] = useState("all");
  const [split, setSplit] = useState(false);
  const [from, setFrom] = useState(logbookRows[0]?.date ?? today);
  const [to, setTo] = useState(today);

  const metric = PIVOT_METRICS.find((m) => m.key === metricKey)!;
  const categories = useMemo(() => [...new Set(logbookRows.map((r) => r.category))], []);

  const rows: LogbookRow[] = useMemo(() => {
    const base = logbookRows.filter(
      (r) => r.date >= from && r.date <= to && (category === "all" || r.category === category),
    );
    return split || dimension === "drill" ? base.flatMap(splitRow) : base;
  }, [from, to, category, split, dimension]);

  const data = useMemo(
    () => pivot(rows, dimension, metric, agg, weights).slice(0, 30).map((d) => ({ date: d.label, value: d.value })),
    [rows, dimension, metric, agg, weights],
  );

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <Field label="Metric">
          <select className="control" value={metricKey} onChange={(e) => setMetricKey(e.target.value)}>
            {PIVOT_METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Group by">
          <select className="control" value={dimension} onChange={(e) => setDimension(e.target.value as PivotDimension)}>
            {PIVOT_DIMENSIONS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Aggregation">
          <select className="control" value={agg} onChange={(e) => setAgg(e.target.value as PivotAgg)}>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="max">Max</option>
            <option value="count">Count</option>
          </select>
        </Field>
        <Field label="Activity type">
          <select className="control" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From">
          <input type="date" className="control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <input type="date" className="control" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
          Use drill parts
        </label>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          onClick={() => download("t4p-pivot.csv", toCsv(data.map((d) => ({ group: d.date, value: d.value }))))}
        >
          <Download className="size-4" /> Export pivot
        </button>
      </div>

      <div className="panel p-4">
        <SectionTitle title={metric.label} hint={`${agg} by ${PIVOT_DIMENSIONS.find((d) => d.key === dimension)!.label.toLowerCase()}`} />
        <TrendBars data={data} dataKey="value" height={360} />
      </div>

      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Row labels</th>
              <th className="px-3 py-2 text-right font-medium">{metric.label}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-1.5">{d.date}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{num(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Training logbook ---------------- */

function TrainingLogbookTab() {
  const [open, setOpen] = useState(trainingLogbook[trainingLogbook.length - 1]?.date ?? "");
  return (
    <div className="space-y-3">
      <SectionTitle title="Daily training logbook" hint="Day description, drills, duration and planned RPE — the team plan behind every GPS row" />
      {[...trainingLogbook].reverse().map((day) => (
        <div key={day.date} className="panel p-4">
          <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(open === day.date ? "" : day.date)}>
            <div>
              <p className="font-semibold tabular-nums">{day.date}</p>
              <p className="text-xs text-muted-foreground">
                {day.dayDescription} · {day.group} · {day.drills.length} drills · {day.drills.reduce((a, b) => a + b.durationMin, 0)} min
              </p>
            </div>
            <span className="metric-value text-primary">{sessionLoadOf(day)} AU</span>
          </button>
          {open === day.date && (
            <table className="mt-3 w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Training drill</th>
                  <th className="py-2 font-medium">Purpose</th>
                  <th className="py-2 text-right font-medium">Duration</th>
                  <th className="py-2 text-right font-medium">RPE</th>
                  <th className="py-2 text-right font-medium">Load</th>
                </tr>
              </thead>
              <tbody>
                {day.drills.map((d) => (
                  <tr key={d.drill} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5">{d.drill}</td>
                    <td className="py-1.5 text-xs text-muted-foreground">{d.purpose}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.durationMin}'</td>
                    <td className="py-1.5 text-right tabular-nums">{d.rpe}</td>
                    <td className="py-1.5 text-right tabular-nums">{d.durationMin * d.rpe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Default session shape: {SESSION_SPLIT.map((s) => s.drill).join(" · ")}
      </p>
    </div>
  );
}

/* ---------------- Tests ---------------- */

function TestsTab() {
  const [round, setRound] = useState(TEST_ROUNDS[TEST_ROUNDS.length - 1]?.label ?? `Testing ${today}`);
  const [test, setTest] = useState(TEST_BATTERY[2]!.name as string);
  const [showAdd, setShowAdd] = useState(false);
  const battery = TEST_BATTERY.find((t) => t.name === test)!;

  const chart = players
    .map((p) => ({ date: fullName(p), value: testValue(p.id, test, round) ?? 0 }))
    .sort((a, b) => (battery.higherIsBetter ? b.value - a.value : a.value - b.value));

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <Field label="Test round">
          <select className="control" value={round} onChange={(e) => setRound(e.target.value)}>
            {TEST_ROUNDS.map((r) => (
              <option key={r.id} value={r.label}>
                {r.label} · {r.date}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Evaluation test">
          <select className="control" value={test} onChange={(e) => setTest(e.target.value)}>
            {TEST_BATTERY.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          onClick={() =>
            download(
              "t4p-tests.csv",
              toCsv(
                players.map((p) => {
                  const row: Record<string, string | number> = { athlete: fullName(p), round };
                  for (const t of TEST_BATTERY) row[t.name] = testValue(p.id, t.name, round) ?? "";
                  return row;
                }),
              ),
            )
          }
        >
          <Download className="size-4" /> Export test battery
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus className="size-4" /> {showAdd ? "Close" : "Record test"}
        </button>
      </div>

      {showAdd && <RecordTestForm defaultRound={round} defaultTest={test} onDone={() => setShowAdd(false)} />}

      <div className="panel p-4">
        <SectionTitle title={`${battery.name}`} hint={`${round} · ${battery.higherIsBetter ? "higher is better" : "lower is better"} · ${battery.unit}`} />
        <TrendBars data={chart} dataKey="value" height={340} />
      </div>

      <div className="panel overflow-x-auto p-0">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Athlete</th>
              {TEST_BATTERY.map((t) => (
                <th key={t.name} className="px-3 py-2 text-right font-medium">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-1.5">{fullName(p)}</td>
                {TEST_BATTERY.map((t) => (
                  <td key={t.name} className="px-3 py-1.5 text-right tabular-nums">
                    {testValue(p.id, t.name, round) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordTestForm({
  defaultRound,
  defaultTest,
  onDone,
}: {
  defaultRound: string;
  defaultTest: string;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    playerId: players[0]?.id ?? "",
    round: defaultRound,
    test: defaultTest,
    value: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form
      className="panel grid gap-2 p-4 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(f.value);
        if (!f.playerId || Number.isNaN(value)) return;
        addManualTest({ playerId: f.playerId, round: f.round, test: f.test, value, date: today });
        onDone();
      }}
    >
      <Field label="Player">
        <select className="control" value={f.playerId} onChange={set("playerId")}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {fullName(p)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Round">
        <input className="control" value={f.round} onChange={set("round")} />
      </Field>
      <Field label="Test">
        <select className="control" value={f.test} onChange={set("test")}>
          {TEST_BATTERY.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Result">
        <div className="flex gap-2">
          <input className="control flex-1" value={f.value} onChange={set("value")} placeholder="e.g. 38.4" />
          <button type="submit" className="rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </Field>
    </form>
  );
}

/* ---------------- Load model ---------------- */

function LoadModelTab({ weights, setWeights }: { weights: LoadWeights; setWeights: (w: LoadWeights) => void }) {
  const [playerId, setPlayerId] = useState(players[0]!.id);
  const acwr = compositeAcwr(playerId, weights);
  const trend = acwr.daily.slice(-28).map((d) => ({ date: d.date.slice(5), load: d.load }));

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <SectionTitle
          title="Composite acute:chronic load model"
          hint="Choose which KPIs build your training load. Each KPI is normalised against the squad reference, weighted, then summed — 100 AU is a typical full session."
          right={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
              onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
            >
              <SlidersHorizontal className="size-4" /> Reset defaults
            </button>
          }
        />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {LOAD_KPIS.map((k) => (
            <div key={k.key} className="rounded-md border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{k.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {k.group} · {k.unit}
                  </p>
                </div>
                <span className="metric-value tabular-nums text-primary">{(weights[k.key] ?? 0).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={0.25}
                value={weights[k.key] ?? 0}
                onChange={(e) => setWeights({ ...weights, [k.key]: Number(e.target.value) })}
                className="mt-2 w-full accent-[var(--color-primary)]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <SectionTitle title="Model preview" hint="Same formula that drives the logbook, alerts view and reports" right={
          <select className="control" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </select>
        } />
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Acute (7d)" value={acwr.acute} unit="AU" />
          <MetricCard label="Chronic (28d, 7d-equivalent)" value={acwr.chronic} unit="AU" />
          <MetricCard label="Monotony" value={acwr.monotony} />
          <div className="panel flex flex-col justify-center p-4">
            <p className="eyebrow">Acute : chronic ratio</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="metric-value text-3xl">{acwr.acwr.toFixed(2)}</span>
              <AcwrPill acwr={acwr.acwr} />
            </div>
          </div>
        </div>
        <MultiLine data={trend} series={[{ key: "load", color: "var(--color-chart-1)", name: "Composite load (AU)" }]} dualAxis={false} height={260} />
      </div>

      <div className="panel p-4">
        <SectionTitle title="GPS import template" hint="Download it, arrange your provider export to match, and upload it back. Any other layout still works — T4P will ask you to map the columns." />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => download("T4P_GPS_IMPORT_TEMPLATE.csv", templateCsv())}
        >
          <Download className="size-4" /> Download T4P template
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}
