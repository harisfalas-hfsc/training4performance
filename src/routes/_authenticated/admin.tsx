import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Ban,
  CheckCircle2,
  Gift,
  Loader2,
  LogIn,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { ACCESS_MONTH_OPTIONS } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import {
  adminDeleteCustomer,
  adminGetStats,
  adminGrantAccess,
  adminImpersonate,
  adminListCustomers,
  adminListTeams,
  adminRevokeAccess,
  adminSetRole,
  adminUpdateCustomer,
  type AdminCustomer,
  type AdminStats,
  type AdminTeam,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin panel | T4P" },
      { name: "description", content: "T4P administration: customers, access, revenue and workspace usage." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin panel | T4P" },
      { property: "og:description", content: "T4P administration: customers, access, revenue and workspace usage." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const listCustomers = useServerFn(adminListCustomers);
  const listTeams = useServerFn(adminListTeams);
  const getStats = useServerFn(adminGetStats);
  const grantAccess = useServerFn(adminGrantAccess);
  const revokeAccess = useServerFn(adminRevokeAccess);
  const setRole = useServerFn(adminSetRole);
  const updateCustomer = useServerFn(adminUpdateCustomer);
  const deleteCustomer = useServerFn(adminDeleteCustomer);
  const impersonate = useServerFn(adminImpersonate);

  const [tab, setTab] = useState<"customers" | "teams">("customers");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(true);
  const [months, setMonths] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setPending(true);
    const [c, s, t] = await Promise.all([
      listCustomers({ data: { search: search.trim() } }),
      getStats({}),
      listTeams({ data: { search: search.trim() } }),
    ]);
    if ("error" in c) toast.error(c.error);
    else setCustomers(c.customers);
    if ("error" in s) toast.error(s.error);
    else setStats(s.stats);
    if ("error" in t) toast.error(t.error);
    else setTeams(t.teams);
    setPending(false);
  }, [listCustomers, getStats, listTeams, search]);


  useEffect(() => {
    if (isAdmin) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (loading) {
    return (
      <AppShell title="Admin panel">
        <div className="grid place-items-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin panel">
        <div className="panel mx-auto max-w-md p-6 text-center">
          <ShieldAlert className="mx-auto size-8 text-destructive" />
          <h2 className="mt-3 text-lg font-semibold">Administrators only</h2>
          <p className="mt-2 text-sm text-muted-foreground">This area is restricted to the T4P owner account.</p>
        </div>
      </AppShell>
    );
  }

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    const r = (await fn()) as { error?: string };
    setBusy(false);
    if (r?.error) toast.error(r.error);
    else toast.success(ok);
    await reload();
  }

  async function signInAs(c: AdminCustomer) {
    setBusy(true);
    const r = await impersonate({ data: { userId: c.id } });
    if ("error" in r) {
      setBusy(false);
      toast.error(r.error);
      return;
    }
    const { data: current } = await supabase.auth.getSession();
    if (current.session) {
      window.localStorage.setItem(
        "t4p.adminSession",
        JSON.stringify({
          access_token: current.session.access_token,
          refresh_token: current.session.refresh_token,
        }),
      );
    }
    const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: r.tokenHash });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Signed in as ${c.email}`);
    void navigate({ to: "/dashboard" });
  }

  return (
    <AppShell
      title="Admin panel"
      subtitle="Customers, access, revenue and workspace usage"
      actions={
        <button
          type="button"
          onClick={() => void reload()}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium"
        >
          <RefreshCw className={pending ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Customers" value={stats?.customers ?? 0} hint={`${stats?.newCustomers30d ?? 0} new in 30 days`} icon={<Users className="size-4" style={{ color: "#2563eb" }} />} />
        <Stat
          label="Revenue (active season)"
          value={`€${(stats?.revenueEur ?? 0).toLocaleString()}`}
          hint={`${stats?.paying ?? 0} paying · ${stats?.complimentary ?? 0} complimentary`}
          icon={<TrendingUp className="size-4" style={{ color: "#059669" }} />}
        />
        <Stat label="Active subscriptions" value={stats?.activeSubscriptions ?? 0} hint={`${stats?.teams ?? 0} teams created`} icon={<CheckCircle2 className="size-4" style={{ color: "#7c3aed" }} />} />
        <Stat label="Players / sessions" value={`${stats?.players ?? 0} / ${stats?.sessions ?? 0}`} hint={`${stats?.gpsRows ?? 0} GPS rows`} icon={<Shield className="size-4" style={{ color: "#d97706" }} />} />
      </div>

      <div className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void reload()}
            placeholder="Search by email, coach, club or team"
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-md border border-border px-4 text-sm font-medium"
        >
          Search
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {(["customers", "teams"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
              tab === t ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {t === "customers" ? "Customers" : `All teams & squads (${teams.length})`}
          </button>
        ))}
      </div>

      {tab === "teams" && (
        <div className="mt-4 space-y-3">
          {pending ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : teams.length === 0 ? (
            <p className="panel p-8 text-center text-sm text-muted-foreground">No teams created yet.</p>
          ) : (
            teams.map((t) => (
              <article key={t.key} className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {t.club || "No club"} · {t.team}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.ownerName || "Unnamed coach"} · {t.ownerEmail}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[0.65rem]">
                    {t.active ? (
                      <Tag tone="ok">{t.complimentary ? "Complimentary" : "Active"}</Tag>
                    ) : (
                      <Tag tone="off">No access</Tag>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span>Players: {t.players}</span>
                  <span>Sessions: {t.sessions}</span>
                  <span>GPS rows: {t.gps_rows}</span>
                  <span>Tests: {t.tests}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Action disabled={busy} onClick={() => setOpenTeam(openTeam === t.key ? null : t.key)}>
                    {openTeam === t.key ? "Hide squad" : `View squad (${t.player_names.length})`}
                  </Action>
                  <Action
                    disabled={busy}
                    onClick={() => {
                      const c = customers.find((x) => x.id === t.ownerId);
                      if (c) void signInAs(c);
                      else toast.error("Owner account not found");
                    }}
                  >
                    <LogIn className="size-3.5" /> Open this team
                  </Action>
                </div>
                {openTeam === t.key && (
                  <div className="mt-3 rounded-md border border-border p-3">
                    {t.player_names.length ? (
                      <ol className="grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
                        {t.player_names.map((n, i) => (
                          <li key={`${t.key}-${i}`} className="truncate text-muted-foreground">
                            {i + 1}. {n}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No squad synced yet — it appears once the coach opens their workspace.
                      </p>
                    )}
                    <p className="mt-2 text-[0.65rem] text-muted-foreground">
                      Updated: {t.updated_at ? new Date(t.updated_at).toLocaleString() : "never"}
                    </p>
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      )}

      <div className={tab === "customers" ? "mt-4 space-y-3" : "hidden"}>
        {pending ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : customers.length === 0 ? (
          <p className="panel p-8 text-center text-sm text-muted-foreground">No customers yet.</p>

        ) : (
          customers.map((c) => {
            const m = months[c.id] ?? 12;
            return (
              <article key={c.id} className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.full_name || c.email || "Unnamed coach"}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.club_name || "No club"} · {c.team_name || "No team"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[0.65rem]">
                    {c.is_admin && <Tag tone="admin">Admin</Tag>}
                    {c.active ? (
                      <Tag tone="ok">{c.complimentary ? "Complimentary" : "Active"}</Tag>
                    ) : (
                      <Tag tone="off">{c.status === "revoked" ? "Revoked" : "No access"}</Tag>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <span>Players: {c.players}</span>
                  <span>Sessions: {c.sessions}</span>
                  <span>GPS rows: {c.gps_rows}</span>
                  <span>Tests: {c.tests}</span>
                  <span>Access until: {c.season_end ? new Date(c.season_end).toLocaleDateString() : "—"}</span>
                  <span>Price: €{c.price_eur}</span>
                  <span>Joined: {new Date(c.created_at).toLocaleDateString()}</span>
                  <span>Last sign-in: {c.last_sign_in_at ? new Date(c.last_sign_in_at).toLocaleDateString() : "—"}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={m}
                    onChange={(e) => setMonths((s) => ({ ...s, [c.id]: Number(e.target.value) }))}
                    className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                    aria-label="Access duration"
                  >
                    {ACCESS_MONTH_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v} month{v > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <Action
                    disabled={busy}
                    onClick={() => act(() => grantAccess({ data: { userId: c.id, months: m } }), "Access granted.")}
                  >
                    <CheckCircle2 className="size-3.5" /> Give paid access
                  </Action>
                  <Action
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => grantAccess({ data: { userId: c.id, months: m, complimentary: true } }),
                        "Complimentary access granted.",
                      )
                    }
                  >
                    <Gift className="size-3.5" /> Complimentary
                  </Action>
                  <Action
                    disabled={busy || !c.active}
                    onClick={() => act(() => revokeAccess({ data: { userId: c.id } }), "Access revoked.")}
                  >
                    <Ban className="size-3.5" /> Revoke
                  </Action>
                  <Action disabled={busy} onClick={() => void signInAs(c)}>
                    <LogIn className="size-3.5" /> Sign in as user
                  </Action>
                  <Action
                    disabled={busy}
                    onClick={() =>
                      act(() => setRole({ data: { userId: c.id, makeAdmin: !c.is_admin } }), "Role updated.")
                    }
                  >
                    <Shield className="size-3.5" /> {c.is_admin ? "Remove admin" : "Make admin"}
                  </Action>
                  <Action disabled={busy} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                    {expanded === c.id ? "Close" : "Edit / squad"}
                  </Action>
                  <Action
                    tone="danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Delete ${c.email}? This removes their account permanently.`)) {
                        void act(() => deleteCustomer({ data: { userId: c.id } }), "Customer deleted.");
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Action>
                </div>

                {expanded === c.id && (
                  <div className="mt-4 space-y-3 rounded-md border border-border p-3">
                    <form
                      className="grid gap-2 sm:grid-cols-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        void act(
                          () =>
                            updateCustomer({
                              data: {
                                userId: c.id,
                                full_name: String(f.get("full_name") ?? ""),
                                club_name: String(f.get("club_name") ?? ""),
                                team_name: String(f.get("team_name") ?? ""),
                                note: String(f.get("note") ?? ""),
                              },
                            }),
                          "Customer updated.",
                        );
                      }}
                    >
                      <Field name="full_name" label="Coach name" defaultValue={c.full_name} />
                      <Field name="club_name" label="Club" defaultValue={c.club_name} />
                      <Field name="team_name" label="Team" defaultValue={c.team_name ?? ""} />
                      <Field name="note" label="Admin note" defaultValue={c.admin_note ?? ""} />
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={busy}
                          className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                    <div>
                      <p className="eyebrow">Squad ({c.player_names.length})</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.player_names.length ? c.player_names.join(", ") : "No players synced yet."}
                      </p>
                      <p className="mt-1 text-[0.65rem] text-muted-foreground">
                        Usage updated:{" "}
                        {c.usage_updated_at ? new Date(c.usage_updated_at).toLocaleString() : "never"}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, hint, icon }: { label: string; value: string | number; hint?: string; icon: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {icon}
      </div>
      <p className="metric-value mt-2 text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Tag({ tone, children }: { tone: "ok" | "off" | "admin"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-success/40 text-success"
      : tone === "admin"
        ? "border-primary/40 text-primary"
        : "border-border text-muted-foreground";
  return <span className={`rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

function Action({
  children,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
        tone === "danger" ? "border-destructive/40 text-destructive" : "border-border text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="block text-xs">
      <span className="eyebrow">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
      />
    </label>
  );
}
