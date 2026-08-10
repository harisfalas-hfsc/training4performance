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
    d: "Create the team, season and squad. Each player gets a passport: profile, position, dominant leg, contract and availability status. Add, edit or release players at any time — every record follows the athlete.",
  },
  {
    t: "2 · Invite the staff",
    d: "One subscription covers the whole staff. Everyone works in the same fitness-coach workspace, on the same squad, the same calendar and the same data — no separate permission tiers to maintain.",
  },
  {
    t: "3 · Plan the microcycle in the calendar",
    d: "The month calendar shows every training day as scheduled, pending or completed, with favourites marked. Create a day, open it in the designer, duplicate a good session onto another date or change its state directly from the list.",
  },
  {
    t: "4 · Design the session block by block",
    d: "The training designer splits the day into blocks — warm-up, activation/prehab, strength room, technical, tactical, conditioning, speed & power, small-sided games, set pieces, cool-down. Each part carries its own duration, RPE, location (pitch, gym, pool, indoor, classroom) and purpose, and the planned duration, weighted RPE and planned load update as you build.",
  },
  {
    t: "5 · Sketch it on the tactics board",
    d: "Place players, balls, cones, poles, ladders, hurdles, mannequins and goals on a real pitch. Draw runs, passes, dashed movements, zigzag and curved runs, zones and text. Undo, rotate the pitch and export the session as an image for the staff briefing.",
  },
  {
    t: "6 · Import GPS data",
    d: "Drag in an export from Catapult, STATSports, GPEXE or Polar — the provider is detected automatically, progress is shown live, and any player name that cannot be matched appears in a clear mapping report so you can resolve it. Or download the T4P template and align your system to it once.",
  },
  {
    t: "7 · Add RPE and split drills",
    d: "RPE can be entered per player per session, or per drill when the GPS session is cut into parts. Session load is RPE × duration, and drill splits let the GPS output match what was actually coached.",
  },
  {
    t: "8 · Build your own load model",
    d: "Choose which KPIs define training load — total distance, high-speed running, sprint distance and efforts, accelerations, decelerations, jumps, max speed, sRPE — and set their weights. Each KPI is normalised against the squad reference and combined into a composite load in AU, which drives acute (7-day), chronic (28-day), ACWR, monotony and strain.",
  },
  {
    t: "9 · Monitor and get alerted",
    d: "Thresholds for ACWR spikes, weekly load jumps, wellness drops and availability risk run automatically. Every triggered alert names the player, the reason and a concrete suggestion for tomorrow's plan.",
  },
  {
    t: "10 · Analyse with the logbook and pivots",
    d: "The activity logbook holds every player-session row. The activity chart is a real pivot: pick any KPI, group by player, position, date, activity type, MD cycle or drill, aggregate by sum, average, max or count, filter by date range and export.",
  },
  {
    t: "11 · Report and export",
    d: "Configurable report templates per audience — head coach weekly, fitness load block, return-to-play brief, club management summary — with one-click export and scheduled delivery for a chosen date range.",
  },
];


const manual: Array<{ t: string; d: string[] }> = [
  {
    t: "Getting started",
    d: [
      "Create an account with your email, then activate the team subscription from My account. The platform — dashboard, squad, calendar, designer, tactics board, logbook, GPS, alerts, analytics and reports — unlocks immediately.",
      "Open the menu with the panel button at the top left of any platform screen. It slides over the page so the working area stays full width, and closes as soon as you pick a destination.",
    ],
  },
  {
    t: "Squad",
    d: [
      "Add a player with name, position, birth date, dominant leg and availability. Update availability whenever status changes: available, partial, individual, rehab, ill or injured.",
      "Removing a player (transfer or release) removes their GPS rows, tests and medical entries with them, so historical squad averages stay clean.",
      "Click any player to open the passport: profile, load history, GPS trends, tests, availability and medical episodes.",
    ],
  },
  {
    t: "Calendar and training designer",
    d: [
      "In the calendar, use the month arrows to move, the filter to show only scheduled, pending, completed or favourite sessions, and Open to jump straight into that day.",
      "In the designer, create a training day with a date, MD label, title, group, objective, duration and planned RPE.",
      "Select a block, then add parts either from the drill library or as a custom line. Edit minutes, RPE, location and purpose per part. Planned load is the duration-weighted RPE multiplied by total planned minutes.",
      "After training, type the actual session RPE and save — the day is marked completed automatically. Mark a well-built session as a favourite and duplicate it onto any future date.",
      "Participation is recorded once per day per player and flows into every other screen.",
    ],
  },
  {
    t: "GPS import",
    d: [
      "Drop your provider export and T4P detects Catapult, STATSports, GPEXE, Polar or the T4P template, shows upload progress and reports every player name it could not match so you can fix the mapping.",
      "If your system exports a different layout, download the T4P sample CSV once and configure your provider to match it — after that every upload is one drag.",
      "Sessions can be cut into parts so GPS output lines up with the drills that were actually coached.",
    ],
  },
  {
    t: "Load model, alerts and reports",
    d: [
      "Choose the KPIs that define load for your methodology — distance, high-speed running, sprints, accelerations, decelerations, jumps, max speed, sRPE — and weight them. The composite drives acute, chronic, ACWR, monotony and strain.",
      "Alerts fire on ACWR spikes, weekly load jumps, wellness drops and availability risk, each with a suggested adjustment for tomorrow.",
      "Report templates are configurable per audience, exportable in one click and schedulable for a chosen cadence and date range.",
    ],
  },
];

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
    a: "Catapult, STATSports, GPEXE and Polar exports are detected automatically. Any other system can be mapped through the downloadable T4P template.",
  },
  {
    q: "Can I change the ACWR formula?",
    a: "Yes. You pick the KPIs and their weights, so the composite load — and therefore ACWR — reflects your own methodology rather than a fixed formula.",
  },
  {
    q: "Can I edit or delete data after saving?",
    a: "Yes. Players, training days, plan parts, GPS rows, RPE values and test results can all be edited or removed.",
  },
  {
    q: "Is my data protected?",
    a: "Data is stored on European infrastructure and processed under GDPR. See the privacy policy and terms for the full detail.",
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

        <h2 className="mt-12 font-display text-2xl font-semibold uppercase tracking-wide">User manual</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything you need to run the platform day to day.
        </p>
        <div className="mt-6 space-y-4">
          {manual.map((m) => (
            <section key={m.t} className="panel p-4">
              <h3 className="font-display text-base font-semibold uppercase tracking-wide text-primary">{m.t}</h3>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {m.d.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold uppercase tracking-wide">FAQ</h2>
        <div className="mt-6 space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="panel p-4">
              <summary className="cursor-pointer text-sm font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

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
