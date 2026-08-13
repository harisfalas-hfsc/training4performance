import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketingPage } from "@/components/marketing";
import { T4P } from "@/components/brand-text";

type OAuthDetails = {
  client?: { name?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } as never });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <MarketingPage>
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Authorization failed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Could not load this authorization request: {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </MarketingPage>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "this app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <MarketingPage>
      <div className="mx-auto max-w-xl px-5 py-16">
        <div className="panel p-6 text-center">
          <p className="page-eyebrow">Agent access</p>
          <h1 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide">
            Connect {clientName}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {clientName} is asking to use your <T4P /> workspace on your behalf. It will be able to read your team,
            squad, sessions, wellness entries and notifications — exactly what you can see when signed in.
          </p>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              disabled={busy}
              onClick={() => void decide(true)}
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => void decide(false)}
              className="rounded-md border border-border bg-card px-7 py-3 text-sm font-semibold disabled:opacity-60"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </MarketingPage>
  );
}
