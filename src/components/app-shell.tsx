import { Link, useRouterState } from "@tanstack/react-router";


import {
  ArrowLeft,
  Activity,
  BarChart3,
  BellRing,
  BrainCircuit,
  CalendarDays,
  ClipboardPen,
  BookOpen,
  FileText,
  GitCompare,
  Layers,
  LayoutDashboard,
  Building2,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  User,
} from "lucide-react";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  team,
  squadName,
  squadAvailability,
  players,
  sessionCalendar,
  gpsHistory,
  manualTests,
  fullName,
  useDataVersion,
} from "@/data/performance";
import { useAuth } from "@/lib/auth";
import { hydrateWorkspace, startWorkspaceAutoSync, stopWorkspaceAutoSync, syncUsageSnapshot } from "@/lib/usage";
import { clearWellness, loadWellness } from "@/data/wellness";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DiscoverMenu } from "@/components/discover-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { SiteFooter } from "@/components/marketing";
import { platformNav } from "@/lib/nav-items";
import { resetPlatformHistory, usePlatformBack } from "@/lib/platform-history";
import { Training4Performance } from "@/components/brand-text";

const nav = platformNav;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, subscription, user, isAdmin } = useAuth();
  const clubLabel = profile?.club_name || subscription?.team_name || `${team.club} · ${team.name}`;
  const { canGoBack, goBack } = usePlatformBack();
  const [supportMode, setSupportMode] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const version = useDataVersion();
  const navItems = nav;

  useEffect(() => {
    setSupportMode(Boolean(window.sessionStorage.getItem("t4p.adminSession")));
  }, []);

  useEffect(() => {
    const closeAccount = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", closeAccount);
    return () => document.removeEventListener("mousedown", closeAccount);
  }, []);

  const returnToAdmin = async () => {
    const raw = window.sessionStorage.getItem("t4p.adminSession");
    if (!raw) return;
    const saved = JSON.parse(raw) as { access_token?: string; refresh_token?: string };
    if (!saved.access_token || !saved.refresh_token) return;
    const { error } = await supabase.auth.setSession({ access_token: saved.access_token, refresh_token: saved.refresh_token });
    if (!error) {
      window.sessionStorage.removeItem("t4p.adminSession");
      window.location.assign("/admin");
    }
  };

  useEffect(() => {
    if (!user?.id) {
      clearWellness();
      stopWorkspaceAutoSync();
      return;
    }
    const id = user.id;
    void hydrateWorkspace(id).then(() => startWorkspaceAutoSync(id));
    void loadWellness(id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const t = window.setTimeout(() => {
      void syncUsageSnapshot({
        userId: user.id,
        clubName: profile?.club_name ?? null,
        teamName: subscription?.team_name ?? null,
        players: players.length,
        sessions: sessionCalendar.length,
        gpsRows: gpsHistory.length,
        tests: manualTests.length,
        playerNames: players.map(fullName),
      });
    }, 2500);
    return () => window.clearTimeout(t);
  }, [user?.id, profile?.club_name, subscription?.team_name, version]);



  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur">
          <div className="relative flex items-center justify-between px-2 py-1 sm:px-5">
            <div className="flex shrink-0 items-center gap-0">

              <DiscoverMenu platformItems={navItems} />
              {canGoBack ? (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Back"
                  className="grid size-9 shrink-0 place-items-center rounded-full text-primary transition-opacity hover:opacity-70 sm:size-10"
                >
                  <ArrowLeft className="size-5" />
                </button>
              ) : null}
            </div>

            <Link
              to="/dashboard"
              onClick={resetPlatformHistory}
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              aria-label="Platform home"
            >
              <img
                src="/logo-t4p.png"
                alt="Training 4 Performance logo"
                className="t4p-logo size-9 shrink-0 object-contain sm:hidden"
              />
              <Training4Performance
                uppercase
                className="hidden sm:inline-flex items-center gap-2 text-2xl"
              />
            </Link>

            <div className="flex shrink-0 items-center gap-0">
              {supportMode ? (
                <Button size="sm" onClick={() => void returnToAdmin()}>
                  <Shield className="size-3.5" /> <span className="hidden sm:inline">Return to admin</span>
                </Button>
              ) : null}
              <NotificationBell userId={user?.id} />
              <ThemeToggle />
              <div ref={accountRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open my account"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((value) => !value)}
                  className="size-9 rounded-full border-border bg-transparent text-primary shadow-none hover:bg-transparent hover:opacity-70 sm:size-10"
                >
                  {profile?.full_name ? (
                    <span className="text-sm font-bold">{profile.full_name.slice(0, 1).toUpperCase()}</span>
                  ) : (
                    <User className="size-5" />
                  )}
                </Button>
                {accountOpen ? (
                  <div className="absolute right-0 top-11 z-40 w-52 overflow-hidden rounded-md border border-border bg-popover shadow-panel">
                    <p className="truncate border-b border-border px-3 py-2 text-xs text-muted-foreground">{user?.email}</p>
                    <Link
                      to="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block px-3 py-2.5 text-sm font-medium hover:bg-accent"
                    >
                      My account
                    </Link>
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 border-t border-border px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                      >
                        <Shield className="size-4" /> Admin panel
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto px-3 pb-2">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground",
                    active && "bg-secondary text-primary",
                  )}
                >
                  <item.icon className="size-3.5" style={{ color: item.color }} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            <p className="eyebrow truncate">
              {clubLabel} · {squadName} · {team.season}
            </p>
            <h1 className="truncate text-2xl font-semibold uppercase tracking-wide">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        <main className="flex-1 p-4 sm:p-5">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );

}


function Row({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={cn("metric-value text-sm", tone)}>{value}</span>
    </div>
  );
}
