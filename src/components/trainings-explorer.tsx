import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { SectionTitle } from "@/components/perf-ui";
import { PlayerPicker, type Scope } from "@/components/selectors";
import { CHART_KINDS, ChartFrame, MultiChart, type ChartKind } from "@/components/charts";
import {
  blockDistribution,
  customKpis,
  fullName,
  gpsHistory,
  gpsValue,
  players,
  sessionCalendar,
  today,
  useDataVersion,
} from "@/data/performance";
import { guardDemo } from "@/lib/access";

const CORE_KPIS = [
  { key: "distance", label: "Distance (m)" },
  { key: "hsr", label: "High speed running (m)" },
  { key: "sprint", label: "Sprint distance (m)" },
  { key: "maxSpeed", label: "Max speed (km/h)" },
  { key: "accel", label: "Accelerations" },
  { key: "decel", label: "Decelerations" },
  { key: "minutes", label: "Minutes" },
  { key: "rpe", label: "RPE" },
  { key: "load", label: "s-RPE load (AU)" },
] as const;

type View = "days" | "drills";

const round = (n: number) => Math.round(n * 10) / 10;

function csv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => `${r[k] ?? ""}`).join(","))].join(
    "\n",
  );
}

function download(name: string, text: string) {
  if (!guardDemo("Exporting training data")) return;
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const valueOf = (row: (typeof gpsHistory)[number], key: string) =>
  key === "load" ? Math.round((row.rpe ?? 0) * (row.minutes ?? 0)) : gpsValue(row, key);

/**
 * Trainings in three steps: which days, who, and what to see —
 * per training day or split per drill/block of one day.
 */
export function TrainingsExplorer() {
  useDataVersion();
  const trainingDates = useMemo(
    () =>
      [
        ...new Set([...sessionCalendar.map((s) => s.date), ...gpsHistory.map((g) => g.date)]),
      ].sort(),
    [sessionCalendar.length, gpsHistory.length],
  );

  const [view, setView] = useState<View>("days");
  const [scope, setScope] = useState<Scope>("team");
  const [picked, setPicked] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>(["distance"]);
  const [kind, setKind] = useState<ChartKind>("bar");
  const [from, setFrom] = useState(trainingDates[0] ?? today);
  const [to, setTo] = useState(trainingDates.at(-1) ?? today);
  const [dayDate, setDayDate] = useState(trainingDates.at(-1) ?? today);

  const allKpis = useMemo(
    () => [...CORE_KPIS.map((k) => ({ key: k.key as string, label: k.label })), ...customKpis()],
    [gpsHistory.length],
  );

  const activeIds = scope === "players" ? picked : players.map((p) => p.id);

  const rows = useMemo(
    () =>
      gpsHistory.filter((g) => g.date >= from && g.date <= to && activeIds.includes(g.playerId)),
    [from, to, activeIds.join(","), gpsHistory.length],
  );

  const days = useMemo(() => [...new Set(rows.map((r) => r.date))].sort(), [rows]);

  /** One point per training day: team totals, squad average, or one series per chosen player. */
  const perPlayerSeries = scope === "players" && picked.length > 1 && kpis.length === 1;

  const dayChart = useMemo(
    () =>
      days.map((date) => {
        const dayRows = rows.filter((r) => r.date === date);
        const point: Record<string, string | number> = { date: date.slice(5) };
        if (perPlayerSeries) {
          const key = kpis[0]!;
          for (const id of picked) {
            const r = dayRows.find((x) => x.playerId === id);
            point[id] = r ? round(valueOf(r, key)) : 0;
          }
          return point;
        }
        for (const k of kpis) {
          const values = dayRows.map((r) => valueOf(r, k));
          const total = values.reduce((a, b) => a + b, 0);
          point[k] = round(
            scope === "average" || k === "maxSpeed" || k === "rpe"
              ? values.length
                ? total / values.length
                : 0
              : total,
          );
        }
        return point;
      }),
    [days, rows, kpis.join(","), scope, perPlayerSeries, picked.join(",")],
  );

  const daySeries = perPlayerSeries
    ? picked.flatMap((id, i) => {
        const p = players.find((x) => x.id === id);
        return p
          ? [{ key: id, name: fullName(p), color: `var(--color-chart-${(i % 5) + 1})` }]
          : [];
      })
    : kpis.map((k, i) => ({
        key: k,
        name: allKpis.find((m) => m.key === k)?.label ?? k,
        color: `var(--color-chart-${(i % 5) + 1})`,
      }));

  /** One day cut into its drills / blocks. */
  const session = sessionCalendar.find((s) => s.date === dayDate);
  const drillRows = useMemo(() => {
    if (!session) return [];
    const one = scope === "players" && picked.length === 1 ? picked[0] : undefined;
    return blockDistribution(session, one);
  }, [session?.id, dayDate, scope, picked.join(",")]);

  const drillChart = drillRows.map((b) => ({
    date: b.block,
    ...Object.fromEntries(
      kpis.map((k) => [
        k,
        k === "load" ? b.load : ((b as unknown as Record<string, number>)[k] ?? 0),
      ]),
    ),
  }));

  const table = useMemo(
    () =>
      view === "drills"
        ? drillRows.map((b) => ({
            Block: b.block,
            Minutes: b.minutes,
            RPE: b.rpe,
            Distance: b.distance,
            HSR: b.hsr,
            Sprint: b.sprint,
            Accel: b.accel,
            Decel: b.decel,
            Load: b.load,
          }))
        : days.map((date) => {
            const dayRows = rows.filter((r) => r.date === date);
            const s = sessionCalendar.find((x) => x.date === date);
            const sum = (f: (r: (typeof dayRows)[number]) => number) =>
              Math.round(dayRows.reduce((a, r) => a + f(r), 0));
            return {
              Date: date,
              Session: s ? `${s.label} — ${s.title}` : "Unplanned activity",
              Players: dayRows.length,
              Minutes: sum((r) => r.minutes ?? 0),
              Distance: sum((r) => r.distance ?? 0),
              HSR: sum((r) => r.hsr ?? 0),
              Sprint: sum((r) => r.sprint ?? 0),
              Load: sum((r) => (r.rpe ?? 0) * (r.minutes ?? 0)),
            };
          }),
    [view, drillRows, days, rows],
  );

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle
          title="What do you want to see?"
          hint="Compare training days, or open one day drill by drill"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "days", label: "Compare training days" },
              { id: "drills", label: "One day, per drill" },
            ] as Array<{ id: View; label: string }>
          ).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${view === v.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <p className="eyebrow mt-4">Who</p>
        <div className="mt-1">
          <PlayerPicker scope={scope} onScope={setScope} picked={picked} onPicked={setPicked} />
        </div>

        <p className="eyebrow mt-4">What</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {allKpis.map((k) => (
            <button
              key={k.key}
              onClick={() => toggle(kpis, setKpis, k.key)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${kpis.includes(k.key) ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {view === "days" ? (
            <>
              <label className="field">
                <span className="field-label">From</span>
                <input
                  type="date"
                  className="control"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field-label">To</span>
                <input
                  type="date"
                  className="control"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label className="field sm:col-span-2">
              <span className="field-label">Training day</span>
              <select
                className="control"
                value={dayDate}
                onChange={(e) => setDayDate(e.target.value)}
              >
                {trainingDates.length ? (
                  trainingDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))
                ) : (
                  <option value={today}>{today}</option>
                )}
              </select>
            </label>
          )}
          <label className="field sm:col-span-2">
            <span className="field-label">Chart</span>
            <div className="flex flex-wrap gap-1.5">
              {CHART_KINDS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setKind(c.id)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${kind === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </label>
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle
          title={view === "drills" ? `${dayDate} · per drill` : "Training days"}
          hint={
            view === "drills"
              ? session
                ? `${session.label} — ${session.title}`
                : "No planned session on this day"
              : `${days.length} day(s) with data`
          }
          right={
            table.length ? (
              <button
                onClick={() =>
                  download(
                    `t4p-trainings-${view}.csv`,
                    csv(table as Array<Record<string, string | number>>),
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium"
              >
                <Download className="size-3.5" /> Export CSV
              </button>
            ) : undefined
          }
        />
        {kpis.length && (view === "drills" ? drillChart.length : dayChart.length) ? (
          <ChartFrame title={view === "drills" ? `Drills · ${dayDate}` : "Training days"}>
            <MultiChart
              data={view === "drills" ? drillChart : dayChart}
              kind={kind}
              height={300}
              series={
                view === "drills"
                  ? kpis.map((k, i) => ({
                      key: k,
                      name: allKpis.find((m) => m.key === k)?.label ?? k,
                      color: `var(--color-chart-${(i % 5) + 1})`,
                    }))
                  : daySeries
              }
            />
          </ChartFrame>
        ) : (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Pick at least one KPI — and make sure the days you chose have GPS or RPE data.
          </p>
        )}

        {table.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  {Object.keys(table[0]!).map((h) => (
                    <th
                      key={h}
                      className={`py-2 ${h === "Date" || h === "Session" || h === "Block" ? "" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => (
                  <tr key={i} className="border-b border-border/60">
                    {Object.entries(r).map(([k, v]) => (
                      <td
                        key={k}
                        className={`py-2 ${k === "Date" || k === "Session" || k === "Block" ? "" : "text-right tabular-nums"}`}
                      >
                        {typeof v === "number" ? v.toLocaleString() : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
