import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookMarked, ClipboardPen, Copy, Lock, Plus, Search, Trash2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { T4P } from "@/components/brand-text";
import { type LibraryBlock } from "@/lib/library.functions";
import { useOfficialLibrary } from "@/lib/use-library-blocks";
import {
  removeSavedBlock,
  saveBlockTemplate,
  savedBlocks,
  updateSavedBlock,
  useLibraryVersion,
  type SavedBlock,
} from "@/data/presets";
import { LIBRARY_CATEGORIES, normalizeCategory } from "@/data/library-categories";
import type { SessionPlanItem } from "@/data/performance";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Drills & exercise library — T4P" },
      {
        name: "description",
        content:
          "Ready-made T4P blocks for strength, power, speed and energy system development, plus every block you save yourself — reusable in any training you design.",
      },
      { property: "og:title", content: "Drills & exercise library — T4P" },
      {
        property: "og:description",
        content: "Pick a ready-made block or reuse your own, then drop it straight into a training.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

function itemLine(it: SessionPlanItem) {
  if (it.strength) {
    return `${it.strength.sets} × ${it.strength.reps}${
      it.strength.intensityPct ? ` · ${it.strength.intensityPct}% 1RM` : ""
    } · rest ${it.strength.restSec}s`;
  }
  return `${it.durationMin} min · RPE ${it.rpe} · ${it.purpose}`;
}

function LibraryPage() {
  useLibraryVersion();
  const [tab, setTab] = useState<"t4p" | "mine">("t4p");
  const [category, setCategory] = useState<string>("ALL");
  const [q, setQ] = useState("");

  const official = useOfficialLibrary();
  const hasAccess = !official.locked;

  const mine = savedBlocks();

  const filter = <T extends { name: string; category?: string | null }>(rows: T[]) =>
    rows.filter(
      (r) =>
        (category === "ALL" || normalizeCategory(r.category) === category) &&
        r.name.toLowerCase().includes(q.trim().toLowerCase()),
    );

  const officialRows = useMemo(() => filter(official.blocks), [official.blocks, category, q]);
  const myRows = useMemo(() => filter(mine), [mine, category, q]);

  const copyToMine = (b: LibraryBlock) => {
    const saved = saveBlockTemplate(b.name, b.items, {
      category: normalizeCategory(b.category),
      ...(b.description ? { description: b.description } : {}),
    });
    if (saved) toast.success(`${b.name} copied to your library`);
  };

  return (
    <AppShell
      title="Drills & exercise library"
      subtitle="Ready-made blocks from T4P plus everything you save yourself"
      actions={
        <Link
          to="/training"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold"
        >
          <ClipboardPen className="size-4" /> Training Designer
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="panel p-5">
          <SectionTitle
            title="Browse blocks"
            hint="A block is a ready group of drills or exercises you can drop into any training"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="flex gap-1.5">
              {(
                [
                  { id: "t4p", label: "T4P library" },
                  { id: "mine", label: "My library" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`h-10 flex-1 rounded-md border px-3 text-xs font-semibold ${
                    tab === t.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {t.label} ({t.id === "t4p" ? official.blocks.length : mine.length})
                </button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className="control h-10"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Section"
              >
                <option value="ALL">All sections</option>
                {LIBRARY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search blocks"
                  className="control h-10 pl-8"
                />
              </div>
            </div>
          </div>
        </div>

        {tab === "t4p" ? (
          !hasAccess ? (
            <div className="panel p-8 text-center">
              <Lock className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">The <T4P /> library needs an active subscription</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Your own saved blocks stay available under “My library”. Ready-made blocks come back the moment your
                subscription is active again.
              </p>
              <Link
                to="/pricing"
                className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
              >
                See pricing
              </Link>
            </div>
          ) : official.loading ? (
            <p className="panel p-8 text-center text-sm text-muted-foreground">Loading the library…</p>
          ) : officialRows.length === 0 ? (
            <p className="panel p-8 text-center text-sm text-muted-foreground">
              No blocks in this section yet.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {officialRows.map((b) => (
                <BlockCard
                  key={b.id}
                  name={b.name}
                  category={normalizeCategory(b.category)}
                  description={b.description}
                  items={b.items}
                  footer={
                    <button
                      type="button"
                      onClick={() => copyToMine(b)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:text-primary"
                    >
                      <Copy className="size-3.5" /> Copy to my library
                    </button>
                  }
                />
              ))}
            </div>
          )
        ) : myRows.length === 0 ? (
          <div className="panel p-8 text-center">
            <BookMarked className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing saved yet. In the Training Designer, build a block and press{" "}
              <span className="font-semibold">Save block</span> — it lands here and stays yours forever.
            </p>
            <Link
              to="/training"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
            >
              <Plus className="size-4" /> Build a block
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {myRows.map((b: SavedBlock) => (
              <BlockCard
                key={b.id}
                name={b.name}
                category={normalizeCategory(b.category)}
                description={b.description ?? null}
                items={b.items}
                footer={
                  <>
                    <select
                      aria-label={`Section for ${b.name}`}
                      className="control h-9 flex-1 text-xs"
                      value={normalizeCategory(b.category)}
                      onChange={(e) => updateSavedBlock(b.id, { category: e.target.value })}
                    >
                      {LIBRARY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(`Remove ${b.name} from your library?`)) return;
                        removeSavedBlock(b.id);
                        toast.success("Removed from your library");
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function BlockCard({
  name,
  category,
  description,
  items,
  footer,
}: {
  name: string;
  category: string;
  description: string | null;
  items: SessionPlanItem[];
  footer: React.ReactNode;
}) {
  return (
    <article className="panel flex h-full flex-col p-4">
      <p className="eyebrow text-primary">{category}</p>
      <h3 className="mt-1 truncate text-sm font-semibold">{name}</h3>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      <ol className="mt-3 flex-1 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="rounded-md bg-surface-2 p-2">
            <p className="truncate text-sm">{it.drill}</p>
            <p className="text-xs text-muted-foreground">{itemLine(it)}</p>
            {it.notes ? <p className="mt-1 whitespace-pre-line text-xs">{it.notes}</p> : null}
            {it.drawing ? <p className="mt-1 text-[0.68rem] text-success">Tactics-board drawing attached</p> : null}

          </li>
        ))}
        {items.length === 0 ? <li className="text-xs text-muted-foreground">Empty block</li> : null}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">{footer}</div>
    </article>
  );
}
