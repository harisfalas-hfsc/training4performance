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
import { T4P, Training4Performance } from "@/components/brand-text";
import { seoHead, webPageLd, SOFTWARE_ID, TOPIC_ENTITIES } from "@/lib/seo";
import {
  ShotSquad,
  ShotCalendar,
  ShotTacticsBoard,
  ShotGpsImport,
} from "@/components/home-shots";


export const Route = createFileRoute("/")({
  head: () => ({
    ...seoHead({
      path: "/",
      title: "Football GPS Training Load & Fitness Testing Platform | T4P",
      description:
        "T4P is football S&C software for coaches: GPS training load, ACWR, fitness testing, wellness, squad availability, session design and reports in one connected platform.",
      keywords: [
        "football performance management platform",
        "football fitness coach software",
        "football GPS analytics",
        "football training load monitoring",
        "ACWR football",
        "football fitness testing software",
        "football training session designer",
        "football player monitoring software",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/",
        name: "T4P — Football Performance Management Platform",
        description:
          "Home page of T4P (Training 4 Performance): football performance management software for fitness, strength and conditioning coaches and sports scientists.",
        primaryEntityId: SOFTWARE_ID,
        about: TOPIC_ENTITIES.slice(0, 12),
      }),
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

const showcase = [
  {
    title: "Squad management",
    text: "Every player in one list: position, availability status and their current acute:chronic ratio, with a full passport one click away.",
    points: [
      "Availability, modified training and rehab at a glance",
      "Searchable squad — no walls of buttons",
      "Player passport: GPS, tests, wellness, medical, reports",
    ],
    shot: <ShotSquad />,
  },
  {
    title: "Training calendar",
    text: "Plan the week around match day. Each day holds its blocks and drills, and the bar shows the load the day actually produced.",
    points: [
      "MD-cycle planning from MD-4 to MD+1",
      "Blocks with times, drills and strength prescriptions",
      "Planned vs actual load side by side",
    ],
    shot: <ShotCalendar />,
  },
  {
    title: "Tactics board",
    text: "Draw the session on a real pitch with players, cones, poles, hurdles, balls and runs — then save the drawing straight onto the training block.",
    points: [
      "Full, half or quarter pitch · football, futsal or blank",
      "Cones, poles, hurdles, balls, zones and run arrows",
      "Every drawing is stored with the session it belongs to",
    ],
    shot: <ShotTacticsBoard />,
  },
  {
    title: "GPS import",
    text: "Drop the file in. T4P recognises the provider, matches your players and turns the raw KPIs into training load using your own weights.",
    points: [
      "Catapult, STATSports, GPEXE, Polar or your own template",
      "Automatic player matching with a mapping report",
      "Distance, HSR, sprints, accelerations, decelerations, jumps",
    ],
    shot: <ShotGpsImport />,
  },
];

function Home() {
  return (
    <MarketingPage>
      {/* MOBILE hero — centered text */}
      <section className="border-b border-border sm:hidden">
        <div className="px-5 pb-8 pt-5 text-center">
          <p className="page-eyebrow"><Training4Performance /></p>
          <h1 className="mt-3 font-display text-3xl font-semibold uppercase leading-[1.05] tracking-wide">
            The football performance system for S&amp;C coaches that connects everything
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            <T4P /> is the daily companion for strength &amp; conditioning coaches in football. It brings every player
            record, training session, GPS report, wellness entry, test result and medical note into one connected
            workspace.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold text-primary"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">€999 per season, per team · every module included</p>
        </div>
      </section>

      {/* DESKTOP HERO — clean text */}
      <section className="relative hidden overflow-hidden border-b border-border sm:block">
        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 text-center">

          <div className="mx-auto max-w-4xl">
            <p className="page-eyebrow"><Training4Performance /></p>
            <h1 className="mt-3 font-display text-4xl font-semibold uppercase leading-[1.05] tracking-wide text-foreground lg:text-6xl">
              The football performance system for S&amp;C coaches that connects everything
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base text-muted-foreground lg:text-lg">
              <T4P /> is the daily companion for strength &amp; conditioning coaches in football. It brings every player
              record, training session, GPS report, wellness entry, test result and medical note into one connected
              workspace — so you spend less time switching files and more time coaching.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground"
              >
                Get started <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-primary px-8 text-sm font-semibold text-primary"
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
        <div className="mx-auto max-w-7xl px-5 py-10">
          <p className="eyebrow text-center">Inside the platform</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-2xl font-semibold uppercase tracking-wide">
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

      {/* Screenshot showcase — desktop only */}
      <section className="hidden border-b border-border lg:block">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <p className="eyebrow text-center">See it in action</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-2xl font-semibold uppercase tracking-wide">
            Real screens from the demo team
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
            This is exactly what you get when you open the live demo — squad, week, tactics board and
            GPS, all connected.
          </p>

          <div className="mt-12 space-y-16">
            {showcase.map((item, i) => (
              <div
                key={item.title}
                className="grid items-start gap-10 lg:grid-cols-[1.35fr_1fr]"
              >
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>{item.shot}</div>
                <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
                  <h3 className="font-display text-xl font-semibold uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {item.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground"
            >
              Open the live demo <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="eyebrow text-center">Capabilities</p>
        <h2 className="mt-3 text-center font-display text-2xl font-semibold uppercase tracking-wide">What's inside</h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center bg-background p-5 text-center transition-colors hover:bg-surface-2/60">
              <f.icon className="size-5" style={{ color: f.color }} />
              <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide">{f.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <p className="eyebrow text-center">About <Training4Performance /></p>
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {[
              { icon: Activity, t: "Built by practitioners", d: "Designed by a sports scientist and strength & conditioning coach from real daily club workflow — not a generic dashboard.", color: "#059669" },
              { icon: ShieldCheck, t: "One workspace", d: "Your whole staff works on the same squad, calendar and data — no per-user fees, no separate tiers.", color: "#2563eb" },
              { icon: BarChart3, t: "Your own load model", d: "Choose the KPIs and weights that build training load, and drive ACWR, monotony and strain from your data.", color: "#d97706" },
            ].map((b) => (
              <div key={b.t} className="flex flex-col items-center text-center">
                <b.icon className="size-5" style={{ color: b.color }} />
                <p className="mt-3 font-display text-lg font-semibold uppercase tracking-wide">{b.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
          <Link
            to="/about"
            className="mx-auto mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-foreground hover:underline"
          >
            More about <T4P /> <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10 text-center">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Ready for the season?</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The season runs 1 June to 31 May. One subscription covers your team and your whole staff.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-7 py-3 text-sm font-semibold text-primary"
          >
            View pricing
          </Link>
        </div>
      </section>
    </MarketingPage>
  );
}
