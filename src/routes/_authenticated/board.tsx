import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { parseDrawing, TacticsBoard } from "@/components/tactics-board";
import { DRILL_PURPOSES, saveBlockTemplate } from "@/data/presets";
import { LIBRARY_CATEGORIES } from "@/data/library-categories";
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
          "Interactive football tactics board: place players, cones, goals and equipment, draw runs, passes and zones, then save the drill to your library or attach it to a training session.",
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

  /* the drill itself */
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState<string>(DRILL_PURPOSES[0] ?? "Technical / tactical");
  const [category, setCategory] = useState<string>("TECHNICAL / TACTICAL");
  const [minutes, setMinutes] = useState(15);
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [drawingJson, setDrawingJson] = useState<string>("");

  /* where it goes */
  const [sessionId, setSessionId] = useState<string>(sessions[0]?.id ?? "");
  const [itemIndex, setItemIndex] = useState<number>(-1);
  const [blockName, setBlockName] = useState<string>("");
  const [saved, setSaved] = useState<string | null>(null);

  const session = sessionCalendar.find((s) => s.id === sessionId);
  const plan: SessionPlanItem[] = session?.plan ?? [];
  const blocks = session?.blockNames ?? ["BLOCK 1"];
  const current = itemIndex >= 0 ? plan[itemIndex] : undefined;
  const drawing = parseDrawing(drawingJson || current?.drawing);

  const flash = (msg: string) => {
    setSaved(msg);
    window.setTimeout(() => setSaved(null), 2800);
  };

  const asItem = (): SessionPlanItem => ({
    drill: (name.trim() || "Board drill").toUpperCase(),
    purpose,
    durationMin: minutes || 15,
    rpe: 0,
    notes: description,
    ...(drawingJson ? { drawing: drawingJson } : {}),
    ...(tags.trim()
      ? { tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }
      : {}),
  });

  /** Keep the drawing in this page's state so both destinations can use it. */
  const captureDrawing = (d: ReturnType<typeof parseDrawing>) => {
    if (!d) return;
    setDrawingJson(JSON.stringify(d));
    flash("Drawing captured — now save it to your library or attach it to a training");
  };

  const saveToLibrary = () => {
    if (!name.trim()) {
      toast.error("Give the drill a name first");
      return;
    }
    const block = saveBlockTemplate(name.trim(), [asItem()], { category, description });
    if (block) flash(`${name.trim()} saved to your library (${category})`);
  };

  const attachToSession = () => {
    if (!session) {
      toast.error("Create a session on the calendar first");
      return;
    }
    const next: SessionPlanItem[] = [...plan];
    const target = blockName || blocks[0] || "BLOCK 1";
    if (itemIndex >= 0 && next[itemIndex]) {
      next[itemIndex] = {
        ...next[itemIndex]!,
        ...(drawingJson ? { drawing: drawingJson } : {}),
        notes: description || next[itemIndex]!.notes,
        ...(name.trim() ? { drill: name.trim().toUpperCase() } : {}),
      };
    } else {
      next.push({ ...asItem(), block: target });
      setItemIndex(next.length - 1);
    }
    updateSession(session.id, { plan: next });
    flash(`Added to ${session.date} · ${session.title}`);
  };

  return (
    <AppShell
      title="Tactics Board"
      subtitle="Draw the drill, describe it, then save it to your library or drop it into a training"
    >
      <section className="panel mb-4 p-4">
        <SectionTitle
          title="1 · The drill"
          hint="Exactly the same fields as the Training Designer, so a board drill can travel anywhere"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="eyebrow">Name</span>
            <input
              className="control mt-1"
              placeholder="e.g. Rondo 5v2 — one touch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="eyebrow">Purpose</span>
            <select className="control mt-1" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              {DRILL_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow">Minutes</span>
            <input
              type="number"
              min={1}
              className="control mt-1"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </label>
          <label className="block">
            <span className="eyebrow">Tags (comma separated)</span>
            <input
              className="control mt-1"
              placeholder="Rondo, Possession, MD-3"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="eyebrow">Description — how the drill runs</span>
          <textarea
            rows={3}
            className="control mt-1 h-auto py-2"
            placeholder="Area, number of players, rules, progressions and coaching points."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </section>

      <TacticsBoard
        key={`${sessionId}-${itemIndex}`}
        drawing={drawing}
        onSave={captureDrawing}
        saveLabel="Use this drawing"
      />

      <section className="panel mt-4 p-4">
        <SectionTitle
          title="2 · Where does it go?"
          hint="Keep it as a reusable library drill, put it straight into a training, or both"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-border p-3">
            <p className="eyebrow mb-2 text-primary">Save to my library</p>
            <label className="block">
              <span className="eyebrow">Library section</span>
              <select className="control mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                {LIBRARY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={saveToLibrary}
              className="mt-3 h-9 w-full rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
            >
              Save drill to my library
            </button>
            <p className="mt-2 text-[0.68rem] text-muted-foreground">
              It then appears in the Training Designer library panel and on the Library page, ready to drop into any
              block.
            </p>
          </div>

          <div className="rounded-md border border-border p-3">
            <p className="eyebrow mb-2 text-primary">Put it in a training</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="eyebrow">Training session</span>
                <select
                  className="control mt-1"
                  value={sessionId}
                  onChange={(e) => {
                    setSessionId(e.target.value);
                    setItemIndex(-1);
                    setBlockName("");
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
                <span className="eyebrow">Exercise</span>
                <select
                  className="control mt-1"
                  value={itemIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setItemIndex(idx);
                    if (idx >= 0) {
                      const it = plan[idx];
                      setDescription(it?.notes ?? "");
                      if (it?.drill) setName(it.drill);
                    }
                  }}
                >
                  <option value={-1}>New exercise</option>
                  {plan.map((p, i) => (
                    <option key={i} value={i}>
                      {p.block ? `${p.block} · ` : ""}
                      {p.drill}
                      {p.drawing ? " (has drawing)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {itemIndex < 0 ? (
                <label className="block">
                  <span className="eyebrow">Block</span>
                  <select className="control mt-1" value={blockName} onChange={(e) => setBlockName(e.target.value)}>
                    {blocks.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="flex items-end">
                <p className="text-[0.68rem] text-muted-foreground">
                  {session
                    ? `${sessionStatus(session)} · ${plan.length} exercise(s) · ${plan.filter((p) => p.drawing).length} with a drawing`
                    : "Create a session on the calendar first."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={attachToSession}
              className="mt-3 h-9 w-full rounded-md border border-border px-4 text-xs font-semibold hover:border-primary hover:text-primary"
            >
              Add to this training
            </button>
          </div>
        </div>

        {saved ? (
          <p className="mt-3 flex items-center gap-2 rounded-md border border-success/40 bg-success/10 p-2.5 text-sm text-success">
            <Link2 className="size-4" /> {saved}
          </p>
        ) : null}
      </section>

      <section className="mt-6 panel p-4">
        <SectionTitle title="How to use the board" hint="Everything is tap-first, so it works on the touchline" />
        <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>· Name and describe the drill above — it travels with the drawing wherever you send it.</li>
          <li>· Tap <span className="text-foreground">Players</span> or <span className="text-foreground">Equipment</span> to open a palette, pick an item, then tap the pitch to place it.</li>
          <li>· Drag any token at any time to reposition it — no need to switch back to the Move tool.</li>
          <li>· Arrow, dashed arrow, line and freehand draw runs, passes and dribbles in the selected colour.</li>
          <li>· Tap <span className="text-foreground">Use this drawing</span>, then choose the library, a training, or both.</li>
          <li>· Rotate switches between portrait and landscape; export saves the board as a PNG.</li>
        </ul>
      </section>
    </AppShell>
  );
}
