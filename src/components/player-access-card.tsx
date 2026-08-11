import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Link2, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SectionTitle } from "@/components/perf-ui";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { canWrite } from "@/lib/access";
import { DEFAULT_REPORTS, revokePlayerAccess, savePlayerAccess, type PortalReports } from "@/lib/portal.functions";

const SECTIONS = [
  { key: "wellness", label: "Daily wellness questionnaire", hint: "He answers it every morning" },
  { key: "gps", label: "GPS graphs", hint: "His own running data only" },
  { key: "tests", label: "Fitness test results", hint: "His own testing history" },
  { key: "load", label: "Training effort", hint: "Session load graph" },
] as const;

const METRICS = [
  { key: "distance", label: "Distance" },
  { key: "hsr", label: "High-speed running" },
  { key: "sprint", label: "Sprinting" },
  { key: "accel", label: "Accelerations" },
  { key: "decel", label: "Decelerations" },
] as const;

interface Row {
  id: string;
  code: string;
  email: string | null;
  active: boolean;
  last_login_at: string | null;
  reports: PortalReports | null;
  has_password: boolean;
}

/** Coach-side control panel: create, share, suspend or delete a player's own login. */
export function PlayerAccessCard({ playerId, playerName }: { playerId: string; playerName: string }) {
  const { user } = useAuth();
  const [row, setRow] = useState<Row | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reports, setReports] = useState<PortalReports>(DEFAULT_REPORTS);
  const [busy, setBusy] = useState(false);

  const save = useServerFn(savePlayerAccess);
  const revoke = useServerFn(revokePlayerAccess);
  const portalUrl = typeof window === "undefined" ? "/portal" : `${window.location.origin}/portal`;

  const load = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("player_access")
      .select("id,code,email,active,last_login_at,reports,password_hash")
      .eq("coach_id", user.id)
      .eq("player_id", playerId)
      .maybeSingle();
    if (!data) {
      setRow(null);
      return;
    }
    const r = { ...DEFAULT_REPORTS, ...((data.reports ?? {}) as Partial<PortalReports>) } as PortalReports;
    setRow({
      id: data.id,
      code: data.code,
      email: data.email,
      active: data.active,
      last_login_at: data.last_login_at,
      reports: r,
      has_password: Boolean(data.password_hash),
    });
    setEmail(data.email ?? "");
    setReports(r);
  };

  useEffect(() => {
    void load();
  }, [user?.id, playerId]);

  const submit = async (patch?: Partial<{ active: boolean; reports: PortalReports }>) => {
    if (!canWrite()) {
      toast.error("A team subscription is needed to manage player logins.");
      return;
    }
    setBusy(true);
    try {
      await save({
        data: {
          playerId,
          playerName,
          email: email || null,
          password: password || null,
          active: patch?.active ?? row?.active ?? true,
          reports: patch?.reports ?? reports,
        },
      });
      setPassword("");
      toast.success("Player login saved");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the login");
    } finally {
      setBusy(false);
    }
  };

  const drop = async (remove: boolean) => {
    setBusy(true);
    try {
      await revoke({ data: { playerId, remove } });
      toast.success(remove ? "Login deleted" : "Login suspended");
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel space-y-4 p-4">
      <SectionTitle
        title="Player portal access"
        hint={
          <>
            Give {playerName} his own email and password. He signs in at{" "}
            <span className="font-medium text-foreground">{portalUrl}</span> and sees only his own data — never another player.
          </>
        }
        right={
          row ? (
            <span className={`text-xs font-semibold ${row.active ? "text-success" : "text-muted-foreground"}`}>
              {row.active ? "Active" : "Suspended"}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No access yet</span>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Player email</span>
          <input
            className="control"
            type="email"
            placeholder="player@club.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow">{row?.has_password ? "New password (leave empty to keep)" : "Password"}</span>
          <input
            className="control"
            type="text"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>

      <div>
        <p className="eyebrow mb-2">What he can open</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SECTIONS.map((s) => (
            <label key={s.key} className="flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 accent-[var(--color-primary)]"
                checked={reports[s.key]}
                onChange={(e) => setReports({ ...reports, [s.key]: e.target.checked })}
              />
              <span>
                {s.label}
                <span className="block text-xs text-muted-foreground">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {reports.gps ? (
        <div>
          <p className="eyebrow mb-2">GPS metrics he may see (graphs only, no numbers)</p>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => {
              const on = reports.metrics.includes(m.key);
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() =>
                    setReports({
                      ...reports,
                      metrics: on ? reports.metrics.filter((x) => x !== m.key) : [...reports.metrics, m.key],
                    })
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          <KeyRound className="size-4" /> {row ? "Save access" : "Create login"}
        </button>
        {row ? (
          <>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              onClick={() => {
                void navigator.clipboard.writeText(
                  `${portalUrl}\nEmail: ${row.email ?? "—"}\nAccess code: ${row.code}`,
                );
                toast.success("Portal link copied");
              }}
            >
              <Link2 className="size-4" /> Copy portal link
            </button>
            <button
              type="button"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              onClick={() => (row.active ? void drop(false) : void submit({ active: true }))}
            >
              <ShieldOff className="size-4" /> {row.active ? "Suspend access" : "Re-activate"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
              onClick={() => {
                if (window.confirm(`Delete ${playerName}'s login completely?`)) void drop(true);
              }}
            >
              <Trash2 className="size-4" /> Delete login
            </button>
          </>
        ) : null}
      </div>

      {row ? (
        <p className="text-xs text-muted-foreground">
          Backup access code <span className="font-mono">{row.code}</span> · last sign-in{" "}
          {row.last_login_at ? row.last_login_at.slice(0, 16).replace("T", " ") : "never"}
        </p>
      ) : null}
    </div>
  );
}
