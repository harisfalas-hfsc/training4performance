import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarDays, Copy, Dumbbell, Map, Pencil, Plus, Search, Timer } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { TrainingsExplorer } from "@/components/trainings-explorer";
import { Button } from "@/components/ui/button";
import {
  duplicateSession,
  sessionCalendar,
  sessionStatus,
  useDataVersion,
  type Session,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/trainings")({
  head: () => ({
    meta: [
      { title: "Trainings — Review, Edit & Analyse | T4P" },
      {
        name: "description",
        content:
          "Review every football training, search tagged drills, edit or duplicate sessions, and analyse training data.",
      },
      { property: "og:title", content: "Trainings — Review, Edit & Analyse | T4P" },
      {
        property: "og:description",
        content:
          "One place for every training session, drill, block, strength prescription and tactics-board plan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrainingsPage,
});

type Tab = "review" | "analyse";

function allTags(session: Session) {
  return [...new Set((session.plan ?? []).flatMap((item) => item.tags ?? []))];
}

function TrainingsPage() {
  useDataVersion();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("review");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const sessions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...sessionCalendar]
      .filter((session) => !from || session.date >= from)
      .filter((session) => !to || session.date <= to)
      .filter((session) => {
        if (!needle) return true;
        const searchable = [
          session.title,
          session.label,
          session.type,
          session.objective,
          ...session.drills,
          ...allTags(session),
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(needle);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [query, from, to, sessionCalendar.length]);

  const duplicate = (session: Session) => {
    const date = window.prompt("Duplicate this training to which date? (YYYY-MM-DD)", session.date);
    if (!date) return;
    const copy = duplicateSession(session.id, date);
    if (!copy) return;
    toast.success(`Training duplicated to ${date}`);
    void navigate({ to: "/training", search: { date } });
  };

  return (
    <AppShell
      title="Trainings"
      subtitle="Review, search, edit, duplicate and analyse every training"
      actions={
        <Button asChild>
          <Link to="/training">
            <Plus /> Create training
          </Link>
        </Button>
      }
    >
      <div className="mb-4 flex gap-2">
        <Button variant={tab === "review" ? "default" : "outline"} onClick={() => setTab("review")}>
          Training review
        </Button>
        <Button
          variant={tab === "analyse" ? "default" : "outline"}
          onClick={() => setTab("analyse")}
        >
          Analyse trainings
        </Button>
      </div>

      {tab === "analyse" ? (
        <TrainingsExplorer />
      ) : (
        <div className="space-y-4">
          <section className="panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_11rem_11rem]">
            <label className="field">
              <span className="field-label">Search trainings, drills or tags</span>
              <span className="control flex items-center gap-2">
                <Search className="size-4 text-muted-foreground" />
                <input
                  className="min-w-0 flex-1 bg-transparent outline-none"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rondo 5v2, strength, pressing…"
                />
              </span>
            </label>
            <label className="field">
              <span className="field-label">From</span>
              <input
                className="control"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">To</span>
              <input
                className="control"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </section>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              {sessions.length} training{sessions.length === 1 ? "" : "s"}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/calendar">
                <CalendarDays /> Open calendar
              </Link>
            </Button>
          </div>

          {sessions.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {sessions.map((session) => {
                const plan = session.plan ?? [];
                const tags = allTags(session);
                const drawings = plan.filter((item) => item.drawing).length;
                const firstDrawingIndex = plan.findIndex((item) => item.drawing);
                const firstDrawing = firstDrawingIndex >= 0 ? plan[firstDrawingIndex] : undefined;
                const strength = plan.filter((item) => item.strength).length;
                return (
                  <article key={session.id} className="panel min-w-0 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary">
                          {session.date} · {session.label}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">{session.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{session.objective}</p>
                      </div>
                      <span className="rounded-md border border-border px-2 py-1 text-xs font-semibold capitalize">
                        {sessionStatus(session)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Timer className="size-3.5" /> {session.durationMin} min
                      </span>
                      <span>
                        {session.blockNames?.length ?? 0} blocks · {plan.length} drills
                      </span>
                      {drawings ? (
                        <span className="inline-flex items-center gap-1">
                          <Map className="size-3.5" /> {drawings} tactics board
                          {drawings === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {strength ? (
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="size-3.5" /> {strength} strength prescription
                          {strength === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    {tags.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      {firstDrawing ? (
                        <Button asChild size="sm">
                          <Link
                            to="/training"
                            search={{
                              date: session.date,
                              block: firstDrawing.block,
                              board: firstDrawingIndex,
                            }}
                          >
                            <Map /> View tactics board
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild size="sm">
                        <Link to="/training" search={{ date: session.date }}>
                          <Pencil /> Review & edit
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => duplicate(session)}>
                        <Copy /> Duplicate
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="panel p-8 text-center text-sm text-muted-foreground">
              No trainings match these filters. Create a training or clear the search.
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
