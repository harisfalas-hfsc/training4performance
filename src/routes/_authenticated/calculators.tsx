import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculators, calculatorCategories, type CalculatorSpec } from "@/lib/calculators";

export const Route = createFileRoute("/_authenticated/calculators")({
  head: () => ({
    meta: [
      { title: "Coach Calculators — T4P" },
      {
        name: "description",
        content:
          "Coaching calculators for VO2 max, RAST sprint power, Conconi threshold, 1RM, heart-rate zones and vVO2max interval sessions.",
      },
      { property: "og:title", content: "Coach Calculators — T4P" },
      {
        property: "og:description",
        content: "Coaching calculators rebuilt from Excel into fast, clean web tools.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalculatorsPage,
});

function CalculatorCard({ spec }: { spec: CalculatorSpec }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(spec.fields.map((f) => [f.key, String(f.default)])),
  );

  const results = useMemo(() => {
    const get = (key: string) => {
      const raw = Number(values[key]);
      return Number.isFinite(raw) ? raw : 0;
    };
    try {
      return spec.compute(get);
    } catch {
      return [];
    }
  }, [spec, values]);

  return (
    <section className="panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <Calculator className="mt-0.5 size-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{spec.name}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{spec.summary}</span>
        </span>
        <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="border-t border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {spec.fields.map((field) => (
              <label key={field.key} className="block">
                <span className="block text-xs font-medium text-muted-foreground">
                  {field.label}
                  {field.unit ? ` (${field.unit})` : ""}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={field.step ?? 1}
                  min={field.min}
                  max={field.max}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {field.hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{field.hint}</span> : null}
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-secondary/60 p-3">
            <p className="eyebrow">Results</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {results.map((r) => (
                <div
                  key={r.label}
                  className={cn(
                    "flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-sm",
                    r.emphasis ? "bg-background font-semibold" : "text-muted-foreground",
                  )}
                >
                  <span className="min-w-0 truncate text-xs">{r.label}</span>
                  <span className={cn("metric-value shrink-0 text-sm", r.emphasis && "text-primary")}>
                    {r.value}
                    {r.unit ? <span className="ml-1 text-[11px] font-normal text-muted-foreground">{r.unit}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {spec.notes?.length ? (
            <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              {spec.notes.map((n) => (
                <li key={n}>· {n}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setValues(Object.fromEntries(spec.fields.map((f) => [f.key, String(f.default)])))}
            >
              Reset values
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CalculatorsPage() {
  const [category, setCategory] = useState<string>("All");
  const visible = calculators.filter((c) => category === "All" || c.category === category);

  return (
    <AppShell title="Calculators" subtitle="Standalone coaching calculators — no session or team required">
      <SectionTitle title="Calculator library" hint="Open a calculator, type your numbers, read the result" />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {["All", ...calculatorCategories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground",
              category === c && "bg-secondary text-primary",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {visible.map((spec) => (
          <CalculatorCard key={spec.id} spec={spec} />
        ))}
      </div>
    </AppShell>
  );
}
