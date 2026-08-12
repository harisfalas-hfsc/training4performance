import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Check, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TrainingExplorer } from "@/components/training-explorer";
import { TestsExplorer } from "@/components/tests-explorer";
import { WellnessExplorer } from "@/components/wellness-explorer";
import { MedicalExplorer } from "@/components/medical-explorer";
import { DateRangePicker } from "@/components/selectors";
import { T4P } from "@/components/brand-text";
import { AcwrPill, AvailabilityPill, MetricCard, SectionTitle } from "@/components/perf-ui";
import { AcwrChart, MultiLine, TrendArea, TrendBars } from "@/components/charts";
import { PlayerAccessCard } from "@/components/player-access-card";
import { Button } from "@/components/ui/button";
import {
  addMedicalEvent,
  age,
  availabilitySummary,
  bmi,
  fullName,
  getPlayer,
  gpsHistory,
  gpsValue,
  customKpis,
  initials,
  playerMedical,
  acwrSeries,
  playerDays,
  playerMetrics,
  playerTrend,
  playerWellness,
  removePlayer,
  removeMedicalEvent,
  RTP_STAGES,
  updatePlayer,
  useDataVersion,
  wellnessScore,
  type Availability,
  type MedicalEvent,
  type Player,
  type Position,
} from "@/data/performance";
import {
  addCustomTest,
  addTestRecord,
  asymmetry,
  autoFindings,
  bestRecord,
  customTests,
  getTestDef,
  latestRecord,
  oneRepMax,
  playerRecords,
  playerTestIds,
  removeCustomTest,
  removeTestRecord,

  SMS_FORMATS,
  sprintSplits,
  sprintTestDates,
  squadTestAverage,
  strengthPrescription,
  STRENGTH_GOALS,
  TEST_CATALOG,
  TEST_GROUPS,
  testLabel,
  testSeries,
  testUnit,
  useTestVersion,
  type CustomTestKind,
  type StrengthGoal,
  type TestGroup,
} from "@/data/testing";
import { entriesFor, entryScore, useWellnessVersion } from "@/data/wellness";


export const Route = createFileRoute("/_authenticated/players/$id")({
  head: ({ params }) => {
    const player = getPlayer(params.id);
    if (!player) {
      return { meta: [{ title: "Player not found — T4P" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${fullName(player)} — Performance Passport`;
    const description = `Fitness testing, GPS load, wellness, training participation and medical history for ${fullName(player)} (${player.position}).`;
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

const TABS = ["Overview", "Explore", "GPS reports", "Fitness tests", "Training", "Wellness", "Medical & illness", "Reports", "Player login"] as const;
const POSITIONS: Position[] = ["GK", "CB", "FB", "CM", "AM", "W", "ST"];
const AVAILABILITY: Availability[] = ["available", "partial", "individual", "rehab", "injured", "ill"];

function PlayerProfile() {
  useDataVersion();
  useTestVersion();
  useWellnessVersion();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const player = getPlayer(id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  if (!player) {
    return (
      <AppShell title="Player not found" subtitle="This player is no longer in the squad">
        <Link to="/squad" className="text-sm text-primary hover:underline">
          Back to squad
        </Link>
      </AppShell>
    );
  }

  const m = playerMetrics(player);
  const trend = playerTrend(id, 28);
  const wellness = playerWellness(id);
  const availability = availabilitySummary(id);
  const medical = playerMedical(id);

  return (
    <AppShell
      title={fullName(player)}
      subtitle={`#${player.number} · ${player.position} · ${age(player.dob)} yrs · ${player.dominantLeg} footed`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove ${fullName(player)} and every record attached to him?`)) {
                removePlayer(player.id);
                void navigate({ to: "/squad" });
              }
            }}
            className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
          >
            <Trash2 className="size-4" /> Delete
          </button>
          <Link to="/squad" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <ArrowLeft className="size-4" /> Squad
          </Link>
        </div>
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
        {tab === "Player login" && <PlayerAccessCard playerId={player.id} playerName={fullName(player)} />}
        {tab === "Overview" && <ProfileTab player={player} />}
        {tab === "Explore" && <PlayerExplore playerId={id} />}
        {tab === "Fitness tests" && <FitnessTab playerId={id} />}

        {tab === "GPS reports" && <PlayerGpsTab playerId={id} />}

        {tab === "Wellness" && <PlayerWellnessTab playerId={id} />}

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

        {tab === "Medical & illness" && (
          <section className="grid gap-4 xl:grid-cols-3">
            <div className="panel p-4 xl:col-span-2">
              <SectionTitle title="Injury & illness history" right={<MedicalEventForm playerId={id} />} />
              {medical.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recorded injuries or illness this season.</p>
              ) : (
                <ul className="space-y-3">
                  {medical.map((e, i) => (
                    <li key={`${e.from}-${i}`} className="rounded-md border border-border bg-surface-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {e.type} · {e.area}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {e.from} → {e.to} · {e.daysLost} days lost
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{e.notes}</p>
                      <button type="button" onClick={() => removeMedicalEvent(id, e.from)} className="mt-2 text-xs text-destructive hover:underline">Delete record</button>
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

        {tab === "Reports" && (
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
            <div className="panel p-4 xl:col-span-2">
              <SectionTitle title="Acute:chronic workload" hint="7-day load against the 28-day baseline" />
              <AcwrChart data={acwrSeries(player.id, 42).map((d) => ({ date: d.date.slice(5), acwr: d.acwr }))} />
            </div>
            <div className="xl:col-span-2 flex flex-wrap gap-2">
              <Button asChild><Link to="/reports">Build a player report</Link></Button>
              <Button asChild variant="outline"><Link to="/analytics"><BarChart3 className="size-4" /> Compare with other players</Link></Button>
            </div>
            <div className="panel p-4 xl:col-span-2">
              <SectionTitle
                title="Automatic detections"
                hint={<>Every time training beats a recorded test, <T4P /> writes a new dated result</>}
              />
              <PlayerFindings playerId={id} />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

const GPS_METRICS = [
  { key: "distance", label: "Distance", unit: "m" },
  { key: "hsr", label: "High-speed running", unit: "m" },
  { key: "sprint", label: "Sprint distance", unit: "m" },
  { key: "maxSpeed", label: "Maximum speed", unit: "km/h" },
  { key: "accel", label: "Accelerations", unit: "" },
  { key: "decel", label: "Decelerations", unit: "" },
  { key: "minutes", label: "Minutes", unit: "min" },
  { key: "rpe", label: "RPE", unit: "" },
] as const;

function PlayerGpsTab({ playerId }: { playerId: string }) {
  const [days, setDays] = useState(28);
  const [metric, setMetric] = useState<string>("distance");
  const rows = gpsHistory
    .filter((row) => row.playerId === playerId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const visible = rows.slice(-days).map((row) => ({ date: row.date.slice(5), value: gpsValue(row, metric) }));
  const choices = [...GPS_METRICS.map((item) => ({ ...item })), ...customKpis().map((item) => ({ ...item, unit: "" }))];
  const selected = choices.find((item) => item.key === metric) ?? choices[0];

  return (
    <section className="grid gap-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-56 flex-1">
          <span className="eyebrow">KPI</span>
          <select className="control mt-1 w-full" value={metric} onChange={(event) => setMetric(event.target.value)}>
            {choices.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <div>
          <p className="eyebrow mb-1">Period</p>
          <div className="flex gap-1">
            {[7, 28, 90].map((value) => (
              <Button key={value} type="button" size="sm" variant={days === value ? "default" : "outline"} onClick={() => setDays(value)}>{value} days</Button>
            ))}
          </div>
        </div>
        <Button asChild variant="outline"><Link to="/analytics"><BarChart3 className="size-4" /> Compare player</Link></Button>
      </div>
      <div className="panel p-4">
        <SectionTitle title={`${selected?.label ?? metric} history`} hint={`${rows.length} saved GPS session${rows.length === 1 ? "" : "s"}`} />
        {visible.length ? <TrendArea data={visible} dataKey="value" height={280} /> : <EmptyData text="No GPS records saved for this player yet." />}
      </div>
      <div className="panel overflow-x-auto p-4">
        <SectionTitle title="Saved GPS sessions" hint="Every import attached to this player, newest first" />
        {rows.length ? (
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="py-2">Date</th><th>Category</th><th className="text-right">{selected?.label ?? metric}</th><th className="text-right">Minutes</th><th className="text-right">RPE</th></tr></thead>
            <tbody>{rows.slice().reverse().map((row) => <tr key={`${row.date}-${row.playerId}`} className="border-b border-border/60"><td className="py-2">{row.date}</td><td>{row.category ?? "Training"}</td><td className="text-right tabular-nums">{gpsValue(row, metric).toLocaleString()} {selected?.unit}</td><td className="text-right tabular-nums">{row.minutes}</td><td className="text-right tabular-nums">{row.rpe || "—"}</td></tr>)}</tbody>
          </table>
        ) : <EmptyData text="Upload and import a GPS report to create this history." />}
      </div>
    </section>
  );
}

function PlayerWellnessTab({ playerId }: { playerId: string }) {
  const rows = entriesFor(playerId);
  const trend = rows.slice(-30).map((entry) => ({ date: entry.date.slice(5), score: entryScore(entry) }));
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link to="/wellness">Open squad wellness</Link></Button>
        <Button type="button" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Player login is in the “Player login” tab</Button>
      </div>
      <div className="panel p-4">
        <SectionTitle title="Wellness history" hint="Daily questionnaire score, last 30 entries" />
        {trend.length ? <TrendArea data={trend} dataKey="score" height={260} /> : <EmptyData text="No wellness questionnaire has been submitted for this player yet." />}
      </div>
      {rows.length ? <div className="panel overflow-x-auto p-4"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="py-2">Date</th><th className="text-right">Score</th><th className="text-right">Sleep</th><th className="text-right">Fatigue</th><th className="text-right">Soreness</th><th>Note</th></tr></thead><tbody>{rows.slice().reverse().map((entry) => <tr key={entry.id ?? entry.date} className="border-b border-border/60"><td className="py-2">{entry.date}</td><td className="text-right">{entryScore(entry)}%</td><td className="text-right">{entry.sleep}/5</td><td className="text-right">{entry.fatigue}/5</td><td className="text-right">{entry.soreness}/5</td><td className="pl-3 text-muted-foreground">{entry.note || "—"}</td></tr>)}</tbody></table></div> : null}
    </section>
  );
}

function MedicalEventForm({ playerId }: { playerId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<MedicalEvent, "playerId">>({ type: "Injury", area: "", from: new Date().toISOString().slice(0, 10), to: "", daysLost: 0, notes: "", stage: "Injury" });
  if (!open) return <Button type="button" size="sm" onClick={() => setOpen(true)}><Plus className="size-4" /> Add record</Button>;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4" role="dialog" aria-modal="true" aria-label="Add medical record">
      <form className="w-full max-w-lg rounded-md border border-border bg-background p-4 shadow-panel" onSubmit={(event) => { event.preventDefault(); if (!form.area.trim()) return; addMedicalEvent({ playerId, ...form }); setOpen(false); }}>
        <SectionTitle title="Add injury or illness" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Labeled label="Type"><select className="control" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as MedicalEvent["type"] })}><option>Injury</option><option>Illness</option></select></Labeled>
          <Labeled label="Area / diagnosis"><input className="control" required value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /></Labeled>
          <Labeled label="From"><input type="date" className="control" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} /></Labeled>
          <Labeled label="To"><input type="date" className="control" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} /></Labeled>
          <Labeled label="Days lost"><input type="number" min={0} className="control" value={form.daysLost} onChange={(event) => setForm({ ...form, daysLost: Number(event.target.value) })} /></Labeled>
          <Labeled label="Return-to-play stage"><select className="control" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>{RTP_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></Labeled>
          <div className="sm:col-span-2"><Labeled label="Notes"><textarea className="control min-h-20" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></Labeled></div>
        </div>
        <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit"><Save className="size-4" /> Save record</Button></div>
      </form>
    </div>
  );
}

function EmptyData({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</p>;
}

/* ------------------------------------------------------------------ */
/* Profile — editable                                                  */
/* ------------------------------------------------------------------ */

function ProfileTab({ player }: { player: Player }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(() => ({ ...player }));

  const field = (k: keyof Player) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    updatePlayer(player.id, {
      firstName: form.firstName.trim() || player.firstName,
      lastName: form.lastName.trim() || player.lastName,
      position: form.position,
      number: Number(form.number) || 0,
      dob: form.dob,
      nationality: form.nationality,
      dominantLeg: form.dominantLeg,
      heightCm: Number(form.heightCm) || 0,
      weightKg: Number(form.weightKg) || 0,
      bodyFat: Number(form.bodyFat) || 0,
      availability: form.availability,
      note: form.note ?? "",
    });
    setEdit(false);
  };

  if (edit) {
    return (
      <section className="panel p-4">
        <SectionTitle
          title="Edit player"
          hint="Anthropometry entered here is also written into the test history"
          right={
            <div className="flex gap-2">
              <button onClick={save} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                <Save className="size-3.5" /> Save
              </button>
              <button
                onClick={() => {
                  setForm({ ...player });
                  setEdit(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
              >
                <X className="size-3.5" /> Cancel
              </button>
            </div>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Labeled label="First name">
            <input className="control" value={form.firstName} onChange={field("firstName")} />
          </Labeled>
          <Labeled label="Last name">
            <input className="control" value={form.lastName} onChange={field("lastName")} />
          </Labeled>
          <Labeled label="Shirt number">
            <input className="control" value={form.number} onChange={field("number")} />
          </Labeled>
          <Labeled label="Position">
            <select className="control" value={form.position} onChange={field("position")}>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Date of birth">
            <input className="control" type="date" value={form.dob} onChange={field("dob")} />
          </Labeled>
          <Labeled label="Nationality">
            <input className="control" value={form.nationality} onChange={field("nationality")} />
          </Labeled>
          <Labeled label="Dominant leg">
            <select className="control" value={form.dominantLeg} onChange={field("dominantLeg")}>
              <option value="Right">Right</option>
              <option value="Left">Left</option>
            </select>
          </Labeled>
          <Labeled label="Availability">
            <select className="control" value={form.availability} onChange={field("availability")}>
              {AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Height (cm)">
            <input className="control" value={form.heightCm} onChange={field("heightCm")} />
          </Labeled>
          <Labeled label="Weight (kg)">
            <input className="control" value={form.weightKg} onChange={field("weightKg")} />
          </Labeled>
          <Labeled label="Body fat (%)">
            <input className="control" value={form.bodyFat} onChange={field("bodyFat")} />
          </Labeled>
          <Labeled label="Note">
            <input className="control" value={form.note ?? ""} onChange={field("note")} />
          </Labeled>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Height" value={player.heightCm} unit="cm" />
      <MetricCard label="Weight" value={player.weightKg} unit="kg" hint={`BMI ${bmi(player)}`} />
      <MetricCard label="Body fat" value={player.bodyFat} unit="%" />
      <MetricCard label="Age group" value={age(player.dob) < 21 ? "U21" : "Senior"} hint={`DOB ${player.dob}`} />
      <div className="panel p-4 sm:col-span-2 xl:col-span-4">
        <SectionTitle
          title="Internal identity"
          hint="One record connects every module"
          right={
            <button
              onClick={() => setEdit(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              Edit player
            </button>
          }
        />
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <Info label="Player ID" value={player.id.toUpperCase()} />
          <Info label="Dominant leg" value={player.dominantLeg} />
          <Info label="Position" value={player.position} />
          <Info label="Nationality" value={player.nationality} />
          <Info label="Availability" value={player.availability} />
          <Info label="Note" value={player.note || "—"} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fitness — full KPI battery                                          */
/* ------------------------------------------------------------------ */

function AddTestForm({ playerId, only }: { playerId: string; only?: TestGroup[] }) {
  const catalog = only ? TEST_CATALOG.filter((t) => only.includes(t.group)) : TEST_CATALOG;
  const [testId, setTestId] = useState(catalog[0]!.id);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState("");
  const [reps, setReps] = useState("1");
  const [saved, setSaved] = useState(false);
  const def = getTestDef(testId)!;

  return (
    <form
      className="mb-3 grid gap-2 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const v = Number(value);
        if (!Number.isFinite(v) || value === "") return;
        addTestRecord({
          playerId,
          testId,
          date,
          value: v,
          ...(def.strength ? { reps: Number(reps) || 1 } : {}),
          source: "manual",
        });
        setValue("");
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1500);
      }}
    >
      <select className="control sm:col-span-2" value={testId} onChange={(e) => setTestId(e.target.value)}>
        {TEST_GROUPS.filter((g) => catalog.some((c) => c.group === g)).map((g) => (
          <optgroup key={g} label={g}>
            {catalog
              .filter((c) => c.group === g)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <input className="control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input
        className="control"
        placeholder={def.strength ? "Load (kg)" : `Value (${def.unit})`}
        value={value}
        inputMode="decimal"
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        {def.strength ? (
          <input className="control w-20" placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} />
        ) : null}
        <button type="submit" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
          {saved ? <Check className="size-4" /> : <Plus className="size-4" />} Add
        </button>
      </div>
    </form>
  );
}

/** Build a test that does not exist in the preset battery. */
function CustomTestBuilder() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [kind, setKind] = useState<CustomTestKind>("number");
  const [higher, setHigher] = useState(true);
  const [sided, setSided] = useState(false);

  const create = () => {
    if (!name.trim()) return;
    const made = addCustomTest({ name: name.trim(), unit: unit.trim(), kind, higher, sided });
    if (made.length) {
      setName("");
      setUnit("");
      setSided(false);
      setOpen(false);
    }
  };

  return (
    <div className="panel p-4 xl:col-span-2">
      <SectionTitle
        title="My own tests"
        hint="Anything you build here behaves exactly like a preset test — history, trend, best, asymmetry"
        right={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {open ? <X className="size-3.5" /> : <Plus className="size-3.5" />} {open ? "Close" : "New test"}
          </button>
        }
      />

      {open ? (
        <div className="mb-3 grid gap-2 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="field xl:col-span-2">
            <span className="field-label">Test name</span>
            <input className="control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Isometric hip adduction" />
          </label>
          <label className="field">
            <span className="field-label">What is recorded</span>
            <select className="control" value={kind} onChange={(e) => setKind(e.target.value as CustomTestKind)}>
              <option value="number">Number (distance, height, reps…)</option>
              <option value="time">Time (lower is better)</option>
              <option value="score">Score (0–3 screen style)</option>
              <option value="strength">Load + reps (derives 1RM)</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Unit</span>
            <input className="control" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="cm, s, kg, N, reps" />
          </label>
          <label className="field">
            <span className="field-label">Better result</span>
            <select
              className="control"
              value={higher ? "higher" : "lower"}
              disabled={kind === "time"}
              onChange={(e) => setHigher(e.target.value === "higher")}
            >
              <option value="higher">Higher is better</option>
              <option value="lower">Lower is better</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Sides</span>
            <select className="control" value={sided ? "sided" : "single"} onChange={(e) => setSided(e.target.value === "sided")}>
              <option value="single">One value</option>
              <option value="sided">Left &amp; right separately</option>
            </select>
          </label>
          <div className="xl:col-span-6">
            <button
              type="button"
              onClick={create}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Check className="size-4" /> Save to my test library
            </button>
          </div>
        </div>
      ) : null}

      {customTests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom tests yet. Everything in the preset battery is already available above — build your own only when you
          measure something we do not ship.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {customTests
            .filter((t) => t.side !== "L")
            .map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm">
                <span>
                  {t.side === "R" ? t.name.replace(/ — right$/, "") : t.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t.unit}
                    {t.side === "R" ? " · L/R" : ""}
                    {t.strength ? " · 1RM" : ""}
                  </span>
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${t.name}" and every result recorded against it?`)) removeCustomTest(t.id);
                  }}
                  aria-label="Delete custom test"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

/** Movement screen recorded as a 3-movement or 5-movement battery. */
function SmsScreenPanel({ playerId }: { playerId: string }) {
  const [format, setFormat] = useState<3 | 5>(3);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const ids = SMS_FORMATS[format];
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const total = ids.reduce((a, id) => a + (Number(scores[id]) || 0), 0);

  const save = () => {
    let wrote = false;
    for (const id of ids) {
      const v = Number(scores[id]);
      if (!Number.isFinite(v) || scores[id] === undefined || scores[id] === "") continue;
      addTestRecord({ playerId, testId: id, date, value: v, source: "manual", note: `SMS ${format}-movement` });
      wrote = true;
    }
    if (wrote) {
      addTestRecord({ playerId, testId: "smsTotal", date, value: total, source: "manual", note: `SMS ${format}-movement` });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    }
  };

  return (
    <div className="panel p-4">
      <SectionTitle
        title="Movement screen (SMS)"
        hint="Score each movement 0–3 — the total is stored and trended for you"
        right={
          <select
            className="control h-8 w-40 text-xs"
            value={format}
            onChange={(e) => setFormat(Number(e.target.value) as 3 | 5)}
          >
            <option value={3}>3-movement screen</option>
            <option value={5}>5-movement screen</option>
          </select>
        }
      />
      <label className="field mb-2">
        <span className="field-label">Screen date</span>
        <input className="control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="grid gap-2">
        {ids.map((id) => {
          const last = latestRecord(playerId, id);
          return (
            <div key={id} className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
              <span className="flex-1 text-sm">{testLabel(id).replace("SMS · ", "")}</span>
              {last ? <span className="text-xs text-muted-foreground">last {last.value}</span> : null}
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScores((prev) => ({ ...prev, [id]: String(s) }))}
                    className={`size-7 rounded-md border text-xs font-semibold ${
                      scores[id] === String(s)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface-1"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {saved ? <Check className="size-4" /> : <Save className="size-4" />} Save screen
        </button>
        <span className="text-sm text-muted-foreground">
          Total {total} / {format * 3}
        </span>
      </div>
    </div>
  );
}

/** Sprint gates in, split times and split speeds out. */
function SprintSplitPanel({ playerId }: { playerId: string }) {
  const dates = sprintTestDates(playerId);
  const [date, setDate] = useState<string>(() => dates[dates.length - 1] ?? "");
  const splits = sprintSplits(playerId, date || undefined);

  return (
    <div className="panel p-4">
      <SectionTitle
        title="Sprint splits"
        hint="Record 5 / 10 / 15 / 20 / 30 m gate times above — split times and speeds are calculated here"
        right={
          dates.length ? (
            <select className="control h-8 w-40 text-xs" value={date} onChange={(e) => setDate(e.target.value)}>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />
      {splits.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="py-2">Segment</th>
              <th className="text-right">Gate time</th>
              <th className="text-right">Split time</th>
              <th className="text-right">Split speed</th>
              <th className="text-right">Average</th>
            </tr>
          </thead>
          <tbody>
            {splits.map((s) => (
              <tr key={s.testId} className="border-b border-border/60">
                <td className="py-1.5">{s.label}</td>
                <td className="text-right tabular-nums">{s.cumulativeTime.toFixed(2)} s</td>
                <td className="text-right tabular-nums">{s.splitTime.toFixed(2)} s</td>
                <td className="text-right tabular-nums font-semibold">{s.splitKmh.toFixed(1)} km/h</td>
                <td className="text-right tabular-nums">{(s.averageSpeed * 3.6).toFixed(1)} km/h</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sprint gate times yet. Add a 5, 10, 15, 20 or 30 m sprint above and the splits appear here automatically.
        </p>
      )}
    </div>
  );
}

function FitnessTab({ playerId }: { playerId: string }) {

  const available = playerTestIds(playerId);
  const [kpi, setKpi] = useState(() => available.find((t) => t === "cmj") ?? available[0] ?? "cmj");
  const [compare, setCompare] = useState<string>("sj");

  const series = useMemo(
    () =>
      testSeries(playerId, kpi).map((r, i, arr) => ({
        date: r.date.slice(5),
        value: r.value,
        compare: testSeries(playerId, compare)[i]?.value ?? arr[i]?.value ?? 0,
      })),
    [playerId, kpi, compare],
  );

  const rows = playerRecords(playerId).slice().reverse();
  const best = bestRecord(playerId, kpi);
  const latest = latestRecord(playerId, kpi);
  const squadAvg = squadTestAverage(kpi);
  const asym = asymmetry(playerId, kpi);

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="panel p-4 xl:col-span-2">
        <SectionTitle title="Record a test" hint="Type the number only — 1RM, asymmetry, personal bests and alerts are derived automatically" />
        <AddTestForm playerId={playerId} />
      </div>

      <CustomTestBuilder />
      <SmsScreenPanel playerId={playerId} />
      <SprintSplitPanel playerId={playerId} />


      <div className="panel p-4">
        <SectionTitle
          title="KPI trend"
          hint="Pick any KPI in the battery"
          right={
            <select className="control h-8 w-56 text-xs" value={kpi} onChange={(e) => setKpi(e.target.value)}>
              {TEST_GROUPS.map((g) => (
                <optgroup key={g} label={g}>
                  {TEST_CATALOG.filter((t) => t.group === g).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          }
        />
        {series.length ? (
          <TrendArea data={series} dataKey="value" />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No {testLabel(kpi)} results recorded yet.</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Latest {latest?.value ?? "—"} {testUnit(kpi)} · Best {best?.value ?? "—"} {testUnit(kpi)} · Squad average{" "}
          {squadAvg || "—"} {testUnit(kpi)}
          {asym !== null ? ` · Left/right asymmetry ${asym}%` : ""}
        </p>
      </div>

      <div className="panel p-4">
        <SectionTitle
          title="Compare two KPIs"
          hint="Overlay any second metric"
          right={
            <select className="control h-8 w-56 text-xs" value={compare} onChange={(e) => setCompare(e.target.value)}>
              {TEST_CATALOG.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          }
        />
        <MultiLine
          data={series}
          series={[
            { key: "value", color: "var(--color-chart-1)", name: testLabel(kpi) },
            { key: "compare", color: "var(--color-chart-2)", name: testLabel(compare) },
          ]}
          height={220}
        />
      </div>

      <div className="panel p-4 xl:col-span-2">
        <SectionTitle
          title="Test history"
          hint="Every dated result, manual or auto-detected"
        />

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-1">
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Date</th>
                <th>Test</th>
                <th className="text-right">Value</th>
                <th className="text-right">Reps</th>
                <th className="text-right">Est. 1RM</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                    No test results yet — add the first one above.
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => {
                const def = getTestDef(r.testId);
                return (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-1.5">{r.date}</td>
                    <td>{testLabel(r.testId)}</td>
                    <td className="text-right tabular-nums">
                      {r.value} {testUnit(r.testId)}
                    </td>
                    <td className="text-right tabular-nums">{r.reps ?? "—"}</td>
                    <td className="text-right tabular-nums">{def?.strength ? `${oneRepMax(r.value, r.reps ?? 1)} kg` : "—"}</td>
                    <td className="text-xs text-muted-foreground">{r.source === "manual" ? "Coach" : "Auto"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => removeTestRecord(r.id)}
                        aria-label="Delete result"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Strength — 1RM + AI prescription                                    */
/* ------------------------------------------------------------------ */

function StrengthTab({ playerId }: { playerId: string }) {
  const lifts = TEST_CATALOG.filter((t) => t.strength);
  const [goal, setGoal] = useState<StrengthGoal>("Strength");
  const done = lifts.filter((l) => playerRecords(playerId, l.id).length > 0);

  return (
    <section className="grid gap-4">
      <div className="panel p-4">
        <SectionTitle title="Log a lift" hint="Load and reps — the estimated 1RM is calculated for you (Epley)" />
        <AddTestForm playerId={playerId} only={["Strength"]} />
      </div>

      <div className="panel p-4">
        <SectionTitle
          title="Strength profile & prescription"
          hint="Loads are rounded to the nearest 2.5 kg"
          right={
            <select className="control h-8 w-44 text-xs" value={goal} onChange={(e) => setGoal(e.target.value as StrengthGoal)}>
              {STRENGTH_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          }
        />
        {done.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lifts recorded yet for this player.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Exercise</th>
                  <th className="text-right">Best set</th>
                  <th className="text-right">Est. 1RM</th>
                  <th className="text-right">Asymmetry</th>
                  <th className="text-right">Working load</th>
                  <th>Prescription</th>
                </tr>
              </thead>
              <tbody>
                {done.map((l) => {
                  const b = bestRecord(playerId, l.id)!;
                  const rm = oneRepMax(b.value, b.reps ?? 1);
                  const rx = strengthPrescription(rm, goal);
                  const asym = asymmetry(playerId, l.id);
                  return (
                    <tr key={l.id} className="border-b border-border/60">
                      <td className="py-2 font-medium">{l.name}</td>
                      <td className="text-right tabular-nums">
                        {b.value} kg × {b.reps ?? 1}
                      </td>
                      <td className="text-right font-semibold tabular-nums text-primary">{rm} kg</td>
                      <td className={`text-right tabular-nums ${asym !== null && asym > 10 ? "text-destructive" : "text-muted-foreground"}`}>
                        {asym !== null ? `${asym}%` : "—"}
                      </td>
                      <td className="text-right tabular-nums">
                        {rx.loadFrom}–{rx.loadTo} kg
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {rx.sets} × {rx.reps} @ {rx.percent} · rest {rx.rest}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <strong className="text-foreground">{goal} block:</strong> {strengthPrescription(100, goal).cue} Any
            left/right gap above 10% should be trained unilaterally before adding bilateral load.
          </span>
        </p>
      </div>
    </section>
  );
}

function PlayerFindings({ playerId }: { playerId: string }) {
  const rows = autoFindings().filter((f) => f.playerId === playerId);
  if (!rows.length) return <p className="text-sm text-muted-foreground">Nothing exceeded a recorded test yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.slice(0, 12).map((f, i) => (
        <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-surface-2 p-2.5 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="text-xs text-muted-foreground">{f.date}</span>
            <span className="block">{f.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
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

/** Same Who → What logic as Analytics, with "who" already fixed to this athlete. */
const PLAYER_SOURCES = [
  { id: "gps", label: "GPS reports" },
  { id: "training", label: "Training & drills" },
  { id: "tests", label: "Fitness tests" },
  { id: "wellness", label: "Wellness" },
  { id: "medical", label: "Medical & availability" },
] as const;

function PlayerExplore({ playerId }: { playerId: string }) {
  useDataVersion();
  const [source, setSource] = useState<(typeof PLAYER_SOURCES)[number]["id"]>("gps");
  const dates = useMemo(() => [...new Set(gpsHistory.map((r) => r.date))].sort(), [gpsHistory.length]);
  const [from, setFrom] = useState(() => {
    const last = dates.at(-1);
    if (!last) return "";
    const start = new Date(last);
    start.setDate(start.getDate() - 28);
    return start.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => dates.at(-1) ?? "");
  const ids = [playerId];

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle title="What do you want to see for this athlete?" hint="GPS, training & drills, fitness tests, wellness or medical & availability" />
        <div className="flex flex-wrap gap-1">
          {PLAYER_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSource(s.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                source === s.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <span className="eyebrow">Dates</span>
          <div className="mt-1">
            <DateRangePicker from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b); }} earliest={dates[0]} latest={dates.at(-1)} />
          </div>
        </div>
      </section>

      {source === "gps" ? <PlayerGpsTab playerId={playerId} /> : null}
      {source === "training" ? <TrainingExplorer playerIds={ids} from={from} to={to} /> : null}
      {source === "tests" ? <TestsExplorer playerIds={ids} from={from} to={to} /> : null}
      {source === "wellness" ? <WellnessExplorer playerIds={ids} from={from} to={to} /> : null}
      {source === "medical" ? <MedicalExplorer playerIds={ids} from={from} to={to} /> : null}
    </div>
  );
}
