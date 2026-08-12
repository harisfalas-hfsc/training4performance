import {
  BarChart3,
  CalendarDays,
  ClipboardPen,
  HeartPulse,
  LayoutDashboard,
  Building2,
  Calculator,
  Dumbbell,
  ListChecks,
  LayoutGrid,
  Satellite,
} from "lucide-react";


export const platformNav = [
  { to: "/dashboard", label: "Insights", icon: LayoutDashboard, color: "#2563eb" },
  { to: "/team", label: "Team & players", icon: Building2, color: "#0f766e" },
  { to: "/trainings", label: "Trainings", icon: ListChecks, color: "#ca8a04" },
  { to: "/gps", label: "GPS reports", icon: Satellite, color: "#0891b2" },
  { to: "/logbook", label: "Fitness tests", icon: Dumbbell, color: "#9333ea" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, color: "#0891b2" },
  { to: "/training", label: "Training Designer", icon: ClipboardPen, color: "#7c3aed" },
  { to: "/wellness", label: "Wellness & alerts", icon: HeartPulse, color: "#db2777" },
  { to: "/analytics", label: "Analytics & Reports", icon: BarChart3, color: "#4f46e5" },
] as const;

export const toolsNav = [
  { to: "/board", label: "Tactics Board", icon: LayoutGrid, color: "#0f766e" },
  { to: "/calculators", label: "Calculators", icon: Calculator, color: "#b45309" },
] as const;
