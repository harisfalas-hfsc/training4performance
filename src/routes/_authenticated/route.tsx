import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, session, hasAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!hasAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <div className="panel max-w-md p-6 text-center">
          <p className="eyebrow">Subscription required</p>
          <h1 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide">
            The platform is for subscribers
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Dashboard, squad, training, tactics board, GPS, logbook, alerts, analytics and reports unlock with an
            active team subscription — €999 per season.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/account" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Request access
            </Link>
            <Link to="/pricing" className="rounded-md border border-border px-4 py-2 text-sm font-semibold">
              See pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
