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
import heroMotion from "@/assets/hero-motion.jpg";

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
  { icon: Users, title: "Squad management", text: "Availability, positions, status and player passports in one place.", color: "#2563eb" },
  { icon: CalendarDays, title: "Training calendar", text: "MD-cycle planning, drills, durations, planned vs actual RPE.", color: "#059669" },
  { icon: ClipboardPen, title: "Tactics board", text: "Draw sessions on a real pitch: players, equipment, runs and zones.", color: "#7c3aed" },
  { icon: Radar, title: "GPS import", text: "Catapult, STATSports, GPEXE, Polar or your own template — with mapping reports.", color: "#0891b2" },
  { icon: BookOpen, title: "Training monitor logbook", text: "Every session row, drill splits, RPE, pivot charts and test batteries.", color: "#d97706" },
  { icon: BellRing, title: "Automated alerts", text: "ACWR spikes, load jumps, wellness drops and availability risks.", color: "#dc2626" },
  { icon: BarChart3, title: "Analytics", text: "Composite load, acute:chronic, monotony, strain and squad benchmarks.", color: "#4f46e5" },
  { icon: BrainCircuit, title: "AI assistant", text: "Daily observations and suggested adjustments for tomorrow's plan.", color: "#9333ea" },
];

function Home() {
  return (
    <MarketingPage>
      {/* Hero */}
      <section className="border-b border-border">
        <img
          src={heroMotion}
          alt="Line-art illustration of a footballer striking a ball and a sprinting player with motion and data curves"
          width={1600}
          height={1008}
          className="block w-full object-cover"
        />

        <div className="mx-auto max-w-6xl px-5 pb-14 pt-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Training 4 Performance</p>
            <h1 className="mt-4 font-display text-4xl font-semibold uppercase leading-[1.05] tracking-wide sm:text-5xl lg:text-6xl">
              The football performance system for S&amp;C coaches that connects everything
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
              T4P is the daily companion for strength &amp; conditioning coaches in football. It brings every player
              record, training session, GPS report, wellness entry, test result and medical note into one connected
              workspace — so you spend less time switching files and more time coaching.
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
            <p className="mt-4 text-xs text-muted-foreground">€999 per season, per team · every module included</p>
          </div>
        </div>
      </section>


      {/* Platform preview */}
      <section className="border-b border-border bg-surface-2/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">Inside the platform</p>
          <h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold uppercase tracking-wide">
            One workspace, from session design to the weekly report
          </h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background shadow-panel">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/60" />
              <span className="size-2.5 rounded-full bg-warning/60" />
              <span className="size-2.5 rounded-full bg-success/60" />
              <span className="ml-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                t4p / dashboard
              </span>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-4">
              {[
                { k: "Squad available", v: "24 / 27", s: "3 modified" },
                { k: "Session load", v: "612 AU", s: "MD-2 · 78 min" },
                { k: "Acute : chronic", v: "1.18", s: "in range" },
                { k: "Open alerts", v: "2", s: "1 critical" },
              ].map((m) => (
                <div key={m.k} className="bg-background p-4">
                  <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{m.k}</p>
                  <p className="mt-2 font-display text-2xl font-semibold">{m.v}</p>
                  <p className="text-xs text-muted-foreground">{m.s}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-px border-t border-border bg-border lg:grid-cols-[1.4fr_1fr]">
              <div className="bg-background p-5">
                <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  Weekly composite load
                </p>
                <div className="mt-5 flex h-36 items-end gap-2">
                  {[38, 62, 84, 55, 71, 93, 40].map((h, i) => (
                    <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <div className="w-full rounded-t bg-primary/85" style={{ height: `${h}%` }} />
                      <span className="font-mono text-[0.6rem] text-muted-foreground">
                        {["MD-4", "MD-3", "MD-2", "MD-1", "MD", "MD+1", "OFF"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-background p-5">
                <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Today's flags</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {[
                    { c: "#dc2626", t: "ACWR 1.61 — spike", p: "Player 11" },
                    { c: "#d97706", t: "Wellness −22% vs baseline", p: "Player 4" },
                    { c: "#059669", t: "New PB · CMJ 41.2 cm", p: "Player 19" },
                  ].map((a) => (
                    <li key={a.t} className="flex items-start gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: a.c }} />
                      <span>
                        <span className="block leading-tight">{a.t}</span>
                        <span className="text-xs text-muted-foreground">{a.p}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Capabilities</p>
        <h2 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide">What's inside</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-5 transition-colors hover:bg-surface-2/60">
              <f.icon className="size-5" style={{ color: f.color }} />
              <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide">{f.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow">About Training 4 Performance</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {[
              { icon: Activity, t: "Built by practitioners", d: "Designed by a sports scientist and strength & conditioning coach from real daily club workflow — not a generic dashboard.", color: "#059669" },
              { icon: ShieldCheck, t: "One workspace", d: "Your whole staff works on the same squad, calendar and data — no per-user fees, no separate tiers.", color: "#2563eb" },
              { icon: BarChart3, t: "Your own load model", d: "Choose the KPIs and weights that build training load, and drive ACWR, monotony and strain from your data.", color: "#d97706" },
            ].map((b) => (
              <div key={b.t}>
                <b.icon className="size-5" style={{ color: b.color }} />
                <p className="mt-3 font-display text-lg font-semibold uppercase tracking-wide">{b.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
          <Link
            to="/about"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
          >
            More about T4P <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Ready for the season?</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The season runs 1 June to 31 May. One subscription covers your team and your whole staff.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold"
          >
            View pricing
          </Link>
        </div>
      </section>
    </MarketingPage>
  );
}
