import type { ReactNode } from "react";

/**
 * Desktop-only "screenshots" for the homepage.
 * Static mock-ups of real T4P screens (demo team data) built with plain markup,
 * so they stay crisp at any size and need no image assets.
 */

export function Frame({
  path,
  children,
  className = "",
}: {
  path: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-background shadow-panel ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-destructive/60" />
        <span className="size-2.5 rounded-full bg-warning/60" />
        <span className="size-2.5 rounded-full bg-success/60" />
        <span className="ml-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          {path}
        </span>
      </div>
      <div className="text-left">{children}</div>
    </div>
  );
}

function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "ok" | "warn" | "bad" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    ok: "bg-success/15 text-success",
    warn: "bg-warning/15 text-warning",
    bad: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------- Squad management ---------- */
export function ShotSquad() {
  const players = [
    ["1", "L. Andreou", "Goalkeeper", "Available", "ok", "0.94"],
    ["4", "M. Petrou", "Defender", "Available", "ok", "1.08"],
    ["8", "K. Georgiou", "Midfielder", "Modified", "warn", "1.41"],
    ["11", "A. Nicolaou", "Winger", "Available", "ok", "1.21"],
    ["9", "S. Christou", "Striker", "Rehab", "bad", "0.62"],
  ] as const;
  return (
    <Frame path="t4p / team & players">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide">T4P — squad</p>
          <p className="text-[0.7rem] text-muted-foreground">5 players · season 2026/27</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-[0.7rem] text-muted-foreground">
          Search player…
        </span>
      </div>
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">
            {["#", "Player", "Position", "Status", "ACWR"].map((h) => (
              <th key={h} className="border-b border-border px-4 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p[0]}>
              <td className="border-b border-border/60 px-4 py-2.5 font-mono text-muted-foreground">{p[0]}</td>
              <td className="border-b border-border/60 px-4 py-2.5 font-semibold">{p[1]}</td>
              <td className="border-b border-border/60 px-4 py-2.5 text-muted-foreground">{p[2]}</td>
              <td className="border-b border-border/60 px-4 py-2.5">
                <Pill tone={p[4] as "ok" | "warn" | "bad"}>{p[3]}</Pill>
              </td>
              <td className="border-b border-border/60 px-4 py-2.5 font-mono">{p[5]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

/* ---------- Training calendar ---------- */
export function ShotCalendar() {
  const days = [
    { d: "Mon", md: "MD+1", s: ["Recovery", "Gym — upper"], load: 210 },
    { d: "Tue", md: "MD-4", s: ["Rondo 5v2", "SSG 4v4"], load: 620 },
    { d: "Wed", md: "MD-3", s: ["Back squat", "Pitch — speed"], load: 745 },
    { d: "Thu", md: "MD-2", s: ["Tactics board", "Passing drill"], load: 540 },
    { d: "Fri", md: "MD-1", s: ["Activation", "Set pieces"], load: 300 },
    { d: "Sat", md: "MD", s: ["Match"], load: 910 },
    { d: "Sun", md: "OFF", s: ["Individual"], load: 120 },
  ];
  return (
    <Frame path="t4p / calendar">
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day) => (
          <div key={day.d} className="bg-background p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xs font-semibold uppercase tracking-wide">{day.d}</span>
              <span className="font-mono text-[0.6rem] text-muted-foreground">{day.md}</span>
            </div>
            <div className="mt-2 space-y-1">
              {day.s.map((s) => (
                <p
                  key={s}
                  className="truncate rounded border-l-2 border-primary bg-primary/10 px-1.5 py-1 text-[0.65rem]"
                >
                  {s}
                </p>
              ))}
            </div>
            <div className="mt-3 h-14 rounded bg-surface-2/60 p-1">
              <div
                className="w-full rounded-sm bg-primary/80"
                style={{ height: `${Math.round((day.load / 910) * 100)}%`, marginTop: `${100 - Math.round((day.load / 910) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-center font-mono text-[0.6rem] text-muted-foreground">{day.load} AU</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ---------- Tactics board ---------- */
function ToolIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex flex-col items-center gap-1">
      <span className="grid size-9 place-items-center rounded-lg border border-border bg-background">
        <svg viewBox="0 0 24 24" className="size-5">
          {children}
        </svg>
      </span>
      <span className="text-[0.55rem] uppercase tracking-wide text-muted-foreground">{label}</span>
    </span>
  );
}

export function ShotTacticsBoard() {
  return (
    <Frame path="t4p / tactics board">
      <div className="flex gap-3 p-3">
        <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface-2/50 p-2">
          <ToolIcon label="Player">
            <circle cx="12" cy="12" r="7" fill="var(--color-primary)" />
          </ToolIcon>
          <ToolIcon label="Cone">
            <path d="M12 4 19 20H5Z" fill="var(--color-brand-amber)" />
          </ToolIcon>
          <ToolIcon label="Pole">
            <rect x="10.5" y="3" width="3" height="18" rx="1.5" fill="var(--color-brand-red)" />
          </ToolIcon>
          <ToolIcon label="Hurdle">
            <path d="M4 20V9h16v11M4 9l8-5 8 5" fill="none" stroke="var(--color-brand-violet)" strokeWidth="2" />
          </ToolIcon>
          <ToolIcon label="Ball">
            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.4" />
          </ToolIcon>
          <ToolIcon label="Run">
            <path d="M4 18 20 6" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M20 6h-6M20 6v6" stroke="currentColor" strokeWidth="2" fill="none" />
          </ToolIcon>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden rounded-xl">
          <svg viewBox="0 0 600 380" className="block w-full" role="img" aria-label="Tactics board with a rondo drill">
            <rect width="600" height="380" fill="var(--color-pitch)" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={i * 100} y="0" width="50" height="380" fill="#ffffff" opacity="0.04" />
            ))}
            <g stroke="var(--color-pitch-line)" strokeWidth="2.5" fill="none">
              <rect x="16" y="16" width="568" height="348" />
              <line x1="300" y1="16" x2="300" y2="364" />
              <circle cx="300" cy="190" r="56" />
              <rect x="16" y="105" width="86" height="170" />
              <rect x="498" y="105" width="86" height="170" />
              <rect x="16" y="150" width="34" height="80" />
              <rect x="550" y="150" width="34" height="80" />
            </g>

            {/* rondo grid of cones */}
            <g fill="var(--color-brand-amber)">
              {([
                [180, 90],
                [420, 90],
                [180, 290],
                [420, 290],
              ] as [number, number][]).map(([x, y]) => (
                <path key={`${x}-${y}`} d={`M${x} ${y - 14} L${x + 12} ${y + 10} L${x - 12} ${y + 10} Z`} />
              ))}
            </g>

            {/* poles */}
            <g>
              {([
                [300, 60],
                [300, 320],
              ] as [number, number][]).map(([x, y]) => (
                <rect key={y} x={x - 3} y={y - 22} width="6" height="44" rx="3" fill="var(--color-brand-red)" />
              ))}
            </g>


            {/* attackers */}
            {[
              [200, 140, "7"],
              [400, 140, "10"],
              [200, 240, "4"],
              [400, 240, "11"],
              [300, 110, "8"],
            ].map(([x, y, n]) => (
              <g key={String(n)}>
                <circle cx={x as number} cy={y as number} r="17" fill="var(--color-primary)" />
                <text
                  x={x as number}
                  y={(y as number) + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="#ffffff"
                >
                  {n}
                </text>
              </g>
            ))}

            {/* defenders */}
            {[
              [270, 195, "A"],
              [340, 215, "B"],
            ].map(([x, y, n]) => (
              <g key={String(n)}>
                <circle cx={x as number} cy={y as number} r="17" fill="var(--color-brand-red)" />
                <text
                  x={x as number}
                  y={(y as number) + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="#ffffff"
                >
                  {n}
                </text>
              </g>
            ))}

            {/* passing lines */}
            <g stroke="#ffffff" strokeWidth="3" fill="none" strokeDasharray="10 8" opacity="0.9">
              <path d="M217 140 L383 140" />
              <path d="M400 157 L400 223" />
              <path d="M383 240 L217 240" />
            </g>
            {/* run arrow */}
            <g stroke="var(--color-brand-amber)" strokeWidth="4" fill="none">
              <path d="M300 130 C 330 170, 270 210, 300 300" />
              <path d="M292 288 L300 306 L308 288" />
            </g>

            <circle cx="240" cy="140" r="7" fill="#ffffff" stroke="var(--color-pitch)" strokeWidth="2" />
          </svg>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5 text-[0.65rem] text-muted-foreground">
        <Pill>Rondo 5v2</Pill>
        <Pill>Full pitch</Pill>
        <Pill>Landscape</Pill>
        <span className="ml-auto">Saved to Tuesday · MD-4 · Block 2</span>
      </div>
    </Frame>
  );
}

/* ---------- GPS import ---------- */
export function ShotGpsImport() {
  const rows = [
    ["L. Andreou", "62", "4 120", "180", "8", "12", "9", "318"],
    ["M. Petrou", "78", "7 940", "612", "21", "34", "28", "704"],
    ["K. Georgiou", "78", "9 210", "735", "26", "41", "37", "812"],
    ["A. Nicolaou", "70", "8 480", "980", "34", "38", "31", "845"],
    ["S. Christou", "45", "4 960", "540", "19", "22", "18", "471"],
  ];
  return (
    <Frame path="t4p / gps reports">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 text-[0.7rem]">
        <span className="rounded-lg border border-dashed border-primary/60 bg-primary/5 px-3 py-1.5 font-semibold text-primary">
          T4P_MD-4_2026-08-11.csv
        </span>
        <Pill tone="ok">Provider detected: Catapult</Pill>
        <Pill tone="ok">5 / 5 players matched</Pill>
        <span className="ml-auto text-muted-foreground">Block 2 · Pitch</span>
      </div>
      <table className="w-full border-collapse text-left text-[0.7rem]">
        <thead>
          <tr className="text-[0.55rem] uppercase tracking-widest text-muted-foreground">
            {["Player", "Min", "Distance", "HSR", "Sprints", "Acc", "Dec", "Load"].map((h) => (
              <th key={h} className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td
                  key={i}
                  className={`whitespace-nowrap border-b border-border/60 px-3 py-2 ${
                    i === 0 ? "font-semibold" : "font-mono text-muted-foreground"
                  } ${i === r.length - 1 ? "font-mono font-semibold text-foreground" : ""}`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-border px-4 py-2.5 text-[0.65rem] text-muted-foreground">
        Training load is calculated from your own KPI weights — distance, HSR, accelerations,
        decelerations and jumps.
      </div>
    </Frame>
  );
}
