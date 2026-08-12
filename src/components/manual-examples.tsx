import type { ReactNode } from "react";

/**
 * Illustrated "screenshots" for the user manual.
 * These are static, print-safe mock-ups of real T4P screens built with plain markup,
 * so they render identically on mobile, desktop and in the PDF export.
 */

function Shot({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure className="print-block my-0 overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-brand-red/60" />
          <span className="size-2 rounded-full bg-brand-amber/60" />
          <span className="size-2 rounded-full bg-brand-green/60" />
        </span>
        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="overflow-x-auto p-3">
        <div className="min-w-[280px]">{children}</div>
      </div>
      {caption ? (
        <figcaption className="border-t border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="block truncate rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs">{value}</span>
    </label>
  );
}

function Btn({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "ghost" }) {
  return (
    <span
      className={
        tone === "primary"
          ? "inline-block rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
          : "inline-block rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
      }
    >
      {children}
    </span>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <table className="w-full border-collapse text-left text-[11px]">
      <thead>
        <tr>
          {head.map((h) => (
            <th
              key={h}
              className="whitespace-nowrap border-b border-border px-2 py-1.5 font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="align-top">
            {r.map((c, j) => (
              <td key={j} className="whitespace-nowrap border-b border-border/60 px-2 py-1.5">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* 1 — Create the team */
export function ShotCreateTeam() {
  return (
    <Shot
      title="Team & players › Create team"
      caption="One screen, one time. After this the team name follows you into every header, report and export."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <Field label="Club" value="Nicosia United FC" />
        <Field label="Team" value="First team" />
        <Field label="Season" value="2026 / 27" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn>Create team</Btn>
        <span className="text-[11px] text-muted-foreground">One team per account — nothing else to configure.</span>
      </div>
    </Shot>
  );
}

/* 2 — Add a player manually (optional) */
export function ShotAddPlayer() {
  return (
    <Shot
      title="Team & players › Add player"
      caption="Only the name is really needed. Everything else can be filled in later, or never."
    >
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="First name" value="Andreas" />
        <Field label="Last name" value="Petrou" />
        <Field label="Shirt" value="7" />
        <Field label="Position" value="Winger" />
        <Field label="Date of birth" value="14/03/2001" />
        <Field label="Height" value="178 cm" />
        <Field label="Weight" value="72 kg" />
        <Field label="Availability" value="Available" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn>Save player</Btn>
        <Btn tone="ghost">Save and add another</Btn>
      </div>
    </Shot>
  );
}

/* 3 — The GPS file itself */
export function ShotGpsFile() {
  return (
    <Shot
      title="nicosia_2026-08-11_session.csv (your own export)"
      caption="This is what leaves your GPS software. Any provider, any column order — you never reformat it by hand."
    >
      <Table
        head={["Player Name", "Duration", "Total Distance (m)", "HSR (m)", "Sprints", "Acc", "Dec", "Max Speed"]}
        rows={[
          ["Andreas Petrou", "72", "6 240", "612", "14", "31", "28", "31.4"],
          ["Marios Georgiou", "72", "5 480", "398", "9", "24", "22", "29.8"],
          ["Kyriakos Louca", "68", "4 910", "205", "4", "18", "17", "27.1"],
          ["Nikos Charalambous", "72", "6 010", "540", "12", "29", "26", "30.6"],
        ]}
      />
    </Shot>
  );
}

/* 4 — Player matching after upload */
export function ShotGpsMatching() {
  const ok = <span className="font-semibold text-brand-green">Matched</span>;
  const nw = <span className="font-semibold text-brand-amber">New name</span>;
  return (
    <Shot
      title="GPS reports › Import › Player matching"
      caption="Three names already exist, one is new. Press Create missing players once and the squad is complete — no typing."
    >
      <Table
        head={["Name in file", "Squad", "Status"]}
        rows={[
          ["Andreas Petrou", "#7 Andreas Petrou", ok],
          ["Marios Georgiou", "#4 Marios Georgiou", ok],
          ["Kyriakos Louca", "#11 Kyriakos Louca", ok],
          ["Nikos Charalambous", "— not in squad —", nw],
        ]}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn>Create missing players (1)</Btn>
        <Btn tone="ghost">Import into the session</Btn>
      </div>
    </Shot>
  );
}

/* 5 — Calculated training load from that file */
export function ShotCalculatedLoad() {
  return (
    <Shot
      title="GPS reports › Training load (calculated)"
      caption="Every player gets his own load from his own numbers. 100 AU = a typical session for a typical player of your squad."
    >
      <div className="mb-2 rounded-lg border border-border bg-muted/40 px-2.5 py-2 text-[11px] leading-relaxed">
        <strong>Model:</strong> Squad-ratio composite · Distance ×1 · HSR ×1.5 · Sprints ×1 · Acc ×1 · Dec ×1
      </div>
      <Table
        head={["Player", "Distance", "HSR", "Load (AU)", "ACWR"]}
        rows={[
          ["Andreas Petrou", "6 240 m", "612 m", <strong key="a">138</strong>, "1.18"],
          ["Marios Georgiou", "5 480 m", "398 m", <strong key="b">104</strong>, "1.02"],
          ["Kyriakos Louca", "4 910 m", "205 m", <strong key="c">78</strong>, "0.74"],
          ["Nikos Charalambous", "6 010 m", "540 m", <strong key="d">127</strong>, "1.11"],
        ]}
      />
    </Shot>
  );
}

/* 6 — A designed session with blocks */
export function ShotSessionBlocks() {
  return (
    <Shot
      title="Training designer › Tuesday 11/08 · Full training"
      caption="Five blocks, 72 minutes. Planned RPE per block gives the planned load before anyone steps on the pitch."
    >
      <Table
        head={["#", "Block", "Drill tag", "Minutes", "Planned RPE"]}
        rows={[
          ["1", "Warm-up", "Activation circuit", "12", "3"],
          ["2", "Technical", "Rondo 5v2", "15", "5"],
          ["3", "Tactical", "Positional 8v8", "20", "7"],
          ["4", "Conditioning", "SSG 4v4 · 4×3'", "18", "9"],
          ["5", "Cool-down", "Mobility", "7", "2"],
        ]}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        Weighted planned RPE 6.2 · Planned load 446 AU. Tag <strong>Rondo 5v2</strong> once and you can ask later how
        many times and how many minutes the squad did it this season.
      </p>
    </Shot>
  );
}

/* 7 — A strength session */
export function ShotStrengthSession() {
  return (
    <Shot
      title="Training designer › Thursday 13/08 · Gym — lower body strength"
      caption="Strength blocks are prescribed exactly as you write them on paper: sets, reps, load and rest."
    >
      <Table
        head={["Exercise", "Sets", "Reps", "Load", "Rest", "Note"]}
        rows={[
          ["Back squat", "4", "5", "85 kg", "3'", "@RPE 8"],
          ["Bulgarian split squat", "3", "8 / leg", "24 kg", "90\"", "Tempo 3-0-1"],
          ["Nordic hamstring", "3", "6", "Body", "90\"", "Eccentric"],
          ["Copenhagen adduction", "3", "8 / side", "Body", "60\"", "Prevention"],
        ]}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        No vest in the gym, so this session has no GPS. It becomes visible work the moment you rate it — see below.
      </p>
    </Shot>
  );
}

/* 8 — Manual RPE entry */
export function ShotManualRpe() {
  return (
    <Shot
      title="Calendar › Enter session or block RPE"
      caption="Entered after the session, about 20–30 minutes later. Load = RPE × minutes (Foster's session RPE)."
    >
      <div className="grid gap-2 sm:grid-cols-4">
        <Field label="Date" value="13/08/2026" />
        <Field label="Block" value="Gym — lower body" />
        <Field label="Duration" value="45 min" />
        <Field label="RPE (0-10)" value="7" />
      </div>
      <div className="mt-3 rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-3 py-2 text-xs font-semibold">
        7 × 45 = 315 AU — shown before you save
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Btn>Save for the whole squad</Btn>
        <Btn tone="ghost">Player by player</Btn>
      </div>
    </Shot>
  );
}

/* 9 — How the two add up */
export function ShotLoadAccumulation() {
  return (
    <Shot
      title="Andreas Petrou › week of 10–16 August"
      caption="GPS days and rated days sit in the same column. The weekly total, ACWR, monotony and strain use all of them."
    >
      <Table
        head={["Day", "Session", "Source", "GPS load", "Manual RPE load", "Total (AU)"]}
        rows={[
          ["Mon 10", "Recovery", "Rated", "—", "3 × 30 = 90", "90"],
          ["Tue 11", "Full training", "GPS", "138", "—", "138"],
          ["Wed 12", "Full training", "GPS + gym", "121", "6 × 30 = 180", "301"],
          ["Thu 13", "Gym — lower body", "Rated", "—", "7 × 45 = 315", "315"],
          ["Fri 14", "Activation", "GPS", "62", "—", "62"],
          ["Sat 15", "Match", "GPS", "196", "—", "196"],
          [<strong key="t">Week</strong>, "", "", <strong key="g">517</strong>, <strong key="m">585</strong>, <strong key="s">1 102</strong>],
        ]}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        On Wednesday the pitch part was tracked and the gym part was rated, so both count. If a block already has GPS
        attached, a rating for that same block is ignored — you can never double count.
      </p>
    </Shot>
  );
}

/* 10 — WHO → WHAT strip */
export function ShotWhoWhat() {
  return (
    <Shot
      title="Analytics & reports › the only question you ever ask"
      caption="Same three steps on every page: who, what, then the KPI, the dates and the chart."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-brand-blue/40 bg-brand-blue/5 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-blue">1 · Who</p>
          <p className="mt-1 text-[11px] leading-relaxed">
            Whole team · Squad average · <strong>Andreas Petrou, Marios Georgiou</strong>
          </p>
        </div>
        <div className="rounded-lg border border-brand-green/40 bg-brand-green/5 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-green">2 · What</p>
          <p className="mt-1 text-[11px] leading-relaxed">
            <strong>GPS reports</strong> · Training &amp; drills · Fitness tests · Wellness · Medical
          </p>
        </div>
        <div className="rounded-lg border border-brand-amber/40 bg-brand-amber/5 p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-amber">3 · How</p>
          <p className="mt-1 text-[11px] leading-relaxed">
            KPI: Training load · 01–31 Aug · Chart: line / bars / area / pie / radar
          </p>
        </div>
      </div>
    </Shot>
  );
}

/* 11 — Drill history answer */
export function ShotDrillHistory() {
  return (
    <Shot
      title="Analytics › Training & drills › Rondo 5v2 vs Passing drill"
      caption="The question a spreadsheet cannot answer, because you tagged the drill once in the designer."
    >
      <Table
        head={["Drill tag", "Sessions", "Total minutes", "Avg minutes", "Players exposed"]}
        rows={[
          ["Rondo 5v2", "18", "264", "14.7", "24"],
          ["Passing drill", "11", "143", "13.0", "26"],
          ["SSG 4v4", "9", "168", "18.7", "22"],
        ]}
      />
    </Shot>
  );
}

export const MANUAL_SHOTS = {
  createTeam: ShotCreateTeam,
  addPlayer: ShotAddPlayer,
  gpsFile: ShotGpsFile,
  gpsMatching: ShotGpsMatching,
  calculatedLoad: ShotCalculatedLoad,
  sessionBlocks: ShotSessionBlocks,
  strengthSession: ShotStrengthSession,
  manualRpe: ShotManualRpe,
  loadAccumulation: ShotLoadAccumulation,
  whoWhat: ShotWhoWhat,
  drillHistory: ShotDrillHistory,
} as const;

export type ManualShotKey = keyof typeof MANUAL_SHOTS;
