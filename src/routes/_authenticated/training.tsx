import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  Copy,
  Dumbbell,
  Layers,
  Pencil,
  Plus,
  Save,
  Search,
  Star,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { TacticsBoard, parseDrawing } from "@/components/tactics-board";
import {
  addSession,
  blockDistribution,
  duplicateSession,
  fullName,
  players,
  removeSession,
  sessionCalendar,
  sessionHasGps,
  sessionStatus,
  setSessionStatus,
  today,
  toggleSessionFavorite,
  TRAINING_LOCATIONS,
  updateSession,
  useDataVersion,
  type Session,
  type SessionPlanItem,
  type SessionStatus,
  type TrainingLocation,
  type TrainingStatus,
} from "@/data/performance";
import {
  addCustomDrill,
  addStrengthExercise,
  allDrills,
  allStrengthExercises,
  DAY_DESCRIPTIONS,
  DRILL_PURPOSES,
  LIFT_PATTERNS,
  SESSION_TYPES,
  sessionTypeOf,
  TRAINING_GROUPS,
  useLibraryVersion,
} from "@/data/presets";

export const Route = createFileRoute("/_authenticated/training")({
  head: () => ({
    meta: [
      { title: "Training Designer — T4P" },
      {
        name: "description",
        content:
          "Design field, indoor, recovery or strength-room sessions in renamable blocks, prescribe sets, reps, load and rest, draw the drill on the tactics board and push the day to the calendar.",
      },
      { property: "og:title", content: "Training Designer — T4P" },
      {
        property: "og:description",
        content:
          "Preset session types and drill libraries from the club logbook, block-by-block planning and automatic GPS association on completion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { date?: string } =>
    typeof search["date"] === "string" ? { date: search["date"] as string } : {},
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
  pending: "Incomplete — waiting for data",
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

const isGymBlock = (name: string, kind: string) =>
  kind === "gym" || /STRENGTH|LIFT|GYM|CORE|ACCESSORY|POWER ROOM/i.test(name);

function TrainingPage() {
  useDataVersion();
  useLibraryVersion();
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
  const [blocks, setBlocks] = useState<string[]>(
    () => session?.blockNames ?? sessionTypeOf(session?.type).blocks,
  );
  const [type, setType] = useState(() => session?.type ?? sessionTypeOf(session?.title).name);
  const [activeBlock, setActiveBlock] = useState<string>(() => blocks[0] ?? "BLOCK 1");
  const [actualRpe, setActualRpe] = useState<number>(session?.actualRpe ?? 0);
  const [saved, setSaved] = useState(false);
  const [drawingIndex, setDrawingIndex] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setItems(session.plan ?? []);
    setActualRpe(session.actualRpe ?? 0);
    const t = session.type ?? sessionTypeOf(session.title).name;
    setType(t);
    const b = session.blockNames ?? sessionTypeOf(t).blocks;
    setBlocks(b);
    setActiveBlock(b[0] ?? "BLOCK 1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const preset = sessionTypeOf(type);
  const gymMode = isGymBlock(activeBlock, preset.kind);

  const addItem = (item: SessionPlanItem) => setItems((prev) => [...prev, item]);
  const patchItem = (i: number, patch: Partial<SessionPlanItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const applyType = (name: string) => {
    setType(name);
    const t = sessionTypeOf(name);
    const empty = items.length === 0;
    if (empty) {
      setBlocks(t.blocks);
      setActiveBlock(t.blocks[0] ?? "BLOCK 1");
    }
  };

  const renameBlock = (old: string, next: string) => {
    const name = next.trim().toUpperCase();
    if (!name || name === old) return;
    setBlocks((prev) => prev.map((b) => (b === old ? name : b)));
    setItems((prev) => prev.map((i) => ((i.block ?? "") === old ? { ...i, block: name } : i)));
    setActiveBlock((b) => (b === old ? name : b));
  };

  const saveSession = (markStatus?: SessionStatus) => {
    if (!session) return;
    const minutes = items.reduce((a, i) => a + (i.durationMin || 0), 0);
    updateSession(session.id, {
      plan: items,
      blockNames: blocks,
      type,
      drills: items.map((i) => i.drill),
      durationMin: minutes || session.durationMin,
      plannedRpe: plan.plannedRpe || session.plannedRpe,
      ...(actualRpe ? { actualRpe } : {}),
      ...(markStatus ? { status: markStatus } : {}),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const plan = useMemo(() => {
    const minutes = items.reduce((a, i) => a + (i.durationMin || 0), 0);
    const weighted = items.reduce((a, i) => a + (i.rpe || 0) * (i.durationMin || 0), 0);
    const plannedRpe = minutes ? +(weighted / minutes).toFixed(1) : 0;
    const tonnage = items.reduce(
      (a, i) => a + (i.strength ? i.strength.sets * i.strength.reps * (i.strength.weightKg ?? 0) : 0),
      0,
    );
    return { minutes, plannedRpe, load: Math.round(plannedRpe * minutes), tonnage };
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
  const distribution = state === "completed" && sessionHasGps(session) ? blockDistribution({ ...session, plan: items, blockNames: blocks }) : [];

  return (
    <AppShell title="Training Designer" subtitle="Session type · blocks · prescriptions · GPS association">
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
                onClick={() => setSelectedId(s.id)}
                className={`rounded-md border p-3 text-left transition-colors ${
                  s.id === selectedId ? "border-primary bg-primary/10" : "border-border bg-surface-2 hover:border-primary/40"
                }`}
              >
                <p className="eyebrow flex items-center justify-between">
                  <span>{s.date === today ? "Today" : s.date.slice(5)}</span>
                  {s.favorite ? <Star className="size-3 fill-primary text-primary" /> : null}
                </p>
                <p className="font-display text-lg font-semibold">{s.label}</p>
                <p className="truncate text-xs text-muted-foreground">{s.type ?? s.title}</p>
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
        <MetricCard label="Planned load" value={plan.load} unit="AU" hint={`${blocks.length} blocks`} />
        <MetricCard
          label={plan.tonnage ? "Gym tonnage" : "Actual RPE"}
          value={plan.tonnage ? Math.round(plan.tonnage) : actualRpe || "—"}
          unit={plan.tonnage ? "kg" : ""}
          hint={plan.tonnage ? "Sets × reps × kg" : "Enter after training"}
        />
      </section>

      {/* session settings */}
      <section className="panel mt-4 p-4">
        <SectionTitle
          title="Session setup"
          hint="Pick the type of day — the blocks below are preset defaults you can rename"
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
                {session.favorite ? "Favourite" : "Save as template"}
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
                onClick={() => saveSession("pending")}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Save & mark incomplete
              </button>
              <button
                type="button"
                onClick={() => saveSession()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <Save className="size-4" /> {saved ? "Saved" : "Save to calendar"}
              </button>
            </div>
          }
        />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-[0.68rem] text-muted-foreground">
            Session type
            <select value={type} onChange={(e) => applyType(e.target.value)} className="control h-9">
              {SESSION_TYPES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.68rem] text-muted-foreground">
            Day description
            <select
              value={session.label}
              onChange={(e) => updateSession(session.id, { label: e.target.value })}
              className="control h-9"
            >
              {[...new Set([session.label, ...DAY_DESCRIPTIONS])].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.68rem] text-muted-foreground">
            Group
            <select
              value={session.group ?? TRAINING_GROUPS[0]}
              onChange={(e) => updateSession(session.id, { group: e.target.value })}
              className="control h-9"
            >
              {TRAINING_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[0.68rem] text-muted-foreground">
            Objective
            <input
              defaultValue={session.objective}
              onBlur={(e) => updateSession(session.id, { objective: e.target.value })}
              className="control h-9"
            />
          </label>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Blocks"
            hint="Rename, add or remove blocks — defaults come from the session type"
            right={
              <button
                type="button"
                onClick={() => {
                  const name = `BLOCK ${blocks.length + 1}`;
                  setBlocks((b) => [...b, name]);
                  setActiveBlock(name);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Layers className="size-4" /> Add block
              </button>
            }
          />
          <div className="mb-3 flex flex-wrap gap-1">
            {blocks.map((b) => {
              const n = items.filter((i) => (i.block ?? "") === b).length;
              const active = activeBlock === b;
              if (renaming === b)
                return (
                  <form
                    key={b}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = new FormData(e.currentTarget).get("n");
                      renameBlock(b, String(v ?? ""));
                      setRenaming(null);
                    }}
                  >
                    <input
                      name="n"
                      autoFocus
                      defaultValue={b}
                      onBlur={(e) => {
                        renameBlock(b, e.target.value);
                        setRenaming(null);
                      }}
                      className="h-8 w-40 rounded-md border border-primary bg-surface-2 px-2 text-xs uppercase outline-none"
                    />
                  </form>
                );
              return (
                <span
                  key={b}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${
                    active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <button type="button" onClick={() => setActiveBlock(b)}>
                    {b}
                    {n ? <span className="ml-1 text-[0.65rem] opacity-70">({n})</span> : null}
                  </button>
                  <button type="button" onClick={() => setRenaming(b)} aria-label={`Rename ${b}`}>
                    <Pencil className="size-3 opacity-60 hover:opacity-100" />
                  </button>
                  {blocks.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Remove ${b}`}
                      onClick={() => {
                        setBlocks((prev) => prev.filter((x) => x !== b));
                        setItems((prev) => prev.filter((i) => (i.block ?? "") !== b));
                        if (activeBlock === b) setActiveBlock(blocks.find((x) => x !== b) ?? "BLOCK 1");
                      }}
                    >
                      <X className="size-3 opacity-60 hover:opacity-100" />
                    </button>
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="space-y-3">
            {blocks.map((b) => {
              const blockItems = items.map((it, i) => ({ it, i })).filter(({ it }) => (it.block ?? "") === b);
              if (!blockItems.length) return null;
              const gym = isGymBlock(b, preset.kind);
              const min = blockItems.reduce((a, x) => a + (x.it.durationMin || 0), 0);
              return (
                <div key={b} className="rounded-md border border-border bg-surface-2 p-3">
                  <p className="eyebrow flex items-center justify-between text-primary">
                    <span>{b}</span>
                    <span className="text-muted-foreground">{min} min</span>
                  </p>
                  <ul className="mt-2 space-y-2">
                    {blockItems.map(({ it, i }) => (
                      <li key={`${b}-${i}`} className="rounded-md border border-border p-2">
                        <div className="flex items-start justify-between gap-2">
                          <input
                            value={it.drill}
                            onChange={(e) => patchItem(i, { drill: e.target.value })}
                            className="w-full bg-transparent text-sm font-semibold outline-none"
                          />
                          <div className="flex shrink-0 items-center gap-2">
                            {!gym ? (
                              <button
                                onClick={() => setDrawingIndex(i)}
                                className="rounded-md border border-border px-2 py-0.5 text-[0.68rem] text-muted-foreground hover:text-primary"
                              >
                                {it.drawing ? "Edit drawing" : "Draw on board"}
                              </button>
                            ) : null}
                            <button onClick={() => removeItem(i)} className="text-xs text-muted-foreground hover:text-destructive">
                              Remove
                            </button>
                          </div>
                        </div>
                        {gym || it.strength ? (
                          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                            <NumField
                              label="Sets"
                              value={it.strength?.sets ?? 3}
                              onChange={(v) => patchItem(i, { strength: { ...defaultStrength(it), sets: v } })}
                            />
                            <NumField
                              label="Reps"
                              value={it.strength?.reps ?? 8}
                              onChange={(v) => patchItem(i, { strength: { ...defaultStrength(it), reps: v } })}
                            />
                            <NumField
                              label="Kg"
                              value={it.strength?.weightKg ?? 0}
                              onChange={(v) => patchItem(i, { strength: { ...defaultStrength(it), weightKg: v } })}
                            />
                            <NumField
                              label="% 1RM"
                              value={it.strength?.intensityPct ?? 0}
                              onChange={(v) => patchItem(i, { strength: { ...defaultStrength(it), intensityPct: v } })}
                            />
                            <NumField
                              label="Rest s"
                              value={it.strength?.restSec ?? 90}
                              onChange={(v) => patchItem(i, { strength: { ...defaultStrength(it), restSec: v } })}
                            />
                            <NumField label="Min" value={it.durationMin} onChange={(v) => patchItem(i, { durationMin: v })} />
                          </div>
                        ) : (
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <NumField label="Min" value={it.durationMin} onChange={(v) => patchItem(i, { durationMin: v })} />
                            <NumField label="RPE" value={it.rpe} onChange={(v) => patchItem(i, { rpe: v })} />
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
                              <select
                                value={it.purpose}
                                onChange={(e) => patchItem(i, { purpose: e.target.value })}
                                className="control h-8"
                              >
                                {[...new Set([it.purpose, ...DRILL_PURPOSES])].map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        )}
                        {it.drawing ? (
                          <p className="mt-1 text-[0.68rem] text-success">Tactics-board drawing attached</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Empty session. Select a block above, then add exercises from the library on the right.
              </p>
            ) : null}
          </div>

          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") ?? "").trim();
              if (!name) return;
              addItem({
                drill: name.toUpperCase(),
                purpose: gymMode ? "STRENGTH" : activeBlock,
                durationMin: Number(fd.get("min")) || 10,
                rpe: Number(fd.get("rpe")) || 5,
                block: activeBlock,
                location: gymMode ? "Gym" : "Pitch",
                ...(gymMode ? { strength: { sets: 3, reps: 8, weightKg: 0, restSec: 90 } } : {}),
              });
              e.currentTarget.reset();
            }}
          >
            <input name="name" placeholder={`Custom item for ${activeBlock}`} className="control min-w-40 flex-1" />
            <input name="min" type="number" placeholder="min" className="control w-20" />
            <input name="rpe" type="number" placeholder="RPE" className="control w-20" />
            <button className="rounded-md border border-border px-3 text-sm font-semibold">Add</button>
          </form>
        </div>

        <Library
          gym={gymMode}
          activeBlock={activeBlock}
          onAdd={(item) => addItem({ ...item, block: activeBlock })}
        />
      </section>

      {distribution.length ? (
        <section className="panel mt-4 p-4">
          <SectionTitle
            title="GPS association"
            hint={
              distribution[0]?.block === "WHOLE SESSION"
                ? "The day is not cut into blocks — the GPS data is associated with the whole session"
                : "The day is cut into blocks — the recorded GPS is distributed across the blocks by duration and intensity"
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Block</th>
                  <th>Min</th>
                  <th>RPE</th>
                  <th>Distance m</th>
                  <th>HSR m</th>
                  <th>Sprint m</th>
                  <th>Acc</th>
                  <th>Dec</th>
                  <th>Load AU</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((r) => (
                  <tr key={r.block} className="border-t border-border">
                    <td className="py-2 font-semibold">{r.block}</td>
                    <td>{r.minutes}</td>
                    <td>{r.rpe}</td>
                    <td className="tabular-nums">{r.distance.toLocaleString()}</td>
                    <td className="tabular-nums">{r.hsr}</td>
                    <td className="tabular-nums">{r.sprint}</td>
                    <td>{r.accel}</td>
                    <td>{r.decel}</td>
                    <td className="tabular-nums">{r.load}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Squad average per block. Open a player passport for the individual split.
          </p>
        </section>
      ) : state !== "completed" ? (
        <section className="panel mt-4 p-4 text-sm text-muted-foreground">
          Session is <span className="text-foreground">{STATE_LABEL[state].toLowerCase()}</span>. Import or enter the GPS
          data for {session.date}, then mark the day completed to see the block-by-block association, alerts and load.
        </section>
      ) : null}

      <section className="panel mt-4 p-4">
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
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
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
      </section>

      {drawingIndex !== null && items[drawingIndex] ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/90 p-3">
          <div className="mx-auto max-w-5xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg font-semibold">
                Drawing — {items[drawingIndex]!.drill}
                <span className="ml-2 text-xs text-muted-foreground">{activeBlock}</span>
              </p>
              <button
                onClick={() => setDrawingIndex(null)}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <TacticsBoard
              drawing={parseDrawing(items[drawingIndex]!.drawing)}
              saveLabel="Save to drill"
              onSave={(d) => {
                patchItem(drawingIndex, { drawing: JSON.stringify(d) });
                setDrawingIndex(null);
              }}
            />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

const defaultStrength = (it: SessionPlanItem) =>
  it.strength ?? { sets: 3, reps: 8, weightKg: 0, restSec: 90 };

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-[0.68rem] text-muted-foreground">
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="control h-8"
      />
    </label>
  );
}

function Library({
  gym,
  activeBlock,
  onAdd,
}: {
  gym: boolean;
  activeBlock: string;
  onAdd: (item: SessionPlanItem) => void;
}) {
  useLibraryVersion();
  const [tab, setTab] = useState<"field" | "gym">(gym ? "gym" : "field");
  const [q, setQ] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => setTab(gym ? "gym" : "field"), [gym]);

  const drills = allDrills().filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
  const lifts = allStrengthExercises().filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="panel p-4">
      <SectionTitle title={`Library → ${activeBlock}`} hint="Defaults from the club logbook — add your own any time" />
      <div className="mb-2 flex gap-1">
        {(["field", "gym"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
              tab === t ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {t === "field" ? "Training drills" : "Strength exercises"}
          </button>
        ))}
      </div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="control h-9 pl-8" />
      </div>

      <ul className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
        {tab === "field"
          ? drills.map((d) => (
              <li key={d.name} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{d.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {d.purpose} · RPE {d.rpe} · {d.minutes} min
                  </span>
                </span>
                <button
                  onClick={() =>
                    onAdd({
                      drill: d.name,
                      purpose: d.purpose,
                      durationMin: d.minutes,
                      rpe: d.rpe,
                      location: "Pitch",
                    })
                  }
                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                  aria-label={`Add ${d.name}`}
                >
                  <Plus className="size-4" />
                </button>
              </li>
            ))
          : LIFT_PATTERNS.map((pattern) => {
              const group = lifts.filter((l) => l.pattern === pattern);
              if (!group.length) return null;
              return (
                <li key={pattern}>
                  <p className="eyebrow mb-1 mt-2 text-primary">{pattern}</p>
                  <ul className="space-y-1.5">
                    {group.map((e) => (
                      <li key={e.name} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                        <span className="min-w-0">
                          <span className="block truncate text-sm">
                            <Dumbbell className="mr-1 inline size-3 text-muted-foreground" />
                            {e.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {e.sets} × {e.reps} · {e.intensity ? `${e.intensity}% 1RM · ` : ""}rest {e.restSec}s
                          </span>
                        </span>
                        <button
                          onClick={() =>
                            onAdd({
                              drill: e.name,
                              purpose: "STRENGTH",
                              durationMin: Math.max(5, Math.round((e.sets * (e.restSec + 30)) / 60)),
                              rpe: e.intensity >= 75 ? 7 : 5,
                              location: "Gym",
                              strength: {
                                sets: e.sets,
                                reps: e.reps,
                                weightKg: 0,
                                intensityPct: e.intensity,
                                restSec: e.restSec,
                              },
                            })
                          }
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
                          aria-label={`Add ${e.name}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
      </ul>

      <button
        onClick={() => setShowCustom((v) => !v)}
        className="mt-3 w-full rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {showCustom ? "Close" : `Add my own ${tab === "gym" ? "exercise" : "drill"}`}
      </button>
      {showCustom ? (
        <form
          className="mt-2 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") ?? "").trim();
            if (!name) return;
            if (tab === "gym") {
              addStrengthExercise({
                name,
                pattern: (String(fd.get("pattern")) as (typeof LIFT_PATTERNS)[number]) ?? "Low push",
                sets: Number(fd.get("sets")) || 3,
                reps: Number(fd.get("reps")) || 8,
                intensity: Number(fd.get("intensity")) || 0,
                restSec: Number(fd.get("rest")) || 90,
              });
            } else {
              addCustomDrill({
                name: name.toUpperCase(),
                purpose: String(fd.get("purpose") ?? "TACTICS"),
                rpe: Number(fd.get("rpe")) || 5,
                minutes: Number(fd.get("min")) || 12,
              });
            }
            e.currentTarget.reset();
            setShowCustom(false);
          }}
        >
          <input name="name" placeholder="Name" className="control" />
          {tab === "gym" ? (
            <div className="grid grid-cols-2 gap-2">
              <select name="pattern" className="control">
                {LIFT_PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input name="sets" type="number" placeholder="Sets" className="control" />
              <input name="reps" type="number" placeholder="Reps" className="control" />
              <input name="intensity" type="number" placeholder="% 1RM" className="control" />
              <input name="rest" type="number" placeholder="Rest (s)" className="control" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <select name="purpose" className="control">
                {DRILL_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input name="rpe" type="number" placeholder="RPE" className="control" />
              <input name="min" type="number" placeholder="Minutes" className="control" />
            </div>
          )}
          <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Save to my library
          </button>
        </form>
      ) : null}
    </div>
  );
}

function NewSessionForm({ onDone }: { onDone: (id: string) => void }) {
  const [form, setForm] = useState({
    date: today,
    type: SESSION_TYPES[0]!.name,
    label: "MD -2",
    objective: "",
    group: TRAINING_GROUPS[0]!,
  });

  const preset = sessionTypeOf(form.type);

  return (
    <form
      className="mt-3 grid gap-2 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-3 xl:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const s = addSession({
          date: form.date,
          label: form.label,
          title: form.type,
          type: form.type,
          blockNames: preset.blocks,
          objective: form.objective || `${form.type} session`,
          durationMin: preset.defaultMinutes,
          plannedRpe: preset.defaultRpe,
          drills: [],
          plan: [],
          group: form.group,
          status: "scheduled",
        });
        onDone(s.id);
      }}
    >
      <input className="control" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
      <select className="control" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
        {SESSION_TYPES.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
      <select className="control" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}>
        {DAY_DESCRIPTIONS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select className="control" value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}>
        {TRAINING_GROUPS.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          className="control flex-1"
          placeholder="Objective"
          value={form.objective}
          onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
        />
        <button type="submit" className="rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
          Create
        </button>
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-3 xl:col-span-5">
        Preset blocks: {preset.blocks.join(" · ")} — you can rename them after creating the day.
      </p>
    </form>
  );
}
