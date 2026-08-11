import { Link } from "@tanstack/react-router";
import { Compass, LogOut, User, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/about", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const [avatar, setAvatar] = useState(false);
  const { session, profile, signOut } = useAuth();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatar(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const initials = (profile?.full_name || session?.user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3">
          <button
            onClick={() => setMenu(true)}
            aria-label="Open discovery menu"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            <Compass className="size-4" />
            <span className="hidden sm:inline">Discover</span>
          </button>

          <Link to="/" className="flex min-w-0 items-center justify-center gap-2.5">
            <img src="/logo-t4p.png" alt="Training 4 Performance logo" className="size-11 shrink-0 object-contain sm:size-12" />
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-xl font-semibold uppercase tracking-[0.3em] sm:text-2xl">T4P</span>
            </span>
          </Link>


          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <div ref={avatarRef} className="relative shrink-0">
              <button
                onClick={() => setAvatar((v) => !v)}

              aria-label="Account menu"
              className="grid size-9 place-items-center rounded-full border border-border bg-surface-2 text-xs font-semibold uppercase"
            >
              {session ? initials : <User className="size-4 text-muted-foreground" />}
            </button>
            {avatar ? (
              <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-panel">
                {session ? (
                  <>
                    <p className="truncate border-b border-border px-4 py-3 text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                    <MenuLink to="/dashboard" onClick={() => setAvatar(false)}>
                      Go to platform
                    </MenuLink>
                    <MenuLink to="/account" onClick={() => setAvatar(false)}>
                      Manage account
                    </MenuLink>
                    <button
                      onClick={() => {
                        setAvatar(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <MenuLink to="/auth" onClick={() => setAvatar(false)}>
                      Sign in
                    </MenuLink>
                    <MenuLink to="/auth" search={{ mode: "signup" }} onClick={() => setAvatar(false)}>
                      Create account
                    </MenuLink>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {menu ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close menu"
            onClick={() => setMenu(false)}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[min(20rem,85vw)] flex-col border-r border-border bg-background px-6 py-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Discover</p>
              <button onClick={() => setMenu(false)} aria-label="Close">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenu(false)}
                  className="border-b border-border py-4 font-display text-lg uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "text-foreground" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto pt-6">
              {session ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMenu(false)}
                  className="block rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Go to platform
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  onClick={() => setMenu(false)}
                  className="block rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
                >
                  Get started
                </Link>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function MenuLink({
  to,
  search,
  onClick,
  children,
}: {
  to: string;
  search?: Record<string, string>;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      to={to as never}
      search={search as never}
      onClick={onClick}
      className="block px-4 py-3 text-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-2/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 sm:flex-row sm:justify-between">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Training 4 Performance
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">
            Terms &amp; Conditions
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/disclaimer" className="hover:text-foreground">
            Disclaimer
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-5 py-4 text-center text-[0.7rem] text-muted-foreground">
        © {new Date().getFullYear()} Training 4 Performance. All rights reserved.
      </div>
    </footer>
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
