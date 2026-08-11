import { Link } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { SmartyAssistant } from "@/components/smarty-assistant";
import { Training4Performance } from "@/components/brand-text";

import { DiscoverMenu } from "@/components/discover-menu";
import { platformNav } from "@/lib/nav-items";
import { cn } from "@/lib/utils";




export function SiteHeader() {
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
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-1 sm:px-5">
          <DiscoverMenu platformItems={platformNav} />

          <Link to="/" className="flex min-w-0 items-center justify-center" aria-label="Training 4 Performance home">
            <img
              src="/logo-t4p.png"
              alt="Training 4 Performance logo"
              width={512}
              height={512}
              decoding="async"
              fetchPriority="high"
              className="t4p-logo size-12 shrink-0 object-contain"
            />
          </Link>


          <div className="flex shrink-0 items-center gap-2">
            <div ref={avatarRef} className="relative shrink-0">
              <button
                onClick={() => setAvatar((v) => !v)}

              aria-label="Account menu"
              className="grid size-12 place-items-center rounded-full text-sm font-semibold uppercase text-primary transition-opacity hover:opacity-70"
            >
              {session ? initials : <User className="size-6" />}
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
        </div>
      </header>


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
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-6 sm:flex-row sm:justify-between">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-muted-foreground">
          <Training4Performance />
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
        © {new Date().getFullYear()} <Training4Performance />. All rights reserved.
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
      <SmartyAssistant />
    </div>
  );
}

export function Prose({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">{title}</h1>
      {updated ? <p className="mt-1 text-xs text-muted-foreground">Last updated: {updated}</p> : null}
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </div>
  );
}
