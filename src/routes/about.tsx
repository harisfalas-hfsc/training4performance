import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BellRing, CalendarDays, ClipboardList, Radar, Sparkles, Users } from "lucide-react";

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
    a: "Live availability for every player: available, partial, individual, rehab, ill or unavailable.",
    chip: "bg-brand-blue/12 text-brand-blue",
    card: "border-brand-blue/25",
  },
  {
    icon: CalendarDays,
    q: "What did we do?",
    a: "Completed sessions, blocks and drills, durations, planned versus actual RPE.",
    chip: "bg-brand-green/12 text-brand-green",
    card: "border-brand-green/25",
  },
  {
    icon: Radar,
    q: "How did they respond?",
    a: "Distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed, composite load.",
    chip: "bg-brand-cyan/12 text-brand-cyan",
    card: "border-brand-cyan/25",
  },
  {
    icon: BellRing,
    q: "Who needs attention?",
    a: "ACWR spikes, weekly load jumps, wellness drops, exposure gaps and availability risk.",
    chip: "bg-brand-red/12 text-brand-red",
    card: "border-brand-red/25",
  },
  {
    icon: Activity,
    q: "What do we do tomorrow?",
    a: "Alerts with concrete session adjustments and AI-supported observations.",
    chip: "bg-brand-violet/12 text-brand-violet",
    card: "border-brand-violet/25",
  },
  {
    icon: ClipboardList,
    q: "What do I show the coach?",
    a: "One-click PDF, PNG, Excel or CSV reports built from the same connected data.",
    chip: "bg-brand-amber/12 text-brand-amber",
    card: "border-brand-amber/25",
  },
  {
    icon: Sparkles,
    q: "Can I just ask?",
    a: "Smarty Assistant reads your squad data and answers in plain language — reports, comparisons, workload trends and session ideas.",
    chip: "bg-brand-blue/12 text-brand-blue",
    card: "border-brand-blue/25",
  },
];


const includes = [
  { t: "Team and squad", d: "One team per account, unlimited players, full passports with profile, tests and medical status.", tone: "border-brand-blue/25", dot: "bg-brand-blue" },
  { t: "Training designer", d: "Block-based sessions with drill library, strength prescriptions and an interactive tactics board.", tone: "border-brand-green/25", dot: "bg-brand-green" },
  { t: "Calendar", d: "Match-day-cycle planning (MD-4 to MD+1) with scheduled, pending and completed states.", tone: "border-brand-violet/25", dot: "bg-brand-violet" },
  { t: "GPS import", d: "Catapult, STATSports, GPEXE, Polar or your own spreadsheet, mapped column by column with a name-matching report.", tone: "border-brand-cyan/25", dot: "bg-brand-cyan" },
  { t: "Load model", d: "You choose the KPIs and weights behind composite load, ACWR, monotony and strain.", tone: "border-brand-amber/25", dot: "bg-brand-amber" },
  { t: "Logbook and analytics", d: "Every player-session row, pivot charts, comparisons and the full test battery.", tone: "border-brand-indigo/25", dot: "bg-brand-indigo" },
  { t: "Alerts", d: "Automated thresholds on workload, wellness and availability, each with a suggested adjustment.", tone: "border-brand-red/25", dot: "bg-brand-red" },
  { t: "Reports and export", d: "Configurable templates plus a full workspace download in Excel or ZIP — your data stays yours.", tone: "border-brand-teal/25", dot: "bg-brand-teal" },
  { t: "Smarty Assistant", d: "Ask questions in plain language, get instant reports and comparisons, and let the AI learn your coaching vocabulary.", tone: "border-brand-blue/25", dot: "bg-brand-blue" },
];


function About() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-green/8 via-background to-brand-blue/10">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <p className="eyebrow text-brand-green">About</p>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide">
            The football performance system that connects everything
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> (<Training4Performance />) is an integrated football fitness, performance and training management
            platform for strength &amp; conditioning coaches. One player record sits at the centre, and the squad,
            training sessions, GPS output, RPE, wellness, testing, medical status, alerts and reports all connect to it.
          </p>
        </div>
      </section>


      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="panel border-brand-red/25 p-6">
            <p className="eyebrow text-brand-red">The problem</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every performance department knows it: the information exists, but it lives in separate places.
              Availability in one file, the training plan in another, GPS exports in a third, wellness in a form,
              testing in a spreadsheet and medical status in someone's head. By the time it is all put together, the
              decision has already been made.
            </p>
          </div>
          <div className="panel border-brand-green/25 p-6">
            <p className="eyebrow text-brand-green">The answer</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <T4P /> keeps a single source of truth. What the coach sees on the dashboard, what the fitness staff analyse
              in the logbook and what is recorded in the player passport are always the same data — so you always know
              who you have, what you did, how they responded, and what to do tomorrow.
            </p>
          </div>
        </div>

        <h2 className="mt-14 font-display text-2xl font-semibold uppercase tracking-wide">The questions it answers</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {questions.map((q) => {
            const Icon = q.icon;
            return (
              <div key={q.q} className={`panel ${q.card} p-5`}>
                <div className={`grid size-10 place-items-center rounded-xl ${q.chip}`}>
                  <Icon className="size-5" />
                </div>
                <p className="mt-3 font-display text-base font-semibold uppercase tracking-wide">{q.q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{q.a}</p>
              </div>
            );
          })}
        </div>

        <h2 className="mt-14 font-display text-2xl font-semibold uppercase tracking-wide">What it includes</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {includes.map((i) => (
            <div key={i.t} className={`panel ${i.tone} flex gap-3 p-4`}>
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${i.dot}`} />
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">{i.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="panel mt-14 border-brand-blue/25 p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-brand-blue/12 text-brand-blue">
              <Sparkles className="size-5" />
            </div>
            <p className="eyebrow text-brand-blue"><SmartyAssistant /></p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <SmartyAssistant /> is the AI analyst inside <T4P />. It reads your squad, sessions, GPS and wellness data and
            answers questions like "Who ran the most this week?", "Compare player A and player B", or "Give me a
            workload report". It can suggest session adjustments, explain trends and learn your terminology over time.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/how-it-works" className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground">
              See how it works
            </Link>
            <Link to="/pricing" className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold">
              View pricing
            </Link>
          </div>
        </div>

        <div className="panel mt-14 border-brand-indigo/30 bg-gradient-to-r from-brand-indigo/10 to-brand-pink/10 p-6">
          <p className="eyebrow text-brand-indigo">Who created it</p>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <T4P /> was created by <strong className="text-foreground">Haris Falas</strong> — sports scientist, fitness
            coach and strength &amp; conditioning coach — from more than a decade of daily work inside professional
            football clubs. Every table, metric and workflow in <T4P /> comes from a real logbook that was used with a real
            squad, not from a product specification.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/haris-falas"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              Read the full profile
            </Link>
            <Link to="/how-it-works" className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold">
              See how it works
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
