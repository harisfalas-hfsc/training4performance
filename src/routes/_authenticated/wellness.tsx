import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, RefreshCw, Save, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { MultiLine, TrendBars } from "@/components/charts";
import { T4P } from "@/components/brand-text";
import { fullName, players, today, useDataVersion } from "@/data/performance";
import {
  WELLNESS_FIELDS,
  deleteWellness,
  emptyEntry,
  entriesFor,
  entriesOn,
  entryOn,
  entryScore,
  loadWellness,
  saveWellness,
  useWellnessVersion,
  wellnessTrend,
  type WellnessEntry,
  type WellnessField,
} from "@/data/wellness";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { canWrite } from "@/lib/access";
import { isDemoActive } from "@/lib/demo";

export const Route = createFileRoute("/_authenticated/wellness")({
  head: () => ({
    meta: [
      { title: "Daily Wellness — T4P" },
      {
        name: "description",
        content:
          "Daily wellness questionnaire, squad readiness trends and personal player portal access codes for football performance staff.",
      },
      { property: "og:title", content: "Daily Wellness — T4P" },
      { property: "og:description", content: "Sleep, fatigue, soreness, stress, mood, hydration and readiness — collected from the players themselves." },
    ],
  }),
  component: WellnessPage,
});

interface AccessRow {
  id: string;
  player_id: string;
  player_name: string;
  code: string;
  email: string | null;
  active: boolean;
  last_login_at: string | null;
}

const TABS = ["Today", "Trends", "Player access"] as const;
type Tab = (typeof TABS)[number];

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint32Array(9);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 3)}-${out.slice(3, 6)}-${out.slice(6, 9)}`;
}

function WellnessPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Today");
  useDataVersion();
  useWellnessVersion();

  useEffect(() => {
    if (user?.id) void loadWellness(user.id);
  }, [user?.id]);

  const responded = entriesOn(today);
  const average = responded.length
    ? Math.round(responded.reduce((s, e) => s + entryScore(e), 0) / responded.length)
    : 0;

  return (
    <AppShell
      title="Daily Wellness"
      subtitle={
        <>
          How the squad feels today. Players answer it themselves in their <T4P /> portal — you can also fill it in for them.
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Link to="/alerts" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Open wellness & workload alerts</Link>
        <Link to="/team" className="rounded-md border border-border px-3 py-2 text-sm font-medium">Open players</Link>
      </div>
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Responses today" value={`${responded.length}/${players.length}`} hint="Questionnaires completed" />
        <MetricCard
          label="Squad wellness index"
          value={average ? `${average}%` : "—"}
          tone={average >= 75 ? "good" : average >= 60 ? "warn" : average ? "bad" : "default"}
          hint="Average of the seven daily questions"
        />
        <MetricCard
          label="Missing"
          value={players.length - responded.length}
          hint="Players who have not answered yet"
        />
      </section>

      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Today" ? <TodayTab /> : null}
        {tab === "Trends" ? <TrendsTab /> : null}
        {tab === "Player access" ? <AccessTab /> : null}
      </div>
    </AppShell>
  );
}

/* ---------------- Today ---------------- */

function TodayTab() {
  const { user } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);

  if (!players.length) {
    return (
      <div className="panel p-6 text-center text-sm text-muted-foreground">
        Add players to your squad first — then every player can answer the daily questionnaire.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="panel overflow-x-auto p-4">
        <SectionTitle title="Today’s answers" hint={`Questionnaire for ${today}`} />
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground">
              <th className="py-2">Player</th>
              <th>Score</th>
              <th>Sleep</th>
              <th>Fatigue</th>
              <th>Soreness</th>
              <th>Readiness</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const entry = entryOn(p.id, today);
              const score = entry ? entryScore(entry) : 0;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="py-2 font-medium">{fullName(p)}</td>
                  <td className={score >= 75 ? "text-success" : score >= 60 ? "text-warning" : score ? "text-destructive" : "text-muted-foreground"}>
                    {entry ? `${score}%` : "—"}
                  </td>
                  <td>{entry ? `${entry.sleep}/5${entry.sleepHours !== null ? ` · ${entry.sleepHours}h` : ""}` : "—"}</td>
                  <td>{entry ? `${entry.fatigue}/5` : "—"}</td>
                  <td>{entry ? `${entry.soreness}/5` : "—"}</td>
                  <td>{entry ? `${entry.readiness}/5` : "—"}</td>
                  <td className="text-xs text-muted-foreground">{entry ? entry.source : "not answered"}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="rounded-md border border-border px-2 py-1 text-xs"
                      onClick={() => setEditing(editing === p.id ? null : p.id)}
                    >
                      {entry ? "Edit" : "Fill in"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing ? (
        <WellnessForm
          playerId={editing}
          initial={entryOn(editing, today) ?? { ...emptyEntry(editing), source: "coach" }}
          onCancel={() => setEditing(null)}
          onSave={async (entry) => {
            const coachId = user?.id ?? (isDemoActive() ? "demo" : null);
            if (!coachId || !canWrite()) {
              toast.error("A team subscription is needed to record data.");
              return;
            }
            const ok = await saveWellness(coachId, { ...entry, source: "coach" });
            toast[ok ? "success" : "error"](ok ? "Wellness saved" : "Could not save wellness");
            if (ok) setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function WellnessForm({
  playerId,
  initial,
  onSave,
  onCancel,
  readOnlyDate,
}: {
  playerId: string;
  initial: WellnessEntry;
  onSave: (entry: WellnessEntry) => void | Promise<void>;
  onCancel?: () => void;
  readOnlyDate?: boolean;
}) {
  const [entry, setEntry] = useState<WellnessEntry>(initial);
  useEffect(() => setEntry(initial), [initial.playerId, initial.date, initial.id]);
  const score = entryScore(entry);
  const set = (key: WellnessField, value: number) => setEntry((e) => ({ ...e, [key]: value }));

  return (
    <div className="panel space-y-4 p-4">
      <SectionTitle
        title="Daily questionnaire"
        hint="1 = worst, 5 = best. Answer every morning before training."
        right={
          <span className={`metric-value text-2xl ${score >= 75 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive"}`}>
            {score}%
          </span>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Date</span>
          <input
            type="date"
            className="control"
            value={entry.date}
            disabled={readOnlyDate}
            onChange={(e) => setEntry((x) => ({ ...x, date: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Hours slept</span>
          <input
            type="number"
            min={0}
            max={16}
            step={0.5}
            className="control"
            value={entry.sleepHours ?? ""}
            onChange={(e) => setEntry((x) => ({ ...x, sleepHours: e.target.value === "" ? null : Number(e.target.value) }))}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {WELLNESS_FIELDS.map((field) => (
          <div key={field.key} className="rounded-md border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{field.label}</p>
              <span className="metric-value tabular-nums text-primary">{entry[field.key]}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={entry[field.key]}
              onChange={(e) => set(field.key, Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{field.low}</span>
              <span>{field.high}</span>
            </div>
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className="eyebrow">Note (optional)</span>
        <textarea
          className="control min-h-16"
          value={entry.note ?? ""}
          onChange={(e) => setEntry((x) => ({ ...x, note: e.target.value }))}
          placeholder="Anything the staff should know — niggles, travel, illness…"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onSave({ ...entry, playerId })}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Save className="size-4" /> Save
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Trends ---------------- */

function TrendsTab() {
  const { user } = useAuth();
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const squad = wellnessTrend(28);
  const personal = useMemo(
    () =>
      entriesFor(playerId).slice(-28).map((e) => ({
        date: e.date.slice(5),
        score: entryScore(e),
        sleep: e.sleep,
        fatigue: e.fatigue,
        soreness: e.soreness,
        readiness: e.readiness,
      })),
    [playerId],
  );

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <SectionTitle title="Squad wellness index" hint="Average of every answer received, last 28 recorded days" />
        {squad.length ? (
          <TrendBars data={squad.map((d) => ({ ...d, date: d.date.slice(5) }))} dataKey="score" height={220} />
        ) : (
          <p className="text-sm text-muted-foreground">No questionnaires yet.</p>
        )}
      </div>

      <div className="panel p-4">
        <SectionTitle
          title="Player detail"
          hint="Sleep, fatigue, soreness and readiness day by day"
          right={
            <select className="control" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {fullName(p)}
                </option>
              ))}
            </select>
          }
        />
        {personal.length ? (
          <MultiLine
            data={personal}
            dualAxis={false}
            series={[
              { key: "score", color: "var(--color-chart-1)", name: "Wellness %" },
              { key: "sleep", color: "var(--color-chart-2)", name: "Sleep" },
              { key: "fatigue", color: "var(--color-chart-3)", name: "Fatigue" },
              { key: "soreness", color: "var(--color-chart-4)", name: "Soreness" },
              { key: "readiness", color: "var(--color-chart-5)", name: "Readiness" },
            ]}
            height={260}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No answers for this player yet.</p>
        )}
        {personal.length && (user?.id || isDemoActive()) ? (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {entriesFor(playerId)
              .slice(-5)
              .reverse()
              .filter((e) => e.note)
              .map((e) => (
                <p key={e.date}>
                  <span className="font-medium text-foreground">{e.date}:</span> {e.note}{" "}
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => e.id && void deleteWellness(user?.id ?? "demo", e.id)}
                  >
                    delete entry
                  </button>
                </p>
              ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- Player access ---------------- */

function AccessTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [busy, setBusy] = useState(false);
  const portalUrl = typeof window === "undefined" ? "/portal" : `${window.location.origin}/portal`;

  const refresh = async () => {
    if (isDemoActive()) {
      setRows([]);
      return;
    }
    if (!user?.id) return;
    const { data } = await supabase
      .from("player_access")
      .select("id,player_id,player_name,code,email,active,last_login_at")
      .eq("coach_id", user.id);
    setRows((data ?? []) as AccessRow[]);
  };

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  const give = async (playerId: string, playerName: string) => {
    if (isDemoActive()) {
      setRows((prev) =>
        prev.some((r) => r.player_id === playerId)
          ? prev
          : [
              ...prev,
              {
                id: `demo-access-${playerId}`,
                player_id: playerId,
                player_name: playerName,
                code: newCode(),
                email: null,
                active: true,
                last_login_at: null,
              },
            ],
      );
      toast.success(`Access code created for ${playerName}`);
      return;
    }
    if (!user?.id) return;
    if (!canWrite()) {
      toast.error("A team subscription is needed to invite players.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("player_access").upsert(
      { coach_id: user.id, player_id: playerId, player_name: playerName, code: newCode(), active: true },
      { onConflict: "coach_id,player_id" },
    );
    setBusy(false);
    if (error) toast.error("Could not create the access code");
    else {
      toast.success(`Access code created for ${playerName}`);
      void refresh();
    }
  };

  const toggle = async (row: AccessRow) => {
    if (isDemoActive()) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)));
      return;
    }
    await supabase.from("player_access").update({ active: !row.active }).eq("id", row.id);
    void refresh();
  };

  const remove = async (row: AccessRow) => {
    if (isDemoActive()) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    await supabase.from("player_access").delete().eq("id", row.id);
    void refresh();
  };

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <SectionTitle
          title="Player portal access"
          hint={
            <>
              Give each player a personal code. They open <span className="font-medium text-foreground">{portalUrl}</span>, type the
              code and get a read-only view of their own GPS, fitness tests and the daily wellness questionnaire. Nothing else is visible
              to them.
            </>
          }
          right={
            <button type="button" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm" onClick={() => void refresh()}>
              <RefreshCw className="size-4" /> Refresh
            </button>
          }
        />
        {!players.length ? (
          <p className="text-sm text-muted-foreground">Add players to your squad first.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Player</th>
                  <th>Email / code</th>
                  <th>Status</th>
                  <th>Last sign-in</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {players.map((p) => {
                  const row = rows.find((r) => r.player_id === p.id);
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <td className="py-2 font-medium">{fullName(p)}</td>
                      <td className="text-xs">
                        {row ? (
                          <>
                            <span className="block">{row.email ?? "no email"}</span>
                            <span className="font-mono text-muted-foreground">{row.code}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={row ? (row.active ? "text-success" : "text-muted-foreground") : "text-muted-foreground"}>
                        {row ? (row.active ? "Active" : "Suspended") : "No access"}
                      </td>
                      <td className="text-xs text-muted-foreground">{row?.last_login_at ? row.last_login_at.slice(0, 16).replace("T", " ") : "never"}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                            onClick={() => void give(p.id, fullName(p))}
                          >
                            <KeyRound className="size-3.5" /> {row ? "New code" : "Create code"}
                          </button>
                          {row ? (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                                onClick={() => {
                                  void navigator.clipboard.writeText(`${portalUrl} — code ${row.code}`);
                                  toast.success("Portal link and code copied");
                                }}
                              >
                                <Copy className="size-3.5" /> Copy
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
                                onClick={() => void toggle(row)}
                              >
                                <ShieldOff className="size-3.5" /> {row.active ? "Suspend" : "Activate"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive"
                                onClick={() => void remove(row)}
                              >
                                <Trash2 className="size-3.5" /> Remove
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
