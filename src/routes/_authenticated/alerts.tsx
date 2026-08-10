import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Bell, HeartPulse, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { fullName, useDataVersion } from "@/data/performance";
import {
  DEFAULT_ENABLED,
  DEFAULT_THRESHOLDS,
  RULES,
  evaluateAlerts,
  type AlertCategory,
  type RuleId,
  type Thresholds,
} from "@/data/alerts-config";
import { useRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Automated Threshold Alerts — T4P" },
      {
        name: "description",
        content:
          "Automatic workload, wellness and availability alerts with configurable thresholds so tomorrow's training plan can be adjusted immediately.",
      },
      { property: "og:title", content: "Automated Threshold Alerts — T4P" },
      {
        property: "og:description",
        content: "ACWR spikes, load jumps, wellness drops and availability risks flagged the moment they cross your limits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

const CATEGORIES: Array<AlertCategory | "All"> = ["All", "Workload", "Wellness", "Availability", "Performance"];

function AlertsPage() {
  useDataVersion();
  const { can, def } = useRole();
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [enabled, setEnabled] = useState<RuleId[]>(DEFAULT_ENABLED);
  const [category, setCategory] = useState<AlertCategory | "All">("All");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const visible = useMemo(() => evaluateAlerts(thresholds, enabled), [thresholds, enabled]);

  const shown = visible
    .filter((a) => category === "All" || a.category === category)
    .filter((a) => !acknowledged.includes(a.id));

  const critical = visible.filter((a) => a.severity === "critical").length;
  const warning = visible.filter((a) => a.severity === "warning").length;

  const toggle = (id: RuleId) =>
    setEnabled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));


  return (
    <AppShell
      title="Alerts"
      subtitle={`Automated threshold monitoring · ${def.label} view`}
      actions={
        <button
          onClick={() => setThresholds(DEFAULT_THRESHOLDS)}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
        >
          <SlidersHorizontal className="size-4" /> Reset thresholds
        </button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Critical" value={critical} tone={critical ? "bad" : "good"} icon={<ShieldAlert className="size-4" />} />
        <MetricCard label="Warnings" value={warning} tone={warning ? "warn" : "good"} icon={<AlertTriangle className="size-4" />} />
        <MetricCard label="Open alerts" value={shown.length} icon={<Bell className="size-4" />} />
        <MetricCard
          label="Acknowledged today"
          value={acknowledged.length}
          hint="Acknowledged alerts stay recorded against the session"
        />
      </section>




      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="panel p-4 xl:col-span-2">
          <SectionTitle
            title="Triggered alerts"
            hint="Each alert carries the exact metric, threshold and a concrete adjustment for tomorrow"
            right={
              <div className="flex flex-wrap gap-1">
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
            }
          />
          {shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No open alerts in this category with the current thresholds.
            </p>
          ) : (
            <ul className="space-y-2">
              {shown.map((a) => (
                <li key={a.id} className="rounded-md border border-border bg-surface-2 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold uppercase ${
                            a.severity === "critical"
                              ? "border-destructive/30 bg-destructive/15 text-destructive"
                              : a.severity === "warning"
                                ? "border-warning/30 bg-warning/15 text-warning"
                                : "border-info/30 bg-info/15 text-info"
                          }`}
                        >
                          {a.severity}
                        </span>
                        <Link to="/players/$id" params={{ id: a.player.id }} className="font-semibold hover:text-primary">
                          {fullName(a.player)}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          #{a.player.number} · {a.player.position} · {a.category}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{a.message}</p>
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">{a.metric}: </span>
                        <span className="metric-value text-primary">{a.value}</span>
                        <span className="text-xs text-muted-foreground"> (threshold {a.threshold})</span>
                      </p>
                      <p className="mt-1 text-sm text-foreground/90">→ {a.action}</p>
                    </div>
                    <button
                      onClick={() => setAcknowledged((prev) => [...prev, a.id])}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      Acknowledge
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel h-fit p-4">
          <SectionTitle
            title="Alert library"
            hint={`${enabled.length} of ${RULES.length} rules active — switch any rule on or off and tune its threshold`}
            right={
              <div className="flex gap-1">
                <button
                  onClick={() => setEnabled(RULES.map((r) => r.id))}
                  className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  All on
                </button>
                <button
                  onClick={() => setEnabled([])}
                  className="rounded-md border border-border px-2 py-1 text-[0.68rem] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  All off
                </button>
              </div>
            }
          />
          <div className="space-y-3">
            {RULES.map((r) => {
              const active = enabled.includes(r.id);
              const count = visible.filter((a) => a.ruleId === r.id).length;
              return (
                <div
                  key={r.id}
                  className={`rounded-md border p-3 ${active ? "border-primary/40 bg-primary/5" : "border-border"}`}
                >
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
                        <span className="text-muted-foreground">Threshold</span>
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
                        onChange={(e) =>
                          setThresholds((prev) => ({ ...prev, [r.key]: Number(e.target.value) }))
                        }
                        className="mt-1 w-full accent-[var(--color-primary)] disabled:opacity-40"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <HeartPulse className="mt-0.5 size-3.5 shrink-0" />
            Alerts recalculate from GPS, wellness, testing and availability records every time new data is imported.
          </p>
        </div>

      </section>
    </AppShell>
  );
}
