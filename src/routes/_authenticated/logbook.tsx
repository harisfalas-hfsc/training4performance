import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus, Printer, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { ChartFrame, HBar, MultiChart, CHART_KINDS, type ChartKind } from "@/components/charts";
import { fullName, players, today, useDataVersion } from "@/data/performance";
import {
  TEST_CATALOG,
  TEST_GROUPS,
  addTestRecord,
  bestRecord,
  getTestDef,
  latestRecord,
  playerRecords,
  removeTestRecord,
  testLabel,
  testRecords,
  testSeries,
  testUnit,
  useTestVersion,
  type TestRecord,
} from "@/data/testing";

export const Route = createFileRoute("/_authenticated/logbook")({
  head: () => ({
    meta: [
      { title: "Fitness Tests — Records, Trends & Reports — T4P" },
      {
        name: "description",
        content:
          "Every fitness test result per player: add, edit and delete rows, compare the squad on any test, see each athlete's trend and print his individual report.",
      },
      { property: "og:title", content: "Fitness Tests — T4P" },
      { property: "og:description", content: "One clean testing sheet: squad table, player record, trends and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FitnessTestsPage,
});

const TABS = ["Squad table", "One player"] as const;
type Tab = (typeof TABS)[number];

const fmt = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2));

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function csv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  return [keys.join(","), ...rows.map((r) => keys.map((k) => `${r[k] ?? ""}`).join(","))].join("\n");
}

/** Tests that at least one athlete has data for, otherwise the whole catalog. */
function usableTests() {
  const used = TEST_CATALOG.filter((t) => testRecords.some((r) => r.testId === t.id));
  return used.length ? used : TEST_CATALOG;
}

function FitnessTestsPage() {
  useDataVersion();
  useTestVersion();
  const [tab, setTab] = useState<Tab>("Squad table");

  return (
    <AppShell title="Fitness tests" subtitle="Individual test records — add, edit, compare and report">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
              (tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground")
            }
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Squad table" ? <SquadTable /> : <PlayerRecord />}
    </AppShell>
  );
}

/* ---------------- Squad table ---------------- */

function SquadTable() {
  const tests = usableTests();
  const [testId, setTestId] = useState(tests[0]?.id ?? "");
  const [showAdd, setShowAdd] = useState(false);
  const def = getTestDef(testId);

  const rows = useMemo(
    () =>
      players
        .map((p) => {
          const last = latestRecord(p.id, testId);
          const best = bestRecord(p.id, testId);
          return { player: p, last, best };
        })
        .sort((a, b) => {
          const av = a.last?.value ?? (def?.higher === false ? Infinity : -Infinity);
          const bv = b.last?.value ?? (def?.higher === false ? Infinity : -Infinity);
          return def?.higher === false ? av - bv : bv - av;
        }),
    [testId, testRecords.length, players.length, def?.higher],
  );

  const withValue = rows.filter((r) => r.last);
  const average = withValue.length
    ? Math.round((withValue.reduce((a, r) => a + (r.last?.value ?? 0), 0) / withValue.length) * 100) / 100
    : 0;

  const chart = withValue.map((r) => ({ name: r.player.lastName, value: r.last!.value }));

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Test</span>
          <select className="control" value={testId} onChange={(e) => setTestId(e.target.value)}>
            {TEST_GROUPS.map((g) => {
              const list = tests.filter((t) => t.group === g);
              return list.length ? (
                <optgroup key={g} label={g}>
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </optgroup>
              ) : null;
            })}
          </select>
        </label>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          onClick={() =>
            download(
              `t4p-${testId || "tests"}.csv`,
              csv(
                rows.map((r) => ({
                  player: fullName(r.player),
                  test: testLabel(testId),
                  latest: r.last?.value ?? "",
                  date: r.last?.date ?? "",
                  best: r.best?.value ?? "",
                })),
              ),
            )
          }
        >
          <Download className="size-4" /> Export
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus className="size-4" /> {showAdd ? "Close" : "Add result"}
        </button>
      </div>

      {showAdd && <AddResultForm defaultTest={testId} onDone={() => setShowAdd(false)} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Players tested" value={`${withValue.length}/${players.length}`} />
        <MetricCard label="Squad average" value={average || "—"} unit={testUnit(testId)} />
        <MetricCard
          label={def?.higher === false ? "Fastest / lowest" : "Best result"}
          value={withValue[0] ? fmt(withValue[0].last!.value) : "—"}
          hint={withValue[0] ? fullName(withValue[0].player) : undefined}
        />
      </div>

      {chart.length ? (
        <div className="panel p-4">
          <SectionTitle title={testLabel(testId)} hint={`${def?.higher === false ? "lower is better" : "higher is better"} · ${testUnit(testId)}`} />
          <ChartFrame title={`${testLabel(testId)} squad ranking`}>
            <HBar data={chart} dataKey="value" labelKey="name" height={Math.max(220, chart.length * 26)} />
          </ChartFrame>
        </div>
      ) : null}

      <div className="panel scroll-pane max-h-[70vh] overflow-auto p-0">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-1 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 text-right font-medium">Latest</th>
              <th className="px-3 py-2 text-right font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Best</th>
              <th className="px-3 py-2 text-right font-medium">vs squad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.player.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="px-3 py-1.5">{fullName(r.player)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.last ? fmt(r.last.value) : "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{r.last?.date ?? "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{r.best ? fmt(r.best.value) : "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {r.last && average ? `${r.last.value >= average ? "+" : ""}${Math.round(((r.last.value - average) / average) * 100)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!players.length && <p className="p-4 text-sm text-muted-foreground">No players yet. Add your squad in Team & players.</p>}
      </div>
    </div>
  );
}

/* ---------------- One player ---------------- */

function PlayerRecord() {
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState<ChartKind>("line");
  const player = players.find((p) => p.id === playerId);
  const records = playerId ? playerRecords(playerId) : [];
  const testIds = useMemo(() => [...new Set(records.map((r) => r.testId))], [records.length, playerId]);
  const [chartTests, setChartTests] = useState<string[]>([]);
  const shown = chartTests.length ? chartTests : testIds.slice(0, 1);

  const chartData = useMemo(() => {
    const dates = [...new Set(records.filter((r) => shown.includes(r.testId)).map((r) => r.date))].sort();
    return dates.map((date) => {
      const point: Record<string, string | number> = { date: date.slice(5) };
      for (const id of shown) {
        const rec = records.find((r) => r.testId === id && r.date === date);
        if (rec) point[id] = rec.value;
      }
      return point;
    });
  }, [records.length, shown.join(","), playerId]);

  const chip = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-xs font-semibold ${
      active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
    }`;

  if (!players.length) {
    return <p className="panel p-6 text-sm text-muted-foreground">No players yet. Add your squad in Team & players first.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Player</span>
          <select className="control" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          onClick={() => window.print()}
        >
          <Printer className="size-4" /> Print his report
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          onClick={() =>
            download(
              `t4p-${player?.lastName ?? "player"}-tests.csv`,
              csv(records.map((r) => ({ date: r.date, test: testLabel(r.testId), value: r.value, unit: testUnit(r.testId), reps: r.reps ?? "", note: r.note ?? "" }))),
            )
          }
        >
          <Download className="size-4" /> Export
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus className="size-4" /> {showAdd ? "Close" : "Add result"}
        </button>
      </div>

      {showAdd && <AddResultForm defaultPlayer={playerId} onDone={() => setShowAdd(false)} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Results recorded" value={records.length} />
        <MetricCard label="Different tests" value={testIds.length} />
        <MetricCard label="Last test day" value={records.at(-1)?.date ?? "—"} />
      </div>

      {testIds.length ? (
        <div className="panel p-4">
          <SectionTitle title="Trend" hint="Pick the test(s) you want to see and how to draw them" />
          <div className="mb-3 flex flex-wrap gap-1">
            {testIds.map((id) => (
              <button
                key={id}
                type="button"
                className={chip(shown.includes(id))}
                onClick={() => setChartTests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
              >
                {testLabel(id)}
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {CHART_KINDS.filter((c) => ["line", "bar", "pie"].includes(c.id)).map((c) => (
              <button key={c.id} type="button" className={chip(kind === c.id)} onClick={() => setKind(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <ChartFrame title={`${player ? fullName(player) : "Player"} test trend`}>
            <MultiChart data={chartData} kind={kind} height={300} series={shown.map((id) => ({ key: id, name: testLabel(id) }))} />
          </ChartFrame>
        </div>
      ) : null}

      <div className="panel scroll-pane max-h-[70vh] overflow-auto p-0">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-1 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Test</th>
              <th className="px-3 py-2 text-right font-medium">Result</th>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Note</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {[...records].reverse().map((r) => (
              <RecordRow key={r.id} record={r} />
            ))}
          </tbody>
        </table>
        {!records.length && (
          <p className="p-4 text-sm text-muted-foreground">No test result for this player yet — press “Add result”.</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Type straight into the result box to edit a value. The bin deletes that single row.
      </p>
    </div>
  );
}

function RecordRow({ record }: { record: TestRecord }) {
  const [value, setValue] = useState(String(record.value));
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-3 py-1.5 tabular-nums">{record.date}</td>
      <td className="px-3 py-1.5">{testLabel(record.testId)}</td>
      <td className="px-3 py-1.5 text-right">
        <input
          className="w-24 rounded border border-border bg-surface-2 px-1 py-0.5 text-right tabular-nums"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const v = Number(value);
            if (!Number.isNaN(v) && v !== record.value) addTestRecord({ ...record, value: v });
          }}
        />
      </td>
      <td className="px-3 py-1.5 text-xs text-muted-foreground">{testUnit(record.testId)}</td>
      <td className="px-3 py-1.5 text-xs text-muted-foreground">{record.note ?? "—"}</td>
      <td className="px-3 py-1.5 text-right">
        <button
          type="button"
          aria-label="Delete test result"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => removeTestRecord(record.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </td>
    </tr>
  );
}

/* ---------------- Add result ---------------- */

function AddResultForm({
  defaultPlayer,
  defaultTest,
  onDone,
}: {
  defaultPlayer?: string;
  defaultTest?: string;
  onDone: () => void;
}) {
  const [f, setF] = useState({
    playerId: defaultPlayer ?? players[0]?.id ?? "",
    testId: defaultTest ?? TEST_CATALOG[0]?.id ?? "",
    date: today,
    value: "",
    reps: "",
    note: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));
  const def = getTestDef(f.testId);

  return (
    <form
      className="panel grid gap-2 p-4 sm:grid-cols-3 xl:grid-cols-6"
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(f.value);
        if (!f.playerId || !f.testId || Number.isNaN(value)) return;
        addTestRecord({
          playerId: f.playerId,
          testId: f.testId,
          date: f.date,
          value,
          source: "manual",
          ...(def?.strength && f.reps ? { reps: Number(f.reps) } : {}),
          ...(f.note ? { note: f.note } : {}),
        });
        setF((p) => ({ ...p, value: "", reps: "", note: "" }));
        onDone();
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Player</span>
        <select className="control" value={f.playerId} onChange={set("playerId")}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {fullName(p)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="eyebrow">Test</span>
        <select className="control" value={f.testId} onChange={set("testId")}>
          {TEST_GROUPS.map((g) => {
            const list = TEST_CATALOG.filter((t) => t.group === g);
            return list.length ? (
              <optgroup key={g} label={g}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.unit})
                  </option>
                ))}
              </optgroup>
            ) : null;
          })}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Date</span>
        <input type="date" className="control" value={f.date} onChange={set("date")} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Result ({testUnit(f.testId) || "value"})</span>
        <input className="control" value={f.value} onChange={set("value")} placeholder="e.g. 38.4" />
      </label>
      {def?.strength ? (
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Reps</span>
          <input className="control" value={f.reps} onChange={set("reps")} placeholder="e.g. 3" />
        </label>
      ) : null}
      <label className="flex flex-col gap-1 sm:col-span-2">
        <span className="eyebrow">Note</span>
        <div className="flex gap-2">
          <input className="control flex-1" value={f.note} onChange={set("note")} placeholder="optional" />
          <button type="submit" className="rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </label>
    </form>
  );
}
