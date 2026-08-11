import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarDays,
  ClipboardPen,
  Dumbbell,
  FileSpreadsheet,
  HeartPulse,
  Radar,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { MarketingPage } from "@/components/marketing";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How T4P Works — Training 4 Performance" },
      {
        name: "description",
        content:
          "The real T4P flow: create your team, build the squad, complete each player profile, run fitness tests, design training in blocks, schedule it in the calendar, import GPS, and read load, ACWR, alerts and reports.",
      },
      { property: "og:title", content: "How T4P Works" },
      {
        property: "og:description",
        content: "Team → squad → player profiles → tests → training design → calendar → GPS → load, alerts and reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

type Step = { icon: LucideIcon; t: string; d: string; tone: string };

const steps: Step[] = [
  {
    icon: Shield,
    tone: "blue",
    t: "Create your team",
    d: "Start by creating the team: club name, season, category and crest. One account holds one team, and everything you build from here lives inside it — your data, nobody else's.",
  },
  {
    icon: Users,
    tone: "green",
    t: "Build the squad",
    d: "Add your players. At the beginning a name is enough — the squad is unlimited, and you can add, edit or remove players at any time as the season moves.",
  },
  {
    icon: ClipboardPen,
    tone: "violet",
    t: "Complete each player profile",
    d: "Open a player and fill the passport: position, birth date, dominant leg, height, body mass, body fat, availability status and medical notes. Every screen in T4P reads from this single record.",
  },
  {
    icon: HeartPulse,
    tone: "pink",
    t: "Record the fitness tests",
    d: "Enter your testing battery — CMJ and jumps, sprint splits, Yo-Yo and aerobic tests, strength numbers, FMS and mobility. Results are stored per date, so progress and personal bests are tracked automatically.",
  },
  {
    icon: Dumbbell,
    tone: "amber",
    t: "Design the training session",
    d: "Build the day in blocks — warm-up, activation, strength, technical, tactical, conditioning, speed & power, small-sided games, set pieces, cool-down. Each part has its own minutes, RPE, location and purpose, and you can pull drills from the library, write them manually, or sketch them on the tactics board.",
  },
  {
    icon: CalendarDays,
    tone: "indigo",
    t: "Schedule it in the calendar",
    d: "Assign the session to a date in the match-day cycle and set its state: scheduled, pending or completed. Duplicate a good session onto another day, mark favourites and record who took part.",
  },
  {
    icon: Radar,
    tone: "cyan",
    t: "Import the GPS report",
    d: "After training, upload the export from your GPS system — Catapult, STATSports, GPEXE, Polar or your own spreadsheet. You map your columns to T4P metrics once, unmatched player names come back in a clear report, and every file is attached to a training day, never left standalone.",
  },
  {
    icon: Activity,
    tone: "teal",
    t: "Everything connects",
    d: "RPE, duration, participation, GPS output and test results merge on the same player record. You choose which KPIs define load — distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed, sRPE — and their weights, and T4P builds your own composite load, acute, chronic, ACWR, monotony and strain.",
  },
  {
    icon: Sparkles,
    tone: "blue",
    t: "Ask Smarty Assistant",
    d: "Click the floating T4P logo or open the Smarty Assistant page. Ask anything — Who ran the most this week?, Compare two players, Give me a workload report — and get answers, tables and charts from your own data.",
  },

  {
    icon: BellRing,
    tone: "red",
    t: "Read the alerts",
    d: "Thresholds run automatically on ACWR spikes, weekly load jumps, wellness drops, exposure gaps and availability risk. Each alert names the player, the reason and a concrete suggestion for tomorrow.",
  },

  {
    icon: BarChart3,
    tone: "blue",
    t: "Analyse in the logbook",
    d: "The logbook holds every player-session row. Pivot any KPI by player, position, date, activity type, MD cycle or drill, aggregate by sum, average, max or count, and chart it the way you want to see it.",
  },
  {
    icon: FileSpreadsheet,
    tone: "green",
    t: "Report and export",
    d: "Build report templates per audience — head coach weekly, load block, return-to-play, club management — and export in one click as PDF, PNG, Excel or CSV. Your whole workspace can also be downloaded as Excel files or a full ZIP backup, any time.",
  },
];

const tones: Record<string, { chip: string; card: string; num: string }> = {
  blue: { chip: "bg-brand-blue/12 text-brand-blue", card: "border-brand-blue/25", num: "text-brand-blue" },
  green: { chip: "bg-brand-green/12 text-brand-green", card: "border-brand-green/25", num: "text-brand-green" },
  violet: { chip: "bg-brand-violet/12 text-brand-violet", card: "border-brand-violet/25", num: "text-brand-violet" },
  pink: { chip: "bg-brand-pink/12 text-brand-pink", card: "border-brand-pink/25", num: "text-brand-pink" },
  amber: { chip: "bg-brand-amber/12 text-brand-amber", card: "border-brand-amber/25", num: "text-brand-amber" },
  indigo: { chip: "bg-brand-indigo/12 text-brand-indigo", card: "border-brand-indigo/25", num: "text-brand-indigo" },
  cyan: { chip: "bg-brand-cyan/12 text-brand-cyan", card: "border-brand-cyan/25", num: "text-brand-cyan" },
  teal: { chip: "bg-brand-teal/12 text-brand-teal", card: "border-brand-teal/25", num: "text-brand-teal" },
  red: { chip: "bg-brand-red/12 text-brand-red", card: "border-brand-red/25", num: "text-brand-red" },
};

const faq = [
  {
    q: "What does the subscription cost and what does it cover?",
    a: "€999 per season for one team. The season runs 1 June to 31 May, every module is included and there is no per-user fee.",
  },
  {
    q: "Do I need a GPS system to use T4P?",
    a: "No. RPE, duration, participation, wellness and test data alone already produce load, ACWR, monotony and strain. GPS simply adds resolution.",
  },
  {
    q: "Which GPS providers are supported?",
    a: "Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system can be mapped column by column with the T4P template — including your own club KPIs.",
  },
  {
    q: "Can I change the ACWR formula?",
    a: "Yes. You pick the KPIs and their weights, so the composite load — and therefore ACWR — reflects your own methodology rather than a fixed formula.",
  },
  {
    q: "Can I edit or delete data after saving?",
    a: "Yes. Players, training days, plan parts, GPS rows, RPE values and test results can all be edited or removed, and you can wipe or delete the team and start again.",
  },
  {
    q: "Can I browse before I subscribe?",
    a: "Yes. Any account can open the platform and look at every screen. Creating and editing data requires an active subscription.",
  },
  {
    q: "Is my data protected?",
    a: "Each account is fully isolated — you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
  },
];

function HowItWorks() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-green/8">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <p className="eyebrow text-brand-blue">How it works</p>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide">
            Team → squad → players → training → GPS → decisions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            T4P follows the real order of work in a performance department. You build the team once, then every
            session, GPS file and test result attaches to the same player record — so the analysis is ready before
            you have to make the decision.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <ol className="space-y-4">
          {steps.map((s, i) => {
            const tone = tones[s.tone]!;
            const Icon = s.icon;
            return (
              <li key={s.t} className={`panel ${tone.card} flex gap-4 p-5`}>
                <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone.chip}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-baseline gap-2">
                    <span className={`font-display text-sm font-semibold ${tone.num}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-lg font-semibold uppercase tracking-wide">{s.t}</span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <h2 className="mt-14 font-display text-2xl font-semibold uppercase tracking-wide">Questions</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {faq.map((f, i) => {
            const tone = Object.values(tones)[i % 9]!;
            return (
              <div key={f.q} className={`panel ${tone.card} p-5`}>
                <p className={`font-display text-base font-semibold uppercase tracking-wide ${tone.num}`}>{f.q}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            );
          })}
        </div>

        <div className="panel mt-12 border-brand-indigo/30 bg-gradient-to-r from-brand-indigo/10 to-brand-cyan/10 p-6 text-center">
          <p className="font-display text-xl font-semibold uppercase tracking-wide">Ready to set up your team?</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account, browse everything, and subscribe when you want to start building.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              Create your account <ArrowRight className="size-4" />
            </Link>
            <Link to="/pricing" className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold">
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
