import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Dumbbell, LogIn, Pencil, Plus, Radar, Save, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";
import type { AdminCustomer, AdminWorkspace } from "@/lib/admin.functions";

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string;
  number: number;
  position: string;
  availability: string;
  dominantLeg: string;
  heightCm: number;
  weightKg: number;
  bodyFat: number;
};

const object = (value: Json): Record<string, Json | undefined> =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const playerRows = (value: Json): PlayerRow[] =>
  (Array.isArray(value) ? value : []).map((item, index) => {
    const row = object(item);
    return {
      id: String(row["id"] ?? `admin-${index}`),
      firstName: String(row["firstName"] ?? ""),
      lastName: String(row["lastName"] ?? ""),
      number: Number(row["number"] ?? 0),
      position: String(row["position"] ?? "CM"),
      availability: String(row["availability"] ?? "available"),
      dominantLeg: String(row["dominantLeg"] ?? "Right"),
      heightCm: Number(row["heightCm"] ?? 0),
      weightKg: Number(row["weightKg"] ?? 0),
      bodyFat: Number(row["bodyFat"] ?? 0),
    };
  });

export function AdminCustomerDetail({
  customer,
  workspace,
  busy,
  onBack,
  onSave,
  onSignIn,
}: {
  customer: AdminCustomer;
  workspace: AdminWorkspace;
  busy: boolean;
  onBack: () => void;
  onSave: (team: Json, players: Json) => Promise<void>;
  onSignIn: () => void;
}) {
  const initialTeam = useMemo(() => object(workspace.team), [workspace.team]);
  const [team, setTeam] = useState({
    club: String(initialTeam["club"] ?? customer.club_name ?? ""),
    name: String(initialTeam["name"] ?? customer.team_name ?? "First team"),
    season: String(initialTeam["season"] ?? ""),
    competition: String(initialTeam["competition"] ?? ""),
  });
  const [players, setPlayers] = useState<PlayerRow[]>(() => playerRows(workspace.players));
  const [editing, setEditing] = useState<string | null>(null);
  const sessions = Array.isArray(workspace.sessions) ? workspace.sessions.length : 0;
  const gps = Array.isArray(workspace.gpsHistory) ? workspace.gpsHistory.length : 0;
  const tests = Array.isArray(workspace.manualTests) ? workspace.manualTests.length : 0;

  const save = () => onSave(team as Json, players as unknown as Json);
  const addPlayer = () => {
    const id = `p-admin-${Date.now()}`;
    setPlayers((rows) => [...rows, { id, firstName: "New", lastName: "Player", number: 0, position: "CM", availability: "available", dominantLeg: "Right", heightCm: 0, weightKg: 0, bodyFat: 0 }]);
    setEditing(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft /> Customers</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSignIn}><LogIn /> View as customer</Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}><Save /> Save changes</Button>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <div className="border-b border-border bg-secondary/50 p-5">
          <p className="eyebrow">Customer workspace</p>
          <h2 className="mt-1 text-2xl font-semibold">{customer.full_name || customer.email}</h2>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Club" value={team.club} onChange={(club) => setTeam((v) => ({ ...v, club }))} />
          <Field label="Team" value={team.name} onChange={(name) => setTeam((v) => ({ ...v, name }))} />
          <Field label="Season" value={team.season} onChange={(season) => setTeam((v) => ({ ...v, season }))} />
          <Field label="Competition" value={team.competition} onChange={(competition) => setTeam((v) => ({ ...v, competition }))} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={Users} label="Players" value={players.length} />
        <Metric icon={CalendarDays} label="Sessions" value={sessions} />
        <Metric icon={Radar} label="GPS rows" value={gps} />
        <Metric icon={Dumbbell} label="Test entries" value={tests} />
      </div>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div><p className="eyebrow">Squad</p><h3 className="text-lg font-semibold">All players</h3></div>
          <Button size="sm" onClick={addPlayer}><Plus /> Add player</Button>
        </div>
        {players.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No player records are synced yet. Open this customer workspace once to migrate their existing browser data.</p>
        ) : (
          <div className="divide-y divide-border">
            {players.map((player) => (
              <div key={player.id} className="p-4">
                {editing === player.id ? (
                  <PlayerEditor player={player} onChange={(next) => setPlayers((rows) => rows.map((row) => row.id === player.id ? next : row))} onDone={() => setEditing(null)} />
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md bg-secondary font-semibold">{player.number || "—"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{player.firstName} {player.lastName}</p>
                      <p className="text-xs text-muted-foreground">{player.position} · {player.availability} · {player.weightKg || "—"} kg</p>
                    </div>
                    <Button variant="outline" size="icon" aria-label={`Edit ${player.firstName}`} onClick={() => setEditing(player.id)}><Pencil /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Delete ${player.firstName}`} onClick={() => setPlayers((rows) => rows.filter((row) => row.id !== player.id))}><Trash2 className="text-destructive" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PlayerEditor({ player, onChange, onDone }: { player: PlayerRow; onChange: (player: PlayerRow) => void; onDone: () => void }) {
  const set = (key: keyof PlayerRow, value: string) => onChange({ ...player, [key]: ["number", "heightCm", "weightKg", "bodyFat"].includes(key) ? Number(value) : value });
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
    <Field label="First name" value={player.firstName} onChange={(v) => set("firstName", v)} />
    <Field label="Last name" value={player.lastName} onChange={(v) => set("lastName", v)} />
    <Field label="Number" type="number" value={String(player.number)} onChange={(v) => set("number", v)} />
    <Field label="Position" value={player.position} onChange={(v) => set("position", v)} />
    <Field label="Availability" value={player.availability} onChange={(v) => set("availability", v)} />
    <Field label="Dominant leg" value={player.dominantLeg} onChange={(v) => set("dominantLeg", v)} />
    <Field label="Height (cm)" type="number" value={String(player.heightCm)} onChange={(v) => set("heightCm", v)} />
    <Field label="Weight (kg)" type="number" value={String(player.weightKg)} onChange={(v) => set("weightKg", v)} />
    <Field label="Body fat %" type="number" value={String(player.bodyFat)} onChange={(v) => set("bodyFat", v)} />
    <div className="flex items-end"><Button size="sm" onClick={onDone}>Done</Button></div>
  </div>;
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="field"><span className="field-label">{label}</span><input className="control" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="panel p-4"><div className="flex items-center justify-between"><p className="eyebrow">{label}</p><Icon className="size-4 text-muted-foreground" /></div><p className="metric-value mt-2 text-2xl">{value}</p></div>;
}