import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Download, Trash2 } from "lucide-react";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { seoHead } from "@/lib/seo";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount, requestSubscription, setAutoRenew } from "@/lib/support.functions";
import { hydrateWorkspace } from "@/lib/usage";
import { downloadWorkspaceZip } from "@/lib/workspace-export";
import { PRICE_FULL, PRICE_LABEL, formatDate } from "@/lib/pricing";

export const Route = createFileRoute("/account")({
  head: () => ({
    ...seoHead({
      path: "/account",
      title: "Manage account | T4P",
      description: "Manage your T4P subscription, download all your data or delete your account.",
      card: "summary",
      noindex: true,
    }),
  }),
  component: Account,
});

function Account() {
  const { loading, session, user, profile, isAdmin, subscription, hasAccess, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const subscribeFn = useServerFn(requestSubscription);
  const autoRenewFn = useServerFn(setAutoRenew);
  const deleteAccountFn = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [clubName, setClubName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

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
    const res = await subscribeFn({ data: { teamName: clubName || profile?.club_name || "First team" } });
    if ("error" in res) setError(res.error);
    await refresh();
    setBusy(false);
  }

  async function toggleRenew(cancel: boolean) {
    setBusy(true);
    setError(null);
    const res = await autoRenewFn({ data: { cancel } });
    if ("error" in res) setError(res.error);
    await refresh();
    setBusy(false);
  }

  async function downloadEverything() {
    if (!user) return;
    setExporting(true);
    setError(null);
    try {
      await hydrateWorkspace(user.id);
      if (!downloadWorkspaceZip()) setError("There is nothing to export yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
    setExporting(false);
  }

  async function deleteAccount() {
    setBusy(true);
    setError(null);
    const res = await deleteAccountFn({});
    if ("error" in res) {
      setError(res.error);
      setBusy(false);
      return;
    }
    window.localStorage.clear();
    await signOut();
    void navigate({ to: "/", replace: true });
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
      <div className="mx-auto max-w-5xl px-5 py-14">
        <p className="eyebrow">Manage account</p>
        <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide">
          {profile?.full_name || user?.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.email}
          {isAdmin ? <span className="ml-2 rounded bg-primary/15 px-2 py-0.5 text-xs text-primary"><T4P /> owner</span> : null}
        </p>
        {clubName ? (
          <p className="mt-1 text-sm">
            Team: <span className="font-semibold">{clubName}</span>
          </p>
        ) : null}
        <p className="mt-3 text-sm text-muted-foreground">
          Subscription, your data and the account itself live here. Payment notices, announcements and your support
          conversations live in the{" "}
          <Link to="/notifications" className="font-semibold text-primary underline underline-offset-2">
            notification centre
          </Link>{" "}
          <Bell className="inline size-3.5" />.
        </p>

        <div className="panel mt-6 p-5">
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
          <div className="panel mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="eyebrow"><T4P /> owner</p>
              <p className="mt-1 text-sm text-muted-foreground">Customer access, subscriptions, tickets and platform support.</p>
            </div>
            <Link to="/admin" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Open admin panel
            </Link>
          </div>
        ) : null}

        <div className="panel mt-6 p-5">
          <p className="eyebrow">Subscription</p>
          {hasAccess ? (
            <>
              <p className="mt-2 text-lg font-semibold text-success">
                {isAdmin && !subscription ? "Owner access" : "Active"}
              </p>
              {subscription ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {subscription.team_name} · {PRICE_FULL} ·{" "}
                    {subscription.cancel_at_period_end
                      ? `ends ${formatDate(subscription.season_end)}`
                      : `renews ${formatDate(subscription.season_end)}`}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {subscription.cancel_at_period_end ? (
                      <button
                        onClick={() => toggleRenew(false)}
                        disabled={busy}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        {busy ? "Working…" : "Resume monthly renewal"}
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleRenew(true)}
                        disabled={busy}
                        className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60"
                      >
                        {busy ? "Working…" : "Cancel subscription"}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cancelling stops the next payment. You keep full access until the end of the paid month, then the
                    account becomes read-only — all your data, charts, reports and exports stay available.
                  </p>
                </>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold">Read-only mode</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can open the platform, view every record, chart and report and export everything. Adding or editing
                data needs an active subscription — {PRICE_LABEL} per month, per team, cancel any time.
              </p>
              <button
                onClick={activate}
                disabled={busy}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Sending…" : `Subscribe — ${PRICE_FULL}`}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Online card payments are being rolled out — for now the monthly subscription is activated after
                invoicing. You will get a notification as soon as it is live.
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

        <div className="panel mt-6 p-5">
          <p className="eyebrow">My data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            One ZIP with everything in your account: team and squad, players, training sessions and blocks, GPS reports,
            fitness tests, wellness entries and medical events, as spreadsheets plus the raw JSON backup.
          </p>
          <button
            onClick={downloadEverything}
            disabled={exporting}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Download className="size-4" /> {exporting ? "Preparing…" : "Download all my data (.zip)"}
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="eyebrow text-destructive">Delete my account</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This erases your login, your team and every record you have stored with <T4P /> — players, sessions, GPS
            reports, tests, wellness, notifications and support history. It cannot be undone, so download your data
            first. Deletion is handled as described in our{" "}
            <Link to="/privacy" className="font-semibold text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            ,{" "}
            <Link to="/terms" className="font-semibold text-primary underline underline-offset-2">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link to="/disclaimer" className="font-semibold text-primary underline underline-offset-2">
              Disclaimer
            </Link>
            .
          </p>
          <label className="field mt-3 max-w-xs">
            <span className="field-label">Type DELETE to confirm</span>
            <input className="control" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)} />
          </label>
          <button
            onClick={() => {
              if (window.confirm("Delete your account and all data permanently?")) void deleteAccount();
            }}
            disabled={busy || confirmDelete.trim().toUpperCase() !== "DELETE"}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-destructive/50 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" /> {busy ? "Deleting…" : "Delete my account permanently"}
          </button>
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
