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
  Download,
  LayoutDashboard,
  LifeBuoy,
  Radar,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { T4P } from "@/components/brand-text";

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
      "Create the team once, then add players manually or create the whole squad from the first GPS file.",
      "Open Team & Players and choose a player. Profile, GPS, tests, training, wellness, medical history, reports and login access are all there.",
      "Use Calendar and Training Designer to plan the work, blocks, participation and RPE.",
      "Upload GPS, confirm the player names, create any missing players, then press Import into the session to save the rows.",
      "Check Insights for the latest squad picture and Wellness & Alerts for anything needing action.",
      "In Analytics & Reports choose player(s), KPI and dates, see the result immediately, then export it.",
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
      "Fastest method: upload the first GPS report, then press Create missing players. The unique names become the squad in one click.",
      "Alternative method: go to Squad and press Add player to enter someone manually.",
      "Set position, shirt number, dominant leg, date of birth and availability status (available, partial, individual, injured, ill, rehab).",
      "Open a player to reach one complete record: overview, GPS reports, fitness tests, training, wellness, medical & illness, reports and player login.",
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
    tips: ["A GPS import can create an empty session automatically when the calendar day does not already exist."],
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
      "Open GPS Reports. Choose an existing session, or leave automatic session creation selected.",
      "Drag in your CSV or XLSX export (Catapult, STATSports, GPEXE, Polar or your club's own format). Upload progress is shown live.",
      "The provider and the columns are detected automatically. Confirm the mapping: which column is total distance, high-speed running, sprints, accelerations, decelerations, max speed, player load, jumps…",
      "Any column T4P does not recognise is kept as a Club KPI and becomes available in analytics, alerts and reports like any other metric.",
      "Check Player matching. If the file contains new names, press Create missing players once; the count is unique players, not file rows.",
      "Press Import into the session. Save template only remembers the column mapping; it does not save the GPS rows.",
      "The saved rows appear at the top of GPS Reports, inside every player, and in Analytics & Reports.",
      "If the session was cut into blocks, the load is distributed across the blocks; otherwise it is attached to the whole session.",
    ],
    tips: [
      "You only need to define the mapping once — the same layout is recognised on your next upload.",
      "Download the T4P template from the import page if you prefer to align your export to a fixed layout.",
    ],
  },
  {
    id: "load",
    n: 7,
    title: "Training load — how T4P calculates it",
    why: "Most GPS exports have no training-load column. T4P calculates one individually for every player, from the KPIs you choose, so ACWR, monotony and strain still work with your own file.",
    icon: Radar,
    color: "#d97706",
    to: "/gps",
    linkLabel: "Open the load model",
    steps: [
      "Open GPS Reports. The card 'Training load model' is on both the Reports and the Import tab.",
      "Choose the formula. 'Squad-ratio composite' is the recommended one and is the same method used in the original Salamina FC training-monitor workbook.",
      "Choose the KPIs and their weights. Weight 0 means the KPI is not used. Distance, high-speed running, sprint distance, accelerations, decelerations and jumps are on by default; any club KPI found in your own upload can be added too.",
      "The load is INDIVIDUAL. Every player-session row gets its own load number, built only from that player's own values on that day — never from the squad's numbers of that day.",
      "The squad average is only the scale, not the value. Each KPI is divided by a team reference number (the average of that KPI across every player-session you have imported) so metres, counts, joules and jump counts can be added into one figure without unit problems.",
      "The result appears as the KPI 'Training load (calculated)' in GPS reports, in the CSV export, and feeds acute load, chronic load, ACWR, monotony and strain — all of them per player.",
      "Alternative formula: 'Session RPE (Foster)' = RPE (0-10) x duration in minutes, also per player, if you prefer the perceived-effort route.",
    ],
    tips: [
      "The maths, for one player on one day: Load (AU) = 100 x [ w1 x (his KPI1 / team reference of KPI1) + w2 x (his KPI2 / team reference of KPI2) + … ] / (w1 + w2 + …).",
      "Worked example: reference distance 5,000 m and reference HSR 400 m; a player runs 6,000 m and 600 m HSR with weights 1 and 1.5. Load = 100 x [1 x 1.20 + 1.5 x 1.50] / 2.5 = 138 AU. His team-mate who ran 4,000 m and 200 m HSR on the same day gets 100 x [0.80 + 0.75] / 2.5 = 62 AU. Same session, two different individual loads.",
      "100 AU is an average session for an average player of your squad. 150 AU is 50% harder than your own team's typical session, not harder than another club's.",
      "The team reference uses your whole imported history, not only the day being calculated, so one very easy or very hard day does not move everybody's numbers.",
      "If your export already contains a load, TRIMP or player-load column, T4P keeps it as a club KPI so you can compare it with the calculated one.",
      "Change the weights any time — every historical day is recalculated instantly, nothing is stored twice.",
    ],
  },

  {
    id: "analyse",
    n: 8,
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
    n: 9,
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
    n: 10,
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
    n: 11,
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
    n: 12,
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
    n: 13,
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
    a: "Leave automatic session creation selected. T4P creates an empty activity on the file date, stores the GPS rows there and lets you design the session later.",
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
    a: "Note the page you were on and what you pressed, then contact support from the Account page. T4P support can open your workspace and look at exactly what you see.",
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

  const downloadPdf = () => {
    setQuery("");
    window.setTimeout(() => window.print(), 60);
  };

  return (
    <AppShell
      title="Manual"
      subtitle={<>How <T4P /> works, step by step — from an empty squad to daily decisions</>}
      actions={
        <button
          type="button"
          onClick={downloadPdf}
          className="no-print inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-panel transition-opacity hover:opacity-90"
        >
          <Download className="size-4" /> Download the manual (PDF)
        </button>
      }
    >
      <div className="space-y-7">
        {/* Print-only cover line */}
        <div className="hidden print:block">
          <p className="eyebrow">Training 4 Performance</p>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-wide">User manual</h2>
        </div>

        {/* Hero / index */}
        <section className="no-print overflow-hidden rounded-2xl border border-brand-blue/30 bg-gradient-to-br from-brand-blue/10 via-brand-cyan/5 to-brand-green/10 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="max-w-2xl space-y-2">
              <p className="eyebrow text-brand-blue">User manual</p>
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">
                The whole logic of the platform, chapter by chapter
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Follow the chapters in order the first time. After that, search, jump to a chapter from the coloured
                index below, or go straight to troubleshooting. You can download this page exactly as you see it.
              </p>
            </div>
            <label className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the manual…"
                className="w-full rounded-full border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          <div className="grid gap-2 border-t border-border/60 bg-background/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="group flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-panel"
                style={{ borderColor: `${c.color}40` }}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold"
                  style={{ backgroundColor: `${c.color}1f`, color: c.color }}
                >
                  {c.n}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.title}</span>
                <c.icon className="size-4 shrink-0 opacity-70" style={{ color: c.color }} />
              </a>
            ))}
            <a
              href="#troubleshooting"
              className="group flex items-center gap-3 rounded-xl border border-brand-red/40 bg-card px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-panel"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-red/12 text-brand-red">
                <LifeBuoy className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">Troubleshooting</span>
            </a>
          </div>
        </section>

        {chapters.map((c) => (
          <section
            key={c.id}
            id={c.id}
            className="print-block scroll-mt-28 overflow-hidden rounded-2xl border bg-card shadow-panel"
            style={{ borderColor: `${c.color}45` }}
          >
            <div
              className="flex flex-wrap items-start justify-between gap-3 border-b p-5"
              style={{
                borderColor: `${c.color}33`,
                backgroundImage: `linear-gradient(120deg, ${c.color}1c, transparent 70%)`,
              }}
            >
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className="grid size-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold text-white shadow-panel"
                  style={{ backgroundColor: c.color }}
                >
                  {c.n}
                </span>
                <div className="min-w-0">
                  <p className="eyebrow flex items-center gap-1.5" style={{ color: c.color }}>
                    <c.icon className="size-3.5" /> Chapter {c.n}
                  </p>
                  <h3 className="font-display text-xl font-semibold uppercase tracking-wide">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.why}</p>
                </div>
              </div>
              {c.to ? (
                <Link
                  to={c.to}
                  className="no-print shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
                  style={{ borderColor: `${c.color}66`, color: c.color }}
                >
                  {c.linkLabel ?? "Open"} →
                </Link>
              ) : null}
            </div>

            <ol className="p-4 sm:p-5">
              {c.steps.map((s, i) => (
                <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < c.steps.length - 1 ? (
                    <span
                      className="absolute left-[13px] top-8 h-[calc(100%-1.5rem)] w-px"
                      style={{ backgroundColor: `${c.color}33` }}
                    />
                  ) : null}
                  <span
                    className="relative z-10 mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 bg-card font-display text-xs font-bold"
                    style={{ borderColor: c.color, color: c.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed">{s}</p>
                </li>
              ))}
            </ol>

            {c.tips?.length ? (
              <div className="space-y-2 border-t p-4 sm:p-5" style={{ borderColor: `${c.color}33`, backgroundColor: `${c.color}0d` }}>
                <p className="eyebrow" style={{ color: c.color }}>
                  Good to know
                </p>
                {c.tips.map((t) => (
                  <p key={t} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: c.color }} />
                    <span>{t}</span>
                  </p>
                ))}
              </div>
            ) : null}
          </section>
        ))}

        <section id="troubleshooting" className="print-break-before scroll-mt-28 space-y-4">
          <div className="rounded-2xl border border-brand-red/35 bg-gradient-to-r from-brand-red/10 to-brand-amber/10 p-5">
            <p className="eyebrow text-brand-red">Troubleshooting</p>
            <h3 className="font-display text-xl font-semibold uppercase tracking-wide">
              Common problems and how to solve them
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every scenario coaches hit in the first weeks, with the fix.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {problems.map((p, i) => (
              <div key={p.q} className="print-block rounded-2xl border border-brand-red/25 bg-card p-4 shadow-panel">
                <p className="flex items-start gap-2 text-sm font-semibold">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-red/12 font-display text-xs font-bold text-brand-red">
                    {i + 1}
                  </span>
                  {p.q}
                </p>
                <p className="mt-2 pl-8 text-sm leading-relaxed text-muted-foreground">{p.a}</p>
              </div>
            ))}
            {problems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No result for “{query}”.</p>
            ) : null}
          </div>
        </section>

        <section className="no-print rounded-2xl border border-brand-blue/30 bg-gradient-to-r from-brand-blue/10 to-brand-cyan/10 p-6 text-center">
          <p className="font-display text-lg font-semibold uppercase tracking-wide">Keep the manual with you</p>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground">
            Download this manual exactly as you see it — every chapter, every step, every troubleshooting card — and
            share it with your staff.
          </p>
          <button
            type="button"
            onClick={downloadPdf}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Download className="size-4" /> Download the manual (PDF)
          </button>
        </section>
      </div>
    </AppShell>
  );
}
