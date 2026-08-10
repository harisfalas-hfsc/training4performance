import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src="/logo-t4p.png" alt="Training 4 Performance logo" className="size-8 shrink-0 object-contain" />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-base font-semibold uppercase tracking-widest">T4P</span>
            <span className="block truncate text-[0.6rem] uppercase tracking-wider text-muted-foreground">
              Training 4 Performance
            </span>
          </span>
        </Link>


        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {session ? (
            <Link
              to="/dashboard"
              className="whitespace-nowrap rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open platform
            </Link>
          ) : (
            <>
              <Link to="/auth" className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground sm:block">
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="whitespace-nowrap rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
              >
                Get started
              </Link>
            </>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-md border border-border p-2 md:hidden"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border px-5 py-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-2 text-sm text-muted-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-2/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-widest">T4P</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Training 4 Performance — integrated football fitness, performance and training management.
          </p>
        </div>
        <FooterCol
          title="Platform"
          items={[
            { to: "/how-it-works", label: "How it works" },
            { to: "/pricing", label: "Pricing" },
            { to: "/auth", label: "Sign in" },
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            { to: "/about", label: "About T4P" },
            { to: "/haris-falas", label: "Haris Falas" },
          ]}
        />
        <FooterCol
          title="Legal"
          items={[
            { to: "/terms", label: "Terms & Conditions" },
            { to: "/privacy", label: "Privacy Policy (GDPR)" },
            { to: "/disclaimer", label: "Disclaimer" },
          ]}
        />
      </div>
      <div className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Training 4 Performance. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((i) => (
          <li key={i.to}>
            <Link to={i.to as never} className="text-xs text-muted-foreground hover:text-primary">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className={cn("flex-1", className)}>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function Prose({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">{title}</h1>
      {updated ? <p className="mt-1 text-xs text-muted-foreground">Last updated: {updated}</p> : null}
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
