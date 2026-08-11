import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Copy,
  Download,
  Dumbbell,
  Eye,
  Layers,
  Pencil,
  Plus,
  Printer,
  Radar,
  Save,
  Search,
  Star,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { exportReport, printSessionSheet } from "@/lib/report-export";
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
  saveBlockTemplate,
  saveSessionTemplate,
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
          "A guided five-step flow: set the day up, build it block by block, preview the session sheet, schedule it, then record GPS or RPE data and let T4P calculate the load.",
      },
      { property: "og:title", content: "Training Designer — T4P" },
      {
        property: "og:description",
        content: "Plan, preview, schedule, record and analyse a training day in one clean flow.",
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
  pending: "Awaiting data",
  completed: "Completed",
};

const STEPS = [
  { id: 1, label: "Session details" },
  { id: 2, label: "Build blocks" },
  { id: 3, label: "Review & save" },
] as const;

const DESIGNER_TYPES = SESSION_TYPES.filter((sessionType) =>
  ["FULL TRAINING", "STRENGTH TRAINING", "RECOVERY", "GAME", "OTHER TRAINING"].includes(sessionType.name),
);

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

/* ------------------------------------------------------------------ */
/* Shared small pieces                                                 */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function StepBar({ step, onStep }: { step: number; onStep: (n: number) => void }) {
  return (
    <nav className="panel mt-4 overflow-x-auto p-2">
      <ol className="flex min-w-max items-stretch gap-1.5">
        {STEPS.map((s) => {
          const active = s.id === step;
          const done = s.id < step;
          return (
            <li key={s.id} className="flex-1">
              <button
                type="button"
                onClick={() => onStep(s.id)}
                className={`flex h-11 w-full items-center gap-2 whitespace-nowrap rounded-md border px-3 text-left text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : done
                      ? "border-border bg-surface-2 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] ${
                    active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="size-3.5" /> : s.id}
                </span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepActions({
  onBack,
  onNext,
  nextLabel,
  children,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
        ) : null}
        {children}
      </div>
      {onNext ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {nextLabel ?? "Continue"} <ArrowRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function TrainingPage() {
  useDataVersion();
  useLibraryVersion();
  const search = Route.useSearch();
  const [selectedId, setSelectedId] = useState(
    () =>
      (sessionCalendar.find((s) => s.date === search.date) ??
        sessionCalendar.find((s) => s.date === today))?.id ?? "",
  );
  const [step, setStep] = useState(1);
  const [showSheet, setShowSheet] = useState(false);
  const session = sessionCalendar.find((s) => s.id === selectedId);

  const [participation, setParticipation] = useState<Record<string, TrainingStatus>>(() =>
    Object.fromEntries(players.map((p) => [p.id, defaultStatus(p.availability)])),
  );
  const [items, setItems] = useState<SessionPlanItem[]>(() => session?.plan ?? []);
  const [blocks, setBlocks] = useState<string[]>(() => session?.blockNames ?? sessionTypeOf(session?.type).blocks);
  const [type, setType] = useState(() => session?.type ?? sessionTypeOf(session?.title).name);
  const [activeBlock, setActiveBlock] = useState<string>(() => blocks[0] ?? "BLOCK 1");
  const [saved, setSaved] = useState("");
  const [drawingIndex, setDrawingIndex] = useState<number | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setItems(session.plan ?? []);
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
    if (items.length === 0) {
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

  const uniqueBlockName = (base: string, existing: string[]) => {
    let name = base.trim().toUpperCase() || "BLOCK";
    let n = 2;
    while (existing.includes(name)) name = `${base.trim().toUpperCase()} (${n++})`;
    return name;
  };

  /** Copy a block (name + every drill inside it) into the same training. */
  const duplicateBlock = (b: string) => {
    const name = uniqueBlockName(`${b} COPY`, blocks);
    setBlocks((prev) => [...prev, name]);
    setItems((prev) => [
      ...prev,
      ...prev.filter((i) => (i.block ?? "") === b).map((i) => ({ ...i, block: name })),
    ]);
    setActiveBlock(name);
    flash(`${b} duplicated as ${name}`);
  };

  /** Copy one drill inside its block. */
  const duplicateItem = (index: number) => {
    setItems((prev) => {
      const it = prev[index];
      if (!it) return prev;
      const next = [...prev];
      next.splice(index + 1, 0, { ...it });
      return next;
    });
  };

  /** Save a block to the library so it can be reused in another training. */
  const saveBlock = (b: string) => {
    const blockItems = items.filter((i) => (i.block ?? "") === b);
    if (!blockItems.length) {
      flash("Add at least one item to this block first");
      return;
    }
    saveBlockTemplate(b, blockItems);
    flash(`${b} saved to your library`);
  };

  const plan = useMemo(() => {
    const minutes = items.reduce((a, i) => a + (i.durationMin || 0), 0);
    const weighted = items.reduce((a, i) => a + (i.rpe || 0) * (i.durationMin || 0), 0);
    const plannedRpe = minutes ? +(weighted / minutes).toFixed(1) : 0;
    const actualWeighted = items.reduce((a, i) => a + (i.actualRpe || 0) * (i.durationMin || 0), 0);
    const reported = items.filter((i) => i.actualRpe).reduce((a, i) => a + (i.durationMin || 0), 0);
    const actualRpe = reported ? +(actualWeighted / reported).toFixed(1) : 0;
    const tonnage = items.reduce(
      (a, i) => a + (i.strength ? i.strength.sets * i.strength.reps * (i.strength.weightKg ?? 0) : 0),
      0,
    );
    return {
      minutes,
      plannedRpe,
      actualRpe,
      load: Math.round(plannedRpe * minutes),
      actualLoad: Math.round(actualRpe * minutes),
      tonnage,
    };
  }, [items]);

  const flash = (msg: string) => {
    setSaved(msg);
    window.setTimeout(() => setSaved(""), 2200);
  };

  const saveSession = (markStatus?: SessionStatus, msg = "Saved") => {
    if (!session) return;
    updateSession(session.id, {
      plan: items,
      blockNames: blocks,
      type,
      drills: items.map((i) => i.drill),
      durationMin: plan.minutes || session.durationMin,
      plannedRpe: plan.plannedRpe || session.plannedRpe,
      ...(plan.actualRpe ? { actualRpe: plan.actualRpe } : {}),
      ...(markStatus ? { status: markStatus } : {}),
    });
    flash(msg);
  };

  /** Save the whole training (blocks + plan) as a reusable template. */
  const saveAsTemplate = () => {
    if (!session) return;
    const name = window.prompt("Name this training template", `${type} — ${session.title}`);
    if (name === null) return;
    saveSessionTemplate({
      name,
      type,
      objective: session.objective,
      durationMin: plan.minutes || session.durationMin,
      plannedRpe: plan.plannedRpe || session.plannedRpe,
      blockNames: blocks,
      plan: items,
    });
    flash("Training saved to your library");
  };

  /** Copy this whole training onto another date. */
  const duplicateToDate = () => {
    if (!session) return;
    const date = window.prompt("Duplicate this training to which date? (YYYY-MM-DD)", session.date);
    if (!date) return;
    const copy = duplicateSession(session.id, date);
    if (copy) {
      setSelectedId(copy.id);
      flash(`Duplicated to ${date}`);
    }
  };

  /** Delete the day and move the selection to a neighbouring day. */
  const deleteDay = () => {
    if (!session) return;
    if (!window.confirm(`Delete ${session.date} — ${session.title}? This cannot be undone.`)) return;
    const rest = sessionCalendar.filter((s) => s.id !== session.id);
    removeSession(session.id);
    setSelectedId(rest[rest.length - 1]?.id ?? "");
    setStep(1);
    flash("Training day deleted");
  };

  const counts = STATUS.map((s) => ({ s, n: Object.values(participation).filter((v) => v === s).length }));


  if (!session) {
    return (
      <AppShell
        title="Create today’s training"
        subtitle={today}
        actions={
          <Link to="/calendar" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold">
            <ArrowLeft className="size-4" /> Calendar
          </Link>
        }
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="font-semibold">Start here</p>
            <p className="text-sm text-muted-foreground">Confirm today’s details, then build the session one block at a time.</p>
          </div>
          <NewSessionForm
            onDone={(id) => {
              setSelectedId(id);
              setStep(2);
            }}
          />
        </div>
      </AppShell>
    );
  }

  const state = sessionStatus(session);
  const hasGps = sessionHasGps(session);
  const distribution = hasGps ? blockDistribution({ ...session, plan: items, blockNames: blocks }) : [];

  /** What the sheet shows: fall back to the values stored on the day when the blocks are still empty. */
  const sheetMinutes = plan.minutes || session.durationMin || 0;
  const sheetRpe = plan.plannedRpe || session.plannedRpe || 0;
  const sheetLoad = plan.load || Math.round(sheetMinutes * sheetRpe);

  const sheetPayload = () => ({
    club: "Training 4 Performance",
    date: session.date,
    label: session.label,
    type,
    group: session.group ?? TRAINING_GROUPS[0]!,
    objective: session.objective,
    minutes: sheetMinutes,
    rpe: sheetRpe,
    load: sheetLoad,
    blocks: blocks.map((b) => {
      const bItems = items.filter((i) => (i.block ?? "") === b);
      return {
        name: b,
        minutes: bItems.reduce((a, i) => a + (i.durationMin || 0), 0),
        items: bItems.map((it) => ({
          drill: it.drill,
          detail: it.strength
            ? `${it.strength.sets} × ${it.strength.reps}${
                it.strength.weightKg ? ` @ ${it.strength.weightKg} kg` : ""
              } · rest ${it.strength.restSec}s`
            : `${it.durationMin} min · RPE ${it.rpe} · ${it.location ?? "Pitch"} · ${it.purpose}`,
        })),
      };
    }),
  });

  /** Print / save the session sheet as a clean A4 PDF. */
  const printSheet = () => {
    const ok = printSessionSheet(sheetPayload());
    toast[ok ? "success" : "message"](
      ok ? "Session sheet opened — use “Save as PDF”" : "Pop-up blocked — the sheet was downloaded instead",
    );
  };

  /** Download this exact training as a spreadsheet (Excel or CSV). */
  const exportSession = (format: "Excel" | "CSV") => {
    const rows = blocks.flatMap((b) => {
      const bItems = items.filter((i) => (i.block ?? "") === b);
      if (!bItems.length) return [[b, "—", 0, 0, "", ""]];
      return bItems.map((it) => [
        b,
        it.drill,
        it.durationMin || 0,
        it.rpe || 0,
        it.actualRpe || "",
        it.strength
          ? `${it.strength.sets}×${it.strength.reps}${it.strength.weightKg ? ` @ ${it.strength.weightKg}kg` : ""}`
          : (it.purpose ?? ""),
      ]);
    });
    const msg = exportReport(format, {
      title: `${type} — ${session.date}`,
      club: "Training 4 Performance",
      subtitle: `${session.label} · ${session.group ?? TRAINING_GROUPS[0]} · ${STATE_LABEL[state]}`,
      headline: [
        { label: "Duration", value: `${sheetMinutes} min` },
        { label: "Planned RPE", value: String(sheetRpe) },
        { label: "Planned load", value: `${sheetLoad} AU` },
        { label: "Reported load", value: plan.actualLoad ? `${plan.actualLoad} AU` : hasGps ? "From GPS" : "—" },
      ],
      columns: ["Block", "Drill", "Minutes", "Planned RPE", "Reported RPE", "Detail"],
      rows,
      observations: [session.objective || "No objective recorded", hasGps ? "GPS data attached to this day" : "No GPS attached"],
    });
    toast.success(msg);
  };


  return (
    <AppShell
      title="Training Designer"
      subtitle={`${session.date === today ? "Today" : session.date} · ${type}`}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/calendar" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold">
            <ArrowLeft className="size-4" /> Calendar
          </Link>
          <button type="button" onClick={() => saveSession(undefined, "Draft saved")} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
            <Save className="size-4" /> Save
          </button>
        </div>
      }
    >
      <StepBar step={step} onStep={setStep} />

      {saved ? (
        <p className="mt-3 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
          <CheckCircle2 className="size-4" /> {saved}
        </p>
      ) : null}

      {/* ---------- step 1 · setup ---------- */}
      {step === 1 && (
        <section className="panel mt-4 p-5">
          <SectionTitle
            title="Set up the day"
            hint="Type of day, match-day cycle, which group trains and the objective"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Session type">
              <select value={type} onChange={(e) => applyType(e.target.value)} className="control">
                {DESIGNER_TYPES.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                value={session.date}
                onChange={(e) => updateSession(session.id, { date: e.target.value })}
                className="control"
              />
            </Field>
            <Field label="Match-day cycle">
              <select
                value={session.label}
                onChange={(e) => updateSession(session.id, { label: e.target.value })}
                className="control"
              >
                {[...new Set([session.label, ...DAY_DESCRIPTIONS])].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Group who trains">
              <select
                value={session.group ?? TRAINING_GROUPS[0]}
                onChange={(e) => updateSession(session.id, { group: e.target.value })}
                className="control"
              >
                {TRAINING_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Objective">
              <input
                defaultValue={session.objective}
                onBlur={(e) => updateSession(session.id, { objective: e.target.value })}
                className="control"
              />
            </Field>
          </div>

          <StepActions onNext={() => setStep(2)} nextLabel="Build the blocks">
            <button
              type="button"
              onClick={deleteDay}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" /> Delete day
            </button>

          </StepActions>
        </section>
      )}

      {/* ---------- step 2 · blocks ---------- */}
      {step === 2 && (
        <>
          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Planned duration"
              value={plan.minutes}
              unit="min"
              icon={<Timer className="size-4" />}
            />
            <MetricCard label="Planned RPE" value={plan.plannedRpe} hint="Calculated from added items" />
            <MetricCard label="Planned load" value={plan.load} unit="AU" hint={`${blocks.length} blocks`} />
            <MetricCard
              label="Gym tonnage"
              value={plan.tonnage ? Math.round(plan.tonnage) : "—"}
              unit={plan.tonnage ? "kg" : ""}
              hint="Sets × reps × kg"
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-3">
            <div className="panel p-5 xl:col-span-2">
              <SectionTitle
                title="Blocks"
                hint="Select a block, then add items from the library — rename or add blocks freely"
                right={
                  <button
                    type="button"
                    onClick={() => {
                      const name = `BLOCK ${blocks.length + 1}`;
                      setBlocks((b) => [...b, name]);
                      setActiveBlock(name);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Layers className="size-4" /> Add block
                  </button>
                }
              />
              <div className="mb-4 flex flex-wrap gap-1.5">
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
                          className="h-9 w-44 rounded-md border border-primary bg-surface-2 px-2 text-xs uppercase outline-none"
                        />
                      </form>
                    );
                  return (
                    <span
                      key={b}
                      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${
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

              <div id="plan-blocks" className="scroll-mt-24 space-y-3">
                {blocks.filter((b) => b === activeBlock).map((b) => {
                  const blockItems = items.map((it, i) => ({ it, i })).filter(({ it }) => (it.block ?? "") === b);
                  const gym = isGymBlock(b, preset.kind);
                  const min = blockItems.reduce((a, x) => a + (x.it.durationMin || 0), 0);
                  return (
                    <div key={b} className="rounded-md border border-border bg-surface-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="eyebrow text-primary">{b}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[0.68rem] text-muted-foreground">{min} min</span>
                          <button
                            type="button"
                            onClick={() => saveBlock(b)}
                            className="h-7 rounded-md border border-border px-2 text-[0.68rem] text-muted-foreground hover:text-primary"
                          >
                            Save block
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateBlock(b)}
                            className="h-7 rounded-md border border-border px-2 text-[0.68rem] text-muted-foreground hover:text-primary"
                          >
                            Duplicate block
                          </button>
                        </div>
                      </div>
                      <ul className="mt-2 space-y-2">
                        {blockItems.map(({ it, i }) => (
                          <li key={`${b}-${i}`} className="rounded-md border border-border bg-card p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <input
                                value={it.drill}
                                onChange={(e) => patchItem(i, { drill: e.target.value })}
                                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                              />
                              <div className="flex shrink-0 items-center gap-2">
                                {!gym && !it.strength ? (
                                  <button
                                    onClick={() => setDrawingIndex(i)}
                                    className="h-7 rounded-md border border-border px-2 text-[0.68rem] text-muted-foreground hover:text-primary"
                                  >
                                    {it.drawing ? "Edit drawing" : "Draw on board"}
                                  </button>
                                ) : null}
                                <button
                                  onClick={() => duplicateItem(i)}
                                  className="h-7 rounded-md border border-border px-2 text-[0.68rem] text-muted-foreground hover:text-primary"
                                >
                                  Duplicate
                                </button>
                                <button
                                  onClick={() => removeItem(i)}
                                  className="h-7 rounded-md border border-border px-2 text-[0.68rem] text-muted-foreground hover:text-destructive"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            {gym || it.strength ? (
                              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
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
                                  onChange={(v) =>
                                    patchItem(i, { strength: { ...defaultStrength(it), intensityPct: v } })
                                  }
                                />
                                <NumField
                                  label="Rest s"
                                  value={it.strength?.restSec ?? 90}
                                  onChange={(v) => patchItem(i, { strength: { ...defaultStrength(it), restSec: v } })}
                                />
                                <NumField
                                  label="Minutes"
                                  value={it.durationMin}
                                  onChange={(v) => patchItem(i, { durationMin: v })}
                                />
                              </div>
                            ) : (
                              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <NumField
                                  label="Minutes"
                                  value={it.durationMin}
                                  onChange={(v) => patchItem(i, { durationMin: v })}
                                />
                                <NumField label="RPE" value={it.rpe} onChange={(v) => patchItem(i, { rpe: v })} />
                                <Field label="Where">
                                  <select
                                    value={it.location ?? "Pitch"}
                                    onChange={(e) => patchItem(i, { location: e.target.value as TrainingLocation })}
                                    className="control"
                                  >
                                    {TRAINING_LOCATIONS.map((l) => (
                                      <option key={l} value={l}>
                                        {l}
                                      </option>
                                    ))}
                                  </select>
                                </Field>
                                <Field label="Purpose">
                                  <select
                                    value={it.purpose}
                                    onChange={(e) => patchItem(i, { purpose: e.target.value })}
                                    className="control"
                                  >
                                    {[...new Set([it.purpose, ...DRILL_PURPOSES])].map((p) => (
                                      <option key={p} value={p}>
                                        {p}
                                      </option>
                                    ))}
                                  </select>
                                </Field>
                              </div>
                            )}
                            {it.drawing ? (
                              <p className="mt-2 text-[0.68rem] text-success">Tactics-board drawing attached</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {!blockItems.length ? (
                        <div className="mt-3 rounded-md border border-dashed border-border p-5 text-center">
                          <p className="text-sm font-semibold">This block is empty</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Add a training drill or strength exercise from the library beside it.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <form
                className="mt-4 grid gap-3 sm:grid-cols-[1fr_6rem_6rem_auto]"
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
                <Field label={`Custom item for ${activeBlock}`}>
                  <input name="name" placeholder="Name" className="control" />
                </Field>
                <Field label="Minutes">
                  <input name="min" type="number" className="control" />
                </Field>
                <Field label="RPE">
                  <input name="rpe" type="number" className="control" />
                </Field>
                <button className="h-9 self-end rounded-md border border-border px-4 text-xs font-semibold hover:border-primary hover:text-primary">
                  Add
                </button>
              </form>

              <StepActions onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Preview the session">
                <button
                  type="button"
                  onClick={() => saveSession(undefined, "Draft saved")}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Save className="size-4" /> Save draft
                </button>
              </StepActions>
            </div>

            <Library
              gym={gymMode}
              activeBlock={activeBlock}
              blockCount={items.filter((i) => (i.block ?? "") === activeBlock).length}
              onAdd={(item) => {
                addItem({ ...item, block: activeBlock });
                toast.success(`${item.drill} added to ${activeBlock}`, {
                  description: `${item.durationMin} min · tap "See block" to edit it`,
                  action: {
                    label: "See block",
                    onClick: () =>
                      document.getElementById("plan-blocks")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  },
                });
              }}
            />

          </section>

        </>
      )}

      {/* ---------- step 3 · preview & schedule ---------- */}
      {step === 3 && (
        <section className="panel mt-4 p-5">
          <SectionTitle
            title="Preview & schedule"
            hint="This is the sheet the coach receives — check it, then schedule the day"
            right={
              <button
                type="button"
                onClick={() => setShowSheet(true)}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <Printer className="size-4" /> Open full sheet
              </button>
            }
          />
          <div className="rounded-md border border-border bg-surface-2 p-4">
            <SessionSheet
              date={session.date}
              label={session.label}
              type={type}
              group={session.group ?? TRAINING_GROUPS[0]!}
              objective={session.objective}
              blocks={blocks}
              items={items}
              minutes={sheetMinutes}
              plannedRpe={sheetRpe}
              load={sheetLoad}
              onEdit={(b) => {
                if (b) setActiveBlock(b);
                setStep(2);
              }}

            />
          </div>

          <StepActions onBack={() => setStep(2)}>
            <button
              type="button"
              onClick={() => saveSession("scheduled", "Scheduled — it is on the calendar")}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
            >
              <CalendarPlus className="size-4" /> Schedule this day
            </button>
            <button
              type="button"
              onClick={saveAsTemplate}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Save as template
            </button>
            <button
              type="button"
              onClick={duplicateToDate}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Duplicate to another date
            </button>
            <button
              type="button"
              onClick={() => saveSession("pending", "Marked as awaiting data")}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Mark as awaiting data
            </button>
          </StepActions>
        </section>
      )}

      {/* ---------- step 4 · record data ---------- */}
      {step === 4 && (
        <section className="panel mt-4 p-5">
          <SectionTitle
            title="Record the data"
            hint="Import GPS for the whole session or per block — or enter the reported RPE per block by hand"
            right={
              <span
                className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${
                  state === "completed"
                    ? "border-success/40 bg-success/10 text-success"
                    : state === "pending"
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-border text-muted-foreground"
                }`}
              >
                {STATE_LABEL[state]}
              </span>
            }
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <p className="eyebrow mb-2">Option A · GPS data</p>
              <p className="text-sm text-muted-foreground">
                {hasGps
                  ? "GPS data is already associated with this day. It is distributed across the blocks by duration and intensity."
                  : "No GPS yet for this day. Import the file and it is written into this exact session."}
              </p>
              <Link
                to="/gps"
                search={{ session: session.id }}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
              >
                <Radar className="size-4" /> {hasGps ? "Open GPS import" : "Import GPS for this session"}
              </Link>
            </div>

            <div className="rounded-md border border-border p-4">
              <p className="eyebrow mb-2">Option B · Reported RPE per block</p>
              <p className="mb-3 text-sm text-muted-foreground">
                No GPS? Enter what the players reported for each block — <T4P /> computes session-RPE load
                (RPE × minutes) and feeds the same acute:chronic model.
              </p>
              <ul className="space-y-2">
                {blocks.map((b) => {
                  const idxs = items.map((it, i) => ({ it, i })).filter(({ it }) => (it.block ?? "") === b);
                  if (!idxs.length) return null;
                  const min = idxs.reduce((a, x) => a + (x.it.durationMin || 0), 0);
                  const current = idxs[0]?.it.actualRpe ?? 0;
                  return (
                    <li key={b} className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{b}</span>
                        <span className="text-xs text-muted-foreground">{min} min planned</span>
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={current || ""}
                        placeholder="RPE"
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setItems((prev) =>
                            prev.map((it) => ((it.block ?? "") === b ? { ...it, actualRpe: v } : it)),
                          );
                        }}
                        className="control h-9 w-20 shrink-0 text-center"
                      />
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Session load from RPE: <span className="metric-value text-primary">{plan.actualLoad || 0}</span> AU
                {plan.actualRpe ? ` · weighted RPE ${plan.actualRpe}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border p-4">
            <p className="eyebrow mb-2">Participation</p>
            <div className="mb-3 flex flex-wrap gap-1 text-xs">
              {counts
                .filter((c) => c.n > 0)
                .map((c) => (
                  <span key={c.s} className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                    {c.n} {c.s.toLowerCase()}
                  </span>
                ))}
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
                  <span className="min-w-0 truncate text-sm">
                    {fullName(p)} <span className="text-xs text-muted-foreground">· {p.position}</span>
                  </span>
                  <select
                    value={participation[p.id]}
                    onChange={(e) =>
                      setParticipation((prev) => ({ ...prev, [p.id]: e.target.value as TrainingStatus }))
                    }
                    className="control h-8 w-40 shrink-0 text-xs"
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

          <StepActions onBack={() => setStep(3)} onNext={() => setStep(5)} nextLabel="See load & alerts">
            <button
              type="button"
              onClick={() => {
                saveSession("completed", "Completed — load calculated");
                setSessionStatus(session.id, "completed");
                setStep(5);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
            >
              <CheckCircle2 className="size-4" /> Mark completed & calculate load
            </button>
          </StepActions>
        </section>
      )}

      {/* ---------- step 5 · load & alerts ---------- */}
      {step === 5 && (
        <>
          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Planned load"
              value={sheetLoad}
              unit="AU"
              hint={`RPE ${sheetRpe} × ${sheetMinutes} min (AU = arbitrary units)`}
            />
            <MetricCard
              label="Actual load"
              value={plan.actualLoad || (hasGps ? "GPS" : "—")}
              unit={plan.actualLoad ? "AU" : ""}
              hint={hasGps ? "GPS associated with this day" : "From reported RPE"}
              tone={plan.actualLoad && plan.actualLoad > sheetLoad * 1.15 ? "warn" : "good"}
            />
            <MetricCard label="Duration" value={sheetMinutes} unit="min" />

            <MetricCard label="Status" value={STATE_LABEL[state]} hint={`${session.date} · ${session.label}`} />
          </section>

          <section className="panel mt-4 p-5">
            <SectionTitle
              title="Block-by-block association"
              hint={
                hasGps
                  ? distribution[0]?.block === "WHOLE SESSION"
                    ? "The day is not cut into blocks — GPS is associated with the whole session"
                    : "GPS is distributed across the blocks by duration and intensity"
                  : "No GPS yet — the table below uses the planned and reported RPE"
              }
            />
            <div className="scroll-pane overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2">Block</th>
                    <th className="py-2">Min</th>
                    <th className="py-2">RPE</th>
                    {hasGps ? (
                      <>
                        <th className="py-2 text-right">Distance m</th>
                        <th className="py-2 text-right">HSR m</th>
                        <th className="py-2 text-right">Sprint m</th>
                        <th className="py-2 text-right">Acc</th>
                        <th className="py-2 text-right">Dec</th>
                      </>
                    ) : null}
                    <th className="py-2 text-right">Load AU</th>
                  </tr>
                </thead>
                <tbody>
                  {hasGps
                    ? distribution.map((r) => (
                        <tr key={r.block} className="border-b border-border/60">
                          <td className="py-2 font-semibold">{r.block}</td>
                          <td>{r.minutes}</td>
                          <td>{r.rpe}</td>
                          <td className="text-right tabular-nums">{r.distance.toLocaleString()}</td>
                          <td className="text-right tabular-nums">{r.hsr}</td>
                          <td className="text-right tabular-nums">{r.sprint}</td>
                          <td className="text-right tabular-nums">{r.accel}</td>
                          <td className="text-right tabular-nums">{r.decel}</td>
                          <td className="text-right tabular-nums">{r.load}</td>
                        </tr>
                      ))
                    : blocks.map((b) => {
                        const bi = items.filter((i) => (i.block ?? "") === b);
                        if (!bi.length) return null;
                        const min = bi.reduce((a, i) => a + (i.durationMin || 0), 0);
                        const rpe = bi[0]?.actualRpe || bi[0]?.rpe || 0;
                        return (
                          <tr key={b} className="border-b border-border/60">
                            <td className="py-2 font-semibold">{b}</td>
                            <td>{min}</td>
                            <td>{rpe}</td>
                            <td className="text-right tabular-nums">{Math.round(rpe * min)}</td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/alerts"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
              >
                Check alerts
              </Link>
              <Link
                to="/analytics"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Acute:chronic & analytics
              </Link>
              <Link
                to="/reports"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Build the report
              </Link>
              <Link
                to="/logbook"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Open logbook
              </Link>
            </div>

            <StepActions onBack={() => setStep(4)} />
          </section>
        </>
      )}

      {/* ---------- session sheet modal ---------- */}
      {showSheet ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/95 p-3">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-lg font-semibold">Session sheet</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setShowSheet(false);
                    setStep(2);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
                >
                  <Pencil className="size-4" /> Edit blocks
                </button>
                <button
                  onClick={printSheet}

                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Printer className="size-4" /> Print / PDF
                </button>
                <button
                  onClick={() => setShowSheet(false)}
                  className="h-9 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="panel p-5">
              <SessionSheet
                date={session.date}
                label={session.label}
                type={type}
                group={session.group ?? TRAINING_GROUPS[0]!}
                objective={session.objective}
                blocks={blocks}
                items={items}
                minutes={sheetMinutes}
                plannedRpe={sheetRpe}
                load={sheetLoad}
                onEdit={(b) => {
                  if (b) setActiveBlock(b);
                  setShowSheet(false);
                  setStep(2);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}


      {/* ---------- drawing modal ---------- */}
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
                className="h-9 rounded-md border border-border px-3 text-xs text-muted-foreground hover:text-foreground"
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

/* ------------------------------------------------------------------ */
/* Session sheet (the A4 the coach reads)                              */
/* ------------------------------------------------------------------ */

function SessionSheet({
  date,
  label,
  type,
  group,
  objective,
  blocks,
  items,
  minutes,
  plannedRpe,
  load,
  onEdit,
}: {
  date: string;
  label: string;
  type: string;
  group: string;
  objective: string;
  blocks: string[];
  items: SessionPlanItem[];
  minutes: number;
  plannedRpe: number;
  load: number;
  onEdit?: (block?: string) => void;
}) {
  return (
    <article className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="eyebrow text-primary">{label}</p>
          <h2 className="font-display text-2xl font-semibold">{type}</h2>
          <p className="text-sm text-muted-foreground">
            {date} · {group}
          </p>
        </div>
        <dl className="flex gap-5 text-right">
          <div>
            <dt className="eyebrow">Duration</dt>
            <dd className="metric-value text-xl">{minutes}′</dd>
          </div>
          <div>
            <dt className="eyebrow">RPE</dt>
            <dd className="metric-value text-xl">{plannedRpe || "—"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Load</dt>
            <dd className="metric-value text-xl text-primary">{load} AU</dd>
          </div>
        </dl>
      </header>

      {objective ? <p className="text-sm text-muted-foreground">Objective — {objective}</p> : null}

      <p className="rounded-md border border-border bg-surface-2 p-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">How these numbers are produced.</span>{" "}
        <b>Duration</b> = the minutes of every item you placed in the blocks (if no item has minutes yet, the duration
        stored on the day is used — that is where 66′ comes from). <b>RPE</b> = the duration-weighted average of the RPE
        set on each item, on the Borg CR10 0–10 scale. <b>Load</b> = RPE × duration in <b>AU (Arbitrary Units)</b>, the
        standard session-RPE load unit — 66 min at RPE 6 = 396 AU. It only reads 0 when the blocks contain no items with
        minutes and RPE. This page is a read-only printout;{" "}
        {onEdit ? "use Edit blocks to change anything." : "go to step 2 · Build the blocks to change anything."}
      </p>


      <div className="grid gap-3 sm:grid-cols-2">
        {blocks.map((b, bi) => {
          const bItems = items.filter((i) => (i.block ?? "") === b);
          const min = bItems.reduce((a, i) => a + (i.durationMin || 0), 0);
          return (
            <section key={b} className="rounded-md border border-border p-3">
              <p className="flex items-baseline justify-between gap-2">
                <span className="eyebrow text-primary">
                  {bi + 1}. {b}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">{min} min</span>
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(b)}
                      className="rounded border border-border px-1.5 text-[0.65rem] font-semibold text-muted-foreground hover:text-primary"
                    >
                      Edit
                    </button>
                  ) : null}
                </span>
              </p>
              {bItems.length ? (
                <ol className="mt-2 space-y-1.5">
                  {bItems.map((it, i) => (
                    <li key={i} className="rounded-md bg-surface-2 p-2 text-sm">
                      <p className="font-semibold">{it.drill}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.strength
                          ? `${it.strength.sets} × ${it.strength.reps}${
                              it.strength.weightKg ? ` @ ${it.strength.weightKg} kg` : ""
                            }${it.strength.intensityPct ? ` · ${it.strength.intensityPct}% 1RM` : ""} · rest ${
                              it.strength.restSec
                            }s`
                          : `${it.durationMin} min · RPE ${it.rpe} · ${it.location ?? "Pitch"} · ${it.purpose}`}
                        {it.drawing ? " · drawing attached" : ""}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Nothing planned in this block yet.{" "}
                  {onEdit ? (
                    <button type="button" onClick={() => onEdit(b)} className="font-semibold text-primary underline">
                      Add drills
                    </button>
                  ) : null}
                </p>
              )}

            </section>
          );
        })}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Small inputs, library, new-day form                                 */
/* ------------------------------------------------------------------ */

const defaultStrength = (it: SessionPlanItem) => it.strength ?? { sets: 3, reps: 8, weightKg: 0, restSec: 90 };

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label}>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} className="control" />
    </Field>
  );
}

function Library({
  gym,
  activeBlock,
  blockCount,
  onAdd,
}: {
  gym: boolean;
  activeBlock: string;
  blockCount: number;
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
    <div className="panel p-5">
      <SectionTitle
        title={`Library → ${activeBlock}`}
        hint="Tap + to drop a drill into the selected block"
        right={
          <button
            type="button"
            onClick={() =>
              document.getElementById("plan-blocks")?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            {blockCount} in this block · See block
          </button>
        }
      />

      <div className="mb-3 flex gap-1.5">
        {(["field", "gym"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-9 flex-1 rounded-md border px-2.5 text-xs font-semibold ${
              tab === t ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {t === "field" ? "Training drills" : "Strength exercises"}
          </button>
        ))}
      </div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="control pl-8" />
      </div>

      <ul className="scroll-pane max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
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
                    onAdd({ drill: d.name, purpose: d.purpose, durationMin: d.minutes, rpe: d.rpe, location: "Pitch" })
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
                      <li
                        key={e.name}
                        className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                      >
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
        className="mt-3 h-9 w-full rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        {showCustom ? "Close" : `Add my own ${tab === "gym" ? "exercise" : "drill"}`}
      </button>
      {showCustom ? (
        <form
          className="mt-3 grid gap-3"
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
          <Field label="Name">
            <input name="name" className="control" />
          </Field>
          {tab === "gym" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pattern">
                <select name="pattern" className="control">
                  {LIFT_PATTERNS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sets">
                <input name="sets" type="number" className="control" />
              </Field>
              <Field label="Reps">
                <input name="reps" type="number" className="control" />
              </Field>
              <Field label="% 1RM">
                <input name="intensity" type="number" className="control" />
              </Field>
              <Field label="Rest (s)">
                <input name="rest" type="number" className="control" />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Purpose">
                <select name="purpose" className="control">
                  {DRILL_PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="RPE">
                <input name="rpe" type="number" className="control" />
              </Field>
              <Field label="Minutes">
                <input name="min" type="number" className="control" />
              </Field>
            </div>
          )}
          <button className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
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
    label: "TRAINING",
    objective: "",
    group: TRAINING_GROUPS[0]!,
  });

  const preset = sessionTypeOf(form.type);

  return (
    <form
      className="grid gap-4 rounded-md border border-border bg-card p-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const s = addSession({
          date: form.date,
          label: form.label,
          title: form.type,
          type: form.type,
          blockNames: ["BLOCK 1"],
          objective: form.objective || `${form.type} session`,
          durationMin: 0,
          plannedRpe: 0,
          drills: [],
          plan: [],
          group: form.group,
          status: "scheduled",
        });
        if (s) onDone(s.id);
      }}
    >
      <Field label="Date">
        <input className="control" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
      </Field>
      <Field label="Training type">
        <select className="control" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          {DESIGNER_TYPES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Match-day cycle">
        <select className="control" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}>
          {DAY_DESCRIPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Group">
        <select className="control" value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}>
          {TRAINING_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Objective">
        <input
          className="control"
          placeholder="What is the day for?"
          value={form.objective}
          onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
        />
      </Field>
      <div className="flex items-end sm:col-span-2">
        <button type="submit" className="h-11 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
          Start building blocks
        </button>
      </div>
    </form>
  );
}
