import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
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
  Compass,
  HeartPulse,
  Search,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MarketingPage } from "@/components/marketing";
import { useAuth } from "@/lib/auth";
import { T4P } from "@/components/brand-text";
import { MANUAL_SHOTS, type ManualShotKey } from "@/components/manual-examples";

export const Route = createFileRoute("/manual")({
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
  shots?: ManualShotKey[];
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
      "Create the team once. That is the only setup step there is.",
      "Start in whichever order suits you. Either add the players first, or upload the first GPS report and press Create missing players — the squad is built from the file, so nobody has to be typed in twice.",
      "Anything the GPS file cannot give you, you add yourself, only if you want it: position, shirt number, date of birth, height, weight, body fat, medical status, test results, RPE. Nothing is compulsory.",
      "No GPS at all? Nothing above changes. Add the players once, run the session and rate it 0-10 with its duration — the platform produces the same load, ACWR, alerts, charts and reports.",
      "Open Team & Players and choose a player. Profile, GPS, tests, training, wellness, medical history, reports and login access are all on the same record.",
      "Use Calendar and Training Designer to plan the work, blocks, participation and RPE.",
      "Check Insights for the latest squad picture and Wellness & alerts for anything needing action.",
      "In Analytics & Reports (and inside every player) it is always the same two questions: WHO, then WHAT. Then the KPI, the dates and the chart.",
    ],
    tips: [
      "The dashboard is your morning screen: availability, yesterday's load, today's plan and any triggered alerts.",
      "The rule of the platform: type once, never re-type. A name, a duration or a rating is entered in one place and every table, chart, alert and report updates itself.",
      "Nothing has to be perfect on day one. One player, one session, one file — the system starts working immediately.",
    ],

    shots: ["createTeam", "addPlayer"],
  },
  {
    id: "explore",
    n: 2,
    title: "Who \u2192 What \u2014 the one question pattern",
    why: "Every analysis page in T4P asks you the same two questions in the same order, so there is nothing new to learn from page to page.",
    icon: Compass,
    color: "#0ea5e9",
    to: "/analytics",
    linkLabel: "Open analytics",
    steps: [
      "WHO \u2014 choose the whole team, the squad average, one player or several players. It is a searchable picker, so 50 players never become 50 buttons.",
      "WHAT \u2014 choose the source you want to look at: GPS reports, Training & drills, Fitness tests, Wellness, or Medical & availability.",
      "Then choose the KPIs, the date range and the chart type (line, bar, area, pie, radar). The result is drawn immediately \u2014 no Apply button, no reload.",
      "Every source obeys the same three steps, so once you have done it once you can do it everywhere.",
      "The same Who \u2192 What strip lives inside a player: open a player and press the Explore tab. WHO is already that player, so you only choose WHAT.",
      "Export whatever is on screen as PNG, PDF, Excel or CSV without rebuilding anything.",
    ],
    tips: [
      "Training & drills answers the questions a spreadsheet cannot: how many times did we do 'Rondo 5v2', how many minutes in total, which players were exposed to it, and how does it compare with 'Passing drill'.",
      "Tag your drills in the Training Designer once and they stay searchable for the whole season.",
      "Any new kind of data added to the platform later appears as another WHAT source \u2014 the pattern never changes.",
    ],
    shots: ["whoWhat", "drillHistory"],
  },
  {
    id: "squad",
    n: 3,
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
    shots: ["addPlayer"],
  },
  {
    id: "calendar",
    n: 4,
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
    n: 5,
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
    shots: ["sessionBlocks", "strengthSession"],
  },
  {
    id: "board",
    n: 6,
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
    n: 7,
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
    shots: ["gpsFile", "gpsMatching"],
  },
  {
    id: "load",
    n: 8,
    title: "Training load — with or without GPS",
    why: "You do not need a GPS system. With GPS, T4P builds an individual load from the KPIs you choose; without GPS, a 0-10 rating and the duration produce the same load, ACWR, monotony and strain.",
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
      "NO GPS SYSTEM? Use Calendar > 'Enter session or block RPE' (Manual RPE load). Pick the day, pick the block or the whole session, enter the duration in minutes and a 0-10 RPE — the same value for everyone, or athlete by athlete.",
      "Manual load = RPE x minutes (Foster's session RPE). RPE 7 for 45 minutes = 315 AU, shown on screen before you save.",
      "Total day load = GPS load + manual load, per player. That total is what feeds ACWR, monotony, strain, alerts and every report, so a squad with no GPS at all is monitored exactly like a squad with vests.",
      "Alternative: set the whole load model to 'Session RPE (Foster)' if you want the perceived-effort route everywhere, including for imported GPS days that carry an RPE column.",
    ],
    tips: [
      "The maths, for one player on one day: Load (AU) = 100 x [ w1 x (his KPI1 / team reference of KPI1) + w2 x (his KPI2 / team reference of KPI2) + … ] / (w1 + w2 + …).",
      "Worked example: reference distance 5,000 m and reference HSR 400 m; a player runs 6,000 m and 600 m HSR with weights 1 and 1.5. Load = 100 x [1 x 1.20 + 1.5 x 1.50] / 2.5 = 138 AU. His team-mate who ran 4,000 m and 200 m HSR on the same day gets 100 x [0.80 + 0.75] / 2.5 = 62 AU. Same session, two different individual loads.",
      "100 AU is an average session for an average player of your squad. 150 AU is 50% harder than your own team's typical session, not harder than another club's.",
      "The team reference uses your whole imported history, not only the day being calculated, so one very easy or very hard day does not move everybody's numbers.",
      "If your export already contains a load, TRIMP or player-load column, T4P keeps it as a club KPI so you can compare it with the calculated one.",
      "Change the weights any time — every historical day is recalculated instantly, nothing is stored twice.",
      "Strength, gym, indoor, pool and rehab blocks are exactly what manual RPE is for: rate them after the session and they stop being invisible work.",
      "No double counting: if a block already has a GPS file attached, a manual rating for that same block is ignored. Rate blocks, not the whole session, on days that were partly tracked.",
      "RPE is collected AFTER the session, roughly 20-30 minutes later, when the player can judge the whole effort.",
    ],

    shots: ["calculatedLoad", "manualRpe", "loadAccumulation"],
  },

  {
    id: "analyse",
    n: 9,
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
    n: 10,
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
    id: "wellness",
    n: 11,
    title: "Wellness and the player\u2019s own login",
    why: "The cheapest daily data in football is how the player feels \u2014 and the player can type it himself, so you do not have to.",
    icon: HeartPulse,
    color: "#db2777",
    to: "/wellness",
    linkLabel: "Open wellness",
    steps: [
      "Open a player, go to the Player login tab and give him access. He signs in to his own portal and sees only his own data.",
      "The player answers the daily questionnaire in about thirty seconds: sleep, fatigue, soreness, stress and mood, which produce a readiness score.",
      "You see the squad responses of the day in Wellness & alerts, colour-coded, with the players who did not answer clearly marked.",
      "A wellness drop against the player\u2019s own baseline raises an alert automatically \u2014 you do not have to scan the table.",
      "Wellness is a full WHAT source in analytics: pick players, pick wellness KPIs, pick dates and compare them with load.",
      "You can also record injuries and illness in the Medical & illness tab; days lost and availability appear in analytics as their own source.",
    ],
    tips: [
      "If the players cannot use the portal, you can enter wellness for them \u2014 the rest of the system behaves identically.",
      "Wellness plus load is what turns a red ACWR into a decision: high load with dropping readiness is the case to act on.",
    ],
  },
  {
    id: "alerts",
    n: 12,
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
    n: 13,
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
    n: 14,
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
    n: 15,
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

type WalkStep = { shot: ManualShotKey; title: string; text: string };

const WALKTHROUGH: WalkStep[] = [
  {
    shot: "createTeam",
    title: "Step 1 — create the team",
    text: "You subscribe, you sign in, you name the club and the team. That is the entire setup; there is one team per account and no other configuration.",
  },
  {
    shot: "addPlayer",
    title: "Step 2 — add a player (optional, you can skip it)",
    text: "If you already have the list, type the players in. If you do not, skip this completely — the next step will build the squad for you.",
  },
  {
    shot: "gpsFile",
    title: "Step 3 — take the file straight out of your GPS software",
    text: "No reformatting, no template to fill. Catapult, STATSports, GPEXE, Polar or your own club layout: drag the file in as it is.",
  },
  {
    shot: "gpsMatching",
    title: "Step 4 — the players are matched automatically",
    text: "Names already in the squad are matched. New names are flagged, and one press of Create missing players adds them with their history attached. Anything the file cannot give you — shirt number, date of birth, height, weight — you add afterwards if and when you want.",
  },
  {
    shot: "calculatedLoad",
    title: "Step 5 — the training load is calculated for each player",
    text: "You choose which KPIs count and how much each one weighs. Every player gets his own load from his own numbers, and ACWR, monotony and strain follow instantly.",
  },
  {
    shot: "sessionBlocks",
    title: "Step 6 — design a session in blocks",
    text: "Blocks with minutes, planned RPE and a drill tag. Tagging Rondo 5v2 once is what lets you ask, in March, how many times and how many minutes you did it.",
  },
  {
    shot: "strengthSession",
    title: "Step 7 — the gym session, where there is no GPS",
    text: "Sets, reps, kilos, rest. Prescribed exactly as you write it on paper, and reusable next week with one duplicate.",
  },
  {
    shot: "manualRpe",
    title: "Step 8 — rate it afterwards and it stops being invisible",
    text: "You cannot know the RPE in advance, so you enter it after the session. Duration times a 0-10 rating is the load, shown on screen before you save.",
  },
  {
    shot: "loadAccumulation",
    title: "Step 9 — GPS load and rated load add up on the same line",
    text: "Tracked days and rated days sit in one weekly total per player. That total is what drives ACWR, monotony, strain, the alerts and every report — with a GPS system or without one.",
  },
  {
    shot: "whoWhat",
    title: "Step 10 — ask anything the same way",
    text: "Who, then what, then the KPI, the dates and the chart type. Every analysis page in the platform, and every player profile, works exactly like this.",
  },
  {
    shot: "drillHistory",
    title: "Step 11 — the answers a spreadsheet never gave you",
    text: "How many rondos, how many minutes, how many players exposed, and how it compares with the passing drill. All from tags you added while designing, not from extra typing.",
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
    <ManualShell
      title="Manual"
      subtitle={<>How <T4P /> works, step by step — from an empty squad to daily decisions</>}
      actions={
        <button
          type="button"
          onClick={downloadPdf}
          className="no-print inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-panel transition-opacity hover:opacity-90"
        >
          <Download className="size-4" /> <span className="hidden sm:inline">Download</span> PDF
        </button>
      }
    >
      <div className="space-y-7">
        {/* Hero / index */}
        <section className="no-print overflow-hidden rounded-2xl border border-brand-blue/30 bg-gradient-to-br from-brand-blue/10 via-brand-cyan/5 to-brand-green/10 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="max-w-2xl space-y-2">
              <p className="eyebrow text-brand-blue">Chapters</p>
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
            <a
              href="#walkthrough"
              className="group flex items-center gap-3 rounded-xl border border-brand-green/45 bg-card px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-panel"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-green/12 text-brand-green">
                <Sparkles className="size-4" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">Worked example (start here)</span>
            </a>
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

        {!q ? (
          <section id="walkthrough" className="print-block scroll-mt-28 overflow-hidden rounded-2xl border border-brand-green/40 bg-card shadow-panel">
            <div className="border-b border-brand-green/30 bg-gradient-to-r from-brand-green/12 to-brand-blue/10 p-5">
              <p className="eyebrow text-brand-green">Worked example</p>
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide">
                From an empty account to your first week — screen by screen
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Follow this once with the fictional Nicosia United FC and you will know the whole platform. Every
                screen below is a real <T4P /> screen with example data in it.
              </p>
            </div>
            <div className="space-y-5 p-4 sm:p-5">
              {WALKTHROUGH.map((w, i) => {
                const Shot = MANUAL_SHOTS[w.shot];
                return (
                  <div key={w.shot} className="print-block space-y-2.5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-green/15 font-display text-xs font-bold text-brand-green">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{w.title}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{w.text}</p>
                      </div>
                    </div>
                    <div className="sm:pl-10">
                      <Shot />
                    </div>
                  </div>
                );
              })}
              <div className="rounded-xl border border-brand-blue/35 bg-brand-blue/8 p-4">
                <p className="text-sm font-semibold">That is the whole loop.</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Team → players (typed or created from the file) → sessions → GPS and/or a 0-10 rating → one load
                  number per player per day → ACWR, alerts, charts and reports that write themselves. Nothing above
                  was typed twice, and a club with no GPS at all skips only steps 3 and 4.
                </p>
              </div>
            </div>
          </section>
        ) : null}

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

            {c.shots?.length ? (
              <div
                className="space-y-3 border-t p-4 sm:p-5"
                style={{ borderColor: `${c.color}33`, backgroundColor: `${c.color}08` }}
              >
                <p className="eyebrow" style={{ color: c.color }}>
                  What it looks like
                </p>
                {c.shots.map((k) => {
                  const Shot = MANUAL_SHOTS[k];
                  return <Shot key={k} />;
                })}
              </div>
            ) : null}

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
    </ManualShell>
  );
}

function ManualShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { session } = useAuth();
  if (session) {
    return (
      <AppShell title={title} subtitle={subtitle} actions={actions}>
        {children}
      </AppShell>
    );
  }
  return (
    <MarketingPage>
      <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-5">
        <p className="page-eyebrow">Platform manual</p>
        <h1 className="mt-3 font-display text-4xl font-semibold uppercase tracking-wide">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
        {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </MarketingPage>
  );
}
