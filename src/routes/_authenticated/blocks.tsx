import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { ChartFrame, TrendBars, MultiLine } from "@/components/charts";
import {
  blockOccurrences,
  blocksWithGps,
  customKpis,
  fullName,
  gpsBlocks,
  players,
  useDataVersion,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/blocks")({
  head: () => ({
    meta: [
      { title: "Block Comparison — Same Drill, Different Days — T4P" },
      {
        name: "description",
        content:
          "Compare the GPS load of the same training block across different sessions: distance, high-speed running, accelerations and max speed, day by day.",
      },
      { property: "og:title", content: "Block Comparison — Same Drill, Different Days — T4P" },
      {
        property: "og:description",
        content: "See whether your squad produced more or less load in the same block on another training day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlocksPage,
});

const CORE_METRICS = [
  { key: "distance", label: "Distance (m)" },
  { key: "hsr", label: "High-speed running (m)" },
  { key: "sprint", label: "Sprint distance (m)" },
  { key: "maxSpeed", label: "Max speed (km/h)" },
  { key: "accel", label: "Accelerations" },
  { key: "decel", label: "Decelerations" },
  { key: "minutes", label: "Minutes" },
  { key: "jumps", label: "Jumps" },
];

function BlocksPage() {
  useDataVersion();
  const blocks = blocksWithGps();
  const kpis = useMemo(() => {
    const extras = new Set<string>();
    for (const g of gpsBlocks) for (const k of Object.keys(g.extra ?? {})) extras.add(k);
    const labels = new Map(customKpis().map((k) => [k.key, k.label]));
    return [...CORE_METRICS, ...[...extras].map((k) => ({ key: k, label: labels.get(k) ?? k }))];
  }, [gpsBlocks.length]);

  const [block, setBlock] = useState(blocks[0] ?? "");
  const [metric, setMetric] = useState("distance");
  const [playerId, setPlayerId] = useState("");
  const [compareBlock, setCompareBlock] = useState("");

  const rows = useMemo(
    () => (block ? blockOccurrences(block, metric, playerId || undefined) : []),
    [block, metric, playerId, gpsBlocks.length],
  );
  const other = useMemo(
    () => (compareBlock ? blockOccurrences(compareBlock, metric, playerId || undefined) : []),
    [compareBlock, metric, playerId, gpsBlocks.length],
  );

  const merged = useMemo(() => {
    if (!other.length) return rows.map((r) => ({ ...r, a: r.value }));
    const dates = [...new Set([...rows.map((r) => r.date), ...other.map((r) => r.date)])].sort();
    return dates.map((date) => ({
      date,
      a: rows.find((r) => r.date === date)?.value ?? 0,
      b: other.find((r) => r.date === date)?.value ?? 0,
    }));
  }, [rows, other]);

  const metricLabel = kpis.find((k) => k.key === metric)?.label ?? metric;
  const best = rows.length ? rows.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const delta = last && prev ? +(last.value - prev.value).toFixed(1) : 0;

  return (
    <AppShell
      title="Block comparison"
      subtitle="The same block on different training days — did your players give more or less load?"
    >
      {blocks.length === 0 ? (
        <div className="panel p-6 text-sm text-muted-foreground">
          <SectionTitle title="No block-level GPS yet" hint="Import a GPS file split into parts to unlock this page" />
          <p>
            On the GPS Import page, choose the column that cuts the training into parts (period / drill / block), map each
            part to a block of the session and import. T4P then keeps one record per block, so the same block can be
            compared across every training day.
          </p>
        </div>
      ) : (
        <>
          <section className="panel mt-1 p-4">
            <SectionTitle title="What do you want to compare?" hint="Pick a block, a KPI, and optionally one athlete" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="block">
                <span className="eyebrow">Block</span>
                <select className="control mt-1" value={block} onChange={(e) => setBlock(e.target.value)}>
                  {blocks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">KPI</span>
                <select className="control mt-1" value={metric} onChange={(e) => setMetric(e.target.value)}>
                  {kpis.map((k) => (
                    <option key={k.key} value={k.key}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Athlete</span>
                <select className="control mt-1" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
                  <option value="">Squad average</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {fullName(p)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">Second block (optional)</span>
                <select className="control mt-1" value={compareBlock} onChange={(e) => setCompareBlock(e.target.value)}>
                  <option value="">None</option>
                  {blocks
                    .filter((b) => b !== block)
                    .map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Times recorded" value={rows.length} hint="Training days with this block" icon={<Layers className="size-4" />} />
            <MetricCard label={`Last ${metricLabel}`} value={last?.value ?? "—"} hint={last?.date ?? ""} />
            <MetricCard
              label="Vs previous time"
              value={delta ? (delta > 0 ? `+${delta}` : delta) : "—"}
              tone={delta >= 0 ? "good" : "warn"}
              hint={prev?.date ? `previous ${prev.date}` : ""}
            />
            <MetricCard label="Best day" value={best?.value ?? "—"} hint={best?.date ?? ""} />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <ChartFrame title={`${block} — ${metricLabel} (one bar per training day)`}>
              <TrendBars data={rows.map((r) => ({ ...r }))} dataKey="value" xKey="date" />
            </ChartFrame>
            <ChartFrame title={compareBlock ? `${block} vs ${compareBlock} — ${metricLabel}` : `${block} — day-by-day trend`}>
              <MultiLine
                data={merged}
                dualAxis={false}
                series={
                  compareBlock
                    ? [
                        { key: "a", color: "var(--color-chart-1)", name: block },
                        { key: "b", color: "var(--color-chart-2)", name: compareBlock },
                      ]
                    : [{ key: "a", color: "var(--color-chart-1)", name: block }]
                }
              />
            </ChartFrame>
          </section>

          <section className="panel mt-4 p-4">
            <SectionTitle title="Every time this block was trained" hint="Squad average and squad total for the selected KPI" />
            <div className="overflow-x-auto">
              <table className="table-base min-w-[640px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Athletes</th>
                    <th>Avg minutes</th>
                    <th>Average {metricLabel}</th>
                    <th>Total {metricLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td className="text-muted-foreground">{r.sessionTitle ?? "—"}</td>
                      <td>{r.athletes}</td>
                      <td>{r.minutes || "—"}</td>
                      <td className="metric-value">{r.value}</td>
                      <td>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
