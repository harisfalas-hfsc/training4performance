import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, type ChartKind } from "@/components/charts";
import {
  fullName,
  gpsHistory,
  players,
  sessionCalendar,
  useDataVersion,
  type GpsDay,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({
    meta: [
      { title: "Compare & Graphs — T4P" },
      {
        name: "description",
        content:
          "Compare players against each other and against the squad on distance, high-speed running, speed zones, sprints and max speed, and compare one training day with another.",
      },
      { property: "og:title", content: "Compare & Graphs — T4P" },
      {
        property: "og:description",
        content: "Player vs player, player vs team and day vs day comparison graphs, exportable for the coaching staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

const METRICS = [
  { key: "distance", label: "Total distance (m)" },
  { key: "zone1", label: "Zone 1 distance (m)" },
  { key: "zone2", label: "Zone 2 distance (m)" },
  { key: "zone3", label: "Zone 3 distance (m)" },
  { key: "hsr", label: "High-speed running (m)" },
  { key: "sprint", label: "Sprint distance (m)" },
  { key: "maxSpeed", label: "Max speed (km/h)" },
  { key: "accel", label: "Accelerations" },
  { key: "decel", label: "Decelerations" },
  { key: "jumps", label: "Jumps" },
  { key: "load", label: "Session load (AU)" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

/** Speed zones derived from the recorded bands: zone 3 = sprint, 2 = HSR, 1 = the rest. */
function metricOf(g: GpsDay, key: MetricKey): number {
  switch (key) {
    case "zone3":
      return g.sprint;
    case "zone2":
      return Math.max(0, g.hsr - g.sprint);
    case "zone1":
      return Math.max(0, g.distance - g.hsr);
    case "load":
      return Math.round(g.rpe * g.minutes);
    case "jumps":
      return g.jumps ?? 0;
    default:
      return (g[key as keyof GpsDay] as number) ?? 0;
  }
}

const dates = () => [...new Set(gpsHistory.map((g) => g.date))].sort();

function ComparePage() {
  useDataVersion();
  const allDates = dates();
  const [metric, setMetric] = useState<MetricKey>("distance");
  const [extraMetrics, setExtraMetrics] = useState<MetricKey[]>(["hsr", "sprint"]);
  const [kind, setKind] = useState<ChartKind>("line");
  const [dayKind, setDayKind] = useState<ChartKind>("bar");
  const [dayA, setDayA] = useState(allDates[allDates.length - 1] ?? "");
  const [dayB, setDayB] = useState(allDates[allDates.length - 2] ?? "");
  const [selected, setSelected] = useState<string[]>(() => players.slice(0, 3).map((p) => p.id));

  const label = METRICS.find((m) => m.key === metric)!.label;
  const tableMetrics = [metric, ...extraMetrics.filter((m) => m !== metric)];


  /* squad ranking on day A */
  const ranking = useMemo(() => {
    const rows = gpsHistory.filter((g) => g.date === dayA);
    return rows
      .map((g) => ({ name: fullName(players.find((p) => p.id === g.playerId) ?? players[0]!), value: metricOf(g, metric) }))
      .sort((a, b) => b.value - a.value);
  }, [dayA, metric]);

  const teamAvgA = ranking.length ? ranking.reduce((a, b) => a + b.value, 0) / ranking.length : 0;

  /* day vs day, per position group */
  const dayVsDay = useMemo(() => {
    const forDay = (d: string) => {
      const rows = gpsHistory.filter((g) => g.date === d);
      return rows.length ? rows.reduce((a, g) => a + metricOf(g, metric), 0) / rows.length : 0;
    };
    return [
      { name: dayB || "—", value: Math.round(forDay(dayB)) },
      { name: dayA || "—", value: Math.round(forDay(dayA)) },
    ];
  }, [dayA, dayB, metric]);

  /* trend: selected players vs team average */
  const trend = useMemo(() => {
    return allDates.slice(-14).map((d) => {
      const rows = gpsHistory.filter((g) => g.date === d);
      const row: Record<string, string | number> = { date: d.slice(5) };
      row["Team avg"] = rows.length ? Math.round(rows.reduce((a, g) => a + metricOf(g, metric), 0) / rows.length) : 0;
      selected.forEach((id) => {
        const g = rows.find((r) => r.playerId === id);
        const p = players.find((x) => x.id === id);
        if (p) row[p.lastName] = g ? Math.round(metricOf(g, metric)) : 0;
      });
      return row;
    });
  }, [selected, metric, allDates]);

  const colors = ["var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];
  const series = [
    { key: "Team avg", color: "var(--color-chart-1)", name: "Team average" },
    ...selected.slice(0, 4).map((id, i) => {
      const p = players.find((x) => x.id === id)!;
      return { key: p.lastName, color: colors[i % colors.length]!, name: fullName(p) };
    }),
  ];

  const exportCsv = () => {
    const head = ["Player", label, "Team average", "Difference"];
    const lines = ranking.map((r) => [r.name, r.value, Math.round(teamAvgA), Math.round(r.value - teamAvgA)].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `t4p-compare-${metric}-${dayA}.csv`;
    a.click();
  };

  const sessionA = sessionCalendar.find((s) => s.date === dayA);
  const sessionB = sessionCalendar.find((s) => s.date === dayB);

  return (
    <AppShell title="Compare & Graphs" subtitle="Player vs player · player vs squad · day vs day">
      <section className="panel p-4">
        <SectionTitle
          title="What do you want to compare?"
          hint="Every graph below follows this selection"
          right={
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Download className="size-4" /> Export CSV
            </button>
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-[0.68rem] text-muted-foreground">
            Metric
            <select value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)} className="control h-9">
              {METRICS.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.68rem] text-muted-foreground">
            Day A
            <select value={dayA} onChange={(e) => setDayA(e.target.value)} className="control h-9">
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.68rem] text-muted-foreground">
            Day B
            <select value={dayB} onChange={(e) => setDayB(e.target.value)} className="control h-9">
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3">
          <p className="eyebrow mb-1">
            <Users className="mr-1 inline size-3" /> Players on the trend graph (max 4)
          </p>
          <div className="flex flex-wrap gap-1">
            {players.map((p) => {
              const on = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() =>
                    setSelected((prev) => (on ? prev.filter((x) => x !== p.id) : [...prev, p.id].slice(-4)))
                  }
                  className={`rounded-md border px-2 py-1 text-xs ${
                    on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {p.lastName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="eyebrow mb-1">Extra KPIs for the comparison table</p>
            <div className="flex flex-wrap gap-1">
              {METRICS.filter((m) => m.key !== metric).map((m) => {
                const on = extraMetrics.includes(m.key);
                return (
                  <button
                    key={m.key}
                    onClick={() =>
                      setExtraMetrics((prev) => (on ? prev.filter((x) => x !== m.key) : [...prev, m.key]))
                    }
                    className={`rounded-md border px-2 py-1 text-xs ${
                      on ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-1">Graph style</p>
            <div className="flex flex-wrap gap-1">
              {CHART_KINDS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setKind(c.id)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    kind === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="eyebrow mb-1 mt-2">Day vs day style</p>
            <div className="flex flex-wrap gap-1">
              {CHART_KINDS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDayKind(c.id)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    dayKind === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle title={`Squad ranking — ${dayA}`} hint={`${label} · team average ${Math.round(teamAvgA).toLocaleString()}`} />
          {ranking.length ? (
            <ChartFrame title={`Squad ranking ${dayA}`}>
              <HBar data={ranking} dataKey="value" labelKey="name" height={Math.max(260, ranking.length * 18)} />
            </ChartFrame>
          ) : (
            <p className="text-sm text-muted-foreground">No GPS data recorded for {dayA}.</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <SectionTitle
              title="Day vs day"
              hint={`${sessionB?.type ?? sessionB?.title ?? "Day B"} → ${sessionA?.type ?? sessionA?.title ?? "Day A"}`}
            />
            <ChartFrame title="Day vs day">
              <MultiChart
                data={dayVsDay}
                kind={dayKind}
                xKey="name"
                height={200}
                series={[{ key: "value", name: label }]}
              />
            </ChartFrame>
            <p className="mt-1 text-xs text-muted-foreground">
              Squad average {label.toLowerCase()} — difference{" "}
              <span className="text-foreground">
                {(dayVsDay[1]!.value - dayVsDay[0]!.value).toLocaleString()} (
                {dayVsDay[0]!.value ? Math.round(((dayVsDay[1]!.value - dayVsDay[0]!.value) / dayVsDay[0]!.value) * 100) : 0}%)
              </span>
            </p>
          </div>

          <div className="panel p-4">
            <SectionTitle title="Players vs team average" hint="Last 14 recorded days" />
            <ChartFrame title="Players vs team average">
              <MultiChart data={trend} series={series} kind={kind} height={240} />
            </ChartFrame>
          </div>
        </div>

      </section>

      <section className="panel mt-4 p-4">
        <SectionTitle
          title="Comparison table"
          hint={`${tableMetrics.length} KPI(s) on ${dayA} — primary metric compared with the squad average`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">#</th>
                <th>Player</th>
                {tableMetrics.map((k) => (
                  <th key={k} className="text-right">
                    {METRICS.find((m) => m.key === k)!.label}
                  </th>
                ))}
                <th className="text-right">vs team</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => {
                const diff = Math.round(r.value - teamAvgA);
                const row = gpsHistory.find(
                  (g) => g.date === dayA && fullName(players.find((p) => p.id === g.playerId) ?? players[0]!) === r.name,
                );
                return (
                  <tr key={r.name} className="border-t border-border">
                    <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                    <td>{r.name}</td>
                    {tableMetrics.map((k) => (
                      <td key={k} className="text-right tabular-nums">
                        {row ? Math.round(metricOf(row, k)).toLocaleString() : "—"}
                      </td>
                    ))}
                    <td className={`text-right tabular-nums ${diff >= 0 ? "text-success" : "text-warning"}`}>
                      {diff >= 0 ? "+" : ""}
                      {diff.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </AppShell>
  );
}
