import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/perf-ui";
import { CHART_KINDS, ChartFrame, HBar, MultiChart, type ChartKind } from "@/components/charts";
import { fullName, medicalEvents, players, useDataVersion } from "@/data/performance";

const chip = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
  }`;

const KPIS = [
  { key: "daysLost", label: "Days lost", unit: "days" },
  { key: "episodes", label: "Episodes", unit: "n" },
  { key: "injuries", label: "Injuries", unit: "n" },
  { key: "illnesses", label: "Illnesses", unit: "n" },
] as const;

/** "Medical & availability" for the chosen athletes: days lost, episodes, body areas. */
export function MedicalExplorer({ playerIds, from, to }: { playerIds: string[]; from: string; to: string }) {
  useDataVersion();
  const [kpis, setKpis] = useState<string[]>(["daysLost"]);
  const [kind, setKind] = useState<ChartKind>("bar");

  const events = useMemo(
    () =>
      medicalEvents.filter(
        (m) => playerIds.includes(m.playerId) && (!to || m.from <= to) && (!from || (m.to || m.from) >= from),
      ),
    [playerIds.join(","), from, to, medicalEvents.length],
  );

  const active = kpis.length ? kpis : ["daysLost"];

  const perPlayer = useMemo(
    () =>
      playerIds
        .map((id) => {
          const player = players.find((p) => p.id === id);
          if (!player) return null;
          const mine = events.filter((m) => m.playerId === id);
          return {
            name: player.lastName,
            daysLost: mine.reduce((sum, m) => sum + (m.daysLost || 0), 0),
            episodes: mine.length,
            injuries: mine.filter((m) => m.type === "Injury").length,
            illnesses: mine.filter((m) => m.type === "Illness").length,
          } as Record<string, string | number>;
        })
        .filter((row): row is Record<string, string | number> => row !== null),
    [playerIds.join(","), events],
  );

  const byArea = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of events) map.set(m.area || "Unspecified", (map.get(m.area || "Unspecified") ?? 0) + (m.daysLost || 0));
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [events]);

  const totals = {
    episodes: events.length,
    daysLost: events.reduce((sum, m) => sum + (m.daysLost || 0), 0),
    injuries: events.filter((m) => m.type === "Injury").length,
    illnesses: events.filter((m) => m.type === "Illness").length,
  };

  const label = (key: string) => KPIS.find((k) => k.key === key)?.label ?? key;

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <SectionTitle title="Which availability KPIs?" hint="Injuries and illnesses recorded on the player profiles" />
        <div className="flex flex-wrap gap-1">
          {KPIS.map((k) => (
            <button
              key={k.key}
              type="button"
              className={chip(active.includes(k.key))}
              onClick={() =>
                setKpis((prev) => (prev.includes(k.key) ? prev.filter((x) => x !== k.key) : [...prev, k.key]))
              }
            >
              {k.label} <span className="font-normal text-muted-foreground">({k.unit})</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          <span className="eyebrow w-full sm:w-auto">Chart</span>
          {CHART_KINDS.map((c) => (
            <button key={c.id} type="button" className={chip(kind === c.id)} onClick={() => setKind(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {totals.episodes
            ? `${totals.episodes} episodes (${totals.injuries} injuries, ${totals.illnesses} illnesses) · ${totals.daysLost} days lost in the selected dates.`
            : "No injury or illness records in these dates — add them in a player profile under Medical & illness."}
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="panel p-4">
          <SectionTitle title="Per athlete" hint="Selected KPIs over the chosen dates" />
          <ChartFrame title="Availability per athlete">
            <MultiChart
              data={perPlayer}
              kind={kind === "pie" ? "bar" : kind}
              xKey="name"
              height={Math.max(260, perPlayer.length * 22)}
              unit={active.length === 1 ? (KPIS.find((k) => k.key === active[0])?.unit ?? "") : ""}
              series={active.map((k) => ({ key: k, name: label(k) }))}
            />
          </ChartFrame>
        </div>
        <div className="panel p-4">
          <SectionTitle title="Days lost by body area" hint="Where the squad is losing training time" />
          <ChartFrame title="Days lost by area">
            <HBar data={byArea} dataKey="value" labelKey="name" height={Math.max(220, byArea.length * 22)} />
          </ChartFrame>
        </div>
      </section>

      {events.length ? (
        <section className="panel overflow-x-auto p-4">
          <SectionTitle title="Episodes" hint="Most recent first" />
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Athlete</th><th>Type</th><th>Area</th><th>From</th><th>To</th><th>Days lost</th><th>Stage</th>
              </tr>
            </thead>
            <tbody>
              {[...events].sort((a, b) => b.from.localeCompare(a.from)).map((m, i) => {
                const player = players.find((p) => p.id === m.playerId);
                return (
                  <tr key={`${m.playerId}-${m.from}-${i}`} className="border-t border-border">
                    <td className="py-2">{player ? fullName(player) : m.playerId}</td>
                    <td>{m.type}</td><td>{m.area}</td><td>{m.from}</td><td>{m.to}</td><td>{m.daysLost}</td><td>{m.stage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
