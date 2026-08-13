/**
 * Built-in answer book for the communication centre.
 *
 * Every entry is written from the platform documentation, so a customer
 * question can be answered instantly, with no AI request and no credit spend.
 * The owner always sees the full conversation and can add his own reply.
 */

export type KnowledgeEntry = {
  id: string;
  /** Lowercase keywords; a question matches when enough of them appear. */
  keywords: string[];
  answer: string;
};

export const SUPPORT_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "overview",
    keywords: [
      "how this platform works", "how the platform works", "how it works", "platform", "works", "work",
      "overview", "getting started", "get started", "start", "begin", "what can i do", "features",
    ],
    answer:
      "In short, T4P follows one line: team → players → what they do. 1) Create the club, team and season in Team & players and add your squad (or let a GPS upload create the missing names). 2) Plan the week in Calendar and build each session in Training Designer as blocks with minutes, planned RPE and drill tags. 3) After the session, upload the GPS file or type duration + RPE — both feed the same load model, so ACWR, monotony and strain are always complete. 4) Players answer the daily wellness questionnaire in the portal. 5) Analytics & reports then answers any question the same way every time: choose the report (GPS, fitness tests, training, wellness), choose who (whole squad, several players, one player), then the KPI, the dates and the chart. Wellness & alerts watches the thresholds in the background and anything triggered lands in your notifications. The full step-by-step manual is at /manual.",
  },
  {

    id: "subscription-price",
    keywords: ["price", "pricing", "cost", "how much", "69", "per month", "fee", "expensive"],
    answer:
      "T4P is €69.90 per month per team, billed monthly and cancellable at any time. One account manages one team with unlimited players, sessions, GPS files and reports. You can see the full breakdown on the Pricing page.",
  },
  {
    id: "cancel",
    keywords: ["cancel", "stop", "unsubscribe", "renew", "renewal", "expire", "expired"],
    answer:
      "Open Account → Subscription and switch automatic renewal off. You keep full access until the end of the month you already paid for. After that the workspace becomes read-only: nothing is deleted, you can still open every page, read every report and export your data, and editing returns the moment you subscribe again.",
  },
  {
    id: "payment-failed",
    keywords: ["payment", "invoice", "receipt", "billing", "card", "failed", "charge"],
    answer:
      "Every billing event appears in your notifications and in Account → Subscription. If a payment failed, the account stays read-only until it is settled; reply here with the date of the attempt and we will check it against the record on our side.",
  },
  {
    id: "read-only",
    keywords: ["read only", "read-only", "cannot edit", "can't edit", "locked", "view only", "no access"],
    answer:
      "Read-only means your subscription is not active yet or has lapsed. You can browse every page and export your data, but saving is blocked. Activate the monthly subscription from Account → Subscription and full editing is unlocked immediately.",
  },
  {
    id: "team-create",
    keywords: ["create team", "new team", "second team", "another team", "team limit"],
    answer:
      "Go to Team & players and name the club, the team and the season. There is one team per account — that keeps the data, the load model and the reports unambiguous. If you need a second team, use a second account.",
  },
  {
    id: "delete-data",
    keywords: ["delete", "remove", "erase", "wipe", "start from scratch", "reset"],
    answer:
      "Team & players has a Danger Zone at the bottom. You can export everything first (one JSON file with team, players, sessions, GPS and tests) and then delete the team and all of its records. Deletion cannot be undone.",
  },
  {
    id: "add-players",
    keywords: ["add player", "new player", "squad", "roster", "player list", "import players"],
    answer:
      "Two ways: type them in from Team & players, or skip it entirely and upload a GPS file — every name in the file that is not in the squad is flagged, and 'Create missing players' adds them with their history attached. Shirt number, date of birth, height and weight can be filled in afterwards.",
  },
  {
    id: "gps-upload",
    keywords: ["gps", "upload", "import", "catapult", "statsports", "gpexe", "polar", "csv", "excel", "file"],
    answer:
      "Open GPS reports → upload and drag the file straight out of your GPS software — Catapult, STATSports, GPEXE, Polar or your own club layout. Columns are detected automatically, players are matched by name, and you attach the file to a planned session or let it create the activity for that date.",
  },
  {
    id: "load-model",
    keywords: ["load", "load model", "kpi weight", "weighting", "how is load calculated", "training load"],
    answer:
      "Load is calculated from the KPIs you choose and the weight you give each one — distance, high-speed running, accelerations, decelerations and jumps. Each player is measured against his own reference, so the load is individual. On days with no GPS, duration × RPE (0-10) gives the load instead, and both add up on the same weekly line.",
  },
  {
    id: "acwr",
    keywords: ["acwr", "acute", "chronic", "monotony", "strain", "sweet spot"],
    answer:
      "ACWR is the 7-day acute load divided by the 28-day chronic load, using the same composite load as everywhere else in the platform. The sweet spot is 0.8-1.3; below that is undertraining, above 1.5 is the high-risk zone. Monotony is the weekly mean divided by the weekly standard deviation, and strain is weekly load × monotony.",
  },
  {
    id: "rpe",
    keywords: ["rpe", "session rpe", "srpe", "rating", "manual load", "no gps"],
    answer:
      "RPE is entered after the session, because you cannot know it in advance. Open the session, type the duration and the 0-10 rating, and the load is shown before you save. Gym, indoor and untracked sessions therefore still count towards ACWR, monotony, strain and every report.",
  },
  {
    id: "training-design",
    keywords: ["training designer", "block", "session design", "drill", "duplicate", "template"],
    answer:
      "Training Designer builds a session from blocks: minutes, planned RPE, a drill tag and an optional tactics-board drawing. Blocks can be saved and duplicated, and each block can carry its own GPS report. Tagging a drill once is what lets you ask months later how often you ran it and for how many minutes.",
  },
  {
    id: "tactics-board",
    keywords: ["tactics", "board", "drawing", "pitch", "draw"],
    answer:
      "The Tactics Board is under Tools. Pick the pitch type and orientation, drag players and equipment, draw with the pen, and export as PNG. A board can also be attached to any block inside a training session.",
  },
  {
    id: "wellness",
    keywords: ["wellness", "questionnaire", "sleep", "fatigue", "soreness", "mood", "readiness"],
    answer:
      "Players answer six daily items — sleep, fatigue, soreness, stress, mood and hydration — and the platform derives a readiness score, compared with each player's own baseline. Squad trends, individual histories and flags appear under Wellness & alerts and in every player's profile.",
  },
  {
    id: "player-portal",
    keywords: ["portal", "player login", "player access", "code", "player password"],
    answer:
      "Open a player's profile → Player access. Issue an access code, or an email and password, and the player signs in at /portal on his phone to complete the daily wellness questionnaire and see only his own graphs. You choose which reports each player is allowed to see, and access can be revoked at any time.",
  },
  {
    id: "tests",
    keywords: ["test", "fitness test", "cmj", "yo-yo", "sprint", "fms", "personal best"],
    answer:
      "Fitness tests supports 40+ KPIs — CMJ, sprint splits, Yo-Yo, FMS, anthropometrics and more. Enter a session of results, and personal bests, progression curves and squad rankings are produced automatically.",
  },
  {
    id: "reports",
    keywords: ["report", "analytics", "compare", "chart", "graph", "kpi", "export pdf", "print"],
    answer:
      "Every analysis page works the same way: choose the report (GPS, fitness tests, training, wellness), choose who (whole squad, several players or one), then the KPI, the dates and the chart type. Any chart or table can be printed or exported to PDF from the button in its header.",
  },
  {
    id: "export",
    keywords: ["export", "download", "backup", "json", "leave"],
    answer:
      "Team & players → Export downloads your whole workspace as one JSON file — team, players, sessions, GPS history, tests and wellness. Individual reports export to PDF from the chart header. Exports stay available even when the account is read-only.",
  },
  {
    id: "alerts",
    keywords: ["alert", "threshold", "notification", "notify", "warning", "recommended settings"],
    answer:
      "Wellness & alerts runs automatic checks after every upload or entry: ACWR spikes, sudden weekly load jumps, wellness drops and availability risks. You can move each threshold, and 'Back to recommended settings' restores the sports-science defaults. Anything triggered arrives in your notifications.",
  },
  {
    id: "logbook",
    keywords: ["logbook", "history", "season record", "audit"],
    answer:
      "The logbook is the scrollable season record: every completed session with its RPE and load, switchable between session view, player view and pivot summaries. It is the audit trail behind every number in analytics.",
  },
  {
    id: "demo",
    keywords: ["demo", "try", "sandbox", "test drive"],
    answer:
      "The live demo at /demo is a sandbox with one team and five players. It behaves exactly like the real platform except that nothing is saved to your account and exports are disabled.",
  },
  {
    id: "password",
    keywords: ["password", "reset password", "forgot", "sign in", "login", "log in", "email change"],
    answer:
      "Use 'Forgot password' on the sign-in page and a reset link is emailed to you. Sign-in is email and password only. If the email address on the account is wrong, reply here with the correct one and we will change it for you.",
  },
  {
    id: "mobile",
    keywords: ["mobile", "phone", "tablet", "app", "install", "offline"],
    answer:
      "T4P runs in the browser on any device and can be installed to the home screen from your browser menu. Coaches usually plan on a laptop and check the pitch-side pages on a phone; players use the portal on a phone.",
  },
  {
    id: "manual",
    keywords: ["manual", "guide", "documentation", "how to use", "tutorial", "help"],
    answer:
      "The platform manual is public and covers every section chapter by chapter, with a step-by-step walkthrough from creating the team to reading the reports. You can open it at /manual at any time.",
  },
  {
    id: "privacy",
    keywords: ["gdpr", "privacy", "data protection", "who can see", "secure", "security"],
    answer:
      "Your workspace is visible only to your account; no other coach or club can see it. Players only ever see their own data through the portal. Data is stored in the EU, exportable at any time and deletable on request — the Privacy page has the full detail.",
  },
];

const STOP = new Set([
  "the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "are", "do", "does",
  "how", "what", "why", "can", "i", "you", "my", "me", "it", "this", "that", "with", "we",
]);

function normalise(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Returns the best matching answer for a customer question, or null when the
 * question is too specific to be answered from the answer book.
 */
export function findSupportAnswer(question: string): KnowledgeEntry | null {
  const q = normalise(question);
  if (q.length < 3) return null;
  const words = new Set(q.split(" ").filter((w) => w.length > 2 && !STOP.has(w)));

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of SUPPORT_KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (kw.includes(" ")) {
        if (q.includes(kw)) score += 3;
      } else if (words.has(kw)) {
        score += 2;
      } else if (q.includes(kw)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= 2 ? best : null;
}

export const SUPPORT_FALLBACK =
  "Thanks for the message — it has been logged and a person from T4P will come back to you here. In the meantime the platform manual covers every section step by step at /manual.";
