import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarketingPage } from "@/components/marketing";
import { supabase } from "@/integrations/supabase/client";
import { currentSeason, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — T4P" },
      { name: "description", content: "Manage your T4P subscription, sub-teams and platform access." },
      { property: "og:title", content: "My T4P account" },
      { property: "og:description", content: "Subscription, sub-teams and access to the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

interface SubTeam {
  id: string;
  name: string;
  price_eur: number;
}

function Account() {
  const { loading, session, user, profile, isAdmin, subscription, hasAccess, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const season = currentSeason();
  const [subTeams, setSubTeams] = useState<SubTeam[]>([]);
  const [newTeam, setNewTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!subscription) return;
    void supabase
      .from("sub_teams")
      .select("id,name,price_eur")
      .eq("subscription_id", subscription.id)
      .order("created_at")
      .then(({ data }) => setSubTeams((data as SubTeam[]) ?? []));
  }, [subscription]);

  async function activate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        team_name: profile?.club_name ? `${profile.club_name} — first team` : "First team",
        status: "active",
        season_start: season.start,
        season_end: season.end,
        price_eur: 999,
      },
      { onConflict: "user_id" },
    );
    if (err) setError(err.message);
    await refresh();
    setBusy(false);
  }

  async function addSubTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !subscription || !newTeam.trim()) return;
    setBusy(true);
    const { data, error: err } = await supabase
      .from("sub_teams")
      .insert({ subscription_id: subscription.id, user_id: user.id, name: newTeam.trim(), price_eur: 399 })
      .select("id,name,price_eur")
      .single();
    if (err) setError(err.message);
    else if (data) setSubTeams((t) => [...t, data as SubTeam]);
    setNewTeam("");
    setBusy(false);
  }

  async function removeSubTeam(id: string) {
    await supabase.from("sub_teams").delete().eq("id", id);
    setSubTeams((t) => t.filter((x) => x.id !== id));
  }

  if (loading || !session) {
    return (
      <MarketingPage>
        <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>
      </MarketingPage>
    );
  }

  const total = 999 + subTeams.length * 399;

  return (
    <MarketingPage>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">
          {profile?.full_name || user?.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email}
          {isAdmin ? <span className="ml-2 rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">Administrator</span> : null}
        </p>

        <div className="panel mt-8 p-5">
          <p className="eyebrow">Subscription</p>
          {hasAccess ? (
            <>
              <p className="mt-2 text-lg font-semibold text-success">
                {isAdmin && !subscription ? "Administrator access" : "Active"}
              </p>
              {subscription ? (
                <p className="text-sm text-muted-foreground">
                  {subscription.team_name} · season {subscription.season_start} → {subscription.season_end} · €
                  {Number(subscription.price_eur).toFixed(0)}
                </p>
              ) : null}
              <Link
                to="/dashboard"
                className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Open the platform
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                No active subscription. A team subscription costs €999 for the {season.label} season (1 June – 31
                May) and unlocks the full platform.
              </p>
              <button
                onClick={activate}
                disabled={busy}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Activating…" : "Activate team subscription — €999"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Activation is registered against your account and invoiced for the season.
              </p>
            </>
          )}
        </div>

        {subscription ? (
          <div className="panel mt-4 p-5">
            <p className="eyebrow">Sub-teams (€399 / year each)</p>
            <ul className="mt-3 space-y-2">
              {subTeams.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
                  <span>{t.name}</span>
                  <button onClick={() => removeSubTeam(t.id)} className="text-xs text-destructive hover:underline">
                    Remove
                  </button>
                </li>
              ))}
              {subTeams.length === 0 ? (
                <li className="text-sm text-muted-foreground">No additional teams yet.</li>
              ) : null}
            </ul>
            <form onSubmit={addSubTeam} className="mt-3 flex gap-2">
              <input
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                placeholder="e.g. U19 Academy"
                className="h-10 flex-1 rounded-md border border-input bg-surface-2 px-3 text-sm"
              />
              <button className="rounded-md border border-border px-4 text-sm font-semibold">Add team</button>
            </form>
            <p className="mt-3 text-sm text-muted-foreground">
              Season total: <strong className="text-foreground">€{total}</strong>
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <button
          onClick={async () => {
            await signOut();
            void navigate({ to: "/", replace: true });
          }}
          className="mt-8 text-sm text-muted-foreground hover:text-destructive"
        >
          Sign out
        </button>
      </div>
    </MarketingPage>
  );
}
