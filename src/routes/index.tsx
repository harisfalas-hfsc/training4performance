import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  LifeBuoy,
  CalendarDays,
  ClipboardPen,
  BookOpen,
  BookMarked,
  HeartPulse,
  Timer,
  Smartphone,
  Radar,
  ShieldCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { BrandCopy, T4P, Training4Performance } from "@/components/brand-text";
import { seoHead, webPageLd, SOFTWARE_ID, TOPIC_ENTITIES } from "@/lib/seo";

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
  {
    icon: Users,
    title: "Squad management",
    text: "Availability, positions, status and player passports in one place.",
    color: "#2563eb",
  },
  {
    icon: CalendarDays,
    title: "Training calendar",
    text: "MD-cycle planning, drills, durations, planned vs actual RPE.",
    color: "#059669",
  },
  {
    icon: ClipboardPen,
    title: "Tactics board",
    text: "Draw sessions on a real pitch: players, equipment, runs and zones.",
    color: "#7c3aed",
  },
  {
    icon: Radar,
    title: "GPS import",
    text: "Catapult, STATSports, GPEXE, Polar or your own template — with mapping reports.",
    color: "#0891b2",
  },
  {
    icon: BookOpen,
    title: "Training monitor logbook",
    text: "Every session row, drill splits, RPE, pivot charts and test batteries.",
    color: "#d97706",
  },
  {
    icon: BookMarked,
    title: "Drills & exercise library",
    text: "Ready-made T4P blocks for strength, power, speed and ESD — plus every block you save.",
    color: "#c026d3",
  },
  {
    icon: HeartPulse,
    title: "Wellness questionnaires",
    text: "Players answer sleep, fatigue, mood, soreness and stress each morning from their phone.",
    color: "#e11d48",
  },
  {
    icon: Timer,
    title: "Fitness testing",
    text: "CMJ, sprints, Yo-Yo, FMS and body composition with personal bests and progression.",
    color: "#0d9488",
  },
  {
    icon: Smartphone,
    title: "Player portal",
    text: "Each player gets a private code to check in and follow his own load and test history.",
    color: "#ea580c",
  },
  {
    icon: BellRing,
    title: "Automated alerts",
    text: "ACWR spikes, load jumps, wellness drops and availability risks.",
    color: "#dc2626",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "Composite load, acute:chronic, monotony, strain and squad benchmarks.",
    color: "#4f46e5",
  },
  {
    icon: LifeBuoy,
    title: "Help when you need it",
    text: "Ask a question from your account and get an answer in the communication centre.",
    color: "#9333ea",
  },
];

function Home() {
  return (
    <MarketingPage>
      {/* MOBILE hero — centered text */}
      <section className="border-b border-border sm:hidden">
        <div className="px-5 pb-8 pt-5 text-center">
          <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
            The football performance system for S&amp;C coaches that connects everything
          </h1>
          <p className="mt-5 text-sm text-muted-foreground">
            <T4P /> is the daily companion for strength &amp; conditioning coaches in football. It
            brings every player record, training session, GPS report, wellness entry, test result
            and medical note into one connected workspace.
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
          <p className="mt-4 text-xs text-muted-foreground">
            €699 per season, per team · cancel any time
          </p>
        </div>
      </section>

      {/* DESKTOP HERO — clean text */}
      <section className="relative hidden overflow-hidden border-b border-border sm:block">
        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-14 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="mx-auto max-w-4xl font-display text-4xl font-semibold leading-tight text-foreground lg:text-5xl">
              The football performance system for S&amp;C coaches that connects everything
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base text-muted-foreground lg:text-lg">
              <T4P /> is the daily companion for strength &amp; conditioning coaches in football. It
              brings every player record, training session, GPS report, wellness entry, test result
              and medical note into one connected workspace — so you spend less time switching files
              and more time coaching.
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
            <p className="mt-4 text-xs text-muted-foreground">
              €699 per season, per team · cancel any time
            </p>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="eyebrow text-center">Capabilities</p>
        <h2 className="mt-3 text-center font-display text-2xl font-semibold uppercase tracking-wide">
          What's inside
        </h2>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center bg-background p-5 text-center transition-colors hover:bg-surface-2/60"
            >
              <f.icon className="size-5" style={{ color: f.color }} />
              <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide">
                {f.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <p className="eyebrow text-center">
            About <Training4Performance />
          </p>
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: Activity,
                t: "Built by practitioners",
                d: "Designed by a sports scientist and strength & conditioning coach from real daily club workflow — not a generic dashboard.",
                color: "#059669",
              },
              {
                icon: ShieldCheck,
                t: "One workspace",
                d: "Your whole staff works on the same squad, calendar and data — no per-user fees, no separate tiers.",
                color: "#2563eb",
              },
              {
                icon: BarChart3,
                t: "Your own load model",
                d: "Choose the KPIs and weights that build training load, and drive ACWR, monotony and strain from your data.",
                color: "#d97706",
              },
            ].map((b) => (
              <div key={b.t} className="flex flex-col items-center text-center">
                <b.icon className="size-5" style={{ color: b.color }} />
                <p className="mt-3 font-display text-lg font-semibold uppercase tracking-wide">
                  {b.t}
                </p>
                <p className="mt-2 text-sm text-muted-foreground"><BrandCopy>{b.d}</BrandCopy></p>
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
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Ready to start?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          €699 per season, cancel any time. One subscription covers your team and your whole staff.
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
