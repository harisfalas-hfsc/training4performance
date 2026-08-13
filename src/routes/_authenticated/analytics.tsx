import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, GitCompare, Layers } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { Button } from "@/components/ui/button";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, MultiLine, SERIES_COLORS, type ChartKind } from "@/components/charts";
import { DateRangePicker, PlayerPicker, type Scope } from "@/components/selectors";
import { TrainingExplorer } from "@/components/training-explorer";
import { TestsExplorer } from "@/components/tests-explorer";
import { WellnessExplorer } from "@/components/wellness-explorer";
import { MedicalExplorer } from "@/components/medical-explorer";

import {
  customKpis,
  fullName,
  gpsHistory,
  gpsRowLoad,
  gpsValue,
  players,
  useDataVersion,
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
  { key: "load", label: "Training load", unit: "AU" },
] as const;

type MetricKey = string;

/** The three families of data every page follows: people → what about them. */
const SOURCES = [
  { id: "gps", label: "GPS reports" },
  { id: "training", label: "Training & drills" },
  { id: "tests", label: "Fitness tests" },
  { id: "wellness", label: "Wellness" },
  { id: "medical", label: "Medical & availability" },
] as const;
type SourceId = (typeof SOURCES)[number]["id"];

const daysBetween = (from: string, to: string) =>
  Math.max(7, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) || 28);

function AnalyticsPage() {
  useDataVersion();
  const [source, setSource] = useState<SourceId>("gps");
  const [kpis, setKpis] = useState<MetricKey[]>(["distance"]);

  const [kind, setKind] = useState<ChartKind>("bar");
  const [devKey, setDevKey] = useState<MetricKey>("hsr");
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
  const rangeRows = useMemo(
    () => gpsHistory.filter((row) => (!from || row.date >= from) && (!to || row.date <= to)),
    [from, to, gpsHistory.length],
  );
  const activeIds = scope === "players" ? selected : players.map((player) => player.id);
  const selectedRows = useMemo(() => rangeRows.filter((row) => activeIds.includes(row.playerId)), [rangeRows, activeIds.join(",")]);

  const trend = useMemo(() => {
    const dates = [...new Set(selectedRows.map((row) => row.date))].sort();
    return dates.map((date) => {
      const dayRows = selectedRows.filter((row) => row.date === date);
      const point: Record<string, string | number> = { date: date.slice(5) };
      for (const metric of [...METRICS, ...customKpis().map((item) => ({ ...item, unit: "" }))]) {
        const values = dayRows.map((row) => metric.key === "load" ? gpsRowLoad(row) : gpsValue(row, metric.key));
        if (metric.key === "maxSpeed") point[metric.key] = values.length ? Math.max(...values) : 0;
        else if (scope === "team") point[metric.key] = Math.round(values.reduce((a, b) => a + b, 0));
        else point[metric.key] = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
      }
      return point;
    });
  }, [selectedRows, scope]);

  const selectedHsr = useMemo(() => {
    const byPlayer = activeIds.map((id) => selectedRows.filter((row) => row.playerId === id).reduce((sum, row) => sum + row.hsr, 0)).filter((value) => value > 0);
    const mean = byPlayer.length ? byPlayer.reduce((a, b) => a + b, 0) / byPlayer.length : 0;
    const sorted = [...byPlayer].sort((a, b) => a - b);
    return {
      mean: Math.round(mean), median: Math.round(sorted[Math.floor(sorted.length / 2)] ?? 0),
      min: Math.round(sorted[0] ?? 0), max: Math.round(sorted.at(-1) ?? 0),
      sd: Math.round(Math.sqrt(byPlayer.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (byPlayer.length || 1))),
    };
  }, [selectedRows, activeIds.join(",")]);

  /** Core KPIs plus whatever club-specific KPIs the coach's own GPS export brought in. */
  const allMetrics = useMemo(
    () => [
      ...METRICS.map((m) => ({ key: m.key as string, label: m.label, unit: m.unit as string })),
      ...customKpis().map((m) => ({ key: m.key, label: m.label, unit: "" })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gpsHistory.length],
  );

  const half = Math.floor(trend.length / 2);
  const periodA = trend.slice(0, half);
  const periodB = trend.slice(half);
  const mean = (rows: typeof trend, key: MetricKey) =>
    Math.round(rows.reduce((a, r) => a + Number((r as Record<string, unknown>)[key] ?? 0), 0) / (rows.length || 1));

  const devLabel = allMetrics.find((d) => d.key === devKey)?.label ?? devKey;

  const deviations = useMemo(
    () =>
      activeIds
        .map((id) => {
          const player = players.find((item) => item.id === id);
          if (!player) return null;
          const peers = players.filter((item) => item.position === player.position).map((item) => item.id);
          const playerValues = rangeRows.filter((row) => row.playerId === id).map((row) => gpsValue(row, devKey));
          const peerTotals = peers.map((peerId) => rangeRows.filter((row) => row.playerId === peerId).reduce((sum, row) => sum + gpsValue(row, devKey), 0)).filter((value) => value > 0);
          const value = playerValues.reduce((a, b) => a + b, 0);
          const norm = peerTotals.length ? peerTotals.reduce((a, b) => a + b, 0) / peerTotals.length : 0;
          return {
            name: player.lastName,
            deviation: norm ? Math.round(((value - norm) / norm) * 100) : 0,
          };
        })
        .filter((row): row is { name: string; deviation: number } => row !== null)
        .sort((a, b) => b.deviation - a.deviation)
        .slice(0, 12),
    [rangeRows, activeIds.join(","), devKey],
  );

  const toggleKpi = (key: MetricKey) =>
    setKpis((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  const comparisonTrend = useMemo(() => {
    const dates = [...new Set(gpsHistory.filter((row) => selected.includes(row.playerId) && (!from || row.date >= from) && (!to || row.date <= to)).map((row) => row.date))].sort();
    return dates.map((date) => {
      const point: Record<string, string | number> = { date: date.slice(5) };
      for (const id of selected) {
         const row = gpsHistory.find((item) => item.playerId === id && item.date === date);
         if (row) point[id] = compareKpi === "load" ? gpsRowLoad(row) : gpsValue(row, compareKpi);
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
        <SectionTitle
          title="Build your report"
          hint="1. What report · 2. For who · 3. Which KPI — then pick the dates"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="1. Report"
            value={source}
            onChange={(value) => setSource(value as SourceId)}
            options={SOURCES.map((s) => ({ value: s.id, label: s.label }))}
          />
          <SelectField
            label="2. For who"
            value={who}
            onChange={(value) => {
              const next = value as WhoMode;
              setWho(next);
              setScope(next === "total" ? "team" : next === "average" ? "average" : "players");
              if (next === "single") setSelected((prev) => prev.slice(0, 1));
            }}
            options={[
              { value: "total", label: "All players (squad total)" },
              { value: "average", label: "All players (squad average)" },
              { value: "multiple", label: "Multiple players" },
              { value: "single", label: "Single player" },
            ]}
          />
          {who === "multiple" || who === "single" ? (
            <MultiSelectField
              label={who === "single" ? "Player" : "Players"}
              values={selected}
              onChange={setSelected}
              max={who === "single" ? 1 : undefined}
              placeholder={who === "single" ? "Choose a player…" : "Choose players…"}
              searchPlaceholder="Search player…"
              emptyText="No players yet — add them in Team & players."
              options={players.map((p) => ({ value: p.id, label: fullName(p), hint: p.position }))}
            />
          ) : null}
          {source === "gps" ? (
            <MultiSelectField
              label="3. KPI"
              values={kpis}
              onChange={setKpis}
              placeholder="Choose KPIs…"
              searchPlaceholder="Distance, HSR, sprint…"
              emptyText="No GPS KPIs yet — import a GPS report."
              options={allMetrics.map((m) => ({ value: m.key, label: m.label, hint: m.unit }))}
            />
          ) : null}
          {source === "gps" ? (
            <SelectField
              label="Chart"
              value={kind}
              onChange={(value) => setKind(value as ChartKind)}
              options={CHART_KINDS.map((c) => ({ value: c.id, label: c.label }))}
            />
          ) : null}
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
        {!players.length ? (
          <p className="mt-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No players yet. Import a GPS report or add players in Team &amp; players.
          </p>
        ) : null}
      </section>


      {source === "training" ? <TrainingExplorer playerIds={activeIds} from={from} to={to} /> : null}
      {source === "tests" ? <TestsExplorer playerIds={activeIds} from={from} to={to} /> : null}
      {source === "wellness" ? <WellnessExplorer playerIds={activeIds} from={from} to={to} /> : null}
      {source === "medical" ? <MedicalExplorer playerIds={activeIds} from={from} to={to} /> : null}

      {source !== "gps" ? null : (
      <>




      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Mean HSR in selected dates" value={selectedHsr.mean} unit="m" />
        <MetricCard label="Median" value={selectedHsr.median} unit="m" />
        <MetricCard label="Standard deviation" value={selectedHsr.sd} unit="m" />
        <MetricCard label="Range" value={`${selectedHsr.min}–${selectedHsr.max}`} unit="m" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel min-w-0 p-4 xl:col-span-2">
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
        <div className="panel min-w-0 p-4">
          <SectionTitle
            title="Who is above or below his position group?"
            right={
              <select
                className="control h-8 py-0 text-xs"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value as typeof devKey)}
              >
                {allMetrics.filter((metric) => metric.key !== "load" && metric.key !== "rpe").map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            }
          />
          <p className="mb-2 text-xs text-muted-foreground">
             Each bar is one player’s selected-period <strong>{devLabel}</strong> versus players in the <strong>same position</strong>. Right of 0 means more; left means less. This is workload context, not a good/bad score.
          </p>
          <ChartFrame title={`Deviation from position average — ${devLabel}`}>
            <HBar data={deviations} dataKey="deviation" labelKey="name" height={340} unit="%" signColors zeroLine />
          </ChartFrame>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel min-w-0 p-4">
          <SectionTitle title="Period comparison" hint={`First half vs second half of the selected ${window} days`} />
          <p className="mb-2 text-xs text-muted-foreground">
            Period A = the older half of your date range, Period B = the newer half. Δ is the change in %.
          </p>
          <div className="scroll-pane overflow-x-auto">
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
        </div>

        <div className="panel min-w-0 p-4 xl:col-span-2">
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
          <div className="scroll-pane overflow-x-auto">
             <table className="w-full min-w-[1050px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Player</th>
                   <th className="text-right whitespace-nowrap">Distance selected dates (m)</th>
                   <th className="text-right whitespace-nowrap">HSR selected dates (m)</th>
                   <th className="text-right whitespace-nowrap">Sprint selected dates (m)</th>
                  <th className="text-right whitespace-nowrap">Max speed (km/h)</th>
                   <th className="text-right whitespace-nowrap">Average RPE</th>
                   <th className="text-right whitespace-nowrap">Selected load (AU)</th>
                   <th className="text-right whitespace-nowrap">ACWR</th>
                </tr>
              </thead>
              <tbody>
                {selected.map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p) return null;
                   const playerRows = rangeRows.filter((row) => row.playerId === id);
                   const total = (key: string) => playerRows.reduce((sum, row) => sum + gpsValue(row, key), 0);
                   const rpes = playerRows.filter((row) => row.rpe > 0).map((row) => row.rpe);
                   const acute = playerRows.reduce((sum, row) => sum + row.rpe * row.minutes, 0);
                   const chronicDays = Math.max(28, window);
                   const chronicRows = gpsHistory.filter((row) => row.playerId === id && row.date <= to && row.date >= new Date(new Date(`${to}T12:00:00`).getTime() - (chronicDays - 1) * 86_400_000).toISOString().slice(0, 10));
                   const chronic = chronicRows.reduce((sum, row) => sum + row.rpe * row.minutes, 0) / (chronicDays / window);

                  return (
                    <tr key={id} className="border-b border-border/60">
                      <td className="py-2 whitespace-nowrap">{fullName(p)}</td>
                       <td className="text-right tabular-nums">{Math.round(total("distance")).toLocaleString()}</td>
                       <td className="text-right tabular-nums">{Math.round(total("hsr"))}</td>
                       <td className="text-right tabular-nums">{Math.round(total("sprint"))}</td>
                       <td className="text-right tabular-nums">{playerRows.length ? Math.max(...playerRows.map((row) => row.maxSpeed)).toFixed(1) : "—"}</td>
                       <td className="text-right tabular-nums">{rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length).toFixed(1) : "—"}</td>
                       <td className="text-right tabular-nums">{Math.round(acute)}</td>
                       <td className="text-right tabular-nums">{chronic ? (acute / chronic).toFixed(2) : "—"}</td>
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
                     return player ? [{ key: id, color: SERIES_COLORS[index % SERIES_COLORS.length]!, name: fullName(player) }] : [];
                  })}
                  height={260}
                />
              </ChartFrame>
            ) : <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Pick “Selected players” at the top and choose at least one player with GPS data in this date range.</p>}
          </div>
        </div>
      </section>
      </>
      )}
    </AppShell>

  );
}
