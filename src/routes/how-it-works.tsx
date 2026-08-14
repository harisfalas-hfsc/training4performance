import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarDays,
  ClipboardPen,
  Gauge,
  HeartPulse,
  Radar,
  Shield,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    ...seoHead({
      path: "/how-it-works",
      title: "How It Works — GPS, Training Load & ACWR Workflow | T4P",
      description:
        "See the T4P workflow: create a team, build the squad, run fitness tests, design training in blocks, schedule sessions, import GPS data and read load, ACWR, alerts and reports.",
      keywords: [
        "football GPS data upload platform",
        "training load monitoring football",
        "soccer training session designer",
        "football practice planner",
      ],
    }),
    scripts: [
      webPageLd({
        path: "/how-it-works",
        name: "How T4P works",
        description:
          "The T4P workflow for football performance staff: create a team, build the squad, run fitness tests, design training in blocks, schedule sessions, import GPS data and read load, ACWR, alerts and reports.",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "How it works", path: "/how-it-works" },
      ]),
    ],
  }),
  component: HowItWorks,
});

type Step = { icon: LucideIcon; t: string; d: ReactNode; tone: string };

const steps: Step[] = [
  {
    icon: Shield,
    tone: "blue",
    t: "Create the team — in any order you like",
    d: (
      <>
        Create the team once. After that there is no right order: add the players by hand, or simply
        upload the first GPS report and press{" "}
        <strong className="text-foreground">Create missing players</strong> — every name in the file
        becomes a player in one click. Whatever the file cannot give you (position, shirt number,
        birth date, height, weight, medical status) you add later, only if you want it. Nothing is
        compulsory, and no name is ever typed twice.
      </>
    ),
  },
  {
    icon: Users,
    tone: "green",
    t: "Work from each player record",
    d: "Open Team & Players, choose a player, then use the same record for profile, GPS history, fitness tests, training, wellness, medical history, reports and player login access.",
  },
  {
    icon: BookMarked,
    tone: "violet",
    t: "Build from the drills & exercise library",
    d: (
      <>
        You never start a session from an empty page. The library holds ready-made{" "}
        <T4P /> blocks — strength, power, speed, energy system development, coordination, mobility,
        technical and recovery — each one with its drills, sets, reps, rest and, where it helps, a
        tactics board drawing. Inside the Training Designer open the{" "}
        <strong className="text-foreground">Blocks</strong> tab, search or filter by category and
        tap once: the whole block drops into the day you are building. Anything you design yourself
        can be saved back with <strong className="text-foreground">Save block</strong> and reused
        for the rest of the season, and a <T4P /> block can be copied into your own library and
        edited to fit your squad.
      </>
    ),
  },
  {
    icon: CalendarDays,
    tone: "indigo",
    t: "Plan and record the work",
    d: "Use Calendar and Training Designer to schedule the day, build blocks, record participation and RPE, and add fitness tests. Everything is dated and attached to the player automatically.",
  },
  {
    icon: Radar,
    tone: "cyan",
    t: "Import GPS once",
    d: (
      <>
        Upload the provider export, confirm player matching and press Import into the session. The
        rows remain in GPS history and become visible inside each player, Insights, Analytics and
        Reports.
      </>
    ),
  },
  {
    icon: Gauge,
    tone: "amber",
    t: "No GPS? Rate the session instead",
    d: (
      <>
        Working without GPS units, or with strength, indoor, pool and rehab blocks that no vest ever
        sees? After the session, open Manual RPE load, set the duration and a 0-10 rating for the
        squad or athlete by athlete. <T4P /> turns it into session load (RPE x minutes) and adds it
        to the same daily total, so load, ACWR, monotony, strain, alerts and reports work exactly
        the same as with a GPS file.
      </>
    ),
  },

  {
    icon: HeartPulse,
    tone: "pink",
    t: "Collect wellness and act on alerts",
    d: "Give a player his own login from his profile. He completes wellness and sees only the reports you allow. The coach sees daily responses and workload, wellness and availability alerts together.",
  },
  {
    icon: BarChart3,
    tone: "blue",
    t: "Ask anything the same way: Who → What",
    d: (
      <>
        Every analysis screen asks the same two questions.{" "}
        <strong className="text-foreground">WHO</strong> — the team, the squad average, one player
        or several, from a searchable picker. <strong className="text-foreground">WHAT</strong> —
        GPS reports, Training &amp; drills, Fitness tests, Wellness or Medical &amp; availability.
        Then the KPI, the dates and the chart type: line, bar, area, pie or radar. The chart redraws
        instantly and exports as PNG, PDF, Excel or CSV. The same strip lives inside each player,
        where WHO is already answered.
      </>
    ),
  },
];

const tones: Record<string, { chip: string; card: string; num: string }> = {
  blue: {
    chip: "bg-brand-blue/12 text-brand-blue",
    card: "border-brand-blue/25",
    num: "text-brand-blue",
  },
  green: {
    chip: "bg-brand-green/12 text-brand-green",
    card: "border-brand-green/25",
    num: "text-brand-green",
  },
  violet: {
    chip: "bg-brand-violet/12 text-brand-violet",
    card: "border-brand-violet/25",
    num: "text-brand-violet",
  },
  pink: {
    chip: "bg-brand-pink/12 text-brand-pink",
    card: "border-brand-pink/25",
    num: "text-brand-pink",
  },
  amber: {
    chip: "bg-brand-amber/12 text-brand-amber",
    card: "border-brand-amber/25",
    num: "text-brand-amber",
  },
  indigo: {
    chip: "bg-brand-indigo/12 text-brand-indigo",
    card: "border-brand-indigo/25",
    num: "text-brand-indigo",
  },
  cyan: {
    chip: "bg-brand-cyan/12 text-brand-cyan",
    card: "border-brand-cyan/25",
    num: "text-brand-cyan",
  },
  teal: {
    chip: "bg-brand-teal/12 text-brand-teal",
    card: "border-brand-teal/25",
    num: "text-brand-teal",
  },
  red: {
    chip: "bg-brand-red/12 text-brand-red",
    card: "border-brand-red/25",
    num: "text-brand-red",
  },
};


function HowItWorks() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-green/8">
        <div className="mx-auto max-w-7xl px-5 py-14 text-center">
          <p className="page-eyebrow">How it works</p>
          <h1 className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-2xl font-semibold uppercase tracking-wide sm:text-4xl">
            {["Create", "import", "review", "decide", "report"].map((w, i) => (
              <span key={w} className="flex items-center gap-x-2">
                {i > 0 ? (
                  <span className="text-brand-blue" aria-hidden>
                    →
                  </span>
                ) : null}
                {w}
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> follows the real order of work in a performance department. You build the team
            once, then every session, GPS file and test result attaches to the same player record —
            so the analysis is ready before you have to make the decision.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10">
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
                    <span className="font-display text-lg font-semibold uppercase tracking-wide">
                      {s.t}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 text-center">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:underline"
          >
            Read the frequently asked questions <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="panel mt-14 overflow-hidden border-brand-amber/35 bg-gradient-to-br from-brand-amber/10 via-background to-brand-blue/10 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-amber/15 text-brand-amber">
              <BookOpen className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-brand-amber">The manual</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide">
                Every workflow is written down, step by step
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Inside the platform, <T4P /> ships with a full colour-coded user manual: 16 numbered
                chapters from an empty squad to daily decisions, a chapter explaining exactly how
                the individual training load and ACWR are calculated, a search box and a
                troubleshooting section. It is also downloadable as a PDF, exactly as it appears on
                screen, so you can print it or send it to your staff.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  [
                    "01",
                    "Numbered chapters",
                    "Squad, calendar, designer, GPS, load, analytics, tests, alerts, reports.",
                  ],
                  [
                    "02",
                    "Searchable",
                    "Type a word and only the matching chapters and answers stay on screen.",
                  ],
                  [
                    "03",
                    "Downloadable PDF",
                    "One button prints or saves the whole manual exactly as displayed.",
                  ],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded-xl border border-brand-amber/30 bg-card p-3">
                    <p className="font-display text-xs font-bold text-brand-amber">{n}</p>
                    <p className="mt-0.5 font-display text-sm font-semibold uppercase tracking-wide">
                      {t}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/manual"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Open the manual <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
                >
                  Create an account to read it
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="panel mt-12 overflow-hidden border-brand-blue/35 bg-gradient-to-br from-brand-blue/10 via-background to-brand-cyan/10 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-blue/15 text-brand-blue">
              <MonitorDown className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-brand-blue">Desktop &amp; offline</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide">
                Install it on the laptop — and keep working with no connection
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                <T4P /> is a website and a desktop program at the same time. Windows gets a setup
                wizard with shortcuts and an uninstaller, macOS gets a drag-to-Applications disk
                image, and both keep working on the pitch, in the gym or on the bus with no internet
                at all.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["01", "Real installers", "T4P-Setup-Windows.exe and T4P-Installer-macOS.dmg, with the T4P icon."],
                  ["02", "Works offline", "Everything already in your workspace stays readable and editable."],
                  ["03", "Syncs by itself", "Offline edits are queued and pushed the moment you are back online."],
                ].map(([n, t, d]) => (
                  <div key={n} className="rounded-xl border border-brand-blue/30 bg-card p-3">
                    <p className="font-display text-xs font-bold text-brand-blue">{n}</p>
                    <p className="mt-0.5 font-display text-sm font-semibold uppercase tracking-wide">
                      {t}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Link
                  to="/download"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Download &amp; install <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>


        <div className="panel mt-12 border-brand-indigo/30 bg-gradient-to-r from-brand-indigo/10 to-brand-cyan/10 p-6 text-center">
          <p className="font-display text-xl font-semibold uppercase tracking-wide">
            Ready to set up your team?
          </p>
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
            <Link
              to="/pricing"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
