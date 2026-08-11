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

export function AcwrPill({ acwr }: { acwr: number }) {
  const cls =
    acwr === 0
      ? "bg-muted text-muted-foreground border-border"
      : acwr > 1.35
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : acwr < 0.8
          ? "bg-warning/15 text-warning border-warning/30"
          : "bg-success/15 text-success border-success/30";
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums", cls)}>
      {acwr === 0 ? "no data" : acwr.toFixed(2)}
    </span>
  );
}

export function SectionTitle({ title, hint, right }: { title: string; hint?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold uppercase tracking-wide">{title}</h2>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {right}
    </div>
  );
}
