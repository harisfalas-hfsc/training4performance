import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
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
import { BrandCopy, T4P } from "@/components/brand-text";
import { breadcrumbLd, jsonLd, seoHead, webPageLd } from "@/lib/seo";

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
      jsonLd({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqSchema.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }),
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

const faq = [
  {
    q: "Do I have to add the players before I upload GPS?",
    a: (
      <>
        No. The two orders are equally valid. Upload the file first and <T4P /> creates every
        detected player for you; or build the squad first and the file matches the names it finds.
        Anything the GPS export does not contain — position, birth date, height, weight, RPE,
        medical status, test results — you add manually whenever you want, and only for the fields
        you actually care about.
      </>
    ),
  },
  {
    q: "How much typing does this really save?",
    a: "One entry, everywhere. A name, a duration, a rating or a test result is typed once and the squad list, calendar, player record, load model, ACWR, alerts, charts and PDF reports all update themselves. There is no second spreadsheet to keep in sync and nothing to copy across after training.",
  },
  {
    q: "What does the subscription cost and what does it cover?",
    a: "€69.90 per month for one team, cancel any time. Every module is included and there is no per-user fee.",
  },
  {
    q: (
      <>
        Do I need a GPS system to use <T4P />?
      </>
    ),
    a: "No — and this is not a limitation. Record the session, its duration and a 0-10 RPE after training and T4P produces session load (RPE x minutes), acute and chronic load, ACWR, monotony and strain, plus the same wellness, testing, alerts and PDF reports. GPS simply adds resolution to a system that already works without it.",
  },

  {
    q: "Which GPS providers are supported?",
    a: (
      <>
        Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system
        can be mapped column by column with the <T4P /> template — including your own club KPIs.
      </>
    ),
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
    a: "Yes. Any account can sign in and look at every screen of the platform. A subscription unlocks creating and editing your own data.",
  },
  {
    q: "Is there a manual?",
    a: (
      <>
        Yes — a full illustrated user manual lives inside the platform, with numbered chapters, a
        search box, troubleshooting and a one-click PDF download of the whole document.
      </>
    ),
  },
  {
    q: "Is my data protected?",
    a: "Each account is fully isolated — you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
  },
];

/** Plain-text mirror of the FAQ above, used only for FAQPage JSON-LD. */
const faqSchema = [
  {
    q: "Do I have to add the players before I upload GPS?",
    a: "No. The two orders are equally valid. Upload the file first and T4P creates every detected player for you; or build the squad first and the file matches the names it finds. Anything the GPS export does not contain \u2014 position, birth date, height, weight, RPE, medical status, test results \u2014 you add manually whenever you want, and only for the fields you actually care about.",
  },
  {
    q: "How much typing does this really save?",
    a: "One entry, everywhere. A name, a duration, a rating or a test result is typed once and the squad list, calendar, player record, load model, ACWR, alerts, charts and PDF reports all update themselves. There is no second spreadsheet to keep in sync and nothing to copy across after training.",
  },
  {
    q: "What does the subscription cost and what does it cover?",
    a: "\u20ac999 per season for one team. The season runs 1 June to 31 May, every module is included and there is no per-user fee.",
  },
  {
    q: "Do I need a GPS system to use T4P?",
    a: "No \u2014 and this is not a limitation. Record the session, its duration and a 0-10 RPE after training and T4P produces session load (RPE x minutes), acute and chronic load, ACWR, monotony and strain, plus the same wellness, testing, alerts and PDF reports. GPS simply adds resolution to a system that already works without it.",
  },
  {
    q: "Which GPS providers are supported?",
    a: "Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system can be mapped column by column with the T4P template \u2014 including your own club KPIs.",
  },
  {
    q: "Can I change the ACWR formula?",
    a: "Yes. You pick the KPIs and their weights, so the composite load \u2014 and therefore the acute to chronic workload ratio \u2014 reflects your own methodology rather than a fixed formula.",
  },
  {
    q: "Can I edit or delete data after saving?",
    a: "Yes. Players, training days, plan parts, GPS rows, RPE values and test results can all be edited or removed, and you can wipe or delete the team and start again.",
  },
  {
    q: "Can I browse before I subscribe?",
    a: "Yes. Any account can sign in and look at every screen of the platform. A subscription unlocks creating and editing your own data.",
  },
  {
    q: "Is there a manual?",
    a: "Yes \u2014 a full illustrated user manual lives inside the platform, with numbered chapters, a search box, troubleshooting and a one-click PDF download of the whole document.",
  },
  {
    q: "Is my data protected?",
    a: "Each account is fully isolated \u2014 you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
  },
];

function HowItWorks() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-green/8">
        <div className="mx-auto max-w-5xl px-5 py-14 text-center">
          <p className="page-eyebrow">How it works</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">
            Create → import → review → decide → report
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> follows the real order of work in a performance department. You build the team
            once, then every session, GPS file and test result attaches to the same player record —
            so the analysis is ready before you have to make the decision.
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

        <h2 className="mt-14 font-display text-2xl font-semibold uppercase tracking-wide">
          Questions
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {faq.map((f, i) => {
            const tone = Object.values(tones)[i % 9]!;
            return (
              <div key={i} className={`panel ${tone.card} p-5`}>
                <p
                  className={`font-display text-base font-semibold uppercase tracking-wide ${tone.num}`}
                >
                  {f.q}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {typeof f.a === "string" ? <BrandCopy>{f.a}</BrandCopy> : f.a}
                </p>
              </div>
            );
          })}
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
            What you stop doing on day one
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The job of a strength &amp; conditioning coach is the performance of the players — not
            data entry. <T4P /> takes the admin off your desk so the only thing left for you is the
            decision.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "No re-typing names",
                "The squad is built from your GPS file, or once by hand. Every screen reuses the same player record.",
              ],
              [
                "No copying between files",
                "Import once, or rate the session once. Charts, tables, ACWR and reports update themselves.",
              ],
              [
                "No manual formulas",
                "Load, acute vs chronic, ACWR, monotony and strain are calculated per player as the data arrives.",
              ],
              [
                "No scanning 27 players",
                "Thresholds watch workload, wellness and availability and tell you who needs attention.",
              ],
              [
                "No building the coach's report",
                "Pick the template, pick the dates, press export. PDF, PNG, Excel or CSV.",
              ],
              [
                "No lost season history",
                "Every session, file, test, injury and rating stays in one place until you delete it.",
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
                Inside the platform, <T4P /> ships with a full colour-coded user manual: 15 numbered
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
