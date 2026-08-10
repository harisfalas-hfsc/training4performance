import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/marketing";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About T4P — Training 4 Performance" },
      {
        name: "description",
        content:
          "T4P is an integrated football fitness, performance and training management platform created by sports scientist and strength & conditioning coach Haris Falas.",
      },
      { property: "og:title", content: "About T4P — Training 4 Performance" },
      {
        property: "og:description",
        content: "Why T4P exists, what it solves and who built it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <MarketingPage>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">About</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">
          One connected football performance system
        </h1>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <p>
            T4P (Training 4 Performance) is an integrated football fitness, performance and training management
            platform. It was built to solve a problem every performance department knows: the information exists,
            but it lives in separate places. Availability is in one file, the training plan in another, GPS exports
            in a third, wellness in a form, testing in a spreadsheet and medical status in someone's head. By the
            time it is all put together, the decision has already been made.
          </p>
          <p>
            T4P keeps a single player record at the centre and connects everything to it — training sessions,
            drills, GPS and physical output, RPE and training load, wellness, testing batteries, availability and
            medical status. Every screen reads from the same source of truth, so what the coach sees on the
            dashboard, what the fitness staff analyse in the logbook, and what the medical staff record in the
            player passport are always the same data.
          </p>

          <h2 className="mt-10 font-display text-lg font-semibold text-foreground">The questions it answers</h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong className="text-foreground">Who do I have?</strong> Live availability, partial, individual, rehab and unavailable.</li>
            <li><strong className="text-foreground">What did we do?</strong> Completed sessions, drills, durations, planned versus actual RPE.</li>
            <li><strong className="text-foreground">How did they respond?</strong> Distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed, composite load.</li>
            <li><strong className="text-foreground">Who needs attention?</strong> ACWR spikes, weekly load jumps, wellness drops, exposure gaps and availability risk.</li>
            <li><strong className="text-foreground">What do we do tomorrow?</strong> Alerts with concrete session adjustments and AI-supported observations.</li>
          </ul>

          <h2 className="mt-10 font-display text-lg font-semibold text-foreground">What it includes</h2>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>Squad management and full player passports.</li>
            <li>Training calendar built around the match-day cycle (MD-4 to MD+1) with drill libraries.</li>
            <li>An interactive tactics board for designing sessions: players, equipment, runs, zones and export.</li>
            <li>GPS import with provider detection, upload progress and a name-mapping report, plus the T4P CSV template.</li>
            <li>Training monitor logbook with pivot charts, drill-level splits, RPE entry and the full evaluation test battery.</li>
            <li>A configurable composite load model driving acute:chronic workload ratio, monotony and strain.</li>
            <li>Automated threshold alerts and configurable report templates with scheduled one-click exports.</li>
            <li>A single shared workspace for the whole performance staff.</li>
          </ul>

          <h2 className="mt-10 font-display text-lg font-semibold text-foreground">Who created it</h2>
          <p>
            T4P was created by <strong className="text-foreground">Haris Falas</strong> — sports scientist, fitness
            coach and strength &amp; conditioning coach — from more than a decade of daily work inside professional
            football clubs. Every table, metric and workflow in T4P comes from a real logbook that was used with a
            real squad, not from a product specification.
          </p>
          <p>
            <Link to="/haris-falas" className="font-medium text-primary hover:underline">
              Read the full profile →
            </Link>
          </p>
        </div>
      </div>
    </MarketingPage>
  );
}
