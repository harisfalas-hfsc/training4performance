import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  ClipboardPen,
  FileText,
  GitCompare,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  Radar,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/perf-ui";

export const Route = createFileRoute("/_authenticated/manual")({
  head: () => ({
    meta: [
      { title: "User Manual — T4P Training 4 Performance" },
      {
        name: "description",
        content:
          "Step-by-step manual for T4P: build a squad, design and schedule sessions, import and analyse GPS, run fitness tests, read alerts and export reports.",
      },
      { property: "og:title", content: "T4P User Manual" },
      {
        property: "og:description",
        content: "Every workflow of the platform explained step by step, with troubleshooting for the common problems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManualPage,
});

type Chapter = {
  id: string;
  n: number;
  title: string;
  why: string;
  icon: LucideIcon;
  color: string;
  to?: string;
  linkLabel?: string;
  steps: string[];
  tips?: string[];
};

const CHAPTERS: Chapter[] = [
  {
    id: "start",
    n: 1,
    title: "Start here — the logic of T4P",
    why: "Everything in T4P is one connected loop. Understand the loop once and every page makes sense.",
    icon: LayoutDashboard,
    color: "#2563eb",
    to: "/dashboard",
    linkLabel: "Open dashboard",
    steps: [
      "Squad — you create the players. Every player has a passport that carries profile, availability, tests and load history.",
      "Calendar — you plan the days. Each day becomes a session you design, schedule and later mark completed.",
      "Training Designer — you build the session in blocks (warm-up, gym, conditioning, SSG…) with duration and RPE.",
      "GPS Import — after the session you drop in the export from your GPS provider and attach it to that session.",
      "Analytics, Alerts, Compare, Reports — the data is turned into acute/chronic load, ACWR, monotony, alerts and one-click exports.",
      "AI Assistant — asks and answers questions on top of the same data: who is at risk, what to prescribe tomorrow.",
    ],
    tips: [
      "The dashboard is your morning screen: availability, yesterday's load, today's plan and any triggered alerts.",
      "Nothing has to be perfect on day one. Add players, run one session, import one GPS file — the system starts working immediately.",
    ],
  },
  {
    id: "squad",
    n: 2,
    title: "Build your squad",
    why: "The squad is the backbone. GPS rows, tests and load are matched to players by name, so getting names right here saves work later.",
    icon: Users,
    color: "#059669",
    to: "/squad",
    linkLabel: "Open squad",
    steps: [
      "Go to Squad and press Add player.",
      "Fill in first and last name exactly as they appear in your GPS export — this is what the importer matches on.",
      "Set position, shirt number, dominant leg, date of birth and availability status (available, partial, individual, injured, ill, rehab).",
      "Open a player to reach the Player Passport: profile, load, GPS, tests, fitness trends, medical notes.",
      "In the passport press Edit profile to record height, weight, body fat and any anthropometric follow-up.",
      "Change availability whenever the status changes — the dashboard and the sidebar squad-status box update instantly.",
      "You can add as many players as you need; there is no squad limit.",
    ],
    tips: [
      "Release or delete a player from the squad list; the historical data stays attached to the record.",
      "If a name is spelled differently in the GPS file, you can either rename the player here or map the name during import.",
    ],
  },
  {
    id: "calendar",
    n: 3,
    title: "Plan the microcycle in the calendar",
    why: "The calendar is where the week takes shape — matchday minus days, sessions, states and duplicates.",
    icon: CalendarDays,
    color: "#0891b2",
    to: "/calendar",
    linkLabel: "Open calendar",
    steps: [
      "Open Calendar and press the + / Add button on any day.",
      "Give the day a session title and kind (full training, recovery, gym, tactical, matchday…).",
      "Press Open in designer to build the content of that day.",
      "Set the state: scheduled → completed (or pending) once the session actually happened.",
      "Duplicate a good session onto another date instead of rebuilding it from scratch.",
      "Mark key sessions as favourites so you can reuse them as templates all season.",
    ],
    tips: ["A session must exist in the calendar before you can attach GPS data to it — always create the day first."],
  },
  {
    id: "design",
    n: 4,
    title: "Design a session step by step",
    why: "Blocks let you plan and later measure load per part of the session instead of one blurred total.",
    icon: ClipboardPen,
    color: "#7c3aed",
    to: "/training",
    linkLabel: "Open training designer",
    steps: [
      "Step 1 · Setup — pick the date, session kind, location and objective.",
      "Step 2 · Blocks — add blocks (warm-up, activation/prehab, strength, technical, tactical, conditioning, speed & power, SSG, set pieces, cool-down). Each block gets a name, duration, planned RPE and purpose.",
      "Use the drill library and press + on a drill to drop it into the open block; a toast confirms and can scroll you to the block.",
      "For strength blocks prescribe sets, reps, load in kg and rest per exercise.",
      "Sketch the drill on the embedded tactics board: place players, cones, goals, draw runs, zigzags, curves and zones, then export the image for your briefing.",
      "Step 3 · Preview — read the full session sheet: total duration, weighted RPE and planned load.",
      "Step 4 · Data — after the session record actual RPE per player (or per block) and participation.",
      "Step 5 · Load — the session load (RPE × duration) is written to the logbook and feeds acute/chronic load.",
    ],
    tips: [
      "Weighted RPE means a 10-minute RPE 9 block does not count the same as a 40-minute RPE 5 block.",
      "If a player was absent or did individual work, mark it in Step 4 so his load is not overstated.",
    ],
  },
  {
    id: "board",
    n: 5,
    title: "Use the tactics board",
    why: "A drawn drill is understood in two seconds; a written one is not.",
    icon: Activity,
    color: "#16a34a",
    to: "/board",
    linkLabel: "Open tactics board",
    steps: [
      "Pick a tool from the toolbar: player tokens, ball, cones, poles, ladders, hurdles, mannequins, goals.",
      "Tap the pitch to place an item; drag an existing item to move it (it will not duplicate).",
      "Draw runs with the line, dashed, zigzag or curve tool — freehand strokes finish with an arrowhead.",
      "Add zones and text labels to explain rules and space.",
      "Use Undo, Clear and the pitch rotation/orientation toggle to fit your view.",
      "Export as PNG and attach it to your session or send it to the staff group.",
    ],
    tips: ["On mobile you can scroll the page vertically even with your finger on the pitch."],
  },
  {
    id: "gps",
    n: 6,
    title: "Import GPS data (any provider)",
    why: "T4P does not force you into one GPS system. You upload your own export and teach the platform your columns once.",
    icon: Radar,
    color: "#06b6d4",
    to: "/gps",
    linkLabel: "Open GPS import",
    steps: [
      "Open GPS Import and choose the session the data belongs to — an import always has to be attached to a session.",
      "Drag in your CSV or XLSX export (Catapult, STATSports, GPEXE, Polar or your club's own format). Upload progress is shown live.",
      "The provider and the columns are detected automatically. Confirm the mapping: which column is total distance, high-speed running, sprints, accelerations, decelerations, max speed, player load, jumps…",
      "Any column T4P does not recognise is kept as a Club KPI and becomes available in analytics, alerts and reports like any other metric.",
      "Check the mapping report: player names that could not be matched to the squad are listed. Map them to the correct player, or fix the name in the squad.",
      "Confirm the import. The rows are stored against that session and each player.",
      "If the session was cut into blocks, the load is distributed across the blocks; otherwise it is attached to the whole session.",
    ],
    tips: [
      "You only need to define the mapping once — the same layout is recognised on your next upload.",
      "Download the T4P template from the import page if you prefer to align your export to a fixed layout.",
    ],
  },
  {
    id: "analyse",
    n: 7,
    title: "Analyse the GPS and the workload",
    why: "Raw numbers are not information. Acute, chronic, ACWR, monotony and strain tell you what to do tomorrow.",
    icon: BarChart3,
    color: "#4f46e5",
    to: "/analytics",
    linkLabel: "Open analytics",
    steps: [
      "Analytics — pick any of the KPIs (core T4P metrics plus your own Club KPIs) and the period you want to see.",
      "Switch the visualisation between line, bar, area, pie and radar; every chart can be exported as PNG or PDF.",
      "Build your load model: choose which KPIs define load and how much weight each one carries. The composite load in AU drives everything downstream.",
      "Read the derived values: acute load (7 days), chronic load (28 days), ACWR, monotony and strain — per player and for the team.",
      "Compare & Graphs — put players side by side, or one player across periods, on any KPI.",
      "Logbook — the pivot table view of every session, RPE and load, exactly like a training monitor spreadsheet.",
    ],
    tips: [
      "ACWR around 0.8–1.3 is generally the comfortable zone; a sharp spike is what the alerts look for.",
      "The load model considers power and aerobic qualities: distance, HSR, accelerations, decelerations and jumps.",
    ],
  },
  {
    id: "tests",
    n: 8,
    title: "Fitness testing and tracking",
    why: "Testing turns opinion into evidence, and repeated testing shows whether your programme worked.",
    icon: GitCompare,
    color: "#9333ea",
    to: "/squad",
    linkLabel: "Open a player passport",
    steps: [
      "Open a player, go to the Tests / Fitness tab and press Add test.",
      "Choose the test — CMJ, squat jump, sprint 10/20/30 m, Yo-Yo IR1, VO2max, FMS screens, isometric strength, agility, flexibility — or create your own custom test.",
      "Enter the date and the result. The date matters: every test is placed on the calendar timeline.",
      "Repeat the battery at the next testing point (pre-season, mid-season, return to play).",
      "Read the fitness trends chart: previous vs current, percentage change, and personal bests.",
      "Compare the player against the squad reference or against other players on the same test.",
      "Personal bests are also detected from training: if a player hits a higher max speed in a session than in his test, the profile is updated.",
    ],
    tips: ["Test reports can be exported per player or per battery from Reports."],
  },
  {
    id: "alerts",
    n: 9,
    title: "Alerts — let the system watch for you",
    why: "You cannot manually scan 27 players every morning. The thresholds do it for you.",
    icon: BellRing,
    color: "#dc2626",
    to: "/alerts",
    linkLabel: "Open alerts",
    steps: [
      "Open Alerts to see everything currently triggered, grouped by workload, wellness, availability and performance.",
      "Each alert names the player, the reason and a concrete suggestion for tomorrow's session.",
      "Press the settings/thresholds control to tune every rule — ACWR ceiling, weekly load jump %, wellness drop, minutes spike, days since return.",
      "Enable or disable individual rules so you only get the signals you care about.",
      "Choose the KPI a rule watches — including your own Club KPIs.",
      "Act: adjust the block durations or RPE of tomorrow's session in the designer.",
    ],
  },
  {
    id: "ai",
    n: 10,
    title: "Ask the AI assistant",
    why: "The assistant reads the same data you do, so you can ask instead of digging.",
    icon: BrainCircuit,
    color: "#9333ea",
    to: "/ai",
    linkLabel: "Open AI assistant",
    steps: [
      "Ask about a player: \"What is the chronic load of #7 and does he need recovery?\"",
      "Ask about the team: \"Who is above an ACWR of 1.4 this week?\"",
      "Ask for prescriptions: \"Give me a hypertrophy block for the strength room\" or \"a power block before matchday\".",
      "Ask for interpretation of GPS or test results and what to change in the next microcycle.",
    ],
  },
  {
    id: "reports",
    n: 11,
    title: "Reports and one-click exports",
    why: "The head coach, the medical staff and the board each need a different page, not the same page.",
    icon: FileText,
    color: "#ea580c",
    to: "/reports",
    linkLabel: "Open reports",
    steps: [
      "Choose a report template — squad availability, weekly load, player report, testing report, GPS session report.",
      "Pick the audience (head coach, fitness staff, medical staff) and the date range.",
      "Select exactly which KPIs appear in the report.",
      "Preview it, then export in one click and share it.",
      "Individual charts anywhere in the platform can also be exported on their own as PNG or PDF.",
    ],
  },
  {
    id: "logbook",
    n: 12,
    title: "The logbook — your season record",
    why: "One scrollable record of every session, RPE and load, so nothing is lost when the season ends.",
    icon: BookOpen,
    color: "#d97706",
    to: "/logbook",
    linkLabel: "Open logbook",
    steps: [
      "Every completed session with its RPE and load appears automatically.",
      "Scroll horizontally through the season; the table keeps its scrollbars visible.",
      "Switch between session view, player view and pivot summaries.",
      "Use it as the audit trail behind every number in analytics.",
    ],
  },
];

type Problem = { q: string; a: string };

const PROBLEMS: Problem[] = [
  {
    q: "My GPS file uploaded but some players are missing",
    a: "Their names in the file do not match the squad. Open the mapping report shown after the upload and map each unmatched name to the right player, or rename the player in Squad so the two match exactly. Re-import and the rows will attach.",
  },
  {
    q: "My GPS export has different KPIs from yours",
    a: "That is expected — every provider is different. During the mapping step, assign the columns you recognise to T4P metrics and leave the rest: they are stored as Club KPIs and can be charted, alerted on and reported exactly like the built-in metrics.",
  },
  {
    q: "I cannot import GPS — it asks for a session",
    a: "Every import must belong to a session so the load lands on the right day. Create the day in Calendar first, then return to GPS Import and select it.",
  },
  {
    q: "The + button in the drill library seems to do nothing",
    a: "It does add the drill to the currently open block — on a small screen the block is below the library. Use the toast's \"See block\" action or the scroll-to-block button in the library header to jump to it.",
  },
  {
    q: "My session load looks too high or too low",
    a: "Session load is RPE × duration, weighted by block. Check the block durations in Step 2 and the actual RPE in Step 4. If players missed parts of the session, mark participation so their individual load is correct.",
  },
  {
    q: "ACWR looks wrong or empty",
    a: "ACWR needs history: 7 days of acute and up to 28 days of chronic load. Early in the season, or after a gap in imports, the ratio will be unstable until enough sessions are recorded.",
  },
  {
    q: "An alert keeps firing for a player who is fine",
    a: "Open Alerts, go to the thresholds and adjust that rule's limit, or disable the rule. Thresholds are yours to set — the defaults are only a starting point.",
  },
  {
    q: "A player's test result did not update his trend",
    a: "Check the test date. Trends are ordered on the calendar timeline, so a test entered with the wrong date will sit in the wrong place. Edit the date in the player's test list.",
  },
  {
    q: "I cannot scroll the page on the tactics board on my phone",
    a: "You can — vertical scrolling works even with your finger on the pitch. If you are mid-drawing, lift and scroll, or switch to the select tool first.",
  },
  {
    q: "I need to change the club or team name",
    a: "Open Account from the header and update the club and team name; it appears in the header, the reports and the exports.",
  },
  {
    q: "Something still does not work",
    a: "Note the page you were on and what you pressed, then contact support from the Account page. An administrator can open your workspace and look at exactly what you see.",
  },
];

function ManualPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const chapters = useMemo(
    () =>
      !q
        ? CHAPTERS
        : CHAPTERS.filter((c) =>
            [c.title, c.why, ...c.steps, ...(c.tips ?? [])].some((t) => t.toLowerCase().includes(q)),
          ),
    [q],
  );

  const problems = useMemo(
    () => (!q ? PROBLEMS : PROBLEMS.filter((p) => `${p.q} ${p.a}`.toLowerCase().includes(q))),
    [q],
  );

  return (
    <AppShell
      title="Manual"
      subtitle="How T4P works, step by step — from an empty squad to daily decisions"
    >
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="eyebrow">User manual</p>
              <h2 className="text-xl font-semibold">The whole logic of the platform in one page</h2>
              <p className="text-sm text-muted-foreground">
                Follow the chapters in order the first time. After that, use the search box or jump straight to the
                troubleshooting section at the bottom.
              </p>
            </div>
            <label className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the manual…"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <c.icon className="size-3.5" style={{ color: c.color }} />
                {c.n}. {c.title}
              </a>
            ))}
            <a
              href="#troubleshooting"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <LifeBuoy className="size-3.5" style={{ color: "#dc2626" }} />
              Troubleshooting
            </a>
          </div>
        </section>

        {chapters.map((c) => (
          <section
            key={c.id}
            id={c.id}
            className="scroll-mt-28 overflow-hidden rounded-lg border border-border bg-card"
            style={{ borderTop: `3px solid ${c.color}` }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${c.color}1a` }}
                >
                  <c.icon className="size-5" style={{ color: c.color }} />
                </span>
                <div className="min-w-0">
                  <p className="eyebrow" style={{ color: c.color }}>
                    Chapter {c.n}
                  </p>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.why}</p>
                </div>
              </div>
              {c.to ? (
                <Link
                  to={c.to}
                  className="shrink-0 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {c.linkLabel ?? "Open"}
                </Link>
              ) : null}
            </div>

            <ol className="divide-y divide-border">
              {c.steps.map((s, i) => (
                <li key={s} className="flex gap-3 p-4">
                  <span
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${c.color}1a`, color: c.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>

            {c.tips?.length ? (
              <div className="space-y-2 border-t border-border bg-secondary/40 p-4">
                {c.tips.map((t) => (
                  <p key={t} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: c.color }} />
                    <span>{t}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        ))}

        <section id="troubleshooting" className="scroll-mt-28 space-y-3">
          <SectionTitle
            title="Troubleshooting — common problems and how to solve them"
            subtitle="Every scenario coaches hit in the first weeks, with the fix"
          />
          <div className="grid gap-3 md:grid-cols-2">
            {problems.map((p) => (
              <div key={p.q} className="rounded-lg border border-border bg-card p-4">
                <p className="flex items-start gap-2 text-sm font-semibold">
                  <HelpCircle className="mt-0.5 size-4 shrink-0" style={{ color: "#dc2626" }} />
                  {p.q}
                </p>
                <p className="mt-2 pl-6 text-sm text-muted-foreground">{p.a}</p>
              </div>
            ))}
            {problems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No result for “{query}”.</p>
            ) : null}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
