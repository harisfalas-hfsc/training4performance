import {
  availabilitySummary,
  fullName,
  players,
  playerWellness,
  squadMetrics,
  wellnessScore,
  type Player,
} from "@/data/performance";

export type AlertCategory = "Workload" | "Wellness" | "Availability";
export type AlertSeverity = "critical" | "warning" | "info";

export interface Thresholds {
  acwrHigh: number;
  acwrLow: number;
  weeklyLoadJumpPct: number;
  wellnessLow: number;
  sleepLow: number;
  sorenessHigh: number;
  availabilityLow: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  acwrHigh: 1.35,
  acwrLow: 0.8,
  weeklyLoadJumpPct: 25,
  wellnessLow: 55,
  sleepLow: 3,
  sorenessHigh: 4,
  availabilityLow: 80,
};

export interface ThresholdAlert {
  id: string;
  player: Player;
  category: AlertCategory;
  severity: AlertSeverity;
  metric: string;
  value: string;
  threshold: string;
  message: string;
  action: string;
  medical: boolean;
}

export function evaluateAlerts(t: Thresholds): ThresholdAlert[] {
  const out: ThresholdAlert[] = [];

  squadMetrics().forEach((m) => {
    const p = m.player;
    const w = playerWellness(p.id);
    const ws = wellnessScore(w);
    const av = availabilitySummary(p.id);

    if (m.load.acute > 0 && m.load.acwr > t.acwrHigh) {
      out.push({
        id: `${p.id}-acwr-high`,
        player: p,
        category: "Workload",
        severity: m.load.acwr > t.acwrHigh + 0.2 ? "critical" : "warning",
        metric: "Acute:chronic workload ratio",
        value: m.load.acwr.toFixed(2),
        threshold: `> ${t.acwrHigh.toFixed(2)}`,
        message: `${fullName(p)} is spiking above the recent workload baseline.`,
        action: "Cap high-speed volume tomorrow and reduce total distance by roughly 20%.",
        medical: false,
      });
    }

    if (m.load.acute > 0 && m.load.acwr > 0 && m.load.acwr < t.acwrLow) {
      out.push({
        id: `${p.id}-acwr-low`,
        player: p,
        category: "Workload",
        severity: "info",
        metric: "Acute:chronic workload ratio",
        value: m.load.acwr.toFixed(2),
        threshold: `< ${t.acwrLow.toFixed(2)}`,
        message: `${fullName(p)} is undertrained relative to the chronic baseline.`,
        action: "Add a top-up conditioning block or extended small-sided game after session.",
        medical: false,
      });
    }

    if (m.load.chronic > 0) {
      const jump = ((m.load.acute - m.load.chronic) / m.load.chronic) * 100;
      if (jump > t.weeklyLoadJumpPct) {
        out.push({
          id: `${p.id}-jump`,
          player: p,
          category: "Workload",
          severity: jump > t.weeklyLoadJumpPct * 1.6 ? "critical" : "warning",
          metric: "Weekly load increase",
          value: `+${Math.round(jump)}%`,
          threshold: `> +${t.weeklyLoadJumpPct}%`,
          message: `${fullName(p)} increased weekly load faster than the safe progression rate.`,
          action: "Plan a lower-intensity day tomorrow and reassess after the next session.",
          medical: false,
        });
      }
    }

    if (ws < t.wellnessLow) {
      out.push({
        id: `${p.id}-wellness`,
        player: p,
        category: "Wellness",
        severity: ws < t.wellnessLow - 10 ? "critical" : "warning",
        metric: "Wellness index",
        value: `${ws}%`,
        threshold: `< ${t.wellnessLow}%`,
        message: `${fullName(p)} reported poor overall wellness this morning.`,
        action: "Individual check-in before session, consider modified participation.",
        medical: false,
      });
    }

    if (w.sleep <= t.sleepLow) {
      out.push({
        id: `${p.id}-sleep`,
        player: p,
        category: "Wellness",
        severity: "warning",
        metric: "Sleep quality",
        value: `${w.sleep}/5`,
        threshold: `<= ${t.sleepLow}/5`,
        message: `${fullName(p)} reported disturbed sleep.`,
        action: "Reduce evening intensity and review travel or schedule factors.",
        medical: false,
      });
    }

    if (w.soreness >= t.sorenessHigh) {
      out.push({
        id: `${p.id}-soreness`,
        player: p,
        category: "Wellness",
        severity: "warning",
        metric: "Muscle soreness",
        value: `${w.soreness}/5`,
        threshold: `>= ${t.sorenessHigh}/5`,
        message: `${fullName(p)} reported elevated muscle soreness.`,
        action: "Screening before training; medical staff to confirm participation level.",
        medical: true,
      });
    }

    if (av.availability < t.availabilityLow) {
      out.push({
        id: `${p.id}-availability`,
        player: p,
        category: "Availability",
        severity: av.availability < t.availabilityLow - 15 ? "critical" : "warning",
        metric: "Training availability",
        value: `${av.availability}%`,
        threshold: `< ${t.availabilityLow}%`,
        message: `${fullName(p)} has missed a significant share of recent sessions.`,
        action: "Confirm return-to-play stage before including in team practice.",
        medical: true,
      });
    }

    if (p.availability === "injured" || p.availability === "rehab" || p.availability === "ill") {
      out.push({
        id: `${p.id}-status`,
        player: p,
        category: "Availability",
        severity: "info",
        metric: "Current status",
        value: p.availability,
        threshold: "non-available",
        message: `${fullName(p)} is not available for full team training.`,
        action: "Plan the session with a reduced group and adjust unit numbers.",
        medical: true,
      });
    }
  });

  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

export const squadSize = players.length;
