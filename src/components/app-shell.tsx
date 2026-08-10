import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BellRing,
  BrainCircuit,
  CalendarDays,
  ClipboardPen,
  BookOpen,
  FileText,
  GitCompare,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { syncUsageSnapshot } from "@/lib/usage";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#2563eb" },
  { to: "/squad", label: "Squad", icon: Users, color: "#059669" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, color: "#0891b2" },
  { to: "/training", label: "Training Designer", icon: ClipboardPen, color: "#7c3aed" },
  { to: "/board", label: "Tactics Board", icon: Activity, color: "#16a34a" },
  { to: "/logbook", label: "Logbook", icon: BookOpen, color: "#d97706" },
  { to: "/gps", label: "GPS Import", icon: Radar, color: "#06b6d4" },
  { to: "/alerts", label: "Alerts", icon: BellRing, color: "#dc2626" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, color: "#4f46e5" },
  { to: "/compare", label: "Compare & Graphs", icon: GitCompare, color: "#9333ea" },
  { to: "/ai", label: "AI Assistant", icon: BrainCircuit, color: "#9333ea" },
  { to: "/reports", label: "Reports", icon: FileText, color: "#ea580c" },
] as const;

const adminItem = { to: "/admin", label: "Admin panel", icon: Shield, color: "#111827" } as const;

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
  const { profile, subscription, isAdmin, user } = useAuth();
  const clubLabel = profile?.club_name || subscription?.team_name || `${team.club} · ${team.name}`;
  const av = squadAvailability();
  const [open, setOpen] = useState(false);
  const version = useDataVersion();

  const navItems = useMemo(
    () => (isAdmin ? [...nav, adminItem] : [...nav]),
    [isAdmin],
  );

  useEffect(() => {
    setOpen(window.localStorage.getItem("t4p.sidebar") === "open");
  }, []);

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

  const toggle = () => {
    setOpen((v) => {
      window.localStorage.setItem("t4p.sidebar", v ? "closed" : "open");
      return !v;
    });
  };


  return (
    <div className="flex min-h-screen w-full bg-background">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={toggle}
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <img src="/logo-t4p.png" alt="Training 4 Performance logo" className="size-7 shrink-0 object-contain" />

          <div className="min-w-0 leading-tight">
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-sidebar-foreground">
              T4P
            </p>
            <p className="truncate text-[0.65rem] text-muted-foreground">Training 4 Performance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={toggle}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-primary",
                )}
              >
                <item.icon className="size-4" style={{ color: active ? item.color : undefined }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3">
          <p className="eyebrow">Squad status</p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <Row label="Available" value={av.available} tone="text-success" />
            <Row label="Partial / Individual" value={av.partial + av.individual} tone="text-warning" />
            <Row label="Injured / Ill / Rehab" value={av.injured + av.ill + av.rehab} tone="text-destructive" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
              >
                {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </button>
              <div className="min-w-0">
              <p className="eyebrow truncate">
                {clubLabel} · {squadName} · {team.season}
              </p>
              <h1 className="truncate text-2xl font-semibold uppercase tracking-wide">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/" className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                Website
              </Link>
              {actions}
              <Link
                to="/account"
                className="rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Account
              </Link>
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
                  <item.icon className="size-3.5" style={{ color: active ? item.color : undefined }} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        <main className="flex-1 p-5">{children}</main>
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
