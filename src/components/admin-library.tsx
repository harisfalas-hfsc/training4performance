import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseDrawing, TacticsBoard } from "@/components/tactics-board";

import { LIBRARY_CATEGORIES, normalizeCategory } from "@/data/library-categories";
import { allDrills, allStrengthExercises } from "@/data/presets";
import type { SessionPlanItem } from "@/data/performance";
import {
  deleteLibraryBlock,
  listLibraryBlocks,
  saveLibraryBlock,
  type LibraryBlock,
} from "@/lib/library.functions";

type BlockForm = {
  id: string;
  category: string;
  name: string;
  description: string;
  published: boolean;
  items: SessionPlanItem[];
};

const empty: BlockForm = {
  id: "",
  category: LIBRARY_CATEGORIES[0] ?? "STRENGTH",
  name: "",
  description: "",
  published: true,
  items: [],
};

/** Owner-only editor for the ready-made T4P blocks coaches see in their library. */
export function AdminLibrary() {
  const qc = useQueryClient();
  const list = useServerFn(listLibraryBlocks);
  const save = useServerFn(saveLibraryBlock);
  const remove = useServerFn(deleteLibraryBlock);
  const [form, setForm] = useState(empty);
  const [pick, setPick] = useState("");
  const [boardIdx, setBoardIdx] = useState<number | null>(null);


  const blocks = useQuery({ queryKey: ["library-blocks"], queryFn: () => list() });

  const saveMutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          category: form.category,
          name: form.name,
          description: form.description,
          items: form.items,
          published: form.published,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Block updated" : "Block published");
      setForm(empty);
      void qc.invalidateQueries({ queryKey: ["library-blocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Block deleted");
      void qc.invalidateQueries({ queryKey: ["library-blocks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const drills = allDrills();
  const lifts = allStrengthExercises();

  const addPicked = () => {
    if (!pick) return;
    const drill = drills.find((d) => d.name === pick);
    if (drill) {
      setForm((f) => ({
        ...f,
        items: [
          ...f.items,
          { drill: drill.name, purpose: drill.purpose, durationMin: drill.minutes, rpe: drill.rpe },
        ],
      }));
    } else {
      const lift = lifts.find((l) => l.name === pick);
      if (!lift) return;
      setForm((f) => ({
        ...f,
        items: [
          ...f.items,
          {
            drill: lift.name,
            purpose: lift.pattern,
            durationMin: 10,
            rpe: 6,
            strength: {
              sets: lift.sets,
              reps: lift.reps,
              intensityPct: lift.intensity,
              restSec: lift.restSec,
            },
          } as SessionPlanItem,
        ],
      }));
    }
    setPick("");
  };

  const rows = (blocks.data ?? []) as LibraryBlock[];

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="panel space-y-3 p-4">
        <p className="eyebrow text-primary">{form.id ? "Edit block" : "New block"}</p>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Block name"
          className="control"
        />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="control"
        >
          {LIBRARY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="What this block is for"
          rows={3}
          className="control h-auto py-2"
        />

        <div className="flex gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="control flex-1">
            <option value="">Add a drill or exercise…</option>
            <optgroup label="Drills">
              {drills.map((d) => (
                <option key={`d-${d.name}`} value={d.name}>
                  {d.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Strength">
              {lifts.map((l) => (
                <option key={`l-${l.name}`} value={l.name}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          </select>
          <Button type="button" variant="outline" size="icon" onClick={addPicked} aria-label="Add item">
            <Plus className="size-4" />
          </Button>
        </div>

        <ul className="space-y-1.5">
          {form.items.map((i, idx) => (
            <li key={`${i.drill}-${idx}`} className="space-y-1.5 rounded-md border border-border p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  {i.drill} · {i.durationMin}′ · RPE {i.rpe}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBoardIdx(idx)}
                    className="rounded-md border border-border px-2 py-0.5 text-[0.68rem] text-muted-foreground hover:text-primary"
                  >
                    {i.drawing ? "Edit board" : "Board"}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${i.drill}`}
                    onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, x) => x !== idx) }))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                className="control h-auto py-1.5 text-xs"
                placeholder="Description — area, players, rules, coaching points"
                value={i.notes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    items: f.items.map((x, k) => (k === idx ? { ...x, notes: e.target.value } : x)),
                  }))
                }
              />
            </li>
          ))}
        </ul>


        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
          />
          Visible to subscribers
        </label>

        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1"
            disabled={!form.name || form.items.length === 0 || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : form.id ? "Save changes" : "Publish block"}
          </Button>
          {form.id ? (
            <Button type="button" variant="outline" onClick={() => setForm(empty)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {blocks.isPending ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="panel p-8 text-center text-sm text-muted-foreground">No T4P blocks published yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((b) => (
              <div key={b.id} className="panel space-y-2 p-4">
                <p className="eyebrow text-primary">{normalizeCategory(b.category)}</p>
                <p className="text-sm font-semibold">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {b.items.length} item{b.items.length === 1 ? "" : "s"}
                  {b.published ? "" : " · hidden"}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({
                        id: b.id,
                        category: normalizeCategory(b.category),
                        name: b.name,
                        description: b.description ?? "",
                        published: b.published,
                        items: b.items,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(`Delete ${b.name}?`)) return;
                      deleteMutation.mutate(b.id);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {boardIdx !== null && form.items[boardIdx] ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/90 p-3">
          <div className="mx-auto max-w-5xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Board — {form.items[boardIdx]!.drill}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => setBoardIdx(null)}>
                Close
              </Button>
            </div>
            <TacticsBoard
              drawing={parseDrawing(form.items[boardIdx]!.drawing)}
              saveLabel="Save to drill"
              onSave={(d) => {
                const idx = boardIdx;
                setForm((f) => ({
                  ...f,
                  items: f.items.map((x, k) => (k === idx ? { ...x, drawing: JSON.stringify(d) } : x)),
                }));
                setBoardIdx(null);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>

  );
}
