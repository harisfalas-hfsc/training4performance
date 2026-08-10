import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Image } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { MultiLine, TrendBars } from "@/components/charts";
import {
  availabilitySummary,
  avg,
  fullName,
  medicalEvents,
  players,
  playerWellness,
  squadMetrics,
  squadStats,
  squadTrend,
  team,
  wellnessScore,
} from "@/data/performance";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "One-Click Reports — Football Performance OS" },
      {
        name: "description",
        content:
          "Presentation-ready team and player reports by audience and period, with graphs, workload, availability and export options.",
      },
      { property: "og:title", content: "One-Click Reports" },
      { property: "og:description", content: "Select team, period and audience — the report builds itself." },
    ],
  }),
  component: ReportsPage,
});

const AUDIENCES = ["Fitness staff", "Head coach", "Technical director", "Club management", "Player"] as const;
const PERIODS = ["Last 7 days", "Last 14 days", "Last 28 days", "Season"] as const;

function ReportsPage() {
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("Head coach");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Last 28 days");
  const [generated, setGenerated] = useState(false);

  const days = period === "Last 7 days" ? 7 : period === "Last 14 days" ? 14 : 28;
  const trend = squadTrend(days);
  const metrics = squadMetrics();
  const hsr = squadStats((m) => m.hsr7);
  const availability = +avg(players.map((p) => availabilitySummary(p.id).availability)).toFixed(1);
  const wellness = Math.round(avg(players.map((p) => wellnessScore(playerWellness(p.id)))));
  const showMedical = audience === "Fitness staff" || audience === "Head coach";

  return (
    <AppShell
      title="Reports"
      subtitle="Team and player reports generated from the connected database"
      actions={
        <button
          onClick={() => setGenerated(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          Generate report
        </button>
      }
    >
      <section className="panel p-4">
        <SectionTitle title="Report setup" hint="Team · period · audience" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-2">Period</p>
            <div className="flex flex-wrap gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                    period === p ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-2">Audience</p>
            <div className="flex flex-wrap gap-1">
              {AUDIENCES.map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                    audience === a ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="eyebrow">{audience} report</p>
            <h2 className="text-2xl font-semibold uppercase">
              {team.club} · {team.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {team.season} · {period} · {team.competition}
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { label: "PDF", icon: FileText },
              { label: "Excel", icon: FileSpreadsheet },
              { label: "PNG", icon: Image },
              { label: "CSV", icon: Download },
            ].map((e) => (
              <button
                key={e.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <e.icon className="size-3.5" /> {e.label}
              </button>
            ))}
          </div>
        </div>

        {generated ? (
          <div className="mt-4 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Squad size" value={players.length} />
              <MetricCard label="Mean HSR 7d" value={hsr.mean} unit="m" />
              <MetricCard label="Availability" value={`${availability}%`} tone={availability > 90 ? "good" : "warn"} />
              <MetricCard label="Wellness index" value={`${wellness}%`} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <p className="eyebrow mb-1">Training load</p>
                <TrendBars data={trend} dataKey="load" height={200} />
              </div>
              <div>
                <p className="eyebrow mb-1">GPS output</p>
                <MultiLine
                  data={trend}
                  series={[
                    { key: "distance", color: "var(--color-chart-1)", name: "Distance" },
                    { key: "hsr", color: "var(--color-chart-2)", name: "HSR" },
                    { key: "sprint", color: "var(--color-chart-3)", name: "Sprint" },
                  ]}
                  height={200}
                />
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Player summary</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Player</th>
                      <th className="text-right">Distance 7d</th>
                      <th className="text-right">HSR 7d</th>
                      <th className="text-right">Sprint 7d</th>
                      <th className="text-right">Acute load</th>
                      <th className="text-right">ACWR</th>
                      <th className="text-right">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.player.id} className="border-b border-border/60">
                        <td className="py-1.5">{fullName(m.player)}</td>
                        <td className="text-right tabular-nums">{m.distance7.toLocaleString()}</td>
                        <td className="text-right tabular-nums">{m.hsr7}</td>
                        <td className="text-right tabular-nums">{m.sprint7}</td>
                        <td className="text-right tabular-nums">{m.load.acute}</td>
                        <td className="text-right tabular-nums">{m.load.acwr || "—"}</td>
                        <td className="text-right tabular-nums">{availabilitySummary(m.player.id).availability}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="eyebrow mb-2">Medical & availability</p>
              {showMedical ? (
                <ul className="space-y-1.5 text-sm">
                  {medicalEvents.map((e, i) => (
                    <li key={i} className="flex flex-wrap justify-between gap-2 rounded-md border border-border p-2.5">
                      <span>
                        {fullName(players.find((p) => p.id === e.playerId)!)} · {e.type}: {e.area}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {e.from} → {e.to} · {e.daysLost} days lost · {e.stage}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                  Detailed medical information is withheld from the {audience.toLowerCase()} report. Availability percentage is
                  reported instead: {availability}%.
                </p>
              )}
            </div>

            <div>
              <p className="eyebrow mb-2">Key observations</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>Mean high-speed running of {hsr.mean} m per player over the last 7 days (sd {hsr.sd} m).</li>
                <li>
                  {metrics.filter((m) => m.load.acwr > 1.35).length} players above the upper acute:chronic monitoring threshold.
                </li>
                <li>Squad availability at {availability}% across recorded sessions.</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Select the period and audience, then press Generate report. No copying into slides, no manual graphs.
          </p>
        )}
      </section>
    </AppShell>
  );
}
