import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  Inbox,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Trophy,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { useDataVersion } from "@/data/performance";
import { useTestVersion } from "@/data/testing";
import {
  DEFAULT_ENABLED,
  DEFAULT_THRESHOLDS,
  RULES,
  type RuleId,
  type Thresholds,
} from "@/data/alerts-config";
import {
  deleteMany,
  emptyBin,
  markAllRead,
  notifications,
  restore,
  setRead,
  softDelete,
  syncNotifications,
  useNotificationVersion,
  type NotificationCategory,
} from "@/data/notifications";
import { useRole } from "@/lib/roles";
import { scopedStorageKey } from "@/lib/workspace-scope";
import { T4P } from "@/components/brand-text";

const SETTINGS_KEY = "t4p.alert-settings.v1";


export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Notification Centre — T4P" },
      {
        name: "description",
        content:
          "Every workload, wellness, availability and personal-record notification in one centre: filter by day, period or player, mark as read and keep the full history.",
      },
      { property: "og:title", content: "Alerts & Notification Centre — T4P" },
      {
        property: "og:description",
        content: "ACWR spikes, wellness drops and broken records — filtered by day, period or player, and never lost.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

const CATEGORIES: Array<NotificationCategory | "All"> = [
  "All",
  "Workload",
  "Wellness",
  "Availability",
  "Performance",
  "Record",
];

type Box = "inbox" | "read" | "bin";
type Period = "today" | "7" | "30" | "season" | "custom";

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
  { id: "season", label: "All" },
  { id: "custom", label: "Custom" },
];

const shiftDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const dayLabel = (iso: string) => {
  const t = new Date().toISOString().slice(0, 10);
  if (iso === t) return `Today · ${iso}`;
  if (iso === shiftDays(1)) return `Yesterday · ${iso}`;
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
};

function AlertsPage() {
  useDataVersion();
  useTestVersion();
  useNotificationVersion();
  const { can, def } = useRole();

  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [enabled, setEnabled] = useState<RuleId[]>(DEFAULT_ENABLED);
  const [box, setBox] = useState<Box>("inbox");
  const [category, setCategory] = useState<NotificationCategory | "All">("All");
  const [period, setPeriod] = useState<Period>("30");
  const [from, setFrom] = useState(shiftDays(30));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [query, setQuery] = useState("");
  const [showRules, setShowRules] = useState(false);
  const [loadedSettings, setLoadedSettings] = useState(false);

  // Load the coach's saved rule settings (per account).
  useEffect(() => {
    const key = scopedStorageKey(SETTINGS_KEY);
    if (key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as { thresholds?: Thresholds; enabled?: RuleId[] };
          if (parsed.thresholds) setThresholds({ ...DEFAULT_THRESHOLDS, ...parsed.thresholds });
          if (parsed.enabled) setEnabled(parsed.enabled);
        }
      } catch {
        /* ignore corrupt settings */
      }
    }
    setLoadedSettings(true);
  }, []);

  // Save settings, then re-evaluate rules and records and merge into the stored feed.
  useEffect(() => {
    if (!loadedSettings) return;
    const key = scopedStorageKey(SETTINGS_KEY);
    if (key) localStorage.setItem(key, JSON.stringify({ thresholds, enabled }));
    syncNotifications(thresholds, enabled);
  }, [thresholds, enabled, loadedSettings]);


  const range = useMemo(() => {
    if (period === "today") return { start: new Date().toISOString().slice(0, 10), end: "9999-12-31" };
    if (period === "7") return { start: shiftDays(7), end: "9999-12-31" };
    if (period === "30") return { start: shiftDays(30), end: "9999-12-31" };
    if (period === "custom") return { start: from, end: to };
    return { start: "0000-01-01", end: "9999-12-31" };
  }, [period, from, to]);

  const all = notifications;
  const inRange = all.filter((n) => n.date >= range.start && n.date <= range.end);

  const shown = inRange
    .filter((n) => (box === "bin" ? n.deleted : !n.deleted && (box === "inbox" ? !n.read : n.read)))
    .filter((n) => category === "All" || n.category === category)
    .filter((n) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        n.playerName.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const byDay = useMemo(() => {
    const map = new Map<string, typeof shown>();
    for (const n of shown) {
      const list = map.get(n.date) ?? [];
      list.push(n);
      map.set(n.date, list);
    }
    return [...map.entries()];
  }, [shown]);

  const unread = all.filter((n) => !n.deleted && !n.read).length;
  const records = all.filter((n) => !n.deleted && n.source === "record").length;
  const critical = all.filter((n) => !n.deleted && n.severity === "critical").length;

  const toggle = (id: RuleId) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <AppShell
      title="Alerts"
      subtitle={<>Notification centre — every alert and every broken record, kept in <T4P /> · {def.label} view</>}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => markAllRead(shown.map((n) => n.id))}
            disabled={!shown.length || box === "bin"}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm disabled:opacity-40"
          >
            <CheckCheck className="size-4" /> Mark all read
          </button>
          <button
            onClick={() => setShowRules((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <SlidersHorizontal className="size-4" /> {showRules ? "Hide" : "Alert"} settings
          </button>
        </div>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Unread" value={unread} tone={unread ? "warn" : "good"} icon={<Bell className="size-4" />} />
        <MetricCard label="Critical" value={critical} tone={critical ? "bad" : "good"} icon={<ShieldAlert className="size-4" />} />
        <MetricCard label="Records broken" value={records} icon={<Trophy className="size-4" />} hint="Training or match beat the tested value" />
        <MetricCard label="In this view" value={shown.length} icon={<Inbox className="size-4" />} />
      </section>

      <section className="panel mt-6 p-4">
        <SectionTitle
          title="Filters"
          hint="Look at one day, a period, a category, or type a player's name to see only his notifications"
        />
        <div className="flex flex-wrap gap-2">
          {(["inbox", "read", "bin"] as Box[]).map((b) => (
            <button
              key={b}
              onClick={() => setBox(b)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold capitalize ${
                box === b ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {b === "inbox" ? `Unread (${unread})` : b === "read" ? "Read" : "Deleted"}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                period === p.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">From</span>
              <input type="date" className="control" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">To</span>
              <input type="date" className="control" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                category === c ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="field mt-3">
          <span className="field-label">Search player or text</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="control pl-8"
              placeholder="e.g. a player's name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </span>
        </label>
        {box === "bin" && (
          <button
            onClick={emptyBin}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive"
          >
            <Trash2 className="size-3.5" /> Empty the bin permanently
          </button>
        )}
      </section>

      <section className="panel mt-4 p-4">
        <SectionTitle
          title="Notifications"
          hint="Grouped by the day the event happened — nothing is deleted automatically"
          right={
            shown.length && box !== "bin" ? (
              <button
                onClick={() => deleteMany(shown.map((n) => n.id))}
                className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive"
              >
                Delete shown
              </button>
            ) : null
          }
        />
        {byDay.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing here for these filters. New alerts and records appear as soon as GPS, RPE, wellness or test data is added.
          </p>
        ) : (
          <div className="space-y-5">
            {byDay.map(([date, list]) => (
              <div key={date}>
                <p className="eyebrow mb-2">
                  {dayLabel(date)} · {list.length}
                </p>
                <ul className="space-y-2">
                  {list.map((n) => (
                    <li
                      key={n.id}
                      className={`rounded-md border p-3 ${
                        n.read || n.deleted ? "border-border bg-surface-2/60 opacity-80" : "border-primary/30 bg-surface-2"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase ${
                                n.severity === "critical"
                                  ? "border-destructive/30 bg-destructive/15 text-destructive"
                                  : n.severity === "warning"
                                    ? "border-warning/30 bg-warning/15 text-warning"
                                    : "border-info/30 bg-info/15 text-info"
                              }`}
                            >
                              {n.source === "record" ? "record" : n.severity}
                            </span>
                            <Link to="/players/$id" params={{ id: n.playerId }} className="font-semibold hover:text-primary">
                              {n.playerName}
                            </Link>
                            <span className="text-xs text-muted-foreground">{n.category}</span>
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                          {n.value ? (
                            <p className="mt-1 text-sm">
                              <span className="text-muted-foreground">{n.metric}: </span>
                              <span className="metric-value text-primary">{n.value}</span>
                              {n.reference ? <span className="text-xs text-muted-foreground"> ({n.reference})</span> : null}
                            </p>
                          ) : null}
                          {n.action ? <p className="mt-1 text-sm text-foreground/90">→ {n.action}</p> : null}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {n.deleted ? (
                            <button
                              onClick={() => restore(n.id)}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                            >
                              <RotateCcw className="size-3.5" /> Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setRead(n.id, !n.read)}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                              >
                                {n.read ? <BellOff className="size-3.5" /> : <CheckCheck className="size-3.5" />}
                                {n.read ? "Unread" : "Read"}
                              </button>
                              <button
                                onClick={() => softDelete(n.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-destructive hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {showRules && (
        <section className="panel mt-4 p-4">
          <SectionTitle
            title="Alert settings — choose which alerts you get"
            hint={`${enabled.length} of ${RULES.length} checks are switched on. Saved automatically for your account.`}
            right={
              <div className="flex gap-1">
                <button
                  onClick={() => setEnabled(RULES.map((r) => r.id))}
                  className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  Switch all on
                </button>
                <button
                  onClick={() => setEnabled([])}
                  className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  Switch all off
                </button>
                <button
                  onClick={() => {
                    setThresholds(DEFAULT_THRESHOLDS);
                    setEnabled(DEFAULT_ENABLED);
                  }}
                  className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <RotateCcw className="mr-1 inline size-3" />
                  Back to recommended settings
                </button>
              </div>
            }
          />
          <div className="mb-3 space-y-2 rounded-md border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">What this panel does:</strong> every card below is one automatic check.
              The tick box decides if the check runs at all; the slider is the number a player must pass before <T4P />{" "}
              writes a notification into your inbox above.
            </p>
            <p>
              <strong className="text-foreground">Example:</strong> the ACWR slider at 1.35 means "warn me when a player's
              7-day load is more than 1.35 times his 28-day average". Drag it down to 1.25 and you get warned earlier and
              more often; drag it up to 1.50 and you only hear about the extreme cases.
            </p>
            <p>
              <strong className="text-foreground">Back to recommended settings</strong> puts every tick box and every
              slider back to the values sports science suggests, in case you changed them and want to start again. It
              never touches your notifications — nothing in the inbox, read box or bin is deleted.
            </p>
            <p>Changes apply the moment you make them and are remembered next time you sign in.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {RULES.map((r) => {
              const active = enabled.includes(r.id);
              const count = notifications.filter((n) => !n.deleted && n.ruleId === r.id).length;
              return (
                <div key={r.id} className={`rounded-md border p-3 ${active ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={!can("manageAlertThresholds")}
                      onChange={() => toggle(r.id)}
                      className="mt-0.5 size-4 accent-[var(--color-primary)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                        {r.label}
                        <span className="eyebrow shrink-0">
                          {r.category} · {count}
                        </span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{r.description}</span>
                    </span>
                  </label>
                  {active && (
                    <div className="mt-2 pl-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Fires when it passes</span>
                        <span className="metric-value text-primary">
                          {thresholds[r.key]}
                          {r.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={r.min}
                        max={r.max}
                        step={r.step}
                        value={thresholds[r.key]}
                        disabled={!can("manageAlertThresholds")}
                        onChange={(e) => setThresholds((prev) => ({ ...prev, [r.key]: Number(e.target.value) }))}
                        className="mt-1 w-full accent-[var(--color-primary)] disabled:opacity-40"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Records are always checked: whenever a training or match value beats the tested one — maximum speed, estimated 1RM —
            the test record is updated and a notification is kept here.
          </p>
        </section>
      )}
    </AppShell>
  );
}
