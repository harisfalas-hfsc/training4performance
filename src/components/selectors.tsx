import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fullName, players as allPlayers, type Player } from "@/data/performance";

export type Scope = "team" | "average" | "players";

const chipClass = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
    active ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
  }`;

/**
 * Who am I looking at? Whole squad (totals), squad average, or a hand-picked
 * list of players chosen from a searchable drop-down (no wall of buttons).
 */
export function PlayerPicker({
  scope,
  onScope,
  picked,
  onPicked,
  players = allPlayers,
  max,
}: {
  scope: Scope;
  onScope: (scope: Scope) => void;
  picked: string[];
  onPicked: (ids: string[]) => void;
  players?: Player[];
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? players.filter((p) => fullName(p).toLowerCase().includes(q)) : players;
  }, [players, query]);

  const toggle = (id: string) => {
    if (picked.includes(id)) return onPicked(picked.filter((x) => x !== id));
    if (max && picked.length >= max) return;
    onPicked([...picked, id]);
  };

  const label =
    picked.length === 0
      ? "Choose players…"
      : picked.length === 1
        ? (() => { const p = players.find((x) => x.id === picked[0]); return p ? fullName(p) : "1 player selected"; })()
        : `${picked.length} players selected`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chipClass(scope === "team")} onClick={() => onScope("team")}>Whole squad (total)</button>
        <button type="button" className={chipClass(scope === "average")} onClick={() => onScope("average")}>Squad average</button>
        <button type="button" className={chipClass(scope === "players")} onClick={() => onScope("players")}>Selected players</button>
      </div>

      {scope === "players" && (
        <div className="space-y-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="control flex w-full max-w-sm items-center justify-between gap-2 text-left text-sm"
              >
                <span className={picked.length ? "" : "text-muted-foreground"}>{label}</span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-0">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="size-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search player…"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs">
                <button
                  type="button"
                  className="font-semibold text-primary disabled:opacity-40"
                  disabled={Boolean(max)}
                  onClick={() => onPicked(filtered.map((p) => p.id))}
                >
                  Select all
                </button>
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => onPicked([])}>
                  Unselect all
                </button>
              </div>
              <div className="max-h-64 overflow-auto py-1">
                {filtered.map((player) => {
                  const active = picked.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => toggle(player.id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary"
                    >
                      <span className={`flex size-4 items-center justify-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                        {active ? <Check className="size-3" /> : null}
                      </span>
                      <span className="truncate">{fullName(player)}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{player.position}</span>
                    </button>
                  );
                })}
                {!filtered.length && <p className="px-3 py-4 text-sm text-muted-foreground">No player matches that name.</p>}
              </div>
            </PopoverContent>
          </Popover>

          {picked.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {picked.map((id) => {
                const player = players.find((p) => p.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {player ? fullName(player) : id}
                    <button type="button" aria-label="Remove player" onClick={() => onPicked(picked.filter((x) => x !== id))}>
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {!players.length && <p className="text-sm text-muted-foreground">No players yet — import a GPS file first.</p>}
        </div>
      )}
    </div>
  );
}

const shift = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

/** Date range with one-click presets so nobody has to scroll a whole season. */
export function DateRangePicker({
  from,
  to,
  onChange,
  earliest,
  latest,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  earliest?: string;
  latest?: string;
}) {
  const end = latest ?? new Date().toISOString().slice(0, 10);
  const presets: Array<{ label: string; from: string; to: string }> = [
    { label: "Last 7 days", from: shift(7), to: end },
    { label: "Last 28 days", from: shift(28), to: end },
    { label: "Last 90 days", from: shift(90), to: end },
    { label: "All data", from: earliest ?? shift(365), to: end },
  ];

  return (
    <div className="flex flex-wrap items-end gap-2">
      {presets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          className={chipClass(from === preset.from && to === preset.to)}
          onClick={() => onChange(preset.from, preset.to)}
        >
          {preset.label}
        </button>
      ))}
      <label className="flex flex-col gap-1">
        <span className="eyebrow">From</span>
        <input type="date" className="control" value={from} onChange={(event) => onChange(event.target.value, to)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">To</span>
        <input type="date" className="control" value={to} onChange={(event) => onChange(from, event.target.value)} />
      </label>
    </div>
  );
}
