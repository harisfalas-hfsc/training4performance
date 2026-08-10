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
  LayoutDashboard,
  Radar,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { team, squadName, squadAvailability } from "@/data/performance";
import { ROLES, useRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/squad", label: "Squad", icon: Users },
  { to: "/training", label: "Training", icon: CalendarDays },
  { to: "/board", label: "Tactics Board", icon: ClipboardPen },
  { to: "/logbook", label: "Logbook", icon: BookOpen },
  { to: "/gps", label: "GPS Import", icon: Radar },
  { to: "/alerts", label: "Alerts", icon: BellRing },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/ai", label: "AI Assistant", icon: BrainCircuit },
  { to: "/reports", label: "Reports", icon: FileText },
] as const;

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
  const av = squadAvailability();
  const { role, setRole, def } = useRole();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <Activity className="size-5 text-primary" />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-sidebar-foreground">
              T4P
            </p>
            <p className="text-[0.68rem] text-muted-foreground">Training 4 Performance</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-primary",
                )}
              >
                <item.icon className="size-4" />
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
            <div className="min-w-0">
              <p className="eyebrow">
                {team.club} · {team.name} · {squadName} · {team.season}
              </p>
              <h1 className="truncate text-2xl font-semibold uppercase tracking-wide">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span className="eyebrow">Signed in as</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  title={def.description}
                  className="h-9 rounded-md border border-input bg-surface-2 px-2 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              {actions}
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground",
                    active && "bg-secondary text-primary",
                  )}
                >
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
