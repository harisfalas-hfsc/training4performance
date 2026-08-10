import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarPlus, Plus, Save, Timer, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import {
  addSession,
  drills,
  fullName,
  getDrill,
  players,
  removeSession,
  sessionCalendar,
  today,
  updateSession,
  useDataVersion,
  type Session,
  type TrainingStatus,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({
    meta: [
      { title: "Training Calendar & Session Designer — T4P" },
      {
        name: "description",
        content:
          "Plan microcycle sessions, build drills with focus categories and estimated RPE, record participation and sketch the pitch.",
      },
      { property: "og:title", content: "Training Calendar & Session Designer" },
      {
        property: "og:description",
        content: "One session, everything connected: drills, focus, RPE, participation and planned load.",
      },
    ],
  }),
  component: TrainingPage,
});

const STATUS: TrainingStatus[] = [
  "Full Training",
  "Partial Training",
  "Individual Training",
  "Rehabilitation",
  "Modified Training",
  "Did Not Train",
];

const defaultStatus = (availability: string): TrainingStatus =>
  availability === "injured" || availability === "ill"
    ? "Did Not Train"
    : availability === "rehab"
      ? "Rehabilitation"
      : availability === "individual"
        ? "Individual Training"
        : availability === "partial"
          ? "Partial Training"
          : "Full Training";

function TrainingPage() {
  useDataVersion();
  const [selectedId, setSelectedId] = useState(
    () => (sessionCalendar.find((s) => s.date === today) ?? sessionCalendar[sessionCalendar.length - 1])?.id ?? "",
  );
  const [showNew, setShowNew] = useState(false);
  const session = sessionCalendar.find((s) => s.id === selectedId) ?? sessionCalendar[sessionCalendar.length - 1];
  const [participation, setParticipation] = useState<Record<string, TrainingStatus>>(() =>
    Object.fromEntries(players.map((p) => [p.id, defaultStatus(p.availability)])),
  );
  const [sessionDrills, setSessionDrills] = useState<string[]>(session?.drills ?? []);
  const [actualRpe, setActualRpe] = useState<number>(session?.actualRpe ?? 0);

  const selectSession = (s: Session) => {
    setSelectedId(s.id);
    setSessionDrills(s.drills);
    setActualRpe(s.actualRpe ?? 0);
  };

  const saveSession = () => {
    if (!session) return;
    const list = sessionDrills.map(getDrill);
    const per = list.length ? Math.round(session.durationMin / list.length) : 0;
    updateSession(session.id, {
      drills: sessionDrills,
      actualRpe: actualRpe || undefined,
      plan: list.map((d) => ({
        drill: d.name,
        purpose: d.categories[0] ?? "TRAINING",
        durationMin: per,
        rpe: d.rpe,
      })),
    });
  };

  const plan = useMemo(() => {
    const list = sessionDrills.map(getDrill);
    const minutes = list.length ? Math.round(session?.durationMin ?? 0) : 0;
    const plannedRpe = list.length ? +(list.reduce((a, d) => a + d.rpe, 0) / list.length).toFixed(1) : 0;
    const sprintDistance = list.some((d) => d.categories.includes("Maximum Speed")) ? 125 : 0;
    return {
      minutes,
      plannedRpe,
      load: Math.round(plannedRpe * minutes),
      sprintDistance,
      highIntensity: list.filter((d) => d.intensity === "High").length,
      focus: Array.from(new Set(list.flatMap((d) => d.categories))),
    };
  }, [sessionDrills, session]);

  const counts = STATUS.map((s) => ({ s, n: Object.values(participation).filter((v) => v === s).length }));

  if (!session) {
    return (
      <AppShell title="Training" subtitle="Calendar · participation · session designer">
        <div className="panel p-6">
          <p className="text-sm text-muted-foreground">No sessions yet — create the first training day.</p>
          <NewSessionForm onDone={(id) => setSelectedId(id)} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Training" subtitle="Calendar · participation · session designer">
      <section className="panel p-4">
        <SectionTitle
          title="Microcycle"
          hint="Select a day to open the session"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <CalendarPlus className="size-4" /> {showNew ? "Close" : "New training day"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete ${session.date} ${session.title}?`)) removeSession(session.id);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" /> Delete day
              </button>
            </div>
          }
        />
        {showNew && (
          <NewSessionForm
            onDone={(id) => {
              setSelectedId(id);
              setSessionDrills([]);
              setActualRpe(0);
              setShowNew(false);
            }}
          />
        )}
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {sessionCalendar.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s)}
              className={`rounded-md border p-3 text-left transition-colors ${
                s.id === selectedId ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:border-primary/40"
              }`}
            >
              <p className="eyebrow">{s.date === today ? "Today" : s.date.slice(5)}</p>
              <p className="font-display text-lg font-semibold">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.title}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Duration" value={session.durationMin} unit="min" icon={<Timer className="size-4" />} />
        <MetricCard label="Planned RPE" value={plan.plannedRpe || session.plannedRpe} hint="Average of drill estimates" />
        <MetricCard
          label="Actual RPE"
          value={actualRpe || "—"}
          hint={actualRpe ? `Difference ${(actualRpe - (plan.plannedRpe || session.plannedRpe)).toFixed(1)}` : "Enter after training"}
          tone={actualRpe > (plan.plannedRpe || session.plannedRpe) ? "warn" : "default"}
        />
        <MetricCard label="Planned load" value={plan.load} unit="AU" hint={`Planned sprint volume ${plan.sprintDistance} m`} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4">
          <SectionTitle title="Participation" hint="Recorded once — flows into every player record" />
          <div className="mb-3 flex flex-wrap gap-1 text-xs">
            {counts
              .filter((c) => c.n > 0)
              .map((c) => (
                <span key={c.s} className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {c.n} {c.s.toLowerCase()}
                </span>
              ))}
          </div>
          <div className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <span className="truncate text-sm">
                  {fullName(p)} <span className="text-xs text-muted-foreground">· {p.position}</span>
                </span>
                <select
                  value={participation[p.id]}
                  onChange={(e) => setParticipation((prev) => ({ ...prev, [p.id]: e.target.value as TrainingStatus }))}
                  className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Session designer"
            hint={session.objective}
            right={
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Actual session RPE
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={actualRpe}
                    onChange={(e) => setActualRpe(Number(e.target.value))}
                    className="h-8 w-16 rounded-md border border-input bg-surface-2 px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveSession}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Save className="size-4" /> Save session
                </button>
              </div>
            }
          />

          <Pitch />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Session drills</p>
              <ul className="space-y-2">
                {sessionDrills.map((d, i) => {
                  const drill = getDrill(d);
                  return (
                    <li key={`${d}-${i}`} className="rounded-md border border-border bg-surface-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{drill.name}</p>
                        <button
                          onClick={() => setSessionDrills((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {drill.duration} · {drill.area} · {drill.players} players · RPE {drill.rpe} · {drill.intensity}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {drill.categories.map((c) => (
                          <span key={c} className="rounded-full bg-secondary px-2 py-0.5 text-[0.68rem] text-secondary-foreground">
                            {c}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {plan.focus.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Session focus profile: {plan.focus.join(" · ")}
                </p>
              )}
            </div>

            <div>
              <p className="eyebrow mb-2">Drill library</p>
              <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {drills.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{d.name}</span>
                      <span className="text-xs text-muted-foreground">
                        RPE {d.rpe} · {d.intensity} · <Users className="inline size-3" /> {d.players}
                      </span>
                    </span>
                    <button
                      onClick={() => setSessionDrills((prev) => [...prev, d.id])}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                      aria-label={`Add ${d.name}`}
                    >
                      <Plus className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function NewSessionForm({ onDone }: { onDone: (id: string) => void }) {
  const [form, setForm] = useState({
    date: today,
    label: "MD-2",
    title: "",
    objective: "",
    durationMin: "80",
    plannedRpe: "7",
    group: "ALL TEAM ATHLETES",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      className="mt-3 grid gap-2 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const s = addSession({
          date: form.date,
          label: form.label,
          title: form.title || "Training session",
          objective: form.objective || "Session objective",
          durationMin: Number(form.durationMin) || 80,
          plannedRpe: Number(form.plannedRpe) || 7,
          drills: [],
          group: form.group,
        });
        onDone(s.id);
      }}
    >
      <input className="control" type="date" value={form.date} onChange={set("date")} />
      <input className="control" placeholder="Day label (MD-2)" value={form.label} onChange={set("label")} />
      <input className="control" placeholder="Title" value={form.title} onChange={set("title")} />
      <input className="control" placeholder="Group" value={form.group} onChange={set("group")} />
      <input className="control sm:col-span-2" placeholder="Objective" value={form.objective} onChange={set("objective")} />
      <input className="control" placeholder="Duration (min)" value={form.durationMin} onChange={set("durationMin")} />
      <div className="flex gap-2">
        <input className="control flex-1" placeholder="Planned RPE" value={form.plannedRpe} onChange={set("plannedRpe")} />
        <button type="submit" className="rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
          Create
        </button>
      </div>
    </form>
  );
}

function Pitch() {
  const [area, setArea] = useState("Half pitch");
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {["Full pitch", "Half pitch", "Quarter pitch", "30 × 25 m SSG"].map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
              area === a ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="pitch-surface relative aspect-[16/9] w-full overflow-hidden rounded-md border border-pitch-line/40">
        <svg viewBox="0 0 160 90" className="absolute inset-0 size-full">
          <g stroke="var(--color-pitch-line)" strokeWidth="0.6" fill="none">
            <rect x="4" y="4" width="152" height="82" />
            <line x1="80" y1="4" x2="80" y2="86" />
            <circle cx="80" cy="45" r="12" />
            <rect x="4" y="24" width="20" height="42" />
            <rect x="136" y="24" width="20" height="42" />
            <rect x="4" y="36" width="7" height="18" />
            <rect x="149" y="36" width="7" height="18" />
          </g>
          {area === "30 × 25 m SSG" && (
            <>
              <rect x="52" y="24" width="56" height="42" fill="var(--color-primary)" opacity="0.1" stroke="var(--color-primary)" strokeDasharray="2 2" strokeWidth="0.6" />
              <text x="80" y="21" textAnchor="middle" fontSize="4" fill="var(--color-primary)">
                30 × 25 m
              </text>
            </>
          )}
          {[
            [40, 30],
            [56, 45],
            [40, 60],
            [104, 30],
            [120, 45],
            [104, 60],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill={i < 3 ? "var(--color-primary)" : "var(--color-chart-2)"} />
          ))}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-warning)" />
            </marker>
          </defs>
          <path d="M56,45 C 70,32 90,32 104,30" stroke="var(--color-warning)" strokeWidth="0.8" fill="none" markerEnd="url(#arrow)" />
          <path d="M40,60 L 72,72" stroke="var(--color-chart-3)" strokeWidth="0.8" strokeDasharray="2 1.5" fill="none" markerEnd="url(#arrow)" />
          <text x="76" y="78" fontSize="3.6" fill="var(--color-pitch-line)">
            Sprint 25 m × 5 = 125 m
          </text>
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[0.68rem] text-muted-foreground">
        {["Cones", "Balls", "Goals", "Mini goals", "Poles", "Hurdles", "Ladders", "Mannequins", "Speed gates"].map((e) => (
          <span key={e} className="rounded-full border border-border px-2 py-0.5">
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}
