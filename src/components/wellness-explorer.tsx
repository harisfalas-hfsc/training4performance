import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/perf-ui";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, type ChartKind } from "@/components/charts";
import { fullName, players } from "@/data/performance";
import {
  WELLNESS_FIELDS,
  entryScore,
  useWellnessVersion,
  wellnessEntries,
  type WellnessEntry,
} from "@/data/wellness";

const chip = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
  }`;

/** Wellness KPIs the coach can chart, exactly like GPS KPIs. */
const WELLNESS_KPIS = [
  { key: "score", label: "Wellness score", unit: "%" },
  { key: "sleepHours", label: "Sleep hours", unit: "h" },
  ...WELLNESS_FIELDS.map((f) => ({ key: f.key as string, label: f.label, unit: "1-5" })),
];

const kpiValue = (entry: WellnessEntry, key: string): number => {
  if (key === "score") return entryScore(entry);
  if (key === "sleepHours") return entry.sleepHours ?? 0;
  return Number((entry as unknown as Record<string, number>)[key] ?? 0);
};

const mean = (values: number[]) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;

/** "Wellness" for the chosen athletes: trend, per-player comparison and ranking. */
export function WellnessExplorer({ playerIds, from, to }: { playerIds: string[]; from: string; to: string }) {
  useWellnessVersion();
  const [kpis, setKpis] = useState<string[]>(["score"]);
  const [kind, setKind] = useState<ChartKind>("line");

  const rows = useMemo(
    () =>
      wellnessEntries.filter(
        (e) => playerIds.includes(e.playerId) && (!from || e.date >= from) && (!to || e.date <= to),
      ),
    [playerIds.join(","), from, to, wellnessEntries.length],
  );

  const active = kpis.length ? kpis : ["score"];

  const trend = useMemo(() => {
    const dates = [...new Set(rows.map((r) => r.date))].sort();
    return dates.map((date) => {
      const dayRows = rows.filter((r) => r.date === date);
      const point: Record<string, string | number> = { date: date.slice(5) };
      for (const kpi of active) point[kpi] = mean(dayRows.map((r) => kpiValue(r, kpi)));
      return point;
    });
  }, [rows, active.join(",")]);

  const comparison = useMemo(
    () =>
      playerIds
        .map((id) => {
          const player = players.find((p) => p.id === id);
          if (!player) return null;
          const mine = rows.filter((r) => r.playerId === id);
          const point: Record<string, string | number> = { name: player.lastName };
          for (const kpi of active) point[kpi] = mean(mine.map((r) => kpiValue(r, kpi)));
          return point;
        })
        .filter((row): row is Record<string, string | number> => row !== null),
    [playerIds.join(","), rows, active.join(",")],
  );

  const ranking = useMemo(
    () =>
      playerIds
        .map((id) => {
          const player = players.find((p) => p.id === id);
          const mine = rows.filter((r) => r.playerId === id);
          return player && mine.length
            ? { name: fullName(player), value: mean(mine.map((r) => entryScore(r))) }
            : null;
        })
        .filter((row): row is { name: string; value: number } => row !== null)
        .sort((a, b) => b.value - a.value),
    [playerIds.join(","), rows],
  );

  const label = (key: string) => WELLNESS_KPIS.find((k) => k.key === key)?.label ?? key;
  const unit = active.length === 1 ? (WELLNESS_KPIS.find((k) => k.key === active[0])?.unit ?? "") : "";
  const responses = rows.length;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle title="Which wellness KPIs?" hint="Daily questionnaire answers — 1 to 5, higher is better" />
        <div className="flex flex-wrap gap-1">
          {WELLNESS_KPIS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={chip(active.includes(k.key))}
              onClick={() =>
                setKpis((prev) => (prev.includes(k.key) ? prev.filter((x) => x !== k.key) : [...prev, k.key]))
              }
            >
              {k.label} <span className="font-normal text-muted-foreground">({k.unit})</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="eyebrow w-full sm:w-auto">Chart</span>
          {CHART_KINDS.map((c) => (
            <button key={c.id} type="button" className={chip(kind === c.id)} onClick={() => setKind(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {responses
            ? `${responses} questionnaire responses in the selected dates.`
            : "No wellness answers in these dates yet — players fill it in from their portal, or you can enter it in Wellness & alerts."}
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle title="Wellness trend" hint="Average of the selected athletes, one point per day" />
          <ChartFrame title="Wellness trend">
            <MultiChart
              data={trend}
              kind={kind === "pie" ? "line" : kind}
              height={280}
              unit={unit}
              series={active.map((k) => ({ key: k, name: label(k) }))}
            />
          </ChartFrame>
        </div>
        <div className="panel p-4">
          <SectionTitle title="Player comparison" hint="Average per athlete over the selected dates" />
          <ChartFrame title="Wellness comparison">
            <MultiChart
              data={comparison}
              kind={kind === "pie" ? "bar" : kind}
              xKey="name"
              height={Math.max(260, comparison.length * 22)}
              unit={unit}
              series={active.map((k) => ({ key: k, name: label(k) }))}
            />
          </ChartFrame>
        </div>
      </section>

      <section className="panel p-4">
        <SectionTitle title="Wellness score ranking" hint="Higher is better — 100% means everything answered at best" />
        <ChartFrame title="Wellness ranking">
          <HBar data={ranking} dataKey="value" labelKey="name" height={Math.max(220, ranking.length * 20)} />
        </ChartFrame>
      </section>
    </div>
  );
}
