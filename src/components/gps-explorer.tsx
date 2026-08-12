import { useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { SectionTitle } from "@/components/perf-ui";
import { CHART_KINDS, ChartFrame, MultiChart, type ChartKind } from "@/components/charts";
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

const CORE_KPIS = [
  { key: "distance", label: "Distance (m)" },
  { key: "hsr", label: "High speed running (m)" },
  { key: "sprint", label: "Sprint distance (m)" },
  { key: "maxSpeed", label: "Max speed (km/h)" },
  { key: "accel", label: "Accelerations" },
  { key: "decel", label: "Decelerations" },
  { key: "minutes", label: "Minutes" },
  { key: "rpe", label: "RPE" },
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

type Scope = "team" | "average" | "players";

/**
 * One place to answer: who (team / average / chosen players), what KPI(s),
 * which dates, and how to draw it. Plus the raw rows behind the picture.
 */
export function GpsExplorer() {
  useDataVersion();
  const dates = useMemo(() => [...new Set(gpsHistory.map((r) => r.date))].sort(), [gpsHistory.length]);
  const [scope, setScope] = useState<Scope>("team");
  const [picked, setPicked] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>(["distance"]);
  const [kind, setKind] = useState<ChartKind>("line");
  const [from, setFrom] = useState(dates[0] ?? today);
  const [to, setTo] = useState(dates.at(-1) ?? today);

  const allKpis = useMemo(
    () => [...CORE_KPIS.map((k) => ({ key: k.key as string, label: k.label })), ...customKpis()],
    [gpsHistory.length],
  );

  const activeIds = scope === "players" ? picked : players.map((p) => p.id);

  const rows = useMemo(
    () =>
      gpsHistory
        .filter((r) => r.date >= from && r.date <= to && activeIds.includes(r.playerId))
        .sort((a, b) => (a.date === b.date ? a.playerId.localeCompare(b.playerId) : b.date.localeCompare(a.date))),
    [from, to, activeIds.join(","), gpsHistory.length],
  );

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
          point[id] = row ? gpsValue(row, key) : 0;
        }
      } else {
        for (const key of kpis) {
          const total = dayRows.reduce((a, r) => a + gpsValue(r, key), 0);
          point[key] = scope === "average" && dayRows.length ? Math.round(total / dayRows.length) : Math.round(total);
        }
      }
      return point;
    });
  }, [rows, kpis.join(","), perPlayerSeries, picked.join(","), scope]);

  const series = perPlayerSeries
    ? picked.flatMap((id) => {
        const p = players.find((x) => x.id === id);
        return p ? [{ key: id, name: fullName(p) }] : [];
      })
    : kpis.map((k) => ({ key: k, name: allKpis.find((m) => m.key === k)?.label ?? k }));

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const chip = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-xs font-semibold ${
      active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
    }`;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle title="1. Who?" hint="The whole team, the squad average, or the players you choose" />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(scope === "team")} onClick={() => setScope("team")}>Whole team (total)</button>
          <button type="button" className={chip(scope === "average")} onClick={() => setScope("average")}>Squad average</button>
          <button type="button" className={chip(scope === "players")} onClick={() => setScope("players")}>Selected players</button>
        </div>
        {scope === "players" && (
          <div className="mt-3 flex flex-wrap gap-1">
            {players.map((p) => (
              <button key={p.id} type="button" className={chip(picked.includes(p.id))} onClick={() => toggle(picked, setPicked, p.id)}>
                {fullName(p)}
              </button>
            ))}
            {!players.length && <p className="text-sm text-muted-foreground">No players yet — import a GPS file first.</p>}
          </div>
        )}
      </section>

      <section className="panel p-4">
        <SectionTitle title="2. What do you want to see?" hint="Pick one KPI or several — and how it should be drawn" />
        <div className="flex flex-wrap gap-1">
          {allKpis.map((k) => (
            <button key={k.key} type="button" className={chip(kpis.includes(k.key))} onClick={() => toggle(kpis, setKpis, k.key)}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1">
            {CHART_KINDS.filter((c) => ["line", "bar", "pie"].includes(c.id)).map((c) => (
              <button key={c.id} type="button" className={chip(kind === c.id)} onClick={() => setKind(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">From</span>
            <input type="date" className="control" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="eyebrow">To</span>
            <input type="date" className="control" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
            onClick={() =>
              download(
                "t4p-gps-rows.csv",
                csv(
                  rows.map((r) => ({
                    date: r.date,
                    player: fullName(players.find((p) => p.id === r.playerId)!) ?? r.playerId,
                    minutes: r.minutes,
                    distance: r.distance,
                    hsr: r.hsr,
                    sprint: r.sprint,
                    maxSpeed: r.maxSpeed,
                    accel: r.accel,
                    decel: r.decel,
                    rpe: r.rpe,
                  })),
                ),
              )
            }
          >
            <Download className="size-4" /> Export rows
          </button>
        </div>
      </section>

      <section className="panel p-4">
        <ChartFrame title="GPS report">
          <MultiChart data={chartData} kind={kind} series={series} height={320} />
        </ChartFrame>
      </section>

      <section className="panel p-0">
        <div className="p-4 pb-0">
          <SectionTitle title="3. The rows behind the graph" hint="Newest first — delete anything that was imported by mistake" />
        </div>
        <div className="scroll-pane max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface-1 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {["Date", "Player", "Min", "Distance", "HSR", "Sprint", "Max speed", "Acc", "Dec", "RPE", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 400).map((r) => {
                const p = players.find((x) => x.id === r.playerId);
                return (
                  <tr key={`${r.date}-${r.playerId}`} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-1.5 tabular-nums">{r.date}</td>
                    <td className="px-3 py-1.5">{p ? fullName(p) : r.playerId}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.minutes}</td>
                    <td className="px-3 py-1.5 tabular-nums">{num(r.distance)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{num(r.hsr)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{num(r.sprint)}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.maxSpeed || "—"}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.accel}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.decel}</td>
                    <td className="px-3 py-1.5 tabular-nums">{r.rpe || "—"}</td>
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
        {!rows.length && (
          <p className="p-4 text-sm text-muted-foreground">No GPS rows for this selection. Change the dates or import a file.</p>
        )}
      </section>
    </div>
  );
}
