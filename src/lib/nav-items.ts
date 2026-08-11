import {
  BarChart3,
  BellRing,
  CalendarDays,
  ClipboardPen,
  HeartPulse,
  LayoutDashboard,
  Building2,
  Calculator,
  LayoutGrid,
  Satellite,
} from "lucide-react";


export const platformNav = [
  { to: "/dashboard", label: "Insights", icon: LayoutDashboard, color: "#2563eb" },
  { to: "/team", label: "Team & players", icon: Building2, color: "#0f766e" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, color: "#0891b2" },
  { to: "/training", label: "Training Designer", icon: ClipboardPen, color: "#7c3aed" },
  { to: "/wellness", label: "Wellness", icon: HeartPulse, color: "#db2777" },
  { to: "/alerts", label: "Alerts", icon: BellRing, color: "#dc2626" },
  { to: "/analytics", label: "Analytics & Reports", icon: BarChart3, color: "#4f46e5" },
] as const;

export const toolsNav = [
  { to: "/board", label: "Tactics Board", icon: LayoutGrid, color: "#0f766e" },
  { to: "/gps", label: "GPS Upload", icon: Satellite, color: "#0891b2" },
  { to: "/calculators", label: "Calculators", icon: Calculator, color: "#b45309" },
] as const;
