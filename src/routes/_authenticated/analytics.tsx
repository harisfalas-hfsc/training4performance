import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, GitCompare, Layers } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { Button } from "@/components/ui/button";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, MultiLine, type ChartKind } from "@/components/charts";
import {
  customKpis,
  fullName,
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

const WINDOWS = [7, 14, 28, 42] as const;

/** Core KPIs modelled by T4P — club-specific KPIs from your own GPS export are appended at runtime. */
const METRICS = [
  { key: "distance", label: "Distance (m)" },
  { key: "hsr", label: "HSR (m)" },
  { key: "sprint", label: "Sprint (m)" },
  { key: "maxSpeed", label: "Max speed (km/h)" },
  { key: "accel", label: "Accelerations" },
  { key: "decel", label: "Decelerations" },
  { key: "minutes", label: "Minutes" },
  { key: "rpe", label: "RPE" },
  { key: "load", label: "s-RPE load (AU)" },
] as const;

type MetricKey = string;

const DEVIATION_METRICS = [
  { key: "hsr7", label: "HSR 7d" },
  { key: "distance7", label: "Distance 7d" },
  { key: "sprint7", label: "Sprint 7d" },
] as const;

const positions: Position[] = ["GK", "CB", "FB", "CM", "AM", "W", "ST"];

function AnalyticsPage() {
  useDataVersion();
  const [window, setWindow] = useState<(typeof WINDOWS)[number]>(28);
  const [kpis, setKpis] = useState<MetricKey[]>(["hsr", "distance"]);
  const [kind, setKind] = useState<ChartKind>("line");
  const [devKey, setDevKey] = useState<(typeof DEVIATION_METRICS)[number]["key"]>("hsr7");
  const [selected, setSelected] = useState<string[]>(["p14", "p09", "p03"]);

  const trend = squadTrend(window);
  const metrics = squadMetrics();
  const hsr = squadStats((m) => m.hsr7);

  /** Core KPIs plus whatever club-specific KPIs the coach's own GPS export brought in. */
  const allMetrics = useMemo(
    () => [...METRICS.map((m) => ({ key: m.key as string, label: m.label })), ...customKpis()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trend],
  );

  const half = Math.floor(trend.length / 2);
  const periodA = trend.slice(0, half);
  const periodB = trend.slice(half);
  const mean = (rows: typeof trend, key: MetricKey) =>
    Math.round(rows.reduce((a, r) => a + Number((r as Record<string, unknown>)[key] ?? 0), 0) / (rows.length || 1));

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

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));

  return (
    <AppShell title="Analytics" subtitle="Choose your KPIs, your window and your chart style">
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Analytics and reporting tools">
        <Button asChild variant="outline"><Link to="/compare"><GitCompare className="size-4" /> Compare players</Link></Button>
        <Button asChild variant="outline"><Link to="/blocks"><Layers className="size-4" /> Compare blocks</Link></Button>
        <Button asChild variant="outline"><Link to="/reports"><FileText className="size-4" /> Reports & exports</Link></Button>
      </nav>
      <section className="panel mb-4 p-4">
        <SectionTitle title="Analysis setup" hint="Pick any combination of KPIs and how you want them drawn" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow w-full sm:w-auto">Window</span>
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                window === w ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {w} days
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="eyebrow w-full sm:w-auto">KPIs</span>
          {allMetrics.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleKpi(m.key)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                kpis.includes(m.key) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="eyebrow w-full sm:w-auto">Chart</span>
          {CHART_KINDS.map((c) => (
            <button
              key={c.id}
              onClick={() => setKind(c.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                kind === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
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
            hint={`${kpis.length} KPI(s) · last ${window} days${kind === "pie" ? " · pie uses the first selected KPI" : ""}`}
          />
          <ChartFrame title="Squad trend">
            <MultiChart
              data={trend}
              kind={kind}
              height={280}
              series={kpis.map((k) => ({ key: k, name: allMetrics.find((m) => m.key === k)?.label ?? k }))}
            />
          </ChartFrame>
        </div>
        <div className="panel p-4">
          <SectionTitle
            title="Deviation from position average"
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
          <ChartFrame title="Deviation from position average">
            <HBar data={deviations} dataKey="deviation" labelKey="name" height={340} color="var(--color-chart-3)" />
          </ChartFrame>
        </div>
      </section>


      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4">
          <SectionTitle title="Period comparison" hint="First half vs second half of the selected window" />
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
                    <td className="py-2">{m.label}</td>
                    <td className="text-right tabular-nums">{a}</td>
                    <td className="text-right tabular-nums">{b}</td>
                    <td className={`text-right tabular-nums ${d > 0 ? "text-warning" : "text-info"}`}>
                      {d > 0 ? "+" : ""}
                      {d}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          <SectionTitle title="Player comparison" hint="Select up to four players" />
          <div className="mb-3 flex flex-wrap gap-1">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  selected.includes(p.id) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {p.lastName}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Player</th>
                  <th className="text-right">Distance 7d</th>
                  <th className="text-right">HSR 7d</th>
                  <th className="text-right">Sprint 7d</th>
                  <th className="text-right">Max speed</th>
                  <th className="text-right">RPE</th>
                  <th className="text-right">Acute</th>
                  <th className="text-right">ACWR</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => {
                  const p = players.find((x) => x.id === id)!;
                  const m = playerMetrics(p);
                  return (
                    <tr key={id} className="border-b border-border/60">
                      <td className="py-2">{fullName(p)}</td>
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
            <MultiLine
              data={trend}
              series={[
                { key: "distance", color: "var(--color-chart-1)", name: "Distance" },
                { key: "hsr", color: "var(--color-chart-2)", name: "HSR" },
                { key: "sprint", color: "var(--color-chart-3)", name: "Sprint" },
              ]}
              height={220}
            />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
