import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { T4P } from "@/components/brand-text";

/**
 * Standalone shell for the owner-only admin panel.
 * Deliberately does NOT render the coach navigation (dashboard, squad, calendar…)
 * — the admin panel is a separate back-office surface.
 */
export function AdminShell({
  title,
  subtitle,
  actions,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="grid size-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : null}
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
              <Shield className="size-4" style={{ color: "#111827" }} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow truncate"><T4P /> back office · owner only</p>
              <h1 className="truncate text-2xl font-semibold uppercase tracking-wide">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <Link

              to="/dashboard"
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Exit admin
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-5">{children}</main>
    </div>
  );
}
