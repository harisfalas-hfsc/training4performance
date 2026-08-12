import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BellRing,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Gauge,
  HeartPulse,
  Radar,
  Sparkles,
  Users,
} from "lucide-react";

import { MarketingPage } from "@/components/marketing";
import { T4P, SmartyAssistant, Training4Performance } from "@/components/brand-text";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    ...seoHead({
      path: "/about",
      title: "About T4P — Football Sports Science Platform for Coaches",
      description:
        "T4P connects squad availability, player passports, session design, GPS import, composite load and ACWR, wellness, testing and reports — built by sports scientist Haris Falas.",
      keywords: [
        "football sports science platform",
        "sports scientist football platform",
        "academy fitness coach software",
        "first team performance staff software",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/about",
        name: "About Training 4 Performance",
        description:
          "What T4P connects for football performance staff and who built it: squad management, training design, GPS analytics, training load, wellness, testing and reporting.",
        type: "AboutPage",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
  }),

  component: About,
});

const questions = [
  {
    icon: Users,
    q: "Who do I have?",
    a: "Live availability for every player: available, partial, individual, rehab, ill or unavailable, plus the full medical and illness history.",
    color: "brand-blue",
  },
  {
    icon: CalendarDays,
    q: "What did we do?",
    a: "Completed sessions, blocks and drills, durations, participation, planned versus actual RPE.",
    color: "brand-green",
  },
  {
    icon: Radar,
    q: "How did they respond?",
    a: "Distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed and an individual training load per player.",
    color: "brand-cyan",
  },
  {
    icon: HeartPulse,
    q: "How do they feel?",
    a: "Daily wellness from the players themselves — sleep, fatigue, soreness, stress, mood and readiness — through their own login.",
    color: "brand-pink",
  },
  {
    icon: BellRing,
    q: "Who needs attention?",
    a: "ACWR spikes, weekly load jumps, wellness drops, exposure gaps and availability risk, in one notification centre.",
    color: "brand-red",
  },
  {
    icon: Activity,
    q: "What do we do tomorrow?",
    a: "Alerts with concrete session adjustments, and a designer where you change the block before the session happens.",
    color: "brand-violet",
  },
  {
    icon: ClipboardList,
    q: "What do I show the coach?",
    a: "One-click PDF, PNG, Excel or CSV reports built from the same connected data.",
    color: "brand-amber",
  },
  {
    icon: Sparkles,
    q: "Can I just ask?",
    a: "Smarty Assistant reads your squad data and answers in plain language — reports, comparisons, workload trends and session ideas.",
    color: "brand-indigo",
  },
];

const includes = [
  { t: "Team and squad", d: "One team per account, unlimited players, full passports with profile, tests, wellness, medical status and player login.", color: "brand-blue" },
  { t: "Training designer", d: "Block-based sessions with drill library, strength prescriptions and an interactive football/futsal tactics board.", color: "brand-green" },
  { t: "Calendar", d: "Match-day-cycle planning (MD-4 to MD+1) with scheduled, pending and completed states, duplication and favourites.", color: "brand-violet" },
  { t: "GPS import", d: "Catapult, STATSports, GPEXE, Polar or your own spreadsheet, mapped column by column, with automatic player creation and session anchoring.", color: "brand-cyan" },
  { t: "Individual load model", d: "You choose the KPIs and weights; every player gets his own load, ACWR, monotony and strain from his own numbers.", color: "brand-amber" },
  { t: "Fitness testing", d: "A battery of 40+ KPIs — CMJ, sprint splits, Yo-Yo, FMS, anthropometrics — with personal bests and squad comparison.", color: "brand-teal" },
  { t: "Wellness and alerts", d: "Daily player questionnaire and automated thresholds on workload, wellness and availability, each with a suggested adjustment.", color: "brand-pink" },
  { t: "Analytics and reports", d: "Player and period comparisons, position-group deviation, configurable report templates and a full workspace export.", color: "brand-indigo" },
  { t: "Sports-science calculators", d: "RAST, beep test, Conconi, heart-rate and speed zones, 1RM and more, ready to use next to your data.", color: "brand-red" },
];

const facts = [
  { k: "€999", v: "per season, per team" },
  { k: "Unlimited", v: "players and staff users" },
  { k: "13", v: "manual chapters, downloadable" },
  { k: "GDPR", v: "European infrastructure" },
];

function About() {
  return (
    <MarketingPage>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-green/12 via-background to-brand-blue/14">
        <div className="absolute -left-24 top-0 size-72 rounded-full bg-brand-cyan/10 blur-3xl" aria-hidden />
        <div className="absolute -right-24 bottom-0 size-72 rounded-full bg-brand-violet/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-5 py-14 text-center">
          <p className="eyebrow text-brand-green">About</p>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide">
            The football performance system that connects everything
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> (<Training4Performance />) is an integrated football fitness, performance and training management
            platform for strength &amp; conditioning coaches, fitness coaches and sports scientists. One player record
            sits at the centre — squad, sessions, GPS, RPE, wellness, testing, medical status, alerts and reports all
            connect to it.
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.k} className="panel border-brand-blue/25 bg-card/80 px-3 py-4">
                <p className="font-display text-xl font-semibold text-brand-blue">{f.k}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{f.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="panel overflow-hidden border-brand-red/35 p-6" style={{ borderLeftWidth: 5 }}>
            <p className="eyebrow text-brand-red">The problem</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every performance department knows it: the information exists, but it lives in separate places.
              Availability in one file, the training plan in another, GPS exports in a third, wellness in a form,
              testing in a spreadsheet and medical status in someone's head. By the time it is all put together, the
              decision has already been made.
            </p>
          </div>
          <div className="panel overflow-hidden border-brand-green/35 p-6" style={{ borderLeftWidth: 5 }}>
            <p className="eyebrow text-brand-green">The answer</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <T4P /> keeps a single source of truth. What the coach sees on the dashboard, what the fitness staff
              analyse in the reports and what is recorded in the player passport are always the same data — so you
              always know who you have, what you did, how they responded, and what to do tomorrow.
            </p>
          </div>
        </div>

        <h2 className="mt-16 font-display text-2xl font-semibold uppercase tracking-wide">The questions it answers</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {questions.map((q) => {
            const Icon = q.icon;
            return (
              <div
                key={q.q}
                className={`panel border-${q.color}/30 p-5 transition-transform hover:-translate-y-0.5`}
              >
                <div className={`grid size-11 place-items-center rounded-2xl bg-${q.color}/12 text-${q.color}`}>
                  <Icon className="size-5" />
                </div>
                <p className="mt-3 font-display text-base font-semibold uppercase tracking-wide">{q.q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{q.a}</p>
              </div>
            );
          })}
        </div>

        <h2 className="mt-16 font-display text-2xl font-semibold uppercase tracking-wide">What it includes</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {includes.map((i, idx) => (
            <div key={i.t} className={`panel border-${i.color}/30 p-5`}>
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg bg-${i.color}/12 font-display text-xs font-bold text-${i.color}`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">{i.t}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>

        <div className="panel mt-16 border-brand-amber/35 bg-gradient-to-br from-brand-amber/10 via-background to-brand-cyan/10 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-amber/15 text-brand-amber">
              <Gauge className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-brand-amber">Individual training load</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Most GPS exports contain no training-load column. <T4P /> builds one for every player individually from
                his own session values, using the KPIs and weights you choose — distance, high-speed running, sprints,
                accelerations, decelerations, jumps or any club KPI in your own file. Each metric is only divided by a
                fixed team reference so metres, counts and joules can be combined into a single number: 100 AU is an
                average session for an average player of your squad. That individual load then drives ACWR, monotony
                and strain, per player.
              </p>
            </div>
          </div>
        </div>

        <div className="panel mt-6 border-brand-blue/30 bg-gradient-to-r from-brand-blue/10 to-brand-violet/10 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-blue/15 text-brand-blue">
              <Sparkles className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-brand-blue"><SmartyAssistant /></p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                <SmartyAssistant /> is the AI analyst inside <T4P />. It reads your squad, sessions, GPS and wellness
                data and answers questions like "Who ran the most this week?", "Compare player A and player B", or
                "Give me a workload report". It can suggest session adjustments, explain trends and learn your
                terminology over time.
              </p>
            </div>
          </div>
        </div>

        <div className="panel mt-6 border-brand-teal/30 bg-gradient-to-r from-brand-teal/10 to-brand-green/10 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-teal/15 text-brand-teal">
              <BookOpen className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-brand-teal">Learn it in an hour</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                A complete, colour-coded user manual lives inside the platform: numbered chapters for every workflow,
                a search box, troubleshooting for the problems coaches actually hit, and a one-click PDF download of
                the whole document exactly as it appears on screen.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to="/how-it-works" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                  See how it works
                </Link>
                <Link to="/pricing" className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold">
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mt-16 border-brand-indigo/35 bg-gradient-to-r from-brand-indigo/12 to-brand-pink/12 p-6">
          <p className="eyebrow text-brand-indigo">Who created it</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> was created by <strong className="text-foreground">Haris Falas</strong> — sports scientist, fitness
            coach and strength &amp; conditioning coach — from more than a decade of daily work inside professional
            football clubs. Every table, metric and workflow in <T4P /> comes from a real logbook that was used with a
            real squad, not from a product specification.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/haris-falas"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              Read the full profile
            </Link>
            <Link to="/auth" search={{ mode: "signup" }} className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold">
              Create your account
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
