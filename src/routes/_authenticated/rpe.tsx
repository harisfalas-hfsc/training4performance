import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Gauge, Layers, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import {
  bulkRpeEntries,
  dayLoad,
  fullName,
  gpsBlocks,
  gpsHistory,
  players,
  removeRpeEntry,
  rpeEntries,
  rpeEntriesFor,
  rpeEntryCounts,
  sessionCalendar,
  today,
  upsertRpeEntry,
  useDataVersion,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/rpe")({
  head: () => ({
    meta: [
      { title: "Manual RPE Load — Strength & Non-GPS Sessions — T4P" },
      {
        name: "description",
        content:
          "Add session RPE (0-10) by block or for the whole training when there is no GPS file, and combine it with GPS load into one true daily training load.",
      },
      { property: "og:title", content: "Manual RPE Load — Strength & Non-GPS Sessions — T4P" },
      {
        property: "og:description",
        content: "Strength, indoor and pool work counted in the same training load as your GPS sessions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RpePage,
});

const WHOLE = "";

function RpePage() {
  useDataVersion();

  const dates = useMemo(() => {
    const set = new Set<string>([today]);
    for (const s of sessionCalendar) set.add(s.date);
    for (const r of rpeEntries) set.add(r.date);
    return [...set].sort().reverse();
  }, [sessionCalendar.length, rpeEntries.length]);

  const [date, setDate] = useState(dates[0] ?? today);
  const session = sessionCalendar.find((s) => s.date === date);

  const blockOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of session?.blockNames ?? []) if (b) set.add(b);
    for (const it of session?.plan ?? []) if (it.block) set.add(it.block);
    for (const g of gpsBlocks) if (g.date === date) set.add(g.block);
    for (const r of rpeEntries) if (r.date === date && r.block) set.add(r.block);
    return [...set];
  }, [date, session, gpsBlocks.length, rpeEntries.length]);

  const [block, setBlock] = useState<string>(WHOLE);
  const [customBlock, setCustomBlock] = useState("");
  const [minutes, setMinutes] = useState(45);
  const [rpe, setRpe] = useState(7);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"squad" | "individual">("squad");
  const [selected, setSelected] = useState<string[]>([]);
  const [individual, setIndividual] = useState<Record<string, number>>({});

  const blockName = block === "__custom" ? customBlock.trim() : block;
  const blockLabel = blockName || "Whole session";
  const targets = mode === "squad" && !selected.length ? players.map((p) => p.id) : selected;

  const hasGpsForBlock =
    Boolean(blockName) && gpsBlocks.some((g) => g.date === date && g.block === blockName);

  const save = () => {
    if (!players.length) {
      toast.error("Add players to your squad first");
      return;
    }
    if (block === "__custom" && !customBlock.trim()) {
      toast.error("Name the block first");
      return;
    }
    if (minutes <= 0) {
      toast.error("Set the duration in minutes");
      return;
    }

    if (mode === "squad") {
      const ids = targets;
      if (!ids.length) {
        toast.error("Select at least one athlete");
        return;
      }
      bulkRpeEntries(date, blockName, ids, rpe, minutes, note || undefined);
      toast.success(`RPE ${rpe}/10 saved for ${ids.length} athlete(s) — ${blockLabel}`);
    } else {
      const entries = Object.entries(individual).filter(([, v]) => v > 0);
      if (!entries.length) {
        toast.error("Set an RPE for at least one athlete");
        return;
      }
      for (const [playerId, value] of entries) {
        upsertRpeEntry({
          date,
          playerId,
          block: blockName,
          rpe: value,
          minutes,
          ...(note ? { note } : {}),
        });
      }
      toast.success(`Individual RPE saved for ${entries.length} athlete(s) — ${blockLabel}`);
    }
  };

  const dayEntries = rpeEntriesFor(date);
  const dayRows = players
    .map((p) => {
      const load = dayLoad(p.id, date);
      const mine = dayEntries.filter((r) => r.playerId === p.id);
      return { player: p, load, mine };
    })
    .filter((r) => r.load.total > 0 || r.mine.length);

  const manualTotal = dayRows.reduce((a, r) => a + r.load.manual, 0);
  const gpsTotal = dayRows.reduce((a, r) => a + r.load.gps, 0);
  const athletes = dayRows.filter((r) => r.load.manual > 0).length;
  const gpsDay = gpsHistory.some((g) => g.date === date);

  return (
    <AppShell
      title="Manual RPE load"
      subtitle="Strength, indoor, pool or any block without a GPS file — rate it 0-10 and T4P adds it to the same training load."
    >
      <section className="mt-1 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Manual load"
          value={manualTotal.toLocaleString()}
          hint={`AU · ${athletes} athlete(s)`}
          icon={<Gauge className="size-4" />}
        />
        <MetricCard label="GPS load" value={gpsTotal.toLocaleString()} hint={gpsDay ? "AU from GPS file" : "no GPS file this day"} />
        <MetricCard
          label="Total day load"
          value={(manualTotal + gpsTotal).toLocaleString()}
          hint="GPS + manual RPE"
          tone="good"
        />
        <MetricCard label="Blocks rated" value={[...new Set(dayEntries.map((r) => r.block || "Whole session"))].length} hint={date} icon={<Layers className="size-4" />} />
      </section>

      <section className="panel mt-4 p-4">
        <SectionTitle
          title="Rate a block (or the whole training)"
          hint="Load = RPE × minutes. Same value for everyone, or athlete by athlete."
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="field">
            <span className="eyebrow">Training day</span>
            <select className="control mt-1" value={date} onChange={(e) => setDate(e.target.value)}>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                  {sessionCalendar.find((s) => s.date === d) ? ` · ${sessionCalendar.find((s) => s.date === d)!.title}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="eyebrow">Block</span>
            <select className="control mt-1" value={block} onChange={(e) => setBlock(e.target.value)}>
              <option value={WHOLE}>Whole session</option>
              {blockOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="__custom">Other block…</option>
            </select>
          </label>

          {block === "__custom" ? (
            <label className="field">
              <span className="eyebrow">Block name</span>
              <input
                className="control mt-1"
                value={customBlock}
                placeholder="e.g. Strength room"
                onChange={(e) => setCustomBlock(e.target.value)}
              />
            </label>
          ) : (
            <label className="field">
              <span className="eyebrow">Duration (min)</span>
              <input
                className="control mt-1"
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 0)}
              />
            </label>
          )}

          {block === "__custom" && (
            <label className="field">
              <span className="eyebrow">Duration (min)</span>
              <input
                className="control mt-1"
                type="number"
                min={1}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 0)}
              />
            </label>
          )}

          <label className="field">
            <span className="eyebrow">How to rate</span>
            <select className="control mt-1" value={mode} onChange={(e) => setMode(e.target.value as "squad" | "individual")}>
              <option value="squad">Same RPE for everyone</option>
              <option value="individual">Individual RPE per athlete</option>
            </select>
          </label>
        </div>

        {hasGpsForBlock && (
          <p className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            This block already has GPS records for {date}. GPS wins for those athletes, so a manual RPE here will not be
            double-counted in the training load.
          </p>
        )}

        {mode === "squad" ? (
          <div className="mt-4 grid gap-3 xl:grid-cols-[320px_1fr]">
            <div className="field">
              <span className="eyebrow">RPE (0-10) · {rpe}</span>
              <input
                className="mt-2 w-full accent-[var(--color-primary)]"
                type="range"
                min={0}
                max={10}
                step={1}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Session load for each athlete: <strong>{rpe * minutes} AU</strong>
              </p>
            </div>
            <div>
              <span className="eyebrow">Athletes ({targets.length} selected)</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {players.map((p) => {
                  const on = selected.includes(p.id) || (!selected.length && mode === "squad");
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                      onClick={() =>
                        setSelected((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                        )
                      }
                    >
                      {fullName(p)}
                    </button>
                  );
                })}
              </div>
              {!!selected.length && (
                <button type="button" className="mt-2 text-xs underline" onClick={() => setSelected([])}>
                  Select the whole squad
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="table-base min-w-[520px]">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>RPE 0-10</th>
                  <th>Load (AU)</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id}>
                    <td>{fullName(p)}</td>
                    <td>
                      <input
                        className="control w-24"
                        type="number"
                        min={0}
                        max={10}
                        value={individual[p.id] ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          setIndividual((prev) => ({ ...prev, [p.id]: Number(e.target.value) || 0 }))
                        }
                      />
                    </td>
                    <td className="tabular-nums">{(individual[p.id] ?? 0) * minutes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="field flex-1 min-w-[220px]">
            <span className="eyebrow">Note (optional)</span>
            <input
              className="control mt-1"
              value={note}
              placeholder="e.g. Upper body strength, 4 x 6 @ 80%"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <Button type="button" onClick={save} className="gap-2">
            <Plus className="size-4" /> Save RPE load
          </Button>
        </div>
      </section>

      <section className="panel mt-4 p-4">
        <SectionTitle
          title={`Training load on ${date}`}
          hint="GPS load and manual RPE load added together — this is what feeds ACWR, monotony and every report."
        />
        <div className="overflow-x-auto">
          <table className="table-base min-w-[720px]">
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Manual blocks</th>
                <th>GPS load</th>
                <th>Manual load</th>
                <th>Total load</th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map((r) => (
                <tr key={r.player.id}>
                  <td>{fullName(r.player)}</td>
                  <td className="text-muted-foreground">
                    {r.mine.length
                      ? r.mine
                          .map(
                            (e) =>
                              `${e.block || "Whole session"} ${e.rpe}/10 × ${e.minutes}′${rpeEntryCounts(e) ? "" : " (GPS wins)"}`,
                          )
                          .join(" · ")
                      : "—"}
                  </td>
                  <td className="tabular-nums">{r.load.gps.toLocaleString()}</td>
                  <td className="tabular-nums">{r.load.manual.toLocaleString()}</td>
                  <td className="metric-value tabular-nums">{r.load.total.toLocaleString()}</td>
                </tr>
              ))}
              {!dayRows.length && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    No load recorded for this day yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!!dayEntries.length && (
        <section className="panel mt-4 p-4">
          <SectionTitle title="Manual entries of the day" hint="Delete anything you rated by mistake" />
          <div className="overflow-x-auto">
            <table className="table-base min-w-[680px]">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Block</th>
                  <th>RPE</th>
                  <th>Minutes</th>
                  <th>Load</th>
                  <th>Note</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dayEntries.map((e) => (
                  <tr key={e.id}>
                    <td>{fullName(players.find((p) => p.id === e.playerId) ?? players[0]!)}</td>
                    <td>{e.block || "Whole session"}</td>
                    <td className="tabular-nums">{e.rpe}/10</td>
                    <td className="tabular-nums">{e.minutes}</td>
                    <td className="tabular-nums">{rpeEntryCounts(e) ? e.rpe * e.minutes : "—"}</td>
                    <td className="text-muted-foreground">{e.note ?? ""}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          removeRpeEntry(e.id);
                          toast.success("Entry removed");
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AppShell>
  );
}
