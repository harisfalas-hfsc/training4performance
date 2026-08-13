import { useEffect, useMemo, useState } from "react";
import { Download, MoveHorizontal, Trash2 } from "lucide-react";
import { SectionTitle } from "@/components/perf-ui";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, SERIES_COLORS, type ChartKind } from "@/components/charts";
import { DateRangePicker, PlayerPicker, type Scope } from "@/components/selectors";
import { MultiSelectField, SelectField } from "@/components/pickers";
import {
  customKpis,
  fullName,
  gpsHistory,
  gpsValue,
  players,
  removeGps,
  today,
  useDataVersion,
} from "@/data/performance";
import { estimateLoad, kpiMeans, activeLoadKpis } from "@/data/load-model";
import { useLoadModel } from "@/components/load-model-card";

const CORE_KPIS = [
  { key: "distance", label: "Distance", unit: "m" },
  { key: "hsr", label: "High speed running", unit: "m" },
  { key: "sprint", label: "Sprint distance", unit: "m" },
  { key: "maxSpeed", label: "Max speed", unit: "km/h" },
  { key: "accel", label: "Accelerations", unit: "n" },
  { key: "decel", label: "Decelerations", unit: "n" },
  { key: "minutes", label: "Minutes", unit: "min" },
  { key: "rpe", label: "RPE", unit: "0-10" },
] as const;

const num = (v: number) => Math.round(v).toLocaleString();

function csv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => `${r[k] ?? ""}`).join(","))].join("\n");
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const PAGE = 50;

/**
 * One place to answer: who (team / average / chosen players), what KPI(s),
 * which dates, and how to draw it. Plus the raw rows behind the picture.
 */
export function GpsExplorer() {
  useDataVersion();
  const loadModel = useLoadModel();
  /** Squad means are computed once per render so the load column stays cheap. */
  const loadMeans = useMemo(
    () => kpiMeans(activeLoadKpis(loadModel).map((k) => k.key)),
    [loadModel, gpsHistory.length],
  );
  const metricValue = (row: (typeof gpsHistory)[number], key: string) =>
    key === "t4pLoad" ? estimateLoad(row, loadModel, loadMeans) : gpsValue(row, key);
  const dates = useMemo(() => [...new Set(gpsHistory.map((r) => r.date))].sort(), [gpsHistory.length]);
  const [scope, setScope] = useState<Scope>("team");
  const [picked, setPicked] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>(["distance"]);
  const [kind, setKind] = useState<ChartKind>("bar");
  const [from, setFrom] = useState(dates.at(-1) ?? today);
  const [to, setTo] = useState(dates.at(-1) ?? today);
  const [limit, setLimit] = useState(PAGE);

  /** Default to the last 28 days of real data as soon as history is available. */
  useEffect(() => {
    if (!dates.length) return;
    const last = dates.at(-1)!;
    const start = new Date(last);
    start.setDate(start.getDate() - 28);
    setFrom(start.toISOString().slice(0, 10));
    setTo(last);
  }, [dates.length]);

  const allKpis = useMemo(
    () => [
      ...CORE_KPIS.map((k) => ({ key: k.key as string, label: k.label, unit: k.unit as string })),
      { key: "t4pLoad", label: "Training load (calculated)", unit: "AU" },
      ...customKpis().map((k) => ({ key: k.key, label: k.label, unit: "" })),
    ],
    [gpsHistory.length, loadModel],
  );

  const activeIds = scope === "players" ? picked : players.map((p) => p.id);

  const rows = useMemo(
    () =>
      gpsHistory
        .filter((r) => r.date >= from && r.date <= to && activeIds.includes(r.playerId))
        .sort((a, b) => (a.date === b.date ? a.playerId.localeCompare(b.playerId) : b.date.localeCompare(a.date))),
    [from, to, activeIds.join(","), gpsHistory.length],
  );

  useEffect(() => setLimit(PAGE), [from, to, activeIds.join(",")]);

  const perPlayerSeries = scope === "players" && picked.length > 1 && kpis.length === 1;

  const chartData = useMemo(() => {
    const days = [...new Set(rows.map((r) => r.date))].sort();
    return days.map((date) => {
      const dayRows = rows.filter((r) => r.date === date);
      const point: Record<string, string | number> = { date: date.slice(5) };
      if (perPlayerSeries) {
        const key = kpis[0]!;
        for (const id of picked) {
          const row = dayRows.find((r) => r.playerId === id);
           if (row) point[id] = metricValue(row, key);
        }
      } else {
        for (const key of kpis) {
          const total = dayRows.reduce((a, r) => a + metricValue(r, key), 0);
          point[key] = scope === "average" && dayRows.length ? Math.round(total / dayRows.length) : Math.round(total);
        }
      }
      return point;
    });
  }, [rows, kpis.join(","), perPlayerSeries, picked.join(","), scope]);

  const series = perPlayerSeries
    ? picked.flatMap((id) => {
        const p = players.find((x) => x.id === id);
         return p ? [{ key: id, name: fullName(p), color: SERIES_COLORS[picked.indexOf(id) % SERIES_COLORS.length] }] : [];
      })
    : kpis.map((k) => ({ key: k, name: allKpis.find((m) => m.key === k)?.label ?? k }));

  const kpiNames = kpis.map((k) => allKpis.find((m) => m.key === k)?.label ?? k);
  const unit = kpis.length === 1 ? (allKpis.find((m) => m.key === kpis[0])?.unit ?? "") : "";
  const whoLabel =
    scope === "team" ? "whole squad (sum of all players)" : scope === "average" ? "squad average per player" : `${picked.length} selected player(s)`;
  const caption = perPlayerSeries
    ? `Each colour is one player · ${kpiNames[0]} per training day`
    : `Each colour is one KPI (${kpiNames.join(", ") || "none selected"}) · ${whoLabel} · one point per training day`;

  const playerSummary = useMemo(() => {
    if (!perPlayerSeries) return [];
    const key = kpis[0];
    if (!key) return [];
    return picked.flatMap((id) => {
      const player = players.find((item) => item.id === id);
      const playerRows = rows.filter((row) => row.playerId === id);
      if (!player || !playerRows.length) return [];
      const values = playerRows.map((row) => metricValue(row, key));
      const value = key === "maxSpeed" ? Math.max(...values) : key === "rpe" ? values.reduce((a, b) => a + b, 0) / values.length : values.reduce((a, b) => a + b, 0);
      return [{ name: fullName(player), value: Math.round(value * 10) / 10 }];
    });
  }, [perPlayerSeries, picked.join(","), rows, kpis.join(",")]);

  /** Extra KPI columns imported from the coach's own GPS export. */
  const extraColumns = useMemo(() => customKpis(), [gpsHistory.length]);

  const exportRows = () =>
    download(
      "t4p-gps-rows.csv",
      csv(
        rows.map((r) => {
          const p = players.find((x) => x.id === r.playerId);
          const base: Record<string, string | number> = {
            date: r.date,
            player: p ? fullName(p) : r.playerId,
            minutes: r.minutes,
            distance: r.distance,
            hsr: r.hsr,
            sprint: r.sprint,
            maxSpeed: r.maxSpeed,
            accel: r.accel,
            decel: r.decel,
            rpe: r.rpe,
          };
          for (const column of extraColumns) base[column.label] = gpsValue(r, column.key);
          base["training load (AU)"] = metricValue(r, "t4pLoad");
          return base;
        }),
      ),
    );

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle title="Build your report" hint="Pick who you are looking at, the KPIs and the dates" />
        <div className="space-y-3">
          <PlayerPicker scope={scope} onScope={setScope} picked={picked} onPicked={setPicked} />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MultiSelectField
              label="KPIs"
              values={kpis}
              onChange={setKpis}
              options={allKpis.map((k) => ({ value: k.key, label: k.label, ...(k.unit ? { hint: k.unit } : {}) }))}
              placeholder="Choose KPIs…"
              searchPlaceholder="Search KPI…"
            />
            <SelectField
              label="Chart"
              value={kind}
              onChange={(value) => setKind(value as ChartKind)}
              options={CHART_KINDS.map((c) => ({ value: c.id, label: c.label }))}
            />
          </div>
          <DateRangePicker
            from={from}
            to={to}
            onChange={(a, b) => { setFrom(a); setTo(b); }}
            earliest={dates[0]}
            latest={dates.at(-1)}
          />
        </div>
      </section>


      <section className="panel p-4">
        {perPlayerSeries && playerSummary.length ? (
          <div className="mb-5 border-b border-border pb-5">
            <SectionTitle title="Selected-period comparison" hint="One bar per player. The number is the period total; max speed uses the peak and RPE uses the average." />
            <ChartFrame title={`${kpiNames[0]} player comparison`}>
              <HBar data={playerSummary} dataKey="value" labelKey="name" height={Math.max(180, playerSummary.length * 48)} {...(unit ? { unit: ` ${unit}` } : {})} categoryColors />
            </ChartFrame>
          </div>
        ) : null}
        <SectionTitle title={perPlayerSeries ? "Day-by-day comparison" : "GPS trend"} hint={perPlayerSeries ? "Every player has a different colour and line pattern." : undefined} />
        <ChartFrame title={`GPS report — ${kpiNames.join(", ") || "no KPI"}`}>
          <MultiChart data={chartData} kind={kind} series={series} height={320} unit={unit} />
        </ChartFrame>
        <p className="mt-2 text-xs text-muted-foreground">{caption}. Hover any bar or point to read the exact number.</p>
      </section>

      <section className="panel p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <SectionTitle
            title="3. The rows behind the graph"
            hint={`${rows.length} row(s) between ${from} and ${to} — newest first`}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
            onClick={exportRows}
          >
            <Download className="size-4" /> Export rows
          </button>
        </div>
        <p className="flex items-center gap-1 px-4 pb-2 text-xs text-muted-foreground">
          <MoveHorizontal className="size-3.5" /> Swipe or scroll sideways to see every KPI column.
        </p>
        <div className="scroll-pane max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface-1 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {["Date", "Player", "Min", "Distance (m)", "HSR (m)", "Sprint (m)", "Max speed (km/h)", "Acc", "Dec", "RPE"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
                {extraColumns.map((column) => (
                  <th key={column.key} className="px-3 py-2 font-medium whitespace-nowrap">{column.label}</th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r) => {
                const p = players.find((x) => x.id === r.playerId);
                return (
                  <tr key={`${r.date}-${r.playerId}`} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-1.5 tabular-nums whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{p ? fullName(p) : r.playerId}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.minutes}</td>
                    <td className="px-3 py-1.5 tabular-nums">{num(r.distance)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{num(r.hsr)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{num(r.sprint)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.maxSpeed || "—"}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.accel}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.decel}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.rpe || "—"}</td>
                    {extraColumns.map((column) => (
                      <td key={column.key} className="px-3 py-1.5 tabular-nums">{num(gpsValue(r, column.key)) || "—"}</td>
                    ))}
                    <td className="px-3 py-1.5 text-right">
                      <button
                        type="button"
                        aria-label="Delete GPS row"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeGps(r.date, r.playerId)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > limit && (
          <div className="border-t border-border p-3 text-center">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
              onClick={() => setLimit((value) => value + PAGE)}
            >
              Show {Math.min(PAGE, rows.length - limit)} more of {rows.length}
            </button>
          </div>
        )}
        {!rows.length && (
          <p className="p-4 text-sm text-muted-foreground">No GPS rows for this selection. Change the dates or import a file.</p>
        )}
      </section>
    </div>
  );
}
