import {
  BarChart3,
  BellRing,
  CalendarDays,
  ClipboardPen,
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
  { to: "/alerts", label: "Alerts", icon: BellRing, color: "#dc2626" },
  { to: "/analytics", label: "Analytics & Reports", icon: BarChart3, color: "#4f46e5" },
] as const;
