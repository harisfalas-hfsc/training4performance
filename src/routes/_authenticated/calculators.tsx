import { createFileRoute } from "@tanstack/react-router";
import { Calculator, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";

export const Route = createFileRoute("/_authenticated/calculators")({
  head: () => ({
    meta: [
      { title: "Coach Calculators — T4P" },
      {
        name: "description",
        content:
          "Standalone coaching calculators for load, speed, testing and prescription — built from your own Excel tools, rebuilt as clean web calculators.",
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

function CalculatorsPage() {
  return (
    <AppShell title="Calculators" subtitle="Standalone coaching calculators — no session or team required">
      <section className="panel p-4">
        <SectionTitle
          title="Calculator library"
          hint="Upload your Excel calculators and they will be rebuilt here as native web tools"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-dashed border-border p-6 text-center">
            <Calculator className="mx-auto size-6 text-primary" />
            <p className="mt-2 text-sm font-medium">No calculators yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send me the Excel files you use and each one becomes a calculator on this page — same inputs and formulas,
              clean interface, no spreadsheet needed.
            </p>
          </div>
          <div className="rounded-md border border-border p-6">
            <FileSpreadsheet className="size-6 text-primary" />
            <p className="mt-2 text-sm font-medium">What works well here</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>· Load, ACWR and monotony calculators</li>
              <li>· Speed / sprint zone and MAS-based prescription</li>
              <li>· 1RM, %1RM and strength progression tables</li>
              <li>· Testing conversions and normative scoring</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
