import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Availability } from "@/data/performance";

export function MetricCard({
  label,
  value,
  unit,
  hint,
  tone = "default",
  icon,
  iconColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
  icon?: ReactNode;
  iconColor?: string;
}) {
  const toneClass =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-warning"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {icon ? <span style={{ color: iconColor }} className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("metric-value mt-2 text-3xl", toneClass)}>
        {value}
        {unit ? <span className="ml-1 text-base text-muted-foreground">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const availabilityMeta: Record<Availability, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success/15 text-success border-success/30" },
  partial: { label: "Partial", className: "bg-warning/15 text-warning border-warning/30" },
  individual: { label: "Individual", className: "bg-warning/15 text-warning border-warning/30" },
  rehab: { label: "Rehabilitation", className: "bg-info/15 text-info border-info/30" },
  injured: { label: "Injured", className: "bg-destructive/15 text-destructive border-destructive/30" },
  ill: { label: "Ill", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function AvailabilityPill({ status }: { status: Availability }) {
  const meta = availabilityMeta[status];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  );
}

export const ACWR_BANDS = [
  { id: "under", label: "Under-training", from: 0, to: 0.8, color: "var(--color-warning)", hint: "Below 0.80 — detraining / low chronic base" },
  { id: "sweet", label: "Sweet spot", from: 0.8, to: 1.3, color: "var(--color-success)", hint: "0.80 – 1.30 — lowest reported injury risk" },
  { id: "caution", label: "Caution", from: 1.3, to: 1.5, color: "var(--color-warning)", hint: "1.30 – 1.50 — rising load, monitor closely" },
  { id: "danger", label: "Danger zone", from: 1.5, to: 2.5, color: "var(--color-destructive)", hint: "Above 1.50 — highest reported injury risk" },
] as const;

export type AcwrBand = (typeof ACWR_BANDS)[number]["id"];

export function acwrBand(acwr: number): AcwrBand {
  if (acwr < 0.8) return "under";
  if (acwr <= 1.3) return "sweet";
  if (acwr <= 1.5) return "caution";
  return "danger";
}

const acwrBandClass: Record<AcwrBand, string> = {
  under: "bg-warning/15 text-warning border-warning/30",
  sweet: "bg-success/15 text-success border-success/30",
  caution: "bg-warning/15 text-warning border-warning/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

export function AcwrPill({ acwr }: { acwr: number }) {
  const band = acwrBand(acwr);
  const cls = acwr === 0 ? "bg-muted text-muted-foreground border-border" : acwrBandClass[band];
  return (
    <span
      title={acwr === 0 ? "No load recorded" : ACWR_BANDS.find((b) => b.id === band)!.hint}
      className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums", cls)}
    >
      {acwr === 0 ? "no data" : acwr.toFixed(2)}
    </span>
  );
}

/** Colour key for every chart or table that shows ACWR. */
export function AcwrLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground", className)}>
      {ACWR_BANDS.map((b) => (
        <span key={b.id} className="inline-flex items-center gap-1" title={b.hint}>
          <span className="size-2 rounded-full" style={{ background: b.color, opacity: 0.85 }} />
          {b.label} <span className="tabular-nums">({b.from.toFixed(2)}–{b.to === 2.5 ? "+" : b.to.toFixed(2)})</span>
        </span>
      ))}
    </div>
  );
}

export function SectionTitle({ title, hint, right }: { title: string; hint?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold uppercase tracking-wide">{title}</h2>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {right ? <div className="min-w-0 sm:shrink-0">{right}</div> : null}
    </div>
  );
}
