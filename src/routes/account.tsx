import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MarketingPage } from "@/components/marketing";
import { supabase } from "@/integrations/supabase/client";
import { currentSeason, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — T4P" },
      { name: "description", content: "Manage your T4P subscription and platform access." },
      { property: "og:title", content: "My T4P account" },
      { property: "og:description", content: "Subscription and access to the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

function Account() {
  const { loading, session, user, profile, isAdmin, subscription, hasAccess, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const season = currentSeason();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [clubName, setClubName] = useState("");

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setClubName(profile?.club_name ?? subscription?.team_name ?? "");
  }, [profile?.full_name, profile?.club_name, subscription?.team_name]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, club_name: clubName || null })
      .eq("id", user.id);
    if (err) setError(err.message);
    if (!err && subscription && clubName) {
      await supabase.from("subscriptions").update({ team_name: clubName }).eq("user_id", user.id);
    }
    await refresh();
    setSaving(false);
    setSaved(!err);
  }

  async function activate() {
    if (!user) return;
    setBusy(true);
    setError(null);
    // Requests are always saved as "pending" by the database — only the owner can activate them.
    const { error: err } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        team_name: clubName || profile?.club_name || "First team",
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

  if (loading || !session) {
    return (
      <MarketingPage>
        <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-muted-foreground">Loading…</div>
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow">My account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">
          {profile?.full_name || user?.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email}
          {isAdmin ? <span className="ml-2 rounded bg-primary/15 px-2 py-0.5 text-xs text-primary">T4P owner</span> : null}
        </p>
        {clubName ? (
          <p className="mt-1 text-sm">
            Team: <span className="font-semibold">{clubName}</span>
          </p>
        ) : null}

        <div className="panel mt-8 p-5">
          <p className="eyebrow">Profile &amp; team</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">Full name</span>
              <input className="control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Team / club</span>
              <input
                className="control"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Your club — first team"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saved ? <span className="text-xs text-success">Saved — the team now shows across the platform.</span> : null}
          </div>
        </div>

        {isAdmin ? (
          <div className="panel mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="eyebrow">T4P owner</p>
              <p className="mt-1 text-sm text-muted-foreground">Customer access, subscriptions and platform support.</p>
            </div>
            <Link to="/admin" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Open admin panel
            </Link>
          </div>
        ) : null}


        <div className="panel mt-8 p-5">
          <p className="eyebrow">Subscription</p>
          {hasAccess ? (
            <>
              <p className="mt-2 text-lg font-semibold text-success">
                {isAdmin && !subscription ? "Owner access" : "Active"}
              </p>
              {subscription ? (
                <p className="text-sm text-muted-foreground">
                  {subscription.team_name} · season {subscription.season_start} → {subscription.season_end} · €
                  {Number(subscription.price_eur).toFixed(0)}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold">View-only mode</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can open the platform and browse every page, chart and screen for free. A team subscription
                costs €999 for the {season.label} season (1 June – 31 May) and unlocks adding and editing squads,
                training, GPS, testing and reports.
              </p>
              <button
                onClick={activate}
                disabled={busy}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Sending…" : "Subscribe — €999 / season"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Online payments are coming soon — for now subscriptions are activated after invoicing. Contact
                info@training4performance.com to get started.
              </p>
            </>
          )}
          <div>
            <Link
              to="/dashboard"
              className="mt-4 inline-flex rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-semibold"
            >
              Open the platform
            </Link>
          </div>
        </div>


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
