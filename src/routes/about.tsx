import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage } from "@/components/marketing";
import { T4P, Training4Performance } from "@/components/brand-text";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
  head: () => ({
    ...seoHead({
      path: "/about",
      title: "About T4P — Football Performance System for S&C Coaches",
      description:
        "Training 4 Performance is one connected workspace for football strength & conditioning coaches: squad, calendar, GPS, load, wellness, testing, alerts, analytics and AI observations.",
      keywords: [
        "football performance platform",
        "strength and conditioning software",
        "training load monitoring football",
        "GPS data management football",
        "S&C coach workspace",
      ],
    }),

    scripts: [
      webPageLd({
        path: "/about",
        name: "About Training 4 Performance",
        description:
          "Why T4P exists and what it includes: squad management, training calendar, session planning, GPS import, training load, wellness, testing, alerts, analytics and AI assistant.",
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

const brings: [string, string][] = [
  ["🏃", "Player information"],
  ["📅", "Training sessions"],
  ["📊", "Training load"],
  ["📡", "GPS data"],
  ["❤️", "Wellness"],
  ["🧪", "Fitness testing"],
  ["🩺", "Medical information"],
  ["📈", "Performance analytics"],
  ["🚨", "Alerts"],
];


const inside: { e: string; t: string; d: string; c: string }[] = [
  {
    e: "🏟️",
    t: "Squad management",
    d: "Central player database: profiles, position, availability, training status, player passport and notes. You immediately see who is available, who has restrictions and who needs attention.",
    c: "blue",
  },
  {
    e: "📅",
    t: "Training calendar",
    d: "Plan the week MD-4 → MD-3 → MD-2 → MD-1 → MD, and compare planned load against actual load. See what really happened, not only what was planned.",
    c: "green",
  },
  {
    e: "🧩",
    t: "Session planning",
    d: "Bring the session into a visual environment: players, runs, zones, equipment, drills and duration — connected to what actually happened on the pitch.",
    c: "violet",
  },
  {
    e: "📡",
    t: "GPS import",
    d: "Catapult, STATSports, GPEXE, Polar or your own template. The value is not importing numbers — it is connecting them to the player, the session, the week and the risk.",
    c: "cyan",
  },
  {
    e: "📊",
    t: "Training monitor",
    d: "Session data, drill splits, RPE, training load, test batteries, trends and individual player responses — from session → week → month → season.",
    c: "amber",
  },
  {
    e: "❤️",
    t: "Wellness",
    d: "Recovery, wellness, readiness and each player's deviation from his own baseline. GPS tells you what a player did; wellness tells you how he responded.",
    c: "pink",
  },
  {
    e: "🧪",
    t: "Fitness testing",
    d: "Strength, jump performance, speed, power and conditioning with individual benchmarks. Testing becomes part of the athlete's story, not another spreadsheet.",
    c: "teal",
  },
  {
    e: "🚨",
    t: "Automated alerts",
    d: "ACWR spikes, sudden load increases, wellness drops and availability risks are brought to your attention. The coach still decides — technology reduces the noise.",
    c: "red",
  },
  {
    e: "📈",
    t: "Performance analytics",
    d: "Composite load, acute-to-chronic relationships, monotony, strain and squad benchmarks. From “what happened?” to “how does this compare?”.",
    c: "indigo",
  },
  {
    e: "🤖",
    t: "AI assistant",
    d: "Daily observations on load changes, wellness deviations, potential spikes and considerations for the next session. AI does not become the coach.",
    c: "violet",
  },
  {
    e: "⚖️",
    t: "Custom load model",
    d: "Define your own KPIs, your own weights and your own load calculation. Your methodology stays yours; T4P becomes the system that supports it.",
    c: "amber",
  },
  {
    e: "🤝",
    t: "Staff workspace",
    d: "S&C, medical, performance and coaching staff work from the same squad, calendar and data. One shared source of information, no duplicate spreadsheets.",
    c: "green",
  },
];

const chain: [string, string][] = [
  ["👤", "Player profile"],
  ["📅", "Training session"],
  ["📡", "GPS data"],
  ["❤️", "Wellness"],
  ["📊", "Training load"],
  ["🚨", "Alerts"],
  ["🎯", "Coaching decision"],
];


const levels = [
  ["Level 1", "Collect data"],
  ["Level 2", "Store data"],
  ["Level 3", "Analyse data"],
  ["Level 4", "Connect data"],
  ["Level 5", "Use data to support decisions"],
];

const tone: Record<string, { chip: string; text: string }> = {
  blue: { chip: "bg-brand-blue/12 text-brand-blue", text: "text-brand-blue" },
  green: { chip: "bg-brand-green/12 text-brand-green", text: "text-brand-green" },
  cyan: { chip: "bg-brand-cyan/12 text-brand-cyan", text: "text-brand-cyan" },
  pink: { chip: "bg-brand-pink/12 text-brand-pink", text: "text-brand-pink" },
  red: { chip: "bg-brand-red/12 text-brand-red", text: "text-brand-red" },
  violet: { chip: "bg-brand-violet/12 text-brand-violet", text: "text-brand-violet" },
  amber: { chip: "bg-brand-amber/12 text-brand-amber", text: "text-brand-amber" },
  indigo: { chip: "bg-brand-indigo/12 text-brand-indigo", text: "text-brand-indigo" },
  teal: { chip: "bg-brand-teal/12 text-brand-teal", text: "text-brand-teal" },
};

function Card({
  children,
  className,
  border,
}: {
  children: React.ReactNode;
  className?: string;
  border?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden p-6 sm:p-8", border ?? "border-border", className)}>
      {children}
    </section>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">{children}</h2>;
}

function About() {
  return (
    <MarketingPage>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-green/14 via-background to-brand-blue/16">
        <div className="relative mx-auto max-w-7xl px-5 py-16 text-center">
          <p className="page-eyebrow">About</p>
          <h1 className="mx-auto mt-3 max-w-4xl font-display text-4xl font-semibold uppercase tracking-wide lg:text-5xl">
            The football performance system that connects everything
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
            <Training4Performance /> (<T4P />) is a professional performance management platform
            designed specifically for strength &amp; conditioning coaches working in football.
          </p>
          <p className="mt-4 font-display text-sm font-semibold uppercase tracking-wide text-brand-blue">
            Your players · Your data · Your decisions · One connected system
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-12">
        {/* Welcome */}
        <Card border="border-brand-blue/30">
          <Title>👋 Welcome to Training 4 Performance</Title>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Instead of managing your team through different Excel files, GPS reports, forms and
            notes, <T4P /> brings everything into one connected workspace.
          </p>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            {brings.map(([e, b]) => (
              <li key={b} className="flex min-w-0 items-center gap-2.5 bg-card px-4 py-3">
                <span aria-hidden className="shrink-0 text-base">
                  {e}
                </span>
                <span className="min-w-0 text-sm font-semibold">{b}</span>
              </li>
            ))}
          </ul>



          <p className="mt-6 font-display text-base font-semibold uppercase tracking-wide text-brand-green">
            Spend less time managing information. Spend more time coaching.
          </p>
        </Card>

        {/* Why it exists */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card border="border-brand-red/30">
            <Title>Why T4P exists</Title>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Modern performance departments generate enormous amounts of information. The problem is
              not the lack of data — it is what happens to that data afterwards. GPS in one system,
              player information in another, wellness somewhere else, testing in Excel and reports in
              different files.
            </p>
            <p className="mt-4 font-display text-sm font-semibold uppercase leading-relaxed tracking-wide text-brand-red">
              One team · One workspace · One performance database · One decision-making environment
            </p>
          </Card>

          <Card border="border-brand-violet/30">
            <Title>🧠 Built for practitioners</Title>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              <T4P /> is not a generic business dashboard. It is designed around the real workflow of
              a strength &amp; conditioning coach: how available the squad is, what the session
              actually was, what the load became, how each player responded, who is accumulating too
              much and what to consider for tomorrow. That is where it stops being a database and
              becomes part of your daily coaching process.
            </p>
          </Card>
        </div>

        {/* What's inside */}
        <Card className="mt-6" border="border-brand-green/30">
          <Title>🔥 What&rsquo;s inside</Title>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            One complete performance environment. Everything works around the same team and the same
            performance database.
          </p>
          <div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {inside.map((i) => {
              const t = tone[i.c]!;
              return (
                <div key={i.t} className="flex gap-3">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-base", t.chip)} aria-hidden>
                    {i.e}
                  </span>
                  <div className="min-w-0">
                    <p className={cn("font-display text-sm font-semibold uppercase tracking-wide", t.text)}>
                      {i.t}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Everything is connected */}
        <Card className="mt-6" border="border-brand-cyan/30">
          <Title>🔗 Everything is connected</Title>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            Instead of looking at ten different pieces of information separately, you see the player
            as one complete performance profile.
          </p>
          <ol className="mt-6 grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
            {chain.map(([e, c], i) => (
              <li key={c} className="flex min-w-0 items-center gap-3 text-sm font-semibold">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-cyan/10 text-base sm:size-7 sm:text-sm">
                    {e}
                  </span>
                  <span className="truncate">{c}</span>
                </span>
                {i < chain.length - 1 ? (
                  <span className="hidden text-brand-cyan sm:inline" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>


        </Card>

        {/* Levels + time */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card border="border-brand-indigo/30">
            <Title>🚀 From data collection to decisions</Title>
            <ol className="mt-5 space-y-2.5">
              {levels.map(([n, d], idx) => (
                <li key={n} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold",
                      idx >= 3 ? "bg-brand-indigo/15 text-brand-indigo" : "bg-surface-2 text-muted-foreground"
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className={cn("text-sm", idx >= 3 ? "font-semibold text-foreground" : "text-muted-foreground")}>
                    {d}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              <T4P /> is designed around levels 4 and 5. More data does not automatically mean better
              performance management — using the right data at the right time does.
            </p>
          </Card>

          <Card border="border-brand-amber/30">
            <Title>⏱️ The real value is time</Title>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              If the system saves even 30 minutes per day from Excel administration, data transfers,
              manual reporting and searching for information, that becomes{" "}
              <strong className="text-foreground">2.5+ hours per week</strong> — to watch players,
              analyse performance, improve programming and communicate with your staff.
            </p>
            <p className="mt-4 font-display text-sm font-semibold uppercase tracking-wide text-brand-amber">
              Time is not just money. Time is coaching capacity.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Your performance department also represents the professionalism of your club. Instead
              of “give me a minute to find that Excel”, you can say “let me show you”.
            </p>
          </Card>
        </div>

        {/* Bottom line */}
        <div className="panel mt-6 overflow-hidden border-brand-blue/35 bg-gradient-to-r from-brand-blue/12 via-background to-brand-pink/12 p-6 sm:p-8">
          <Title>⚽ The bottom line</Title>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            <Training4Performance /> is not about replacing the coach. It is about making the coach
            better equipped. It does not remove professional judgement — it supports it.
          </p>
          <p className="mt-4 font-display text-base font-semibold uppercase tracking-wide text-brand-blue">
            Connect your data · Understand your players · Improve your workflow · Coach better
          </p>
          <p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">
            <T4P /> was created by <strong className="text-foreground">Haris Falas</strong> — sports
            scientist and strength &amp; conditioning coach — from daily work inside professional
            football clubs. €699 per season, per team, every module included.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/how-it-works"
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground"
            >
              See how it works
            </Link>
            <Link
              to="/pricing"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              View pricing
            </Link>
            <Link
              to="/haris-falas"
              className="rounded-md border border-border bg-card px-5 py-3 text-sm font-semibold"
            >
              About Haris Falas
            </Link>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
