import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BrainCircuit, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { TrendBars } from "@/components/charts";
import {
  alerts,
  avg,
  fullName,
  getPlayer,
  players,
  playerWellness,
  sessionCalendar,
  squadMetrics,
  squadStats,
  squadTrend,
  today,
  wellnessScore,
} from "@/data/performance";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Performance Assistant — T4P" },
      {
        name: "description",
        content:
          "Daily AI summary, player and team analysis, observations and considerations generated from the connected performance database.",
      },
      { property: "og:title", content: "AI Performance Assistant" },
      { property: "og:description", content: "Observations and considerations — the coach keeps the decision." },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const metrics = squadMetrics();
  const trend = squadTrend(14);
  const hsrMean = squadStats((m) => m.hsr7).mean;
  const list = alerts();
  const observations = list.filter((a) => a.kind === "Observation");
  const recommendations = list.filter((a) => a.kind === "Recommendation");
  const [question, setQuestion] = useState("How is the team progressing over the last six weeks?");
  const [answered, setAnswered] = useState(true);

  const loadNow = Math.round(avg(trend.slice(-3).map((t) => Number(t.load))));
  const loadPrev = Math.round(avg(trend.slice(-6, -3).map((t) => Number(t.load))));
  const delta = loadPrev ? Math.round(((loadNow - loadPrev) / loadPrev) * 100) : 0;
  const aboveHsr = metrics.filter((m) => m.hsr7 > hsrMean).length;
  const lowWellness = players.filter((p) => wellnessScore(playerWellness(p.id)) < 60);
  const session = sessionCalendar.find((s) => s.date === today)!;

  return (
    <AppShell title="AI Performance Assistant" subtitle="Analysis of the data already stored in the platform">
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle title="AI daily summary" hint={`${today} · ${session.label} · ${session.title}`} />
          <ul className="space-y-2 text-sm">
            <Bullet>
              Team workload {delta >= 0 ? "increased" : "decreased"} {Math.abs(delta)} percent compared with the previous
              three training days ({loadPrev} → {loadNow} AU).
            </Bullet>
            <Bullet>{aboveHsr} players exceeded the squad average for high-speed running ({hsrMean} m over 7 days).</Bullet>
            <Bullet>
              {metrics.filter((m) => m.load.acwr > 1.35).length} players carry a seven-day workload substantially above their
              recent baseline.
            </Bullet>
            <Bullet>
              {lowWellness.length} players reported elevated fatigue or soreness today
              {lowWellness.length ? `: ${lowWellness.map((p) => p.lastName).join(", ")}.` : "."}
            </Bullet>
            <Bullet>
              {players.filter((p) => p.availability !== "available").length} players are outside full team training and follow an
              individual pathway.
            </Bullet>
          </ul>
          <div className="mt-4">
            <p className="eyebrow mb-1">Underlying data · squad s-RPE load, 14 days</p>
            <TrendBars data={trend} dataKey="load" height={160} />
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle title="Ask the assistant" />
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setAnswered(false);
            }}
            rows={3}
            className="w-full rounded-md border border-input bg-surface-2 p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => setAnswered(true)}
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Sparkles className="size-4" /> Analyse
          </button>
          {answered && (
            <div className="mt-3 rounded-md border border-border bg-surface-2 p-3 text-sm">
              <p className="flex items-center gap-2 text-xs text-primary">
                <BrainCircuit className="size-4" /> Assistant
              </p>
              <p className="mt-2 text-muted-foreground">
                Over the analysed window the squad averaged {Math.round(avg(trend.map((t) => Number(t.distance))))} m per session
                with {Math.round(avg(trend.map((t) => Number(t.hsr))))} m of high-speed running and an average session RPE of{" "}
                {(avg(trend.map((t) => Number(t.rpe)))).toFixed(1)}. Training volume is stable, intensity is trending{" "}
                {delta >= 0 ? "upward" : "downward"}, and availability sits at{" "}
                {Math.round((players.filter((p) => p.availability === "available").length / players.length) * 100)} percent.
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            The assistant reports observations and considerations. It does not make medical diagnoses and does not replace the
            coaching decision.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Observations" hint="Patterns identified in the data" items={observations} />
        <Panel title="Considerations" hint="Suggested monitoring and possible session adjustments" items={recommendations} />
      </section>
    </AppShell>
  );
}

function Panel({
  title,
  hint,
  items,
}: {
  title: string;
  hint: string;
  items: Array<{ playerId: string; text: string; severity: string }>;
}) {
  return (
    <div className="panel p-4">
      <SectionTitle title={title} hint={hint} />
      <ul className="space-y-2">
        {items.slice(0, 10).map((a, i) => {
          const p = getPlayer(a.playerId)!;
          return (
            <li key={i} className="rounded-md border border-border bg-surface-2 p-3">
              <Link
                to="/players/$id"
                params={{ id: p.id }}
                className="text-sm font-semibold hover:text-primary hover:underline"
              >
                {fullName(p)}
              </Link>
              <p className="text-xs text-muted-foreground">{a.text}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 rounded-md border border-border bg-surface-2 p-3">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
