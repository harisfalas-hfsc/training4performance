import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SectionTitle, MetricCard } from "@/components/perf-ui";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, type ChartKind } from "@/components/charts";
import {
  attendance,
  blockMinutes,
  drillCatalog,
  drillEntries,
  drillSummary,
  type DrillCatalogItem,
} from "@/data/explore";

const chip = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
  }`;

/**
 * "Training & drills" answers: how many sessions did this player attend, how
 * many times did we do Rondo 5v2, how long did it last, and how does it
 * compare with the passing drill.
 */
export function TrainingExplorer({
  playerIds,
  from,
  to,
}: {
  playerIds: string[];
  from: string;
  to: string;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [kind, setKind] = useState<ChartKind>("bar");
  const [measure, setMeasure] = useState<"times" | "minutes">("times");

  const catalog = useMemo(() => drillCatalog(from, to), [from, to]);
  const entries = useMemo(() => drillEntries(from, to), [from, to]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? catalog.filter((item) => item.label.toLowerCase().includes(q)) : catalog).slice(0, 40);
  }, [catalog, query]);

  const chosen: DrillCatalogItem[] = catalog.filter((item) => picked.includes(item.key));
  const summaries = useMemo(
    () => chosen.map((item) => drillSummary(item, playerIds, from, to)),
    [chosen.map((c) => c.key).join(","), playerIds.join(","), from, to],
  );

  const rows = useMemo(() => attendance(playerIds, from, to), [playerIds.join(","), from, to]);
  const blocks = useMemo(() => blockMinutes(from, to), [from, to]);

  const compareData = summaries.map((s) => ({ name: s.label, value: measure === "times" ? s.times : s.minutes }));
  const perPlayerData = rows.map((row) => {
    const point: Record<string, string | number> = { name: row.name };
    summaries.forEach((s) => {
      const hit = s.perPlayer.find((p) => p.playerId === row.playerId);
      point[s.label] = hit ? (measure === "times" ? hit.times : hit.minutes) : 0;
    });
    return point;
  });

  const totalMinutes = entries.reduce((a, e) => a + e.minutes, 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Training sessions in range" value={rows[0]?.sessions ?? 0} unit="" />
        <MetricCard label="Drills / exercises planned" value={entries.length} unit="" />
        <MetricCard label="Planned training time" value={totalMinutes} unit="min" />
        <MetricCard
          label="Average attendance"
          value={rows.length ? Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length) : 0}
          unit="%"
        />
      </section>

      <section className="panel p-4">
        <SectionTitle
          title="Search a drill, tag or exercise"
          hint='Tag drills in the Training Designer (e.g. "Rondo 5v2", "Bulgarian split squat") and they become searchable here'
        />
        <div className="control flex max-w-sm items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rondo 5v2, passing drill, split squat…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {filtered.map((item) => (
            <button
              key={item.key}
              type="button"
              className={chip(picked.includes(item.key))}
              onClick={() =>
                setPicked((prev) => (prev.includes(item.key) ? prev.filter((x) => x !== item.key) : [...prev, item.key]))
              }
            >
              {item.label}
              <span className="ml-1 font-normal text-muted-foreground">
                {item.kind === "tag" ? "tag" : "drill"} · {item.count}×
              </span>
            </button>
          ))}
          {!filtered.length ? (
            <p className="text-sm text-muted-foreground">
              Nothing planned in this date range yet — add drills in the Training Designer.
            </p>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="eyebrow w-full sm:w-auto">Measure</span>
          <button type="button" className={chip(measure === "times")} onClick={() => setMeasure("times")}>
            How many times
          </button>
          <button type="button" className={chip(measure === "minutes")} onClick={() => setMeasure("minutes")}>
            Total minutes
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="eyebrow w-full sm:w-auto">Chart</span>
          {CHART_KINDS.map((c) => (
            <button key={c.id} type="button" className={chip(kind === c.id)} onClick={() => setKind(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {summaries.length ? (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <div className="panel p-4">
              <SectionTitle title="Drill comparison" hint={measure === "times" ? "Times performed" : "Minutes spent"} />
              <ChartFrame title="Drill comparison">
                <MultiChart
                  data={compareData}
                  kind={kind}
                  xKey="name"
                  height={260}
                  unit={measure === "minutes" ? "min" : ""}
                  series={[{ key: "value", name: measure === "times" ? "Times" : "Minutes" }]}
                />
              </ChartFrame>
            </div>
            <div className="panel p-4">
              <SectionTitle title="Per athlete" hint="Counted from the sessions each athlete actually attended" />
              <ChartFrame title="Drill per athlete">
                <MultiChart
                  data={perPlayerData}
                  kind={kind === "pie" ? "bar" : kind}
                  xKey="name"
                  height={Math.max(260, perPlayerData.length * 22)}
                  unit={measure === "minutes" ? "min" : ""}
                  series={summaries.map((s) => ({ key: s.label, name: s.label }))}
                />
              </ChartFrame>
            </div>
          </section>

          <section className="panel p-4">
            <SectionTitle title="Selected drills — summary" hint="Times, minutes and average RPE in the chosen dates" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Drill / tag</th>
                    <th className="text-right">Times</th>
                    <th className="text-right">Total min</th>
                    <th className="text-right">Avg min</th>
                    <th className="text-right">Avg RPE</th>
                    <th className="text-right">Days used</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => (
                    <tr key={s.label} className="border-t border-border">
                      <td className="py-1.5">{s.label}</td>
                      <td className="text-right tabular-nums">{s.times}</td>
                      <td className="text-right tabular-nums">{s.minutes}</td>
                      <td className="text-right tabular-nums">{s.avgMinutes}</td>
                      <td className="text-right tabular-nums">{s.avgRpe || "—"}</td>
                      <td className="text-right tabular-nums">{s.dates.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p className="panel p-4 text-sm text-muted-foreground">
          Pick one or more drills or tags above to compare them (for example Rondo 5v2 vs passing drill).
        </p>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle title="Attendance" hint="Sessions attended in the selected dates" />
          {rows.length ? (
            <ChartFrame title="Attendance">
              <HBar
                data={rows.map((row) => ({ name: row.name, value: row.pct }))}
                dataKey="value"
                labelKey="name"
                height={Math.max(220, rows.length * 20)}
              />
            </ChartFrame>
          ) : (
            <p className="text-sm text-muted-foreground">Pick players first.</p>
          )}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Player</th>
                  <th className="text-right">Attended</th>
                  <th className="text-right">Sessions</th>
                  <th className="text-right">%</th>
                  <th className="text-right">Minutes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.playerId} className="border-t border-border">
                    <td className="py-1.5">{row.name}</td>
                    <td className="text-right tabular-nums">{row.attended}</td>
                    <td className="text-right tabular-nums">{row.sessions}</td>
                    <td className="text-right tabular-nums">{row.pct}%</td>
                    <td className="text-right tabular-nums">{row.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle title="Where the time went" hint="Planned minutes per training block" />
          {blocks.length ? (
            <ChartFrame title="Minutes per block">
              <MultiChart
                data={blocks.map((b) => ({ name: b.name, value: b.minutes }))}
                kind={kind === "line" ? "bar" : kind}
                xKey="name"
                height={280}
                unit="min"
                series={[{ key: "value", name: "Minutes" }]}
              />
            </ChartFrame>
          ) : (
            <p className="text-sm text-muted-foreground">No training planned in this date range.</p>
          )}
        </div>
      </section>
    </div>
  );
}
