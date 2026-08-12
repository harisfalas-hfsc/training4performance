import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, GitCompare, Layers } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { Button } from "@/components/ui/button";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, MultiLine, type ChartKind } from "@/components/charts";
import { DateRangePicker, PlayerPicker, type Scope } from "@/components/selectors";
import {
  customKpis,
  fullName,
  gpsHistory,
  gpsValue,
  players,
  playerMetrics,
  positionAverage,
  squadMetrics,
  squadStats,
  squadTrend,
  useDataVersion,
  type Position,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Squad Analytics & Comparison — T4P" },
      {
        name: "description",
        content:
          "Squad averages, deviation from position norms, period comparison and side-by-side player comparison across GPS, load and testing.",
      },
      { property: "og:title", content: "Squad Analytics & Comparison" },
      { property: "og:description", content: "Trends, deviations and comparisons generated automatically from connected data." },
    ],
  }),
  component: AnalyticsPage,
});

/** Core KPIs modelled by T4P — club-specific KPIs from your own GPS export are appended at runtime. */
const METRICS = [
  { key: "distance", label: "Distance", unit: "m" },
  { key: "hsr", label: "High speed running", unit: "m" },
  { key: "sprint", label: "Sprint distance", unit: "m" },
  { key: "maxSpeed", label: "Max speed", unit: "km/h" },
  { key: "accel", label: "Accelerations", unit: "n" },
  { key: "decel", label: "Decelerations", unit: "n" },
  { key: "minutes", label: "Minutes", unit: "min" },
  { key: "rpe", label: "RPE", unit: "0-10" },
  { key: "load", label: "s-RPE load", unit: "AU" },
] as const;

type MetricKey = string;

const DEVIATION_METRICS = [
  { key: "hsr7", label: "HSR last 7 days" },
  { key: "distance7", label: "Distance last 7 days" },
  { key: "sprint7", label: "Sprint last 7 days" },
] as const;

const positions: Position[] = ["GK", "CB", "FB", "CM", "AM", "W", "ST"];

const daysBetween = (from: string, to: string) =>
  Math.max(7, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) || 28);

function AnalyticsPage() {
  useDataVersion();
  const [kpis, setKpis] = useState<MetricKey[]>(["distance"]);
  const [kind, setKind] = useState<ChartKind>("bar");
  const [devKey, setDevKey] = useState<(typeof DEVIATION_METRICS)[number]["key"]>("hsr7");
  const [scope, setScope] = useState<Scope>("team");
  const [selected, setSelected] = useState<string[]>([]);
  const [compareKpi, setCompareKpi] = useState<MetricKey>("distance");
  const availableDates = useMemo(() => [...new Set(gpsHistory.map((row) => row.date))].sort(), [gpsHistory.length]);
  const [from, setFrom] = useState(() => availableDates[0] ?? "");
  const [to, setTo] = useState(() => availableDates.at(-1) ?? "");

  /** Default to the last 28 days of real data instead of the whole season. */
  useEffect(() => {
    if (!availableDates.length) return;
    const last = availableDates.at(-1)!;
    const start = new Date(last);
    start.setDate(start.getDate() - 28);
    setFrom(start.toISOString().slice(0, 10));
    setTo(last);
  }, [availableDates.length]);

  const window = daysBetween(from, to);
  const trend = squadTrend(window);
  const metrics = squadMetrics();
  const hsr = squadStats((m) => m.hsr7);

  /** Core KPIs plus whatever club-specific KPIs the coach's own GPS export brought in. */
  const allMetrics = useMemo(
    () => [
      ...METRICS.map((m) => ({ key: m.key as string, label: m.label, unit: m.unit as string })),
      ...customKpis().map((m) => ({ key: m.key, label: m.label, unit: "" })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trend],
  );

  const half = Math.floor(trend.length / 2);
  const periodA = trend.slice(0, half);
  const periodB = trend.slice(half);
  const mean = (rows: typeof trend, key: MetricKey) =>
    Math.round(rows.reduce((a, r) => a + Number((r as Record<string, unknown>)[key] ?? 0), 0) / (rows.length || 1));

  const devLabel = DEVIATION_METRICS.find((d) => d.key === devKey)?.label ?? devKey;

  const deviations = useMemo(
    () =>
      [...metrics]
        .map((m) => {
          const norm = positionAverage(m.player.position, (x) => Number(x[devKey])) || 1;
          return {
            name: m.player.lastName,
            deviation: Math.round(((Number(m[devKey]) - norm) / norm) * 100),
          };
        })
        .sort((a, b) => b.deviation - a.deviation)
        .slice(0, 12),
    [metrics, devKey],
  );

  const toggleKpi = (key: MetricKey) =>
    setKpis((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  const comparisonTrend = useMemo(() => {
    const dates = [...new Set(gpsHistory.filter((row) => selected.includes(row.playerId) && (!from || row.date >= from) && (!to || row.date <= to)).map((row) => row.date))].sort();
    return dates.map((date) => {
      const point: Record<string, string | number> = { date: date.slice(5) };
      for (const id of selected) {
        const row = gpsHistory.find((item) => item.playerId === id && item.date === date);
        point[id] = row ? gpsValue(row, compareKpi) : 0;
      }
      return point;
    });
  }, [selected, compareKpi, from, to, gpsHistory.length]);

  const kpiNames = kpis.map((k) => allMetrics.find((m) => m.key === k)?.label ?? k);
  const unit = kpis.length === 1 ? (allMetrics.find((m) => m.key === kpis[0])?.unit ?? "") : "";
  const whoLabel =
    scope === "team" ? "whole squad (sum)" : scope === "average" ? "squad average per player" : `${selected.length} selected player(s)`;

  return (
    <AppShell title="Analytics & reports" subtitle="Choose players, KPI and dates — then see or export the result">
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Analytics and reporting tools">
        <Button asChild variant="outline"><Link to="/compare"><GitCompare className="size-4" /> Compare players</Link></Button>
        <Button asChild variant="outline"><Link to="/blocks"><Layers className="size-4" /> Compare blocks</Link></Button>
        <Button asChild variant="outline"><Link to="/reports"><FileText className="size-4" /> Reports & exports</Link></Button>
      </nav>

      <section className="panel mb-4 p-4">
        <SectionTitle title="1. Who do you want to analyse?" hint="Whole squad, squad average, or players picked from the list" />
        <PlayerPicker scope={scope} onScope={setScope} picked={selected} onPicked={setSelected} />
        {!players.length ? <p className="mt-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">No players yet. Import a GPS report or add players in Team & players.</p> : null}
      </section>

      <section className="panel mb-4 p-4">
        <SectionTitle title="2. Which KPIs, which dates, drawn how?" hint="Everything below follows these choices" />
        <div className="flex flex-wrap items-center gap-1">
          <span className="eyebrow w-full sm:w-auto">KPIs</span>
          {allMetrics.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleKpi(m.key)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                kpis.includes(m.key) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {m.label}{m.unit ? ` (${m.unit})` : ""}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="eyebrow w-full sm:w-auto">Chart</span>
          {CHART_KINDS.map((c) => (
            <button
              key={c.id}
              onClick={() => setKind(c.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                kind === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <span className="eyebrow">Dates</span>
          <div className="mt-1">
            <DateRangePicker
              from={from}
              to={to}
              onChange={(a, b) => { setFrom(a); setTo(b); }}
              earliest={availableDates[0]}
              latest={availableDates.at(-1)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Squad mean HSR 7d" value={hsr.mean} unit="m" />
        <MetricCard label="Median" value={hsr.median} unit="m" />
        <MetricCard label="Standard deviation" value={hsr.sd} unit="m" />
        <MetricCard label="Range" value={`${hsr.min}–${hsr.max}`} unit="m" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Squad trend"
            hint={`${kpiNames.join(", ") || "no KPI"} · ${whoLabel} · last ${window} days${kind === "pie" ? " · pie uses the first KPI" : ""}`}
          />
          <ChartFrame title={`Squad trend — ${kpiNames.join(", ")}`}>
            <MultiChart
              data={trend}
              kind={kind}
              height={280}
              unit={unit}
              series={kpis.map((k) => ({ key: k, name: allMetrics.find((m) => m.key === k)?.label ?? k }))}
            />
          </ChartFrame>
          <p className="mt-2 text-xs text-muted-foreground">
            One bar/point per training day. Each colour is one KPI — hover to read the exact number{unit ? ` in ${unit}` : ""}.
          </p>
        </div>
        <div className="panel p-4">
          <SectionTitle
            title="Who is above or below his position group?"
            right={
              <select
                className="control h-8 py-0 text-xs"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value as typeof devKey)}
              >
                {DEVIATION_METRICS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            }
          />
          <p className="mb-2 text-xs text-muted-foreground">
            Each bar is one player: how far his <strong>{devLabel}</strong> is above (amber, doing more) or below (blue, doing less)
            the average of players in the <strong>same position</strong>. 0% = exactly on his position average.
          </p>
          <ChartFrame title={`Deviation from position average — ${devLabel}`}>
            <HBar data={deviations} dataKey="deviation" labelKey="name" height={340} unit="%" signColors zeroLine />
          </ChartFrame>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4">
          <SectionTitle title="Period comparison" hint={`First half vs second half of the selected ${window} days`} />
          <p className="mb-2 text-xs text-muted-foreground">
            Period A = the older half of your date range, Period B = the newer half. Δ is the change in %.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Metric</th>
                  <th className="text-right">Period A</th>
                  <th className="text-right">Period B</th>
                  <th className="text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {allMetrics.map((m) => {
                  const a = mean(periodA, m.key);
                  const b = mean(periodB, m.key);
                  const d = a ? Math.round(((b - a) / a) * 100) : 0;
                  return (
                    <tr key={m.key} className="border-b border-border/60">
                      <td className="py-2">{m.label}{m.unit ? ` (${m.unit})` : ""}</td>
                      <td className="text-right tabular-nums">{a.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{b.toLocaleString()}</td>
                      <td className={`text-right tabular-nums ${d > 0 ? "text-warning" : "text-info"}`}>
                        {d > 0 ? "+" : ""}
                        {d}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="eyebrow mt-4">Position averages · HSR 7d</p>
          <ul className="mt-2 space-y-1 text-sm">
            {positions.map((p) => (
              <li key={p} className="flex justify-between">
                <span className="text-muted-foreground">{p}</span>
                <span className="tabular-nums">{positionAverage(p, (m) => m.hsr7)} m</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Player comparison"
            hint="Uses the players you picked at the top — one line per player"
          />
          <div className="mb-4 max-w-xs">
            <label>
              <span className="eyebrow">KPI to compare</span>
              <select className="control mt-1 w-full" value={compareKpi} onChange={(event) => setCompareKpi(event.target.value)}>
                {allMetrics.map((metric) => <option key={metric.key} value={metric.key}>{metric.label}</option>)}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Player</th>
                  <th className="text-right whitespace-nowrap">Distance 7d (m)</th>
                  <th className="text-right whitespace-nowrap">HSR 7d (m)</th>
                  <th className="text-right whitespace-nowrap">Sprint 7d (m)</th>
                  <th className="text-right whitespace-nowrap">Max speed (km/h)</th>
                  <th className="text-right">RPE</th>
                  <th className="text-right">Acute</th>
                  <th className="text-right">ACWR</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p) return null;
                  const m = playerMetrics(p);

                  return (
                    <tr key={id} className="border-b border-border/60">
                      <td className="py-2 whitespace-nowrap">{fullName(p)}</td>
                      <td className="text-right tabular-nums">{m.distance7.toLocaleString()}</td>
                      <td className="text-right tabular-nums">{m.hsr7}</td>
                      <td className="text-right tabular-nums">{m.sprint7}</td>
                      <td className="text-right tabular-nums">{m.maxSpeed || "—"}</td>
                      <td className="text-right tabular-nums">{m.rpe7 || "—"}</td>
                      <td className="text-right tabular-nums">{m.load.acute}</td>
                      <td className="text-right tabular-nums">{m.load.acwr || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            {selected.length && comparisonTrend.length ? (
              <ChartFrame title={`${allMetrics.find((item) => item.key === compareKpi)?.label ?? compareKpi} comparison`}>
                <MultiLine
                  data={comparisonTrend}
                  dualAxis={false}
                  series={selected.flatMap((id, index) => {
                    const player = players.find((item) => item.id === id);
                    return player ? [{ key: id, color: `var(--color-chart-${(index % 5) + 1})`, name: fullName(player) }] : [];
                  })}
                  height={260}
                />
              </ChartFrame>
            ) : <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Pick “Selected players” at the top and choose at least one player with GPS data in this date range.</p>}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
