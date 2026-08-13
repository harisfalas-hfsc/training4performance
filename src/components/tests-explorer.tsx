import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/perf-ui";
import { MultiSelectField, SelectField } from "@/components/pickers";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, type ChartKind } from "@/components/charts";
import { fullName, players } from "@/data/performance";
import {
  TEST_CATALOG,
  latestRecord,
  squadTestAverage,
  squadTestRanking,
  testLabel,
  testRecords,
  testSeries,
  testUnit,
  useTestVersion,
} from "@/data/testing";

/** "Fitness tests" for the chosen athletes: rankings, comparison and progress. */
export function TestsExplorer({ playerIds, from, to }: { playerIds: string[]; from: string; to: string }) {
  useTestVersion();
  const [picked, setPicked] = useState<string[]>([]);
  const [kind, setKind] = useState<ChartKind>("bar");

  const usedTests = useMemo(
    () => TEST_CATALOG.filter((def) => testRecords.some((r) => r.testId === def.id)),
    [testRecords.length],
  );
  const active = picked.length ? picked : usedTests.slice(0, 1).map((t) => t.id);

  const comparison = useMemo(
    () =>
      playerIds
        .map((id) => {
          const player = players.find((p) => p.id === id);
          if (!player) return null;
          const point: Record<string, string | number> = { name: fullName(player) };
          active.forEach((testId) => {
            const record = latestRecord(id, testId);
            point[testLabel(testId)] = record ? record.value : 0;
          });
          return point;
        })
        .filter((row): row is Record<string, string | number> => row !== null),
    [playerIds.join(","), active.join(","), testRecords.length],
  );

  const progress = useMemo(() => {
    const testId = active[0];
    if (!testId) return [] as Array<Record<string, string | number>>;
    const dates = [
      ...new Set(
        playerIds.flatMap((id) =>
          testSeries(id, testId)
            .filter((p) => (!from || p.date >= from) && (!to || p.date <= to))
            .map((p) => p.date),
        ),
      ),
    ].sort();
    return dates.map((date) => {
      const point: Record<string, string | number> = { date: date.slice(5) };
      playerIds.forEach((id) => {
        const player = players.find((p) => p.id === id);
        const hit = testSeries(id, testId).find((p) => p.date === date);
        if (player && hit) point[player.lastName] = hit.value;
      });
      return point;
    });
  }, [playerIds.join(","), active[0], from, to, testRecords.length]);

  const firstTest = active[0];

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle title="3. Which tests?" hint="Only tests that already have results are listed" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MultiSelectField
            label="Tests"
            values={active}
            onChange={setPicked}
            placeholder="Choose tests…"
            searchPlaceholder="CMJ, 10 m sprint, Yo-Yo…"
            emptyText="No test results yet — record them in Fitness tests."
            options={usedTests.map((def) => ({ value: def.id, label: def.name, hint: def.unit }))}
          />
          <SelectField
            label="Chart"
            value={kind}
            onChange={(value) => setKind(value as ChartKind)}
            options={CHART_KINDS.map((c) => ({ value: c.id, label: c.label }))}
          />
        </div>
      </section>


      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle title="Player comparison" hint="Latest result per selected test" />
          <ChartFrame title="Test comparison">
            <MultiChart
              data={comparison}
              kind={kind}
              xKey="name"
              height={Math.max(260, comparison.length * 22)}
              unit={active.length === 1 ? testUnit(active[0]!) : ""}
              series={active.map((id) => ({ key: testLabel(id), name: testLabel(id) }))}
            />
          </ChartFrame>
        </div>
        <div className="panel p-4">
          <SectionTitle
            title="Progress over time"
            hint={firstTest ? `${testLabel(firstTest)} — one line per selected player` : "Pick a test"}
          />
          <ChartFrame title="Test progress">
            <MultiChart
              data={progress}
              kind={kind === "pie" ? "line" : kind}
              height={260}
              unit={firstTest ? testUnit(firstTest) : ""}
              series={playerIds
                .map((id) => players.find((p) => p.id === id))
                .filter((p): p is NonNullable<typeof p> => Boolean(p))
                .map((p) => ({ key: p.lastName, name: fullName(p) }))}
            />
          </ChartFrame>
        </div>
      </section>

      {firstTest ? (
        <section className="panel p-4">
          <SectionTitle
            title={`Squad ranking — ${testLabel(firstTest)}`}
            hint={`Squad average ${squadTestAverage(firstTest)} ${testUnit(firstTest)}`}
          />
          <ChartFrame title="Squad test ranking">
            <HBar
              data={squadTestRanking(firstTest).map((row) => ({ name: fullName(row.player), value: row.value ?? 0 }))}
              dataKey="value"
              labelKey="name"
              height={Math.max(220, squadTestRanking(firstTest).length * 20)}
            />
          </ChartFrame>
        </section>
      ) : null}
    </div>
  );
}
