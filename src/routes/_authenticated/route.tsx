import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, FlaskConical, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { exitDemo, isDemoActive, resetDemo } from "@/lib/demo";
import { T4P } from "@/components/brand-text";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, session, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [demo] = useState(() => isDemoActive());

  useEffect(() => {
    if (demo) return;
    if (!loading && !session) void navigate({ to: "/auth", replace: true });
  }, [demo, loading, session, navigate]);

  if (!demo && (loading || !session)) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <>
      {demo ? (
        <div className="relative z-10 border-b border-border bg-primary/10 px-4 py-2 text-xs sm:text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <FlaskConical className="size-4" aria-hidden /> Demo team — <T4P />
            </span>
            <span className="text-muted-foreground">
              Play with everything. New teams, new players, GPS edits and exports are off.
            </span>
            <button
              type="button"
              onClick={() => resetDemo()}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 font-semibold"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Reset demo
            </button>
            <button
              type="button"
              onClick={() => exitDemo()}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground"
            >
              <X className="size-3.5" aria-hidden /> Exit demo
            </button>
          </div>
        </div>
      ) : !hasAccess ? (
        <div className="relative z-10 border-b border-border bg-primary/10 px-4 py-2 text-xs sm:text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Eye className="size-4" aria-hidden /> View-only mode
            </span>
            <span className="text-muted-foreground">
              Read-only mode: view, analyse and export everything. Adding or editing unlocks with a subscription — €699 / season.
            </span>
            <Link
              to="/pricing"
              className="rounded-md bg-primary px-3 py-1 font-semibold text-primary-foreground"
            >
              Subscribe
            </Link>
          </div>
        </div>
      ) : null}
      <Outlet />
    </>
  );
}
