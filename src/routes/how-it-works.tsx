import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingPage } from "@/components/marketing";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How T4P Works — Training 4 Performance" },
      {
        name: "description",
        content:
          "Step by step: set up your squad, plan the microcycle, design sessions on the tactics board, import GPS, monitor load and act on alerts with T4P.",
      },
      { property: "og:title", content: "How T4P Works" },
      { property: "og:description", content: "From squad setup to daily decisions — the full T4P workflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  {
    t: "1 · Set up the club and squad",
    d: "Create the team, season and squad. Each player gets a passport: profile, position, dominant leg, contract and availability status. The administrator can add sub-teams (academy, U19, women's team) under the same account.",
  },
  {
    t: "2 · Assign roles",
    d: "Invite head coach, fitness staff and medical staff. Permissions decide what each role sees: coaches and fitness staff get availability and workload, while diagnoses, clinical notes and return-to-play detail stay visible to medical staff only.",
  },
  {
    t: "3 · Plan the microcycle",
    d: "Build the week around the match: MD+1, MD-4, MD-3, MD-2, MD-1, MD. Each day gets a description, objective, duration, training group and planned RPE, with drills selected from the drill taxonomy.",
  },
  {
    t: "4 · Design the session on the tactics board",
    d: "Place players, balls, cones, poles, ladders, hurdles, mannequins and goals on a real pitch. Draw runs, passes, dashed movements, zigzag and curved runs, zones and text. Undo, rotate the pitch and export the session as an image for the staff briefing.",
  },
  {
    t: "5 · Import GPS data",
    d: "Drag in an export from Catapult, STATSports, GPEXE or Polar — the provider is detected automatically, progress is shown live, and any player name that cannot be matched appears in a clear mapping report so you can resolve it. Or download the T4P template and align your system to it once.",
  },
  {
    t: "6 · Add RPE and split drills",
    d: "RPE can be entered per player per session, or per drill when the GPS session is cut into parts. Session load is RPE × duration, and drill splits let the GPS output match what was actually coached.",
  },
  {
    t: "7 · Build your own load model",
    d: "Choose which KPIs define training load — total distance, high-speed running, sprint distance and efforts, accelerations, decelerations, jumps, max speed, sRPE — and set their weights. Each KPI is normalised against the squad reference and combined into a composite load in AU, which drives acute (7-day), chronic (28-day), ACWR, monotony and strain.",
  },
  {
    t: "8 · Monitor and get alerted",
    d: "Thresholds for ACWR spikes, weekly load jumps, wellness drops and availability risk run automatically. Every triggered alert names the player, the reason and a concrete suggestion for tomorrow's plan.",
  },
  {
    t: "9 · Analyse with the logbook and pivots",
    d: "The activity logbook holds every player-session row. The activity chart is a real pivot: pick any KPI, group by player, position, date, activity type, MD cycle or drill, aggregate by sum, average, max or count, filter by date range and export.",
  },
  {
    t: "10 · Report and export",
    d: "Configurable report templates per audience — head coach weekly, fitness performance, medical return-to-play, board summary — with one-click export and scheduled delivery for a chosen date range. Medical content is redacted automatically for unauthorised audiences.",
  },
];

function HowItWorks() {
  return (
    <MarketingPage>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">How it works</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">
          From squad setup to tomorrow's session
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          T4P follows the real weekly rhythm of a football performance department. Each step feeds the next, and
          every screen reads the same connected player record.
        </p>

        <ol className="mt-10 space-y-4">
          {steps.map((s) => (
            <li key={s.t} className="panel p-4">
              <p className="font-display text-base font-semibold uppercase tracking-wide text-primary">{s.t}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Create your account
          </Link>
          <Link to="/pricing" className="rounded-md border border-border px-5 py-3 text-sm font-semibold">
            Pricing
          </Link>
        </div>
      </div>
    </MarketingPage>
  );
}
