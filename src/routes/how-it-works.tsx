import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardPen,
  HeartPulse,
  Radar,
  Shield,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
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
    t: "Create the team or import the squad",
    d: "Create the team once. Then add players manually or upload the first GPS report and create every detected player in one click — names never need to be typed twice.",
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
        Upload the provider export, confirm player matching and press Import into the session. The rows remain in GPS history and become visible inside each player, Insights, Analytics and Reports.
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
    t: "Choose, compare and report",
    d: "In Analytics & Reports choose one player, several players or the whole squad; then choose the KPI and dates. See the chart immediately and export it as PNG, PDF, Excel or CSV.",
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
    q: (
      <>
        Do I need a GPS system to use <T4P />?
      </>
    ),
    a: "No. RPE, duration, participation, wellness and test data alone already produce load, ACWR, monotony and strain. GPS simply adds resolution.",
  },
  {
    q: "Which GPS providers are supported?",
    a: (
      <>
        Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system can be mapped
        column by column with the <T4P /> template — including your own club KPIs.
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
    q: "Is my data protected?",
    a: "Each account is fully isolated — you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
  },
];

/** Plain-text mirror of the FAQ above, used only for FAQPage JSON-LD. */
const faqSchema = [
  {
    q: "What does the subscription cost and what does it cover?",
    a: "\u20ac999 per season for one team. The season runs 1 June to 31 May, every module is included and there is no per-user fee.",
  },
  {
    q: "Do I need a GPS system to use T4P?",
    a: "No. RPE, duration, participation, wellness and test data alone already produce load, ACWR, monotony and strain. GPS simply adds resolution.",
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
    q: "Is my data protected?",
    a: "Each account is fully isolated \u2014 you only ever see your own team. Data is stored on European infrastructure and processed under GDPR.",
  },
];

function HowItWorks() {
  return (
    <MarketingPage>
      <section className="border-b border-border bg-gradient-to-br from-brand-blue/8 via-background to-brand-green/8">
        <div className="mx-auto max-w-5xl px-5 py-10 text-center">
          <p className="eyebrow text-brand-blue">How it works</p>
          <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide">
            Create → import → review → decide → report
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> follows the real order of work in a performance department. You build the team once, then every
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
              <div key={i} className={`panel ${tone.card} p-5`}>
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
