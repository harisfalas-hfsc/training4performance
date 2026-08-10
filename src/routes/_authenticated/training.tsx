import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Copy, Plus, Save, Star, Timer, Trash2, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import {
  addSession,
  drills,
  duplicateSession,
  fullName,
  getDrill,
  players,
  removeSession,
  sessionCalendar,
  sessionStatus,
  setSessionStatus,
  today,
  toggleSessionFavorite,
  TRAINING_BLOCKS,
  TRAINING_LOCATIONS,
  updateSession,
  useDataVersion,
  type Session,
  type SessionPlanItem,
  type SessionStatus,
  type TrainingBlock,
  type TrainingLocation,
  type TrainingStatus,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({
    meta: [
      { title: "Training Designer — T4P" },
      {
        name: "description",
        content:
          "Design each training day block by block — warm-up, strength room, technical, conditioning — with duration, RPE, location and participation.",
      },
      { property: "og:title", content: "Training Designer — T4P" },
      {
        property: "og:description",
        content: "Build the session in blocks, schedule it, mark it completed and save it as a favourite template.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search["date"] === "string" ? (search["date"] as string) : undefined,
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

const STATE_LABEL: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  pending: "Pending completion",
  completed: "Completed",
};

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
  const search = Route.useSearch();
  const [selectedId, setSelectedId] = useState(
    () =>
      (sessionCalendar.find((s) => s.date === search.date) ??
        sessionCalendar.find((s) => s.date === today) ??
        sessionCalendar[sessionCalendar.length - 1])?.id ?? "",
  );
  const [showNew, setShowNew] = useState(false);
  const session = sessionCalendar.find((s) => s.id === selectedId) ?? sessionCalendar[sessionCalendar.length - 1];
  const [participation, setParticipation] = useState<Record<string, TrainingStatus>>(() =>
    Object.fromEntries(players.map((p) => [p.id, defaultStatus(p.availability)])),
  );
  const [items, setItems] = useState<SessionPlanItem[]>(() => session?.plan ?? []);
  const [activeBlock, setActiveBlock] = useState<TrainingBlock>("Warm-up");
  const [actualRpe, setActualRpe] = useState<number>(session?.actualRpe ?? 0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setItems(session?.plan ?? []);
    setActualRpe(session?.actualRpe ?? 0);
  }, [session?.id]);

  const selectSession = (s: Session) => setSelectedId(s.id);

  const addItem = (item: SessionPlanItem) => setItems((prev) => [...prev, item]);
  const patchItem = (i: number, patch: Partial<SessionPlanItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const saveSession = () => {
    if (!session) return;
    updateSession(session.id, {
      plan: items,
      drills: items.map((i) => i.drill),
      durationMin: items.reduce((a, i) => a + (i.durationMin || 0), 0) || session.durationMin,
      ...(actualRpe ? { actualRpe, status: "completed" as SessionStatus } : {}),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const plan = useMemo(() => {
    const minutes = items.reduce((a, i) => a + (i.durationMin || 0), 0);
    const weighted = items.reduce((a, i) => a + (i.rpe || 0) * (i.durationMin || 0), 0);
    const plannedRpe = minutes ? +(weighted / minutes).toFixed(1) : 0;
    return {
      minutes,
      plannedRpe,
      load: Math.round(plannedRpe * minutes),
      blocks: Array.from(new Set(items.map((i) => i.block ?? "Warm-up"))),
    };
  }, [items]);

  const counts = STATUS.map((s) => ({ s, n: Object.values(participation).filter((v) => v === s).length }));

  if (!session) {
    return (
      <AppShell title="Training Designer" subtitle="Build the day block by block">
        <div className="panel p-6">
          <p className="text-sm text-muted-foreground">No sessions yet — create the first training day.</p>
          <NewSessionForm onDone={(id) => setSelectedId(id)} />
        </div>
      </AppShell>
    );
  }

  const state = sessionStatus(session);

  return (
    <AppShell title="Training Designer" subtitle="Blocks · participation · planned load">
      <section className="panel p-4">
        <SectionTitle
          title="Training days"
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
                  const d = window.prompt("Copy this session to date (YYYY-MM-DD)", today);
                  if (d) duplicateSession(session.id, d);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Copy className="size-4" /> Duplicate
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
              setItems([]);
              setActualRpe(0);
              setShowNew(false);
            }}
          />
        )}
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {sessionCalendar.map((s) => {
            const st = sessionStatus(s);
            return (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={`rounded-md border p-3 text-left transition-colors ${
                  s.id === selectedId ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:border-primary/40"
                }`}
              >
                <p className="eyebrow flex items-center justify-between">
                  <span>{s.date === today ? "Today" : s.date.slice(5)}</span>
                  {s.favorite ? <Star className="size-3 fill-primary text-primary" /> : null}
                </p>
                <p className="font-display text-lg font-semibold">{s.label}</p>
                <p className="truncate text-xs text-muted-foreground">{s.title}</p>
                <p
                  className={`mt-1 text-[0.68rem] ${
                    st === "completed" ? "text-success" : st === "pending" ? "text-warning" : "text-muted-foreground"
                  }`}
                >
                  {STATE_LABEL[st]}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Planned duration" value={plan.minutes || session.durationMin} unit="min" icon={<Timer className="size-4" />} />
        <MetricCard label="Planned RPE" value={plan.plannedRpe || session.plannedRpe} hint="Duration-weighted across blocks" />
        <MetricCard
          label="Actual RPE"
          value={actualRpe || "—"}
          hint={actualRpe ? `Difference ${(actualRpe - (plan.plannedRpe || session.plannedRpe)).toFixed(1)}` : "Enter after training"}
          tone={actualRpe > (plan.plannedRpe || session.plannedRpe) ? "warn" : "default"}
        />
        <MetricCard label="Planned load" value={plan.load} unit="AU" hint={`${plan.blocks.length} block(s) planned`} />
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
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={state}
                  onChange={(e) => setSessionStatus(session.id, e.target.value as SessionStatus)}
                  className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs"
                >
                  {(["scheduled", "pending", "completed"] as SessionStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATE_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => toggleSessionFavorite(session.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Star className={`size-4 ${session.favorite ? "fill-primary text-primary" : ""}`} />
                  {session.favorite ? "Favourite" : "Save as favourite"}
                </button>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Actual RPE
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
                  <Save className="size-4" /> {saved ? "Saved" : "Save session"}
                </button>
              </div>
            }
          />

          <div className="mb-3 flex flex-wrap gap-1">
            {TRAINING_BLOCKS.map((b) => {
              const n = items.filter((i) => (i.block ?? "Warm-up") === b).length;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setActiveBlock(b)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                    activeBlock === b ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {b}
                  {n ? <span className="ml-1 text-[0.65rem] opacity-70">({n})</span> : null}
                </button>
              );
            })}
          </div>

          <Pitch />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Session plan</p>
              <div className="space-y-3">
                {TRAINING_BLOCKS.filter((b) => items.some((i) => (i.block ?? "Warm-up") === b)).map((b) => (
                  <div key={b} className="rounded-md border border-border bg-surface-2 p-3">
                    <p className="eyebrow text-primary">{b}</p>
                    <ul className="mt-2 space-y-2">
                      {items.map((it, i) =>
                        (it.block ?? "Warm-up") !== b ? null : (
                          <li key={`${b}-${i}`} className="rounded-md border border-border p-2">
                            <div className="flex items-start justify-between gap-2">
                              <input
                                value={it.drill}
                                onChange={(e) => patchItem(i, { drill: e.target.value })}
                                className="w-full bg-transparent text-sm font-semibold outline-none"
                              />
                              <button onClick={() => removeItem(i)} className="text-xs text-muted-foreground hover:text-destructive">
                                Remove
                              </button>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <label className="text-[0.68rem] text-muted-foreground">
                                Min
                                <input
                                  type="number"
                                  min={0}
                                  value={it.durationMin}
                                  onChange={(e) => patchItem(i, { durationMin: Number(e.target.value) })}
                                  className="control h-8"
                                />
                              </label>
                              <label className="text-[0.68rem] text-muted-foreground">
                                RPE
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={it.rpe}
                                  onChange={(e) => patchItem(i, { rpe: Number(e.target.value) })}
                                  className="control h-8"
                                />
                              </label>
                              <label className="text-[0.68rem] text-muted-foreground">
                                Where
                                <select
                                  value={it.location ?? "Pitch"}
                                  onChange={(e) => patchItem(i, { location: e.target.value as TrainingLocation })}
                                  className="control h-8"
                                >
                                  {TRAINING_LOCATIONS.map((l) => (
                                    <option key={l} value={l}>
                                      {l}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="text-[0.68rem] text-muted-foreground">
                                Purpose
                                <input
                                  value={it.purpose}
                                  onChange={(e) => patchItem(i, { purpose: e.target.value })}
                                  className="control h-8"
                                />
                              </label>
                            </div>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ))}
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Empty session. Pick a block above, then add a drill from the library or a custom part.
                  </p>
                ) : null}
              </div>

              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const name = String(fd.get("name") ?? "").trim();
                  if (!name) return;
                  addItem({
                    drill: name,
                    purpose: activeBlock,
                    durationMin: Number(fd.get("min")) || 10,
                    rpe: Number(fd.get("rpe")) || 5,
                    block: activeBlock,
                    location: activeBlock === "Strength room" ? "Gym" : "Pitch",
                  });
                  e.currentTarget.reset();
                }}
              >
                <input name="name" placeholder={`Custom part for ${activeBlock}`} className="control flex-1" />
                <input name="min" type="number" placeholder="min" className="control w-20" />
                <input name="rpe" type="number" placeholder="RPE" className="control w-20" />
                <button className="rounded-md border border-border px-3 text-sm font-semibold">Add</button>
              </form>
            </div>

            <div>
              <p className="eyebrow mb-2">Drill library → {activeBlock}</p>
              <ul className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
                {drills.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{d.name}</span>
                      <span className="text-xs text-muted-foreground">
                        RPE {d.rpe} · {d.intensity} · <Users className="inline size-3" /> {d.players}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        const drill = getDrill(d.id);
                        addItem({
                          drill: drill.name,
                          purpose: drill.categories[0] ?? activeBlock,
                          durationMin: Number.parseInt(drill.duration, 10) || 10,
                          rpe: drill.rpe,
                          block: activeBlock,
                          location: activeBlock === "Strength room" ? "Gym" : "Pitch",
                        });
                      }}
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
          status: "scheduled",
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
