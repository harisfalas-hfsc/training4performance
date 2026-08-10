import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { HBar, MultiLine, TrendBars } from "@/components/charts";
import {
  fullName,
  players,
  playerMetrics,
  positionAverage,
  squadMetrics,
  squadStats,
  squadTrend,
  type Position,
} from "@/data/performance";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Squad Analytics & Comparison — Football Performance OS" },
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
const METRICS = [
  { key: "distance", label: "Distance (m)" },
  { key: "hsr", label: "HSR (m)" },
  { key: "sprint", label: "Sprint (m)" },
  { key: "load", label: "s-RPE load (AU)" },
] as const;

const positions: Position[] = ["GK", "CB", "FB", "CM", "AM", "W", "ST"];

function AnalyticsPage() {
  const [window, setWindow] = useState<(typeof WINDOWS)[number]>(28);
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("hsr");
  const [selected, setSelected] = useState<string[]>(["p14", "p09", "p03"]);

  const trend = squadTrend(window);
  const metrics = squadMetrics();
  const hsr = squadStats((m) => m.hsr7);

  const half = Math.floor(trend.length / 2);
  const periodA = trend.slice(0, half);
  const periodB = trend.slice(half);
  const mean = (rows: typeof trend, key: (typeof METRICS)[number]["key"]) =>
    Math.round(rows.reduce((a, r) => a + Number(r[key]), 0) / (rows.length || 1));

  const deviations = useMemo(
    () =>
      [...metrics]
        .filter((m) => m.hsr7 > 0)
        .map((m) => ({
          name: m.player.lastName,
          deviation: Math.round(((m.hsr7 - (positionAverage(m.player.position, (x) => x.hsr7) || 1)) / (positionAverage(m.player.position, (x) => x.hsr7) || 1)) * 100),
        }))
        .sort((a, b) => b.deviation - a.deviation)
        .slice(0, 12),
    [metrics],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev));

  return (
    <AppShell title="Analytics" subtitle="Squad trends, position norms, period and player comparison">
      <div className="mb-4 flex flex-wrap gap-2">
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
        <span className="mx-2 h-8 w-px bg-border" />
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              metric === m.key ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Squad mean HSR 7d" value={hsr.mean} unit="m" />
        <MetricCard label="Median" value={hsr.median} unit="m" />
        <MetricCard label="Standard deviation" value={hsr.sd} unit="m" />
        <MetricCard label="Range" value={`${hsr.min}–${hsr.max}`} unit="m" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle title={`Squad trend — ${METRICS.find((m) => m.key === metric)!.label}`} hint={`Last ${window} days`} />
          <TrendBars data={trend} dataKey={metric} height={260} />
        </div>
        <div className="panel p-4">
          <SectionTitle title="Deviation from position average" hint="HSR, last 7 days" />
          <HBar data={deviations} dataKey="deviation" labelKey="name" height={340} color="var(--color-chart-3)" />
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
              {METRICS.map((m) => {
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
