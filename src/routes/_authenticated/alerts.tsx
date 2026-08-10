import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Bell, HeartPulse, Lock, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, SectionTitle } from "@/components/perf-ui";
import { fullName } from "@/data/performance";
import {
  DEFAULT_THRESHOLDS,
  evaluateAlerts,
  type AlertCategory,
  type Thresholds,
} from "@/data/alerts-config";
import { useRole, MEDICAL_REDACTED } from "@/lib/roles";

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

const CATEGORIES: Array<AlertCategory | "All"> = ["All", "Workload", "Wellness", "Availability"];

const sliders: Array<{ key: keyof Thresholds; label: string; min: number; max: number; step: number; unit: string }> = [
  { key: "acwrHigh", label: "ACWR upper limit", min: 1.05, max: 1.8, step: 0.05, unit: "" },
  { key: "acwrLow", label: "ACWR lower limit", min: 0.4, max: 1, step: 0.05, unit: "" },
  { key: "weeklyLoadJumpPct", label: "Weekly load jump", min: 10, max: 60, step: 5, unit: "%" },
  { key: "wellnessLow", label: "Wellness floor", min: 30, max: 80, step: 5, unit: "%" },
  { key: "sleepLow", label: "Sleep quality floor", min: 1, max: 4, step: 1, unit: "/5" },
  { key: "sorenessHigh", label: "Soreness ceiling", min: 2, max: 5, step: 1, unit: "/5" },
  { key: "availabilityLow", label: "Availability floor", min: 50, max: 95, step: 5, unit: "%" },
];

function AlertsPage() {
  const { can, def } = useRole();
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [category, setCategory] = useState<AlertCategory | "All">("All");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const all = useMemo(() => evaluateAlerts(thresholds), [thresholds]);
  const visible = all.filter((a) => (a.medical ? can("viewMedicalDetail") || !a.medical : true));
  const hiddenMedical = all.length - all.filter((a) => !a.medical || can("viewMedicalDetail")).length;

  const shown = visible
    .filter((a) => category === "All" || a.category === category)
    .filter((a) => !acknowledged.includes(a.id));

  const critical = visible.filter((a) => a.severity === "critical").length;
  const warning = visible.filter((a) => a.severity === "warning").length;

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

      {hiddenMedical > 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-border bg-surface-2 p-3 text-sm text-muted-foreground">
          <Lock className="size-4" /> {hiddenMedical} alert(s) hidden — {MEDICAL_REDACTED}.
        </p>
      )}

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
          <SectionTitle title="Alert thresholds" hint={can("manageAlertThresholds") ? "Changes apply instantly" : "Read-only for your role"} />
          <div className="space-y-4">
            {sliders.map((s) => (
              <div key={s.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="metric-value text-primary">
                    {thresholds[s.key]}
                    {s.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={thresholds[s.key]}
                  disabled={!can("manageAlertThresholds")}
                  onChange={(e) => setThresholds((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
                  className="mt-1 w-full accent-[var(--color-primary)] disabled:opacity-40"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <HeartPulse className="mt-0.5 size-3.5 shrink-0" />
            Alerts recalculate from GPS, wellness and availability records every time new data is imported.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
