import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Eye } from "lucide-react";
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

  return (
    <>
      {!hasAccess ? (
        <div className="relative z-10 border-b border-border bg-primary/10 px-4 py-2 text-xs sm:text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Eye className="size-4" aria-hidden /> View-only mode
            </span>
            <span className="text-muted-foreground">
              Browse every page freely. Adding or editing data unlocks with a team subscription — €999 / season.
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
