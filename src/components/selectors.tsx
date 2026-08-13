import { useState } from "react";
import { MultiSelectField, SelectField } from "@/components/pickers";
import { fullName, players as allPlayers, type Player } from "@/data/performance";

export type Scope = "team" | "average" | "players";

/**
 * "For who?" — the same standardised drop-down flow used on every report:
 * pick the scope, then (when needed) pick the athletes from a searchable list.
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
  const [single, setSingle] = useState(false);

  const options = players.map((player) => ({
    value: player.id,
    label: fullName(player),
    hint: player.position,
  }));

  const scopeValue = scope === "players" ? (single ? "single" : "multiple") : scope;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <SelectField
        label="For who"
        value={scopeValue}
        onChange={(value) => {
          if (value === "single") {
            setSingle(true);
            onScope("players");
            onPicked(picked.slice(0, 1));
            return;
          }
          setSingle(false);
          onScope(value === "multiple" ? "players" : (value as Scope));
        }}
        options={[
          { value: "team", label: "All players (total)" },
          { value: "average", label: "All players (average)" },
          { value: "multiple", label: "Multiple players" },
          { value: "single", label: "Single player" },
        ]}
      />

      {scope === "players" ? (
        <MultiSelectField
          label={single ? "Player" : "Players"}
          values={picked}
          onChange={onPicked}
          options={options}
          max={single ? 1 : max}
          placeholder={single ? "Choose a player…" : "Choose players…"}
          searchPlaceholder="Search player…"
          emptyText="No players yet — add your squad or import a GPS file first."
        />
      ) : null}
    </div>
  );
}

const shiftFrom = (anchor: string, days: number) => {
  const date = new Date(`${anchor}T12:00:00`);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

/** Date range as one drop-down of presets plus exact From / To dates. */
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
  earliest?: string | undefined;
  latest?: string | undefined;
}) {
  const end = latest ?? new Date().toISOString().slice(0, 10);
  const presets: Array<{ value: string; label: string; from: string; to: string }> = [
    { value: "7", label: "Last 7 days", from: shiftFrom(end, 6), to: end },
    { value: "28", label: "Last 28 days", from: shiftFrom(end, 27), to: end },
    { value: "90", label: "Last 90 days", from: shiftFrom(end, 89), to: end },
    { value: "all", label: "All data", from: earliest ?? shiftFrom(end, 365), to: end },
  ];

  const match = presets.find((preset) => preset.from === from && preset.to === to);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SelectField
        label="Date range"
        value={match?.value ?? "custom"}
        onChange={(value) => {
          const preset = presets.find((p) => p.value === value);
          if (preset) onChange(preset.from, preset.to);
        }}
        options={[
          ...presets.map((preset) => ({ value: preset.value, label: preset.label })),
          ...(match ? [] : [{ value: "custom", label: "Custom dates" }]),
        ]}
      />
      <label className="flex min-w-0 flex-col gap-1">
        <span className="eyebrow">From</span>
        <input type="date" className="control w-full" value={from} onChange={(event) => onChange(event.target.value, to)} />
      </label>
      <label className="flex min-w-0 flex-col gap-1">
        <span className="eyebrow">To</span>
        <input type="date" className="control w-full" value={to} onChange={(event) => onChange(from, event.target.value)} />
      </label>
    </div>
  );
}
