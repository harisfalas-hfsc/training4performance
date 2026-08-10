import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { parseDrawing, TacticsBoard } from "@/components/tactics-board";
import {
  sessionCalendar,
  sessionStatus,
  updateSession,
  useDataVersion,
  type SessionPlanItem,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "Tactics Board & Session Designer — T4P" },
      {
        name: "description",
        content:
          "Interactive football tactics board: place players, cones, goals and equipment, draw runs, passes and zones, then attach the drawing to a training session.",
      },
      { property: "og:title", content: "Tactics Board & Session Designer — T4P" },
      {
        property: "og:description",
        content: "Coach-style tactic board with clickable tool palettes, drag-and-drop tokens and session association.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoardPage,
});

function BoardPage() {
  useDataVersion();
  const sessions = useMemo(() => [...sessionCalendar].sort((a, b) => b.date.localeCompare(a.date)), []);
  const [sessionId, setSessionId] = useState<string>(sessions[0]?.id ?? "");
  const [itemIndex, setItemIndex] = useState<number>(-1);
  const [saved, setSaved] = useState<string | null>(null);

  const session = sessionCalendar.find((s) => s.id === sessionId);
  const plan: SessionPlanItem[] = session?.plan ?? [];
  const current = itemIndex >= 0 ? plan[itemIndex] : undefined;
  const drawing = parseDrawing(current?.drawing);

  const save = (d: ReturnType<typeof parseDrawing>) => {
    if (!session || !d) return;
    const json = JSON.stringify(d);
    const next: SessionPlanItem[] = [...plan];
    if (itemIndex >= 0 && next[itemIndex]) {
      next[itemIndex] = { ...next[itemIndex]!, drawing: json };
    } else {
      next.push({
        drill: "Board drawing",
        purpose: "Tactical / technical",
        durationMin: 15,
        rpe: session.plannedRpe,
        block: session.blockNames?.[0] ?? "BLOCK 1",
        drawing: json,
      });
      setItemIndex(next.length - 1);
    }
    updateSession(session.id, { plan: next });
    setSaved(`Saved to ${session.date} · ${session.title}`);
    window.setTimeout(() => setSaved(null), 2500);
  };

  return (
    <AppShell
      title="Tactics Board"
      subtitle="Design a drill, attach it to a training session, then track it on the calendar"
    >
      <section className="panel mb-4 p-4">
        <SectionTitle
          title="Associate this drawing with a training"
          hint="Pick the session and the exercise the drawing belongs to — it appears in the designer and on the calendar"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="eyebrow">Training session</span>
            <select
              className="control mt-1"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setItemIndex(-1);
              }}
            >
              {sessions.length === 0 ? <option value="">No sessions yet — create one on the calendar</option> : null}
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.date} · {s.label} — {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow">Exercise / block</span>
            <select className="control mt-1" value={itemIndex} onChange={(e) => setItemIndex(Number(e.target.value))}>
              <option value={-1}>New exercise in this session</option>
              {plan.map((p, i) => (
                <option key={i} value={i}>
                  {p.block ? `${p.block} · ` : ""}
                  {p.drill}
                  {p.drawing ? " (has drawing)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <p className="text-xs text-muted-foreground">
              {session ? (
                <>
                  Status: <span className="text-foreground">{sessionStatus(session)}</span> · {plan.length} exercise(s)
                  planned · {plan.filter((p) => p.drawing).length} with a drawing
                </>
              ) : (
                "Create a session on the calendar first."
              )}
            </p>
          </div>
        </div>
        {saved ? (
          <p className="mt-3 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-2.5 text-sm text-success">
            <Link2 className="size-4" /> {saved}
          </p>
        ) : null}
      </section>

      <TacticsBoard
        key={`${sessionId}-${itemIndex}`}
        drawing={drawing}
        onSave={save}
        saveLabel={session ? "Save to session" : "Save drawing"}
      />

      <section className="mt-6 panel p-4">
        <SectionTitle title="How to use the board" hint="Everything is tap-first, so it works on the touchline" />
        <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>· Pick the session and exercise above — every drawing is stored inside that training.</li>
          <li>· Tap <span className="text-foreground">Players</span> or <span className="text-foreground">Equipment</span> to open a palette, pick an item, then tap the pitch to place it.</li>
          <li>· Drag any token at any time to reposition it — no need to switch back to the Move tool.</li>
          <li>· Arrow, dashed arrow, line and freehand draw runs, passes and dribbles in the selected colour.</li>
          <li>· Zone and circle mark playing areas; text adds a label anywhere on the pitch.</li>
          <li>· Rotate switches between portrait and landscape; export saves the board as a PNG.</li>
        </ul>
      </section>
    </AppShell>
  );
}
