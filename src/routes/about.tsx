import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  Gauge,
  HeartPulse,
  PencilLine,
  Radar,
  Compass,
  Satellite,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { MarketingPage } from "@/components/marketing";
import { BrandCopy, T4P, Training4Performance } from "@/components/brand-text";
import { FederationTrustBlock } from "@/components/federation-trust";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    ...seoHead({
      path: "/about",
      title: "About T4P — Football Sports Science Platform for Coaches",
      description:
        "T4P connects squad availability, player passports, session design, GPS import, composite load and ACWR, wellness, testing and reports — and works fully manually for coaches with no GPS system. Built by sports scientist Haris Falas.",
      keywords: [
        "football sports science platform",
        "training load without GPS",
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

const tone: Record<string, { card: string; chip: string; text: string }> = {
  blue: {
    card: "border-brand-blue/30",
    chip: "bg-brand-blue/12 text-brand-blue",
    text: "text-brand-blue",
  },
  green: {
    card: "border-brand-green/30",
    chip: "bg-brand-green/12 text-brand-green",
    text: "text-brand-green",
  },
  cyan: {
    card: "border-brand-cyan/30",
    chip: "bg-brand-cyan/12 text-brand-cyan",
    text: "text-brand-cyan",
  },
  pink: {
    card: "border-brand-pink/30",
    chip: "bg-brand-pink/12 text-brand-pink",
    text: "text-brand-pink",
  },
  red: {
    card: "border-brand-red/30",
    chip: "bg-brand-red/12 text-brand-red",
    text: "text-brand-red",
  },
  violet: {
    card: "border-brand-violet/30",
    chip: "bg-brand-violet/12 text-brand-violet",
    text: "text-brand-violet",
  },
  amber: {
    card: "border-brand-amber/30",
    chip: "bg-brand-amber/12 text-brand-amber",
    text: "text-brand-amber",
  },
  indigo: {
    card: "border-brand-indigo/30",
    chip: "bg-brand-indigo/12 text-brand-indigo",
    text: "text-brand-indigo",
  },
  teal: {
    card: "border-brand-teal/30",
    chip: "bg-brand-teal/12 text-brand-teal",
    text: "text-brand-teal",
  },
};

const questions = [
  {
    icon: Users,
    q: "Who do I have?",
    a: "Live availability for every player: available, partial, individual, rehab, ill or unavailable, plus the full medical and illness history.",
    color: "blue",
  },
  {
    icon: CalendarDays,
    q: "What did we do?",
    a: "Completed sessions, blocks and drills, durations, participation, planned versus actual RPE.",
    color: "green",
  },
  {
    icon: Radar,
    q: "How did they respond?",
    a: "Distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed and an individual training load per player.",
    color: "cyan",
  },
  {
    icon: HeartPulse,
    q: "How do they feel?",
    a: "Daily wellness from the players themselves — sleep, fatigue, soreness, stress, mood and readiness — through their own login.",
    color: "pink",
  },
  {
    icon: BellRing,
    q: "Who needs attention?",
    a: "ACWR spikes, weekly load jumps, wellness drops, exposure gaps and availability risk, in one notification centre.",
    color: "red",
  },
  {
    icon: Activity,
    q: "What do we do tomorrow?",
    a: "Alerts with concrete session adjustments, and a designer where you change the block before the session happens.",
    color: "violet",
  },
  {
    icon: ClipboardList,
    q: "What do I show the coach?",
    a: "One-click PDF, PNG, Excel or CSV reports built from the same connected data.",
    color: "amber",
  },
  {
    icon: Sparkles,
    q: "What if I get stuck?",
    a: "Ask from your account and the answer arrives in your communication centre — usually straight away.",
    color: "indigo",
  },
];

const includes = [
  {
    t: "Team and squad",
    d: "One team per account, unlimited players, full passports with profile, tests, wellness, medical status and player login.",
    color: "blue",
  },
  {
    t: "Training designer",
    d: "Block-based sessions with drill library, strength prescriptions and an interactive football/futsal tactics board.",
    color: "green",
  },
  {
    t: "Calendar",
    d: "Match-day-cycle planning (MD-4 to MD+1) with scheduled, pending and completed states, duplication and favourites.",
    color: "violet",
  },
  {
    t: "GPS import",
    d: "Catapult, STATSports, GPEXE, Polar or your own spreadsheet, mapped column by column, with automatic player creation and session anchoring.",
    color: "cyan",
  },
  {
    t: "Individual load model",
    d: "You choose the KPIs and weights; every player gets his own load, ACWR, monotony and strain from his own numbers.",
    color: "amber",
  },
  {
    t: "Fitness testing",
    d: "A battery of 40+ KPIs — CMJ, sprint splits, Yo-Yo, FMS, anthropometrics — with personal bests and squad comparison.",
    color: "teal",
  },
  {
    t: "Wellness and alerts",
    d: "Daily player questionnaire and automated thresholds on workload, wellness and availability, each with a suggested adjustment.",
    color: "pink",
  },
  {
    t: "Analytics and reports",
    d: "Player and period comparisons, position-group deviation, configurable report templates and a full workspace export.",
    color: "indigo",
  },
  {
    t: "Sports-science calculators",
    d: "RAST, beep test, Conconi, heart-rate and speed zones, 1RM and more, ready to use next to your data.",
    color: "red",
  },
];

const facts = [
  { k: "€699", v: "per season, per team" },
  { k: "Unlimited", v: "players and staff users" },
  { k: "No GPS?", v: "the full system still works" },
  { k: "GDPR", v: "European infrastructure" },
];

/** The two equally complete ways of feeding the platform. */
const routes = [
  {
    icon: PencilLine,
    color: "green",
    eyebrow: "Without a GPS system",
    title: "Pen, stopwatch and RPE — nothing else",
    body: "You do not need a single GPS unit to run the whole platform. Record the session and its blocks, the duration and a 0–10 RPE after training, and T4P turns it into session load exactly as Foster describes it: RPE × minutes. Strength work, indoor sessions, pool, rehab and gym are all counted the same way.",
    points: [
      "Session or block RPE for the whole squad in one screen, or athlete by athlete",
      "Load, acute vs chronic, ACWR, monotony and strain calculated from it",
      "Wellness, availability, testing, alerts and every report work identically",
      "Same PDF, PNG, Excel and CSV exports for the head coach",
    ],
  },
  {
    icon: Satellite,
    color: "cyan",
    eyebrow: "With a GPS system",
    title: "Your export, your KPIs, your formula",
    body: "If you do have GPS, the same structure simply gets more resolution. Import from Catapult, STATSports, GPEXE, Polar or your own spreadsheet, and T4P builds an individual training load from the KPIs and weights you choose — even when the file has no load column at all.",
    points: [
      "Distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed",
      "Your own club KPIs recognised from your own file",
      "Individual load per player, not a squad average",
      "GPS days and manually rated days add up into one true daily load",
    ],
  },
];

/** Why the coach's working week changes. */
const benefits = [
  {
    icon: Clock,
    color: "blue",
    t: "Your evening back",
    d: "No more copying rows between four spreadsheets after training. Import once, or type the RPE once, and every chart, table and report is already updated.",
  },
  {
    icon: ShieldCheck,
    color: "green",
    t: "Fewer avoidable injuries",
    d: "Spikes in load, low wellness, exposure gaps and availability risk are flagged the moment they appear — with a concrete suggestion for tomorrow's session, not just a red number.",
  },
  {
    icon: ClipboardList,
    color: "amber",
    t: "Credibility with the head coach",
    d: "Walk into the meeting with a clean one-page report built from real data. Every recommendation you make can be shown on a chart in five seconds.",
  },
  {
    icon: Users,
    color: "pink",
    t: "The players on your side",
    d: "Each player has his own login, fills in his wellness in thirty seconds and sees his own progress. Buy-in comes from letting them see the numbers, not from asking them to fill in a form.",
  },
  {
    icon: Gauge,
    color: "violet",
    t: "Your own methodology, not ours",
    d: "You decide which KPIs define load and how much each one weighs. T4P does the arithmetic; the sports science stays yours.",
  },
  {
    icon: BookOpen,
    color: "teal",
    t: "A season that is written down",
    d: "Every session, test, injury and export stays in one place. At the end of the season you have a complete record — and a starting point for the next one.",
  },
];

/** A realistic week, so the coach can picture himself using it. */
const week = [
  {
    d: "Sunday night",
    t: "Plan the microcycle",
    b: "Lay MD-4 to MD+1 on the calendar and duplicate the blocks that worked last week.",
  },
  {
    d: "Before training",
    t: "Check who you have",
    b: "Availability, wellness responses and the alerts that came in overnight — one screen, thirty seconds.",
  },
  {
    d: "After training",
    t: "Record what happened",
    b: "Import the GPS file, or rate the session 0–10 and enter the minutes. Both end in the same training load.",
  },
  {
    d: "Midweek",
    t: "Read the response",
    b: "ACWR, monotony and strain per player, plus who is drifting away from his position group.",
  },
  {
    d: "Match week",
    t: "Report and decide",
    b: "Export the PDF for the head coach and adjust tomorrow's block before it is delivered, not after.",
  },
];

function About() {
  return (
    <MarketingPage>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-green/12 via-background to-brand-blue/14">
        <div className="relative mx-auto max-w-5xl px-5 py-14 text-center">
          <p className="page-eyebrow">About</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">
            The football performance system that connects everything
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-relaxed text-foreground">
            Built by a real football S&amp;C coach,{" "}
            <Link
              to="/haris-falas"
              className="text-brand-blue underline decoration-brand-blue/40 underline-offset-4 transition-colors hover:text-brand-blue/80"
            >
              Haris Falas
            </Link>
            , for football S&amp;C coaches.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> (<Training4Performance />) is an integrated football fitness, performance and
            training management platform for strength &amp; conditioning coaches, fitness coaches
            and sports scientists. One player record sits at the centre — squad, sessions, GPS, RPE,
            wellness, testing, medical status, alerts and reports all connect to it.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="panel overflow-hidden border-brand-red/35 p-6"
            style={{ borderLeftWidth: 5 }}
          >
            <p className="eyebrow text-brand-red">The problem</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Every performance department knows it: the information exists, but it lives in
              separate places. Availability in one file, the training plan in another, GPS exports
              in a third, wellness in a form, testing in a spreadsheet and medical status in
              someone's head. By the time it is all put together, the decision has already been
              made.
            </p>
          </div>
          <div
            className="panel overflow-hidden border-brand-green/35 p-6"
            style={{ borderLeftWidth: 5 }}
          >
            <p className="eyebrow text-brand-green">The answer</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <T4P /> keeps a single source of truth. What the coach sees on the dashboard, what the
              fitness staff analyse in the reports and what is recorded in the player passport are
              always the same data — so you always know who you have, what you did, how they
              responded, and what to do tomorrow.
            </p>
          </div>
        </div>

        <h2 className="mt-16 font-display text-2xl font-semibold uppercase tracking-wide">
          The questions it answers
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {questions.map((q) => {
            const Icon = q.icon;
            return (
              <div
                key={q.q}
                className={`panel ${tone[q.color]!.card} p-5 transition-transform hover:-translate-y-0.5`}
              >
                <div
                  className={`grid size-11 place-items-center rounded-2xl ${tone[q.color]!.chip}`}
                >
                  <Icon className="size-5" />
                </div>
                <p className="mt-3 font-display text-base font-semibold uppercase tracking-wide">
                  {q.q}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground"><BrandCopy>{q.a}</BrandCopy></p>
              </div>
            );
          })}
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Two ways to work — both complete
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            A GPS system is a luxury, not a requirement. <T4P /> was built so that a coach with
            nothing but a stopwatch and his players' feedback gets the same monitoring, the same
            graphs and the same reports as a department with twenty vests. Only the resolution of
            the data changes — never the workflow.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {routes.map((r) => {
              const Icon = r.icon;
              const t = tone[r.color]!;
              return (
                <div
                  key={r.eyebrow}
                  className={`panel ${t.card} p-6`}
                  style={{ borderTopWidth: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-2xl ${t.chip}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className={`eyebrow ${t.text}`}>{r.eyebrow}</p>
                      <p className="font-display text-base font-semibold uppercase tracking-wide">
                        {r.title}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><BrandCopy>{r.body}</BrandCopy></p>
                  <ul className="mt-4 space-y-2">
                    {r.points.map((p) => (
                      <li
                        key={p}
                        className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                      >
                        <Check className={`mt-0.5 size-4 shrink-0 ${t.text}`} aria-hidden />
                        <span><BrandCopy>{p}</BrandCopy></span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">And you can mix the two on the same day.</strong> If
            the pitch session was tracked but the gym block was not, rate the gym block manually —{" "}
            <T4P /> adds GPS load and manual load into one daily total per player, and never counts
            the same block twice.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Start in any order — the platform fills itself in
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            There is no long setup and no data-entry weekend. There is one team, and two equally
            correct ways to begin. Whichever you choose, you never type the same name twice.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="panel border-brand-blue/30 p-6" style={{ borderTopWidth: 4 }}>
              <p className="eyebrow text-brand-blue">Option A</p>
              <p className="font-display text-base font-semibold uppercase tracking-wide">
                Add the players first
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Enter the squad once — a name is enough to start. Position, shirt number, birth
                date, height, weight and availability can be filled in later, whenever you actually
                need them. Every GPS file you upload afterwards is matched to those players
                automatically.
              </p>
            </div>
            <div className="panel border-brand-cyan/30 p-6" style={{ borderTopWidth: 4 }}>
              <p className="eyebrow text-brand-cyan">Option B</p>
              <p className="font-display text-base font-semibold uppercase tracking-wide">
                Upload the GPS file first
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Drop in your export before the squad exists. <T4P /> reads the names, shows you
                exactly who is missing, and creates the whole squad in one click. The session, the
                KPIs and the load are saved in the same step — the squad is a by-product of the work
                you already did.
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">
              And whatever the GPS cannot give you, you add by hand — freely.
            </strong>{" "}
            A GPS unit does not know how hard the gym block felt, what the player weighs, when he
            was injured or how he slept. So RPE, body composition, tests, wellness, medical status
            and any club metric can be entered manually at any moment, for one player or for the
            whole squad. Teams with no GPS at all simply use that route for everything — and get the
            identical load, ACWR, alerts, charts and reports.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            One way of asking questions — everywhere
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            There is no menu to learn. Every analysis screen in <T4P /> — and every player record —
            asks you the same two questions in the same order, then draws the answer.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Who",
                d: "The whole team, the squad average, one player or several — from a searchable picker, never a wall of fifty buttons.",
                c: "blue",
              },
              {
                n: "02",
                t: "What",
                d: "GPS reports · Training & drills · Fitness tests · Wellness · Medical & availability. Every data family the platform holds.",
                c: "cyan",
              },
              {
                n: "03",
                t: "How to see it",
                d: "The KPIs you care about, the dates you choose, and line, bar, area, pie or radar. Exported as PNG, PDF, Excel or CSV.",
                c: "violet",
              },
            ].map((x) => (
              <div key={x.n} className={`panel ${tone[x.c]!.card} p-5`}>
                <span
                  className={`grid size-9 place-items-center rounded-xl ${tone[x.c]!.chip} font-display text-xs font-bold`}
                >
                  {x.n}
                </span>
                <p className="mt-3 font-display text-base font-semibold uppercase tracking-wide">
                  {x.t}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
          <div className="panel mt-4 border-brand-teal/30 bg-gradient-to-r from-brand-teal/8 to-brand-blue/8 p-5">
            <div className="flex flex-wrap items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-teal/15 text-brand-teal">
                <Compass className="size-5" />
              </span>
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
                Because drills are tagged, the same two questions answer things a spreadsheet never
                could: how many times did we run{" "}
                <strong className="text-foreground">Rondo 5v2</strong> this season, for how many
                minutes, which players were exposed to it, and how does it compare with the passing
                drill — or how many strength sessions this one player actually attended.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Less typing. More coaching.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The reason this platform exists is simple: a strength &amp; conditioning coach should
            spend his day on the performance of the players, not on writing, organising and
            re-typing. Everything below stops on the day you start.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "No re-typing names",
                "The squad is created from your GPS file, or entered once. Every screen reuses the same player record.",
              ],
              [
                "No four spreadsheets",
                "Availability, plan, GPS, RPE, wellness, tests and medical live in one connected record.",
              ],
              [
                "No manual formulas",
                "Load, acute, chronic, ACWR, monotony and strain are computed per player the moment data arrives.",
              ],
              [
                "No morning scanning",
                "Thresholds watch workload, wellness and availability and name the players who need attention.",
              ],
              [
                "No report night",
                "Pick the template and the dates, press export: PDF, PNG, Excel or CSV, ready for the head coach.",
              ],
              [
                "No lost history",
                "Every session, file, rating, test and injury stays in one place for the whole season.",
              ],
            ].map(([t, d]) => (
              <div key={t} className="panel border-brand-green/25 p-5">
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-green">
                  {t}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            Why a fitness coach needs it
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Not because it produces more numbers. Because it gives you back the two things the job
            never leaves you: time, and the confidence to defend a decision.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => {
              const Icon = b.icon;
              const t = tone[b.color]!;
              return (
                <div
                  key={b.t}
                  className={`panel ${t.card} p-5 transition-transform hover:-translate-y-0.5`}
                >
                  <div className={`grid size-11 place-items-center rounded-2xl ${t.chip}`}>
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-3 font-display text-base font-semibold uppercase tracking-wide">
                    {b.t}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground"><BrandCopy>{b.d}</BrandCopy></p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            A week inside the platform
          </h2>
          <ol className="mt-6 space-y-3 border-l-2 border-brand-blue/25 pl-5">
            {week.map((w) => (
              <li key={w.d} className="relative">
                <span
                  className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-background bg-brand-blue"
                  aria-hidden
                />
                <p className="eyebrow text-brand-blue">{w.d}</p>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">{w.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{w.b}</p>
              </li>
            ))}
          </ol>
        </section>

        <h2 className="mt-16 font-display text-2xl font-semibold uppercase tracking-wide">
          What it includes
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {includes.map((i, idx) => (
            <div key={i.t} className={`panel ${tone[i.color]!.card} p-5`}>
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone[i.color]!.chip} font-display text-xs font-bold`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">{i.t}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
            </div>
          ))}
        </div>

        <FederationTrustBlock className="mt-10" />

        <div className="panel mt-16 border-brand-amber/35 bg-gradient-to-br from-brand-amber/10 via-background to-brand-cyan/10 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-amber/15 text-brand-amber">
              <Gauge className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-brand-amber">Individual training load</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Most GPS exports contain no training-load column. <T4P /> builds one for every
                player individually from his own session values, using the KPIs and weights you
                choose — distance, high-speed running, sprints, accelerations, decelerations, jumps
                or any club KPI in your own file. Each metric is only divided by a fixed team
                reference so metres, counts and joules can be combined into a single number: 100 AU
                is an average session for an average player of your squad. That individual load then
                drives ACWR, monotony and strain, per player.
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
                A complete, colour-coded user manual lives inside the platform: numbered chapters
                for every workflow, a search box, troubleshooting for the problems coaches actually
                hit, and a one-click PDF download of the whole document exactly as it appears on
                screen.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/how-it-works"
                  className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  See how it works
                </Link>
                <Link
                  to="/pricing"
                  className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
                >
                  View pricing
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mt-16 border-brand-indigo/35 bg-gradient-to-r from-brand-indigo/12 to-brand-pink/12 p-6">
          <p className="eyebrow text-brand-indigo">Who created it</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> was created by <strong className="text-foreground">Haris Falas</strong> — sports
            scientist, fitness coach and strength &amp; conditioning coach — from more than a decade
            of daily work inside professional football clubs. Every table, metric and workflow in{" "}
            <T4P /> comes from a real logbook that was used with a real squad, not from a product
            specification.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/haris-falas"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              Read the full profile
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              Create your account
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
