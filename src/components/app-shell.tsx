import { Link, useRouterState } from "@tanstack/react-router";
import { SmartyAssistant } from "@/components/smarty-assistant";


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
import { hydrateWorkspace, syncUsageSnapshot } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DiscoverMenu } from "@/components/discover-menu";
import { platformNav } from "@/lib/nav-items";
import { usePlatformBack } from "@/lib/platform-history";

const nav = platformNav;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, subscription, user } = useAuth();
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
    if (!user?.id) return;
    void hydrateWorkspace(user.id);
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
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="flex shrink-0 items-center gap-2">
              <DiscoverMenu platformItems={navItems} />
              {canGoBack ? (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Back"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowLeft className="size-4" />
                </button>
              ) : null}
            </div>

            <Link to="/dashboard" className="flex min-w-0 items-center justify-center" aria-label="Platform home">
              <img
                src="/logo-t4p.png"
                alt="Training 4 Performance logo"
                className="t4p-logo size-14 shrink-0 object-contain sm:size-16"
              />
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              {supportMode ? (
                <Button size="sm" onClick={() => void returnToAdmin()}>
                  <Shield className="size-3.5" /> <span className="hidden sm:inline">Return to admin</span>
                </Button>
              ) : null}
              <div ref={accountRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open my account"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((value) => !value)}
                  className="rounded-full border-2 border-primary bg-primary/10 text-primary"
                >
                  {profile?.full_name ? (
                    <span className="text-xs font-bold">{profile.full_name.slice(0, 1).toUpperCase()}</span>
                  ) : (
                    <User className="size-4" />
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
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2">
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
      </div>
      <SmartyAssistant />
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
