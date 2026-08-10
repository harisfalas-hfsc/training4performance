import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { TacticsBoard } from "@/components/tactics-board";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "Tactics Board & Session Designer — T4P" },
      {
        name: "description",
        content:
          "Interactive football tactics board: place players, cones, goals and equipment, draw runs, passes and zones, then export the session drawing.",
      },
      { property: "og:title", content: "Tactics Board & Session Designer — T4P" },
      {
        property: "og:description",
        content: "Coach-style tactic board with clickable tool palettes, drag-and-drop tokens and drawing tools.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoardPage,
});

function BoardPage() {
  return (
    <AppShell title="Tactics Board" subtitle="Design a drill or a shape — drag items, draw runs, export the picture">
      <TacticsBoard />
      <section className="mt-6 panel p-4">
        <SectionTitle title="How to use the board" hint="Everything is tap-first, so it works on the touchline" />
        <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>· Tap <span className="text-foreground">Players</span> or <span className="text-foreground">Equipment</span> to open a palette, pick an item, then tap the pitch to place it.</li>
          <li>· Drag any token at any time to reposition it — no need to switch back to the Move tool.</li>
          <li>· Arrow, dashed arrow, line and freehand draw runs, passes and dribbles in the selected colour.</li>
          <li>· Zone and circle mark playing areas; text adds a label anywhere on the pitch.</li>
          <li>· The eraser removes a single token or drawing; undo steps back through the last changes.</li>
          <li>· Rotate switches between portrait and landscape; export saves the board as a PNG.</li>
        </ul>
      </section>
    </AppShell>
  );
}
