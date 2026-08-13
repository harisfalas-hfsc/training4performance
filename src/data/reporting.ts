import type { Role } from "@/lib/roles";

export type ExportFormat = "PDF" | "Excel" | "PNG" | "CSV";
export type Cadence = "Daily" | "Weekly (Mon)" | "Weekly (Fri)" | "Match day -1" | "Monthly";

export type SectionId =
  | "headline"
  | "loadTrend"
  | "gpsOutput"
  | "playerTable"
  | "availability"
  | "medical"
  | "wellness"
  | "observations";

export const SECTIONS: Array<{ id: SectionId; label: string; medical?: boolean }> = [
  { id: "headline", label: "Headline metrics" },
  { id: "loadTrend", label: "Training load trend" },
  { id: "gpsOutput", label: "GPS output" },
  { id: "playerTable", label: "Player summary table" },
  { id: "availability", label: "Availability" },
  { id: "wellness", label: "Wellness index" },
  { id: "medical", label: "Medical detail", medical: true },
  { id: "observations", label: "Key observations" },
];

export const AUDIENCES = ["Fitness staff", "Head coach", "Technical director", "Club management", "Player"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const PERIODS = ["Last 7 days", "Last 14 days", "Last 28 days", "Season"] as const;
export type Period = (typeof PERIODS)[number];

export interface ReportTemplate {
  id: string;
  name: string;
  audience: Audience;
  period: Period;
  sections: SectionId[];
  formats: ExportFormat[];
  /** Roles allowed to open and send this template. */
  allowedRoles: Role[];
  builtIn?: boolean;
}

export const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "tpl-hc-weekly",
    name: "Head coach weekly review",
    audience: "Head coach",
    period: "Last 7 days",
    sections: ["headline", "loadTrend", "playerTable", "availability", "observations"],
    formats: ["PDF", "PNG"],
    allowedRoles: ["fitness_staff"],
    builtIn: true,
  },
  {
    id: "tpl-fitness-block",
    name: "Fitness staff load block",
    audience: "Fitness staff",
    period: "Last 28 days",
    sections: ["headline", "loadTrend", "gpsOutput", "playerTable", "wellness", "observations"],
    formats: ["Excel", "CSV"],
    allowedRoles: ["fitness_staff"],
    builtIn: true,
  },
  {
    id: "tpl-medical-rtp",
    name: "Medical return-to-play brief",
    audience: "Fitness staff",
    period: "Last 14 days",
    sections: ["headline", "availability", "medical", "wellness"],
    formats: ["PDF"],
    allowedRoles: ["fitness_staff"],
    builtIn: true,
  },
  {
    id: "tpl-board",
    name: "Club management summary",
    audience: "Club management",
    period: "Season",
    sections: ["headline", "availability", "loadTrend", "observations"],
    formats: ["PDF"],
    allowedRoles: ["fitness_staff"],
    builtIn: true,
  },
];

export interface ScheduledExport {
  id: string;
  templateId: string;
  cadence: Cadence;
  format: ExportFormat;
  recipients: string;
  from: string;
  to: string;
  active: boolean;
  lastSent?: string;
}

export const DEFAULT_SCHEDULES: ScheduledExport[] = [];
