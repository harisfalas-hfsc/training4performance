import { useMemo, useState } from "react";
import { SectionTitle, MetricCard } from "@/components/perf-ui";
import { MultiSelectField, SelectField } from "@/components/pickers";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, type ChartKind } from "@/components/charts";
import {
  attendance,
  blockMinutes,
  drillCatalog,
  drillEntries,
  drillSummary,
  type DrillCatalogItem,
} from "@/data/explore";

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
  const [picked, setPicked] = useState<string[]>([]);
  const [kind, setKind] = useState<ChartKind>("bar");
  const [measure, setMeasure] = useState<"times" | "minutes">("times");

  const catalog = useMemo(() => drillCatalog(from, to), [from, to]);
  const entries = useMemo(() => drillEntries(from, to), [from, to]);
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
          title="3. Which drills or tags?"
          hint='Tag drills in the Training Designer (e.g. "Rondo 5v2", "Bulgarian split squat") and they become searchable here'
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelectField
            label="Drills / tags"
            values={picked}
            onChange={setPicked}
            placeholder="Choose drills…"
            searchPlaceholder="Rondo 5v2, passing drill…"
            emptyText="Nothing planned in this date range yet — add drills in the Training Designer."
            options={catalog.map((item) => ({
              value: item.key,
              label: item.label,
              hint: `${item.kind === "tag" ? "tag" : "drill"} · ${item.count}×`,
            }))}
          />
          <SelectField
            label="Measure"
            value={measure}
            onChange={(value) => setMeasure(value as "times" | "minutes")}
            options={[
              { value: "times", label: "How many times" },
              { value: "minutes", label: "Total minutes" },
            ]}
          />
          <SelectField
            label="Chart"
            value={kind}
            onChange={(value) => setKind(value as ChartKind)}
            options={CHART_KINDS.map((c) => ({ value: c.id, label: c.label }))}
          />
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
            <SectionTitle
              title="Selected drills — summary"
              hint="Times, minutes, RPE and the GPS recorded on those days"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Drill / tag</th>
                    <th className="text-right">Times</th>
                    <th className="text-right">Total min</th>
                    <th className="text-right">Avg min</th>
                    <th className="text-right">Avg RPE</th>
                    <th className="text-right">Days used</th>
                    <th className="text-right">Avg load</th>
                    <th className="text-right">Avg dist</th>
                    <th className="text-right">m/min</th>
                    <th className="text-right">Avg HSR</th>
                    <th className="text-right">Peak speed</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((s) => {
                    const g = gpsStats.find((x) => x.label === s.label);
                    return (
                      <tr key={s.label} className="border-t border-border">
                        <td className="py-1.5">{s.label}</td>
                        <td className="text-right tabular-nums">{s.times}</td>
                        <td className="text-right tabular-nums">{s.minutes}</td>
                        <td className="text-right tabular-nums">{s.avgMinutes}</td>
                        <td className="text-right tabular-nums">{s.avgRpe || "—"}</td>
                        <td className="text-right tabular-nums">{s.dates.length}</td>
                        <td className="text-right tabular-nums">{g?.withGps ? g.avgLoad : "—"}</td>
                        <td className="text-right tabular-nums">
                          {g?.withGps ? g.avgDistance.toLocaleString() : "—"}
                        </td>
                        <td className="text-right tabular-nums">{g?.withGps ? g.distancePerMin : "—"}</td>
                        <td className="text-right tabular-nums">
                          {g?.withGps ? g.avgHsr.toLocaleString() : "—"}
                        </td>
                        <td className="text-right tabular-nums">{g?.peakMaxSpeed || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              GPS is recorded per session and split across the blocks of the day, then shared out to each drill by
              its minutes. Peak speed is the highest speed recorded on the days that drill was done.
            </p>
          </section>
        </>
      ) : (
        <p className="panel p-4 text-sm text-muted-foreground">
          Pick one or more drills or tags above to compare them (for example Rondo 5v2 vs passing drill).
        </p>
      )}

      <section className="panel p-4">
        <SectionTitle
          title="Which drill was the hardest?"
          hint="Every tagged drill in the range, ranked by the GPS metric you choose"
          right={
            <span className="text-xs text-muted-foreground">
              {playerIds.length === 1 ? "One athlete" : "Squad average"}
            </span>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Rank by"
            value={metric}
            onChange={(value) => setMetric(value as DrillGpsMetric)}
            options={DRILL_GPS_METRICS.map((m) => ({ value: m.key, label: m.label }))}
          />
        </div>
        {ranked.length ? (
          <>
            <div className="mt-3">
              <ChartFrame title={`Drills ranked by ${metricMeta?.label ?? metric}`}>
                <HBar
                  data={ranked.slice(0, 15).map((row) => ({ name: row.label, value: row[metric] as number }))}
                  dataKey="value"
                  labelKey="name"
                  height={Math.max(220, Math.min(ranked.length, 15) * 26)}
                />
              </ChartFrame>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">#</th>
                    <th>Drill / tag</th>
                    <th className="text-right">{metricMeta?.label ?? metric}</th>
                    <th className="text-right">Times</th>
                    <th className="text-right">With GPS</th>
                    <th className="text-right">Avg min</th>
                    <th className="text-right">Peak speed</th>
                    <th className="text-right">Best speed day</th>
                    <th className="text-right">Last done</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.slice(0, 25).map((row, i) => (
                    <tr key={row.key} className="border-t border-border">
                      <td className="py-1.5 tabular-nums text-muted-foreground">{i + 1}</td>
                      <td>
                        {row.label}
                        <span className="ml-2 text-xs text-muted-foreground">{row.kind}</span>
                      </td>
                      <td className="text-right font-semibold tabular-nums">
                        {(row[metric] as number).toLocaleString()}
                      </td>
                      <td className="text-right tabular-nums">{row.times}</td>
                      <td className="text-right tabular-nums">{row.withGps}</td>
                      <td className="text-right tabular-nums">{row.avgMinutes}</td>
                      <td className="text-right tabular-nums">{row.peakMaxSpeed || "—"}</td>
                      <td className="text-right tabular-nums">{row.peakSpeedDate || "—"}</td>
                      <td className="text-right tabular-nums">{row.dates.at(-1) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing tagged in this date range yet — tag your drills in the Training Designer and upload GPS to see
            this ranking.
          </p>
        )}
      </section>


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
