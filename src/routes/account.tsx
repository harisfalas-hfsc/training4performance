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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

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
