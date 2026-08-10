import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  BrainCircuit,
  CalendarDays,
  ClipboardPen,
  BookOpen,
  Radar,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { MarketingPage } from "@/components/marketing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "T4P — Training 4 Performance | Football Performance System for S&C Coaches" },
      {
        name: "description",
        content:
          "T4P is the football performance system built for S&C coaches — the daily companion that brings squad availability, training design, GPS import, workload monitoring, wellness, testing, medical status, logbook, alerts and reports into one connected workspace.",
      },
      { property: "og:title", content: "T4P — Training 4 Performance | Football Performance System for S&C Coaches" },
      {
        property: "og:description",
        content:
          "The daily companion for football S&C coaches: squad availability, session design, GPS, workload, wellness, testing, medical status and one-click reports — all connected.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),

  component: Home,
});

const features = [
  { icon: Users, title: "Squad management", text: "Availability, positions, status and player passports in one place." },
  { icon: CalendarDays, title: "Training calendar", text: "MD-cycle planning, drills, durations, planned vs actual RPE." },
  { icon: ClipboardPen, title: "Tactics board", text: "Draw sessions on a real pitch: players, equipment, runs and zones." },
  { icon: Radar, title: "GPS import", text: "Catapult, STATSports, GPEXE, Polar or the T4P template — with mapping reports." },
  { icon: BookOpen, title: "Training monitor logbook", text: "Every session row, drill splits, RPE, pivot charts and test batteries." },
  { icon: BellRing, title: "Automated alerts", text: "ACWR spikes, load jumps, wellness drops and availability risks." },
  { icon: BarChart3, title: "Analytics", text: "Composite load, acute:chronic, monotony, strain and squad benchmarks." },
  { icon: BrainCircuit, title: "AI assistant", text: "Daily observations and suggested adjustments for tomorrow's plan." },
];

function Home() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-surface-2/60">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center sm:py-20">
          <img
            src="/logo-t4p.png"
            alt="Training 4 Performance logo"
            className="mx-auto mb-6 size-16 object-contain"
            width={64}
            height={64}
          />
          <p className="eyebrow">Training 4 Performance</p>
          <h1 className="mx-auto mt-3 max-w-3xl font-display text-3xl font-semibold uppercase leading-tight tracking-wide sm:text-5xl">
            The football performance system for S&C coaches that connects everything
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
            T4P is the daily companion for strength & conditioning coaches in football. It brings every player
            record, training session, GPS report, wellness entry, test result and medical note into one
            connected workspace — so you spend less time switching files and more time coaching.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
            Squad availability, block-based session design, the tactics board, GPS import from Catapult,
            STATSports, GPEXE and Polar, your own composite load model with ACWR, monotony and strain, RPE,
            the full testing battery, automated alerts and one-click reports — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            €999 per season, per team · every module included
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">What's inside</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="panel p-4">
              <f.icon className="size-5 text-primary" />
              <p className="mt-3 font-semibold">{f.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 lg:grid-cols-3">
          {[
            { icon: Activity, t: "Built by practitioners", d: "Designed by a sports scientist and strength & conditioning coach from real daily club workflow — not a generic dashboard." },
            { icon: ShieldCheck, t: "One workspace", d: "Your whole staff works on the same squad, calendar and data — no per-user fees, no separate tiers." },
            { icon: BarChart3, t: "Your own load model", d: "Choose the KPIs and weights that build training load, and drive ACWR, monotony and strain from your data." },
          ].map((b) => (
            <div key={b.t}>
              <b.icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-lg font-semibold">{b.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Ready for the season?</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The season runs 1 June to 31 May. One subscription covers your team and your whole staff.
        </p>
        <Link
          to="/pricing"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          View pricing <ArrowRight className="size-4" />
        </Link>
      </section>
    </MarketingPage>
  );
}
