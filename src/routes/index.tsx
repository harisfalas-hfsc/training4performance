import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, HeartPulse, Timer, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AcwrPill, AvailabilityPill, MetricCard, SectionTitle } from "@/components/perf-ui";
import { MultiLine, TrendBars } from "@/components/charts";
import {
  alerts,
  avg,
  fullName,
  getPlayer,
  players,
  playerWellness,
  sessionCalendar,
  squadAvailability,
  squadMetrics,
  squadStats,
  squadTrend,
  today,
  wellnessScore,
} from "@/data/performance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coach Dashboard — T4P — Training 4 Performance" },
      {
        name: "description",
        content:
          "Daily squad availability, training load, GPS response and attention list for football fitness and performance staff.",
      },
      { property: "og:title", content: "Coach Dashboard — T4P — Training 4 Performance" },
      {
        property: "og:description",
        content: "Squad availability, workload, wellness and AI-supported observations in one connected screen.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const av = squadAvailability();
  const metrics = squadMetrics();
  const hsrStats = squadStats((m) => m.hsr7);
  const trend = squadTrend(21);
  const todaySession = sessionCalendar.find((s) => s.date === today);
  const previous = [...sessionCalendar].filter((s) => s.date < today).slice(-2).reverse();
  const upcoming = sessionCalendar.filter((s) => s.date > today);
  const wellnessAvg = Math.round(avg(players.map((p) => wellnessScore(playerWellness(p.id)))));
  const attention = alerts()
    .filter((a) => a.severity !== "info")
    .slice(0, 8);
  const load7 = Math.round(avg(metrics.map((m) => m.load.acute)));

  return (
    <AppShell
      title="Coach Dashboard"
      subtitle="Monday 10 August 2026 · MD-2"
      actions={
        <Link
          to="/training"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open today's session <ArrowUpRight className="size-4" />
        </Link>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Who do I have?"
          value={`${av.available}/${players.length}`}
          hint={`${av.partial} partial · ${av.individual} individual · ${av.rehab} rehab · ${av.injured + av.ill} unavailable`}
          tone="good"
        />
        <MetricCard
          label="Squad 7-day load"
          value={load7}
          unit="AU"
          hint="Average session-RPE load per player"
          icon={<TrendingUp className="size-4" />}
        />
        <MetricCard
          label="Squad HSR (7 days)"
          value={hsrStats.mean}
          unit="m"
          hint={`median ${hsrStats.median} · min ${hsrStats.min} · max ${hsrStats.max} · sd ${hsrStats.sd}`}
        />
        <MetricCard
          label="Wellness index"
          value={`${wellnessAvg}%`}
          hint="Sleep, fatigue, soreness, stress, mood"
          tone={wellnessAvg > 70 ? "good" : wellnessAvg > 60 ? "warn" : "bad"}
          icon={<HeartPulse className="size-4" />}
        />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle title="How are they responding?" hint="Squad averages, last 21 days" />
          <MultiLine
            data={trend}
            series={[
              { key: "distance", color: "var(--color-chart-1)", name: "Distance (m)" },
              { key: "hsr", color: "var(--color-chart-2)", name: "HSR (m)" },
              { key: "sprint", color: "var(--color-chart-3)", name: "Sprint (m)" },
            ]}
            height={240}
          />
          <div className="mt-4">
            <p className="eyebrow mb-1">Session-RPE load</p>
            <TrendBars data={trend} dataKey="load" height={130} />
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle title="What are we doing?" />
          {todaySession ? (
            <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
              <p className="eyebrow text-primary">Today · {todaySession.label}</p>
              <p className="mt-1 font-display text-lg font-semibold">{todaySession.title}</p>
              <p className="text-xs text-muted-foreground">{todaySession.objective}</p>
              <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Timer className="size-3" /> {todaySession.durationMin} min
                </span>
                <span>Planned RPE {todaySession.plannedRpe}</span>
              </p>
            </div>
          ) : null}

          <p className="eyebrow mt-4">Next up</p>
          <ul className="mt-2 space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="rounded-md border border-border bg-surface-2 p-2.5">
                <p className="text-xs text-muted-foreground">
                  {s.date} · {s.label}
                </p>
                <p className="text-sm font-medium">{s.title}</p>
              </li>
            ))}
          </ul>

          <p className="eyebrow mt-4">What did we do?</p>
          <ul className="mt-2 space-y-2">
            {previous.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border border-border p-2.5">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {s.date} · {s.label}
                  </p>
                  <p className="text-sm font-medium">{s.title}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-muted-foreground">Planned {s.plannedRpe}</p>
                  <p className={s.actualRpe && s.actualRpe > s.plannedRpe ? "text-warning" : "text-success"}>
                    Actual {s.actualRpe ?? "—"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Who needs attention?"
            hint="Automatically derived from workload, exposure and wellness"
            right={
              <Link to="/ai" className="text-xs font-medium text-primary hover:underline">
                Full AI analysis
              </Link>
            }
          />
          <ul className="space-y-2">
            {attention.map((a, i) => {
              const p = getPlayer(a.playerId)!;
              return (
                <li key={i} className="flex items-start gap-3 rounded-md border border-border bg-surface-2 p-3">
                  <AlertTriangle
                    className={
                      a.severity === "high" ? "mt-0.5 size-4 text-destructive" : "mt-0.5 size-4 text-warning"
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/players/$id"
                      params={{ id: p.id }}
                      className="text-sm font-semibold hover:text-primary hover:underline"
                    >
                      {fullName(p)} <span className="text-muted-foreground">· {p.position}</span>
                    </Link>
                    <p className="text-xs text-muted-foreground">{a.text}</p>
                  </div>
                  <span className="eyebrow shrink-0">{a.kind}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="panel p-4">
          <SectionTitle title="Availability today" />
          <ul className="space-y-1.5">
            {players
              .filter((p) => p.availability !== "available")
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5">
                  <Link to="/players/$id" params={{ id: p.id }} className="text-sm hover:text-primary">
                    {fullName(p)}
                    <span className="block text-xs text-muted-foreground">{p.note}</span>
                  </Link>
                  <AvailabilityPill status={p.availability} />
                </li>
              ))}
          </ul>

          <p className="eyebrow mt-4">Highest ACWR</p>
          <ul className="mt-2 space-y-1.5">
            {[...metrics]
              .sort((a, b) => b.load.acwr - a.load.acwr)
              .slice(0, 5)
              .map((m) => (
                <li key={m.player.id} className="flex items-center justify-between text-sm">
                  <Link to="/players/$id" params={{ id: m.player.id }} className="hover:text-primary">
                    {fullName(m.player)}
                  </Link>
                  <AcwrPill acwr={m.load.acwr} />
                </li>
              ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
