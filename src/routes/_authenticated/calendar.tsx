import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Star, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import {
  addSession,
  removeSession,
  sessionCalendar,
  sessionStatus,
  setSessionStatus,
  today,
  toggleSessionFavorite,
  useDataVersion,
  type SessionStatus,
} from "@/data/performance";
import { DAY_DESCRIPTIONS, SESSION_TYPES, sessionTypeOf } from "@/data/presets";


export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Training Calendar — T4P" },
      {
        name: "description",
        content:
          "Month view of every training day: scheduled, pending and completed sessions, favourites and one-click access to the designer.",
      },
      { property: "og:title", content: "Training Calendar — T4P" },
      { property: "og:description", content: "See the whole month of training at a glance and open any day." },
    ],
  }),
  component: CalendarPage,
});

const STATE_LABEL: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  pending: "Pending",
  completed: "Completed",
};

const STATE_CLASS: Record<SessionStatus, string> = {
  scheduled: "border-border text-muted-foreground",
  pending: "border-warning/50 text-warning",
  completed: "border-success/50 text-success",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarPage() {
  useDataVersion();
  const base = sessionCalendar[sessionCalendar.length - 1]?.date ?? today;
  const [cursor, setCursor] = useState(() => new Date(`${base.slice(0, 7)}-01T00:00:00`));
  const [filter, setFilter] = useState<"all" | SessionStatus | "favorite">("all");
  const [creating, setCreating] = useState<string | null>(null);
  const navigate = useNavigate();


  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const total = new Date(year, month + 1, 0).getDate();
    const cells: Array<string | null> = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= total; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    return cells;
  }, [year, month]);

  const match = (date: string) =>
    sessionCalendar.filter((s) => {
      if (s.date !== date) return false;
      if (filter === "all") return true;
      if (filter === "favorite") return !!s.favorite;
      return sessionStatus(s) === filter;
    });

  const monthSessions = sessionCalendar.filter((s) => s.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));

  return (
    <AppShell
      title="Training Calendar"
      subtitle="Scheduled · pending · completed"
      actions={
        <Link to="/training" className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
          Open designer
        </Link>
      }
    >
      <section className="panel p-4">
        <SectionTitle
          title={`${MONTHS[month]} ${year}`}
          hint={`${monthSessions.length} session(s) this month`}
          right={
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs"
              >
                <option value="all">All sessions</option>
                <option value="scheduled">Scheduled</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="favorite">Favourites</option>
              </select>
              <button
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                aria-label="Previous month"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="inline-flex size-8 items-center justify-center rounded-md border border-border"
                aria-label="Next month"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] uppercase tracking-widest text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((date, i) =>
            date === null ? (
              <div key={`e-${i}`} className="min-h-24 rounded-md border border-transparent" />
            ) : (
              <div
                key={date}
                className={`min-h-24 rounded-md border p-1.5 ${
                  date === today ? "border-primary bg-primary/5" : "border-border bg-surface-2"
                }`}
              >
                <p className="text-[0.68rem] text-muted-foreground">{Number(date.slice(-2))}</p>
                <div className="mt-1 space-y-1">
                  {match(date).map((s) => {
                    const st = sessionStatus(s);
                    return (
                      <Link
                        key={s.id}
                        to="/training"
                        search={{ date: s.date }}
                        className={`block rounded border px-1.5 py-1 text-left text-[0.68rem] leading-tight ${STATE_CLASS[st]}`}
                      >
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          {s.label}
                          {s.favorite ? <Star className="size-3 fill-primary text-primary" /> : null}
                        </span>
                        <span className="block truncate">{s.title}</span>
                      </Link>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setCreating(date)}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-dashed border-border py-1 text-[0.62rem] text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Plus className="size-3" /> Session
                </button>
              </div>

            ),
          )}
        </div>
      </section>

      <section className="panel mt-4 p-4">
        <SectionTitle title="Month list" hint="Change the state of a day without opening it" />
        <div className="space-y-2">
          {monthSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions in this month.</p>
          ) : null}
          {monthSessions.map((s) => {
            const st = sessionStatus(s);
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    <CalendarDays className="mr-1 inline size-3.5 text-primary" />
                    {s.date} · {s.label} — {s.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{s.objective}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSessionFavorite(s.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    <Star className={`size-3.5 ${s.favorite ? "fill-primary text-primary" : ""}`} /> Favourite
                  </button>
                  <select
                    value={st}
                    onChange={(e) => setSessionStatus(s.id, e.target.value as SessionStatus)}
                    className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs"
                  >
                    {(["scheduled", "pending", "completed"] as SessionStatus[]).map((x) => (
                      <option key={x} value={x}>
                        {STATE_LABEL[x]}
                      </option>
                    ))}
                  </select>
                  <Link
                    to="/training"
                    search={{ date: s.date }}
                    className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    aria-label="Delete session"
                    onClick={() => {
                      if (window.confirm(`Delete ${s.title} on ${s.date}?`)) removeSession(s.id);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {creating ? (
        <CreateSession
          date={creating}
          onClose={() => setCreating(null)}
          onCreated={(date) => {
            setCreating(null);
            void navigate({ to: "/training", search: { date } });
          }}
        />
      ) : null}
    </AppShell>
  );
}

function CreateSession({
  date,
  onClose,
  onCreated,
}: {
  date: string;
  onClose: () => void;
  onCreated: (date: string) => void;
}) {
  const [typeName, setTypeName] = useState(SESSION_TYPES[0]!.name);
  const [label, setLabel] = useState("MD -2");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const preset = sessionTypeOf(typeName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" role="dialog">
      <div className="panel w-full max-w-lg p-4">
        <SectionTitle title={`New session · ${date}`} hint="Blocks are pre-filled from the preset and can be renamed in the designer" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="eyebrow">Session type</span>
            <select className="control mt-1" value={typeName} onChange={(e) => setTypeName(e.target.value)}>
              {SESSION_TYPES.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow">Day description</span>
            <select className="control mt-1" value={label} onChange={(e) => setLabel(e.target.value)}>
              {DAY_DESCRIPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="eyebrow">Title</span>
            <input
              className="control mt-1"
              placeholder={preset.name}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="eyebrow">Objective</span>
            <input className="control mt-1" value={objective} onChange={(e) => setObjective(e.target.value)} />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Blocks: {preset.blocks.join(" · ")} — {preset.defaultMinutes} min, planned RPE {preset.defaultRpe}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={() => {
              addSession({
                date,
                label,
                title: title.trim() || preset.name,
                type: preset.name,
                blockNames: [...preset.blocks],
                durationMin: preset.defaultMinutes,
                plannedRpe: preset.defaultRpe,
                objective: objective.trim() || "Session objective to be defined",
                drills: [],
                plan: [],
                status: "scheduled",
              });
              onCreated(date);
            }}
            className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            Create & open designer
          </button>
        </div>
      </div>
    </div>
  );
}

