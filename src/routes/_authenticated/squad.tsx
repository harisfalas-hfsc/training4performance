import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AcwrPill, AvailabilityPill, MetricCard, SectionTitle } from "@/components/perf-ui";
import { HBar } from "@/components/charts";
import {
  addPlayer,
  age,
  bmi,
  fullName,
  initials,
  players,
  positionAverage,
  squadMetrics,
  removePlayer,
  squadStats,
  team,
  updatePlayer,
  useDataVersion,
  squadName,
  type Player,
  type Position,
} from "@/data/performance";

export const Route = createFileRoute("/_authenticated/squad")({
  head: () => ({
    meta: [
      { title: "Squad & Players — T4P" },
      {
        name: "description",
        content: "Full squad list with position, availability, 7-day workload, HSR, sprint exposure and ACWR.",
      },
      { property: "og:title", content: "Squad & Players — T4P" },
      { property: "og:description", content: "Every player, one connected performance record." },
    ],
  }),
  component: SquadPage,
});

const positions: Position[] = ["GK", "CB", "FB", "CM", "AM", "W", "ST"];

const AVAILABILITY: Player["availability"][] = ["available", "partial", "individual", "rehab", "injured", "ill"];

function AddPlayerForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    position: "CM" as Position,
    number: "",
    dob: "2000-01-01",
    nationality: "CYP",
    heightCm: "180",
    weightKg: "75",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      className="mb-3 grid gap-2 rounded-md border border-border bg-surface-2 p-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.lastName.trim()) return;
        addPlayer({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          position: form.position,
          number: Number(form.number) || 0,
          dob: form.dob,
          nationality: form.nationality,
          heightCm: Number(form.heightCm) || 180,
          weightKg: Number(form.weightKg) || 75,
        });
        onDone();
      }}
    >
      <input className="control" placeholder="First name" value={form.firstName} onChange={set("firstName")} />
      <input className="control" placeholder="Last name" value={form.lastName} onChange={set("lastName")} />
      <select className="control" value={form.position} onChange={set("position")}>
        {positions.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input className="control" placeholder="Shirt number" value={form.number} onChange={set("number")} />
      <input className="control" type="date" value={form.dob} onChange={set("dob")} />
      <input className="control" placeholder="Nationality" value={form.nationality} onChange={set("nationality")} />
      <input className="control" placeholder="Height (cm)" value={form.heightCm} onChange={set("heightCm")} />
      <div className="flex gap-2">
        <input className="control flex-1" placeholder="Weight (kg)" value={form.weightKg} onChange={set("weightKg")} />
        <button type="submit" className="rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
          Save
        </button>
      </div>
    </form>
  );
}

function SquadPage() {
  useDataVersion();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [pos, setPos] = useState<Position | "ALL">("ALL");
  const metrics = squadMetrics();

  const rows = useMemo(
    () =>
      metrics.filter(
        (m) =>
          (pos === "ALL" || m.player.position === pos) &&
          fullName(m.player).toLowerCase().includes(query.toLowerCase()),
      ),
    [metrics, pos, query],
  );

  const hsrStats = squadStats((m) => m.hsr7);
  const distStats = squadStats((m) => m.distance7);

  const hsrChart = [...metrics]
    .sort((a, b) => b.hsr7 - a.hsr7)
    .slice(0, 12)
    .map((m) => ({ name: m.player.lastName, hsr: m.hsr7 }));

  return (
    <AppShell title="Squad" subtitle={`${team.club} · ${squadName} · ${players.length} players`}>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Squad size" value={players.length} hint="Registered in this squad" />
        <MetricCard label="Average age" value={Math.round(players.reduce((a, p) => a + age(p.dob), 0) / players.length)} unit="yrs" />
        <MetricCard label="Distance 7d (mean)" value={distStats.mean} unit="m" hint={`sd ${distStats.sd}`} />
        <MetricCard label="HSR 7d (mean)" value={hsrStats.mean} unit="m" hint={`max ${hsrStats.max} · min ${hsrStats.min}`} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Squad list"
            hint="Click a player to open the passport · edit status inline · remove players who left"
            right={
              <button
                type="button"
                onClick={() => setShowAdd((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <UserPlus className="size-4" /> {showAdd ? "Close" : "Add player"}
              </button>
            }
          />

          {showAdd && <AddPlayerForm onDone={() => setShowAdd(false)} />}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player"
                className="h-9 w-56 rounded-md border border-input bg-surface-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(["ALL", ...positions] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPos(p)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                    pos === p ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-2">Player</th>
                  <th className="px-2">Pos</th>
                  <th className="px-2">Age</th>
                  <th className="px-2 text-right">Dist 7d</th>
                  <th className="px-2 text-right">HSR 7d</th>
                  <th className="px-2 text-right">Sprint</th>
                  <th className="px-2 text-right">Max spd</th>
                  <th className="px-2 text-right">ACWR</th>
                  <th className="px-2">Status</th>
                  <th className="px-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => {
                  const p = m.player;
                  const posAvg = positionAverage(p.position, (x) => x.hsr7) || 1;
                  const dev = Math.round(((m.hsr7 - posAvg) / posAvg) * 100);
                  return (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-surface-2">
                      <td className="py-2 pr-2">
                        <Link to="/players/$id" params={{ id: p.id }} className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                            {initials(p)}
                          </span>
                          <span>
                            <span className="font-medium hover:text-primary">{fullName(p)}</span>
                            <span className="block text-xs text-muted-foreground">
                              #{p.number} · {p.nationality} · BMI {bmi(p)}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 text-muted-foreground">{p.position}</td>
                      <td className="px-2 text-muted-foreground">{age(p.dob)}</td>
                      <td className="px-2 text-right tabular-nums">{m.distance7.toLocaleString()}</td>
                      <td className="px-2 text-right tabular-nums">
                        {m.hsr7}
                        <span className={`ml-1 text-xs ${dev > 20 ? "text-destructive" : dev < -20 ? "text-warning" : "text-muted-foreground"}`}>
                          {dev > 0 ? "+" : ""}
                          {dev}%
                        </span>
                      </td>
                      <td className="px-2 text-right tabular-nums">{m.sprint7}</td>
                      <td className="px-2 text-right tabular-nums">{m.maxSpeed || "—"}</td>
                      <td className="px-2 text-right">
                        <AcwrPill acwr={m.load.acwr} />
                      </td>
                      <td className="px-2">
                        <select
                          value={p.availability}
                          onChange={(e) => updatePlayer(p.id, { availability: e.target.value as Player["availability"] })}
                          className="h-8 rounded-md border border-input bg-surface-2 px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                        >
                          {AVAILABILITY.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 text-right">
                        <button
                          type="button"
                          aria-label={`Remove ${fullName(p)}`}
                          onClick={() => {
                            if (window.confirm(`Remove ${fullName(p)} from the squad? All their records are deleted.`))
                              removePlayer(p.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-4">
          <SectionTitle title="HSR ranking" hint="Last 7 days, top 12" />
          <HBar data={hsrChart} dataKey="hsr" labelKey="name" height={360} />
          <p className="eyebrow mt-4">Position averages · HSR 7d</p>
          <ul className="mt-2 space-y-1 text-sm">
            {positions.map((p) => (
              <li key={p} className="flex justify-between">
                <span className="text-muted-foreground">{p}</span>
                <span className="tabular-nums">{positionAverage(p, (m) => m.hsr7)} m</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
