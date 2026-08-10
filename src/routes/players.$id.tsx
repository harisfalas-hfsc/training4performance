import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { MEDICAL_REDACTED, useRole } from "@/lib/roles";
import { AppShell } from "@/components/app-shell";
import { AcwrPill, AvailabilityPill, MetricCard, SectionTitle } from "@/components/perf-ui";
import { MultiLine, TrendArea, TrendBars } from "@/components/charts";
import {
  age,
  availabilitySummary,
  bmi,
  fullName,
  getPlayer,
  initials,
  playerMedical,
  playerDays,
  playerMetrics,
  playerTrend,
  playerWellness,
  positionAverage,
  RTP_STAGES,
  squadStats,
  testingHistory,
  wellnessScore,
} from "@/data/performance";

export const Route = createFileRoute("/players/$id")({
  loader: ({ params }) => {
    const player = getPlayer(params.id);
    if (!player) throw notFound();
    return { name: fullName(player), position: player.position };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Player not found — Football Performance OS" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} — Performance Passport`;
    const description = `Fitness testing, GPS load, wellness, training participation and medical history for ${loaderData.name} (${loaderData.position}).`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PlayerProfile,
});

const TABS = ["Profile", "Fitness", "GPS", "Wellness", "Training", "Medical", "Analytics"] as const;

function PlayerProfile() {
  const { id } = Route.useParams();
  const player = getPlayer(id)!;
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const m = playerMetrics(player);
  const trend = playerTrend(id, 28);
  const tests = testingHistory(id);
  const wellness = playerWellness(id);
  const availability = availabilitySummary(id);
  const medical = playerMedical(id);
  const hsrSquad = squadStats((x) => x.hsr7).mean;
  const hsrPos = positionAverage(player.position, (x) => x.hsr7) || 1;

  return (
    <AppShell
      title={fullName(player)}
      subtitle={`#${player.number} · ${player.position} · ${age(player.dob)} yrs · ${player.dominantLeg} footed`}
      actions={
        <Link to="/squad" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <ArrowLeft className="size-4" /> Squad
        </Link>
      }
    >
      <div className="panel flex flex-wrap items-center gap-4 p-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-secondary font-display text-xl font-bold">
          {initials(player)}
        </span>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Info label="Availability" value={<AvailabilityPill status={player.availability} />} />
          <Info label="ACWR" value={<AcwrPill acwr={m.load.acwr} />} />
          <Info label="Wellness" value={`${wellnessScore(wellness)}%`} />
          <Info label="Season availability" value={`${availability.availability}%`} />
          <Info label="Nationality" value={player.nationality} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Profile" && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Height" value={player.heightCm} unit="cm" />
            <MetricCard label="Weight" value={player.weightKg} unit="kg" hint={`BMI ${bmi(player)}`} />
            <MetricCard label="Body fat" value={player.bodyFat} unit="%" />
            <MetricCard label="Age group" value={age(player.dob) < 21 ? "U21" : "Senior"} hint={`DOB ${player.dob}`} />
            <div className="panel p-4 sm:col-span-2 xl:col-span-4">
              <SectionTitle title="Internal identity" hint="One record connects every module" />
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <Info label="Player ID" value={player.id.toUpperCase()} />
                <Info label="Dominant leg" value={player.dominantLeg} />
                <Info label="Position" value={player.position} />
              </div>
            </div>
          </section>
        )}

        {tab === "Fitness" && (
          <section className="grid gap-4 xl:grid-cols-2">
            <div className="panel p-4">
              <SectionTitle title="CMJ trend" hint="Baseline, personal best and drop-off detected automatically" />
              <TrendArea data={tests.map((t) => ({ date: t.date.slice(5), cmj: t.cmj }))} dataKey="cmj" />
              <p className="mt-2 text-xs text-muted-foreground">
                Baseline {tests[0]?.cmj} cm · Personal best {Math.max(...tests.map((t) => t.cmj))} cm · Latest{" "}
                {tests[tests.length - 1]?.cmj} cm
              </p>
            </div>
            <div className="panel p-4">
              <SectionTitle title="Speed & endurance" />
              <MultiLine
                data={tests.map((t) => ({ date: t.date.slice(5), sprint10: t.sprint10 * 10, sprint30: t.sprint30, maxSpeed: t.maxSpeed }))}
                series={[
                  { key: "sprint10", color: "var(--color-chart-2)", name: "10 m (×10 s)" },
                  { key: "sprint30", color: "var(--color-chart-3)", name: "30 m (s)" },
                  { key: "maxSpeed", color: "var(--color-chart-1)", name: "Max speed (km/h)" },
                ]}
              />
            </div>
            <div className="panel p-4 xl:col-span-2">
              <SectionTitle title="Testing history" hint="Every battery is added to the same record" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th>CMJ (cm)</th>
                    <th>10 m (s)</th>
                    <th>30 m (s)</th>
                    <th>Max speed (km/h)</th>
                    <th>Yo-Yo (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.date} className="border-b border-border/60">
                      <td className="py-2">{t.date}</td>
                      <td className="tabular-nums">{t.cmj}</td>
                      <td className="tabular-nums">{t.sprint10}</td>
                      <td className="tabular-nums">{t.sprint30}</td>
                      <td className="tabular-nums">{t.maxSpeed}</td>
                      <td className="tabular-nums">{t.yoyo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "GPS" && (
          <section className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Distance 7d" value={m.distance7.toLocaleString()} unit="m" />
              <MetricCard
                label="HSR 7d"
                value={m.hsr7}
                unit="m"
                hint={`squad ${hsrSquad} m · ${player.position} ${hsrPos} m`}
                tone={m.hsr7 > hsrPos * 1.25 ? "warn" : "default"}
              />
              <MetricCard label="Sprint 7d" value={m.sprint7} unit="m" />
              <MetricCard label="Max speed 7d" value={m.maxSpeed || "—"} unit="km/h" />
            </div>
            <div className="panel p-4">
              <SectionTitle title="28-day GPS trend" />
              <MultiLine
                data={trend}
                series={[
                  { key: "distance", color: "var(--color-chart-1)", name: "Distance" },
                  { key: "hsr", color: "var(--color-chart-2)", name: "HSR" },
                  { key: "sprint", color: "var(--color-chart-3)", name: "Sprint" },
                ]}
                height={260}
              />
            </div>
            <div className="panel p-4">
              <SectionTitle title="Deviation from position average" />
              <p className="text-sm text-muted-foreground">
                HSR is{" "}
                <span className={m.hsr7 > hsrPos ? "text-warning" : "text-info"}>
                  {Math.round(((m.hsr7 - hsrPos) / hsrPos) * 100)}%
                </span>{" "}
                versus the {player.position} average and{" "}
                <span>{Math.round(((m.hsr7 - hsrSquad) / hsrSquad) * 100)}%</span> versus the squad average.
              </p>
            </div>
          </section>
        )}

        {tab === "Wellness" && (
          <section className="grid gap-4 xl:grid-cols-2">
            <div className="panel p-4">
              <SectionTitle title="Today's readiness" hint={`Overall ${wellnessScore(wellness)}%`} />
              <ul className="space-y-3">
                {(
                  [
                    ["Sleep", wellness.sleep],
                    ["Fatigue", wellness.fatigue],
                    ["Soreness", wellness.soreness],
                    ["Stress", wellness.stress],
                    ["Mood", wellness.mood],
                  ] as const
                ).map(([label, v]) => (
                  <li key={label}>
                    <div className="flex justify-between text-sm">
                      <span>{label}</span>
                      <span className="tabular-nums text-muted-foreground">{v}/5</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-secondary">
                      <div
                        className={`h-2 rounded-full ${v >= 4 ? "bg-success" : v >= 3 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${(v / 5) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel p-4">
              <SectionTitle title="RPE response" hint="Daily session RPE, last 28 days" />
              <TrendBars data={trend} dataKey="rpe" color="var(--color-chart-3)" height={240} />
            </div>
          </section>
        )}

        {tab === "Training" && (
          <section className="grid gap-4 xl:grid-cols-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-5">
              <MetricCard label="Sessions available" value={availability.total} />
              <MetricCard label="Full" value={availability.full} tone="good" />
              <MetricCard label="Partial" value={availability.partial} tone="warn" />
              <MetricCard label="Individual / rehab" value={availability.individual} tone="warn" />
              <MetricCard label="Missed" value={availability.missed} tone={availability.missed ? "bad" : "good"} />
            </div>
            <div className="panel p-4 xl:col-span-3">
              <SectionTitle title="Participation history" hint="Recorded once when the coach selects the squad" />
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2">Date</th>
                      <th>Status</th>
                      <th className="text-right">Minutes</th>
                      <th className="text-right">RPE</th>
                      <th className="text-right">s-RPE load</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...playerDays(id)].reverse().map((d) => (
                      <tr key={d.date} className="border-b border-border/60">
                        <td className="py-1.5">{d.date}</td>
                        <td className={d.status === "Full Training" ? "" : "text-warning"}>{d.status}</td>
                        <td className="text-right tabular-nums">{d.minutes}</td>
                        <td className="text-right tabular-nums">{d.rpe || "—"}</td>
                        <td className="text-right tabular-nums">{d.rpe * d.minutes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === "Medical" && (
          <section className="grid gap-4 xl:grid-cols-3">
            <div className="panel p-4 xl:col-span-2">
              <SectionTitle title="Injury & illness history" />
              {!canSeeMedical ? (
                <p className="flex items-center gap-2 rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
                  <Lock className="size-4" /> {MEDICAL_REDACTED}. {medical.length} recorded episode(s); current training
                  availability is {availability.availability}%.
                </p>
              ) : medical.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recorded injuries or illness this season.</p>
              ) : (
                <ul className="space-y-3">
                  {medical.map((e, i) => (
                    <li key={i} className="rounded-md border border-border bg-surface-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {e.type} · {e.area}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {e.from} → {e.to} · {e.daysLost} days lost
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{e.notes}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel p-4">
              <SectionTitle title="Return-to-play timeline" />
              <ol className="space-y-2">
                {RTP_STAGES.map((stage) => {
                  const current = medical[0]?.stage === stage;
                  const idx = RTP_STAGES.indexOf(medical[0]?.stage ?? "Match Available");
                  const done = RTP_STAGES.indexOf(stage) <= idx;
                  return (
                    <li key={stage} className="flex items-center gap-3">
                      <span
                        className={`size-2.5 rounded-full ${current ? "bg-primary" : done ? "bg-success" : "bg-secondary"}`}
                      />
                      <span className={current ? "text-sm font-semibold text-primary" : "text-sm text-muted-foreground"}>
                        {stage}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        )}

        {tab === "Analytics" && (
          <section className="grid gap-4 xl:grid-cols-2">
            <div className="grid gap-3 sm:grid-cols-2 xl:col-span-2 xl:grid-cols-4">
              <MetricCard label="Acute load (7d)" value={m.load.acute} unit="AU" />
              <MetricCard
                label="Chronic load (28d)"
                value={m.load.chronic}
                unit="AU"
                hint={m.load.chronicReliable ? "Sufficient history" : "Insufficient historical data for a reliable 28-day comparison"}
                tone={m.load.chronicReliable ? "default" : "warn"}
              />
              <MetricCard label="Training monotony" value={m.load.monotony} />
              <MetricCard label="Training strain" value={m.load.strain} />
            </div>
            <div className="panel p-4 xl:col-span-2">
              <SectionTitle title="Load trend" hint="Session-RPE load, 28 days" />
              <TrendBars data={trend} dataKey="load" height={240} />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}
