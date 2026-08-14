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

const brings = [
  "Player information",
  "Training sessions",
  "Training load",
  "GPS data",
  "Wellness",
  "Fitness testing",
  "Medical information",
  "Performance analytics",
  "Alerts",
  "AI-supported observations",
];

const inside = [
  ["Squad management", "Central player database: profiles, position, availability, training status, player passport, notes."],
  ["Training calendar", "Plan MD-4 → MD, compare planned load against actual load, see what really happened."],
  ["Session planning", "Block-based sessions with a visual tactics board: players, runs, zones, equipment, drills, duration."],
  ["GPS import", "Catapult, STATSports, GPEXE, Polar or your own template, connected to player, session and week."],
  ["Training monitor", "Session data, drill splits, RPE and load from session → week → month → season."],
  ["Wellness", "Recovery, wellness, readiness and individual deviations from each player's baseline."],
  ["Fitness testing", "Strength, jump, speed, power and conditioning tests with individual benchmarks."],
  ["Automated alerts", "ACWR spikes, sudden load increases, wellness drops and availability risks brought to you."],
  ["Performance analytics", "Composite load, acute-to-chronic relationships, monotony, strain and squad benchmarks."],
  ["AI assistant", "Daily observations and considerations for the next session. The coach stays the decision maker."],
  ["Custom load model", "Your KPIs, your weights, your load calculation. Your methodology stays yours."],
  ["Staff workspace", "S&C, medical, performance and coaching staff working from one shared data environment."],
];

const chain = [
  "Player profile",
  "Training session",
  "GPS data",
  "Wellness",
  "Training load",
  "Alerts",
  "AI observations",
  "Coaching decision",
];

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
    <section className={cn("panel overflow-hidden p-5 sm:p-7", border ?? "border-border", className)}>
      {children}
    </section>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">{children}</h2>
  );
}

function About() {
  return (
    <MarketingPage>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-green/12 via-background to-brand-blue/14">
        <div className="relative mx-auto max-w-4xl px-5 py-14 text-center">
          <p className="page-eyebrow">About</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">
            The football performance system that connects everything
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <Training4Performance /> (<T4P />) is a professional performance management platform
            designed specifically for strength &amp; conditioning coaches working in football.
            Your players. Your data. Your decisions. One connected system.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-12">
        {/* Welcome */}
        <Card border="border-brand-blue/25">
          <Title>Welcome</Title>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Instead of managing your team through different Excel files, GPS reports, forms and
            notes, <T4P /> brings everything into one connected workspace.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {brings.map((b) => (
              <span
                key={b}
                className="rounded-full border border-brand-blue/25 bg-brand-blue/8 px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {b}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold leading-relaxed text-foreground">
            Spend less time managing information. Spend more time coaching.
          </p>
        </Card>

        {/* Why it exists */}
        <Card className="mt-6">
          <Title>Why T4P exists</Title>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Modern performance departments generate enormous amounts of information. The problem is
            not the lack of data — it is what happens to that data afterwards. GPS in one system,
            player information in another, wellness somewhere else, testing in Excel and reports in
            different files. <T4P /> was built to solve exactly this problem.
          </p>
          <p className="mt-5 font-display text-sm font-semibold uppercase leading-relaxed tracking-wide text-brand-blue">
            One team · One workspace · One performance database · One decision-making environment
          </p>
        </Card>

        {/* Built for practitioners */}
        <Card className="mt-6">
          <Title>Built for performance practitioners</Title>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <T4P /> is not a generic business dashboard. It is designed around the real workflow of a
            strength &amp; conditioning coach: how available the squad is, what the session actually
            was, what the load became, how each player responded, who is accumulating too much and
            what should be considered for tomorrow. That is where it becomes part of the daily
            coaching process instead of another database.
          </p>
        </Card>

        {/* What's inside */}
        <Card className="mt-6">
          <Title>What&rsquo;s inside</Title>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            One complete performance environment. Everything works around the same team and the same
            performance database.
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {inside.map(([t, d]) => (
              <div key={t}>
                <p className="font-display text-sm font-semibold uppercase tracking-wide">{t}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Everything is connected */}
        <Card className="mt-6" border="border-brand-cyan/25">
          <Title>Everything is connected</Title>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Instead of looking at ten different pieces of information separately, you see the player
            as one complete performance profile.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {chain.map((c, i) => (
              <span key={c} className="flex items-center gap-2">
                <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold">
                  {c}
                </span>
                {i < chain.length - 1 ? (
                  <span className="text-brand-cyan" aria-hidden>
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </Card>

        {/* The real value */}
        <Card className="mt-6">
          <Title>The real value is time</Title>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            If the system saves even 30 minutes per day from Excel administration, data transfers,
            manual reporting and searching for information, that becomes more than 2.5 hours per
            week — to watch players, analyse performance, improve programming and communicate with
            your staff. Time is not just money. Time is coaching capacity.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Your performance department also represents the professionalism of your club. Instead of
            saying &ldquo;give me a minute to find that Excel&rdquo;, you can say &ldquo;let me show
            you&rdquo;.
          </p>
        </Card>

        {/* Bottom line + who created it */}
        <div className="panel mt-6 overflow-hidden border-brand-indigo/35 bg-gradient-to-r from-brand-indigo/12 to-brand-pink/12 p-6 sm:p-7">
          <Title>The bottom line</Title>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            <Training4Performance /> is not about replacing the coach. It is about making the coach
            better equipped. It does not remove professional judgement — it supports it. Connect your
            data, understand your players, improve your workflow, coach better.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            It was created by <strong className="text-foreground">Haris Falas</strong> — sports
            scientist and strength &amp; conditioning coach — from daily work inside professional
            football clubs, at €999 per season per team with every module included.
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
