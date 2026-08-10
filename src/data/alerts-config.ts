import {
  availabilitySummary,
  fullName,
  players,
  playerDays,
  playerWellness,
  positionAverage,
  squadMetrics,
  today,
  wellnessScore,
  type Player,
} from "@/data/performance";
import { detectSpeedPbs, findingPlayerName } from "@/data/testing";

export type AlertCategory = "Workload" | "Wellness" | "Availability" | "Performance";
export type AlertSeverity = "critical" | "warning" | "info";

export interface Thresholds {
  acwrHigh: number;
  acwrLow: number;
  weeklyLoadJumpPct: number;
  monotonyHigh: number;
  strainHigh: number;
  wellnessLow: number;
  sleepLow: number;
  sorenessHigh: number;
  fatigueLow: number;
  moodLow: number;
  availabilityLow: number;
  hsrDeviationPct: number;
  sprintDeviationPct: number;
  inactivityDays: number;
  minutesHigh: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  acwrHigh: 1.35,
  acwrLow: 0.8,
  weeklyLoadJumpPct: 25,
  monotonyHigh: 2,
  strainHigh: 6000,
  wellnessLow: 55,
  sleepLow: 3,
  sorenessHigh: 4,
  fatigueLow: 2,
  moodLow: 2,
  availabilityLow: 80,
  hsrDeviationPct: 30,
  sprintDeviationPct: 40,
  inactivityDays: 5,
  minutesHigh: 110,
};

export interface ThresholdAlert {
  id: string;
  ruleId: RuleId;
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

export type RuleId =
  | "acwrHigh"
  | "acwrLow"
  | "loadJump"
  | "monotony"
  | "strain"
  | "wellness"
  | "sleep"
  | "soreness"
  | "fatigue"
  | "mood"
  | "availability"
  | "status"
  | "hsrSpike"
  | "sprintSpike"
  | "speedPb"
  | "inactivity"
  | "minutes";

export interface RuleDef {
  id: RuleId;
  label: string;
  category: AlertCategory;
  description: string;
  /** threshold slider that drives this rule */
  key: keyof Thresholds;
  min: number;
  max: number;
  step: number;
  unit: string;
  defaultOn: boolean;
}

/** The alert library — switch any rule on or off and tune its threshold. */
export const RULES: RuleDef[] = [
  { id: "acwrHigh", label: "ACWR spike", category: "Workload", description: "Acute:chronic workload ratio above the safe ceiling.", key: "acwrHigh", min: 1.05, max: 1.8, step: 0.05, unit: "", defaultOn: true },
  { id: "acwrLow", label: "Undertrained (low ACWR)", category: "Workload", description: "Acute load well below the chronic baseline.", key: "acwrLow", min: 0.4, max: 1, step: 0.05, unit: "", defaultOn: true },
  { id: "loadJump", label: "Weekly load jump", category: "Workload", description: "Week-on-week load progression faster than the safe rate.", key: "weeklyLoadJumpPct", min: 10, max: 60, step: 5, unit: "%", defaultOn: true },
  { id: "monotony", label: "Training monotony", category: "Workload", description: "Too little day-to-day variation in load.", key: "monotonyHigh", min: 1.2, max: 3, step: 0.1, unit: "", defaultOn: true },
  { id: "strain", label: "Training strain", category: "Workload", description: "Weekly load × monotony above the strain ceiling.", key: "strainHigh", min: 2000, max: 12000, step: 500, unit: " AU", defaultOn: true },
  { id: "minutes", label: "Excessive session minutes", category: "Workload", description: "Single-session exposure above the planned ceiling.", key: "minutesHigh", min: 70, max: 140, step: 5, unit: " min", defaultOn: false },
  { id: "wellness", label: "Wellness drop", category: "Wellness", description: "Overall morning wellness index below the floor.", key: "wellnessLow", min: 30, max: 80, step: 5, unit: "%", defaultOn: true },
  { id: "sleep", label: "Poor sleep", category: "Wellness", description: "Reported sleep quality at or below the floor.", key: "sleepLow", min: 1, max: 4, step: 1, unit: "/5", defaultOn: true },
  { id: "soreness", label: "High soreness", category: "Wellness", description: "Reported muscle soreness at or above the ceiling.", key: "sorenessHigh", min: 2, max: 5, step: 1, unit: "/5", defaultOn: true },
  { id: "fatigue", label: "High fatigue", category: "Wellness", description: "Reported fatigue score at or below the floor.", key: "fatigueLow", min: 1, max: 4, step: 1, unit: "/5", defaultOn: true },
  { id: "mood", label: "Low mood / stress", category: "Wellness", description: "Mood score at or below the floor.", key: "moodLow", min: 1, max: 4, step: 1, unit: "/5", defaultOn: false },
  { id: "availability", label: "Low training availability", category: "Availability", description: "Share of sessions completed below the floor.", key: "availabilityLow", min: 50, max: 95, step: 5, unit: "%", defaultOn: true },
  { id: "status", label: "Currently unavailable", category: "Availability", description: "Player is injured, ill or in rehabilitation.", key: "availabilityLow", min: 50, max: 95, step: 5, unit: "%", defaultOn: true },
  { id: "inactivity", label: "No recent data", category: "Availability", description: "No GPS record for longer than the inactivity window.", key: "inactivityDays", min: 2, max: 14, step: 1, unit: " days", defaultOn: true },
  { id: "hsrSpike", label: "HSR above position norm", category: "Performance", description: "7-day high-speed running far above the positional average.", key: "hsrDeviationPct", min: 10, max: 80, step: 5, unit: "%", defaultOn: true },
  { id: "sprintSpike", label: "Sprint above position norm", category: "Performance", description: "7-day sprint distance far above the positional average.", key: "sprintDeviationPct", min: 10, max: 90, step: 5, unit: "%", defaultOn: true },
  { id: "speedPb", label: "Maximum speed exceeded", category: "Performance", description: "Training or match speed beat the recorded speed test — the test record is updated automatically.", key: "hsrDeviationPct", min: 10, max: 80, step: 5, unit: "%", defaultOn: true },
];

export const DEFAULT_ENABLED: RuleId[] = RULES.filter((r) => r.defaultOn).map((r) => r.id);

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

export function evaluateAlerts(t: Thresholds, enabled: RuleId[] = DEFAULT_ENABLED): ThresholdAlert[] {
  const out: ThresholdAlert[] = [];
  const on = (id: RuleId) => enabled.includes(id);

  squadMetrics().forEach((m) => {
    const p = m.player;
    const w = playerWellness(p.id);
    const ws = wellnessScore(w);
    const av = availabilitySummary(p.id);
    const push = (a: Omit<ThresholdAlert, "player" | "id"> & { id?: string }) =>
      out.push({ ...a, id: a.id ?? `${p.id}-${a.ruleId}`, player: p } as ThresholdAlert);

    if (on("acwrHigh") && m.load.acute > 0 && m.load.acwr > t.acwrHigh) {
      push({
        ruleId: "acwrHigh",
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

    if (on("acwrLow") && m.load.acute > 0 && m.load.acwr > 0 && m.load.acwr < t.acwrLow) {
      push({
        ruleId: "acwrLow",
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

    if (on("loadJump") && m.load.chronic > 0) {
      const jump = ((m.load.acute - m.load.chronic) / m.load.chronic) * 100;
      if (jump > t.weeklyLoadJumpPct) {
        push({
          ruleId: "loadJump",
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

    if (on("monotony") && m.load.monotony > t.monotonyHigh) {
      push({
        ruleId: "monotony",
        category: "Workload",
        severity: "warning",
        metric: "Training monotony",
        value: m.load.monotony.toFixed(2),
        threshold: `> ${t.monotonyHigh}`,
        message: `${fullName(p)} is training with too little day-to-day variation.`,
        action: "Sharpen the hard/easy contrast: raise one day, lower the next.",
        medical: false,
      });
    }

    if (on("strain") && m.load.strain > t.strainHigh) {
      push({
        ruleId: "strain",
        category: "Workload",
        severity: m.load.strain > t.strainHigh * 1.3 ? "critical" : "warning",
        metric: "Training strain",
        value: `${Math.round(m.load.strain)} AU`,
        threshold: `> ${t.strainHigh} AU`,
        message: `${fullName(p)} is accumulating strain above the club ceiling.`,
        action: "Insert a regeneration day within the next 48 hours.",
        medical: false,
      });
    }

    if (on("minutes")) {
      const last = playerDays(p.id).slice(-1)[0];
      if (last && last.minutes > t.minutesHigh) {
        push({
          ruleId: "minutes",
          category: "Workload",
          severity: "warning",
          metric: "Session minutes",
          value: `${last.minutes} min`,
          threshold: `> ${t.minutesHigh} min`,
          message: `${fullName(p)} exceeded the single-session exposure ceiling on ${last.date}.`,
          action: "Reduce tomorrow's total volume or plan an individual recovery block.",
          medical: false,
        });
      }
    }

    if (on("wellness") && ws < t.wellnessLow) {
      push({
        ruleId: "wellness",
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

    if (on("sleep") && w.sleep <= t.sleepLow) {
      push({
        ruleId: "sleep",
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

    if (on("soreness") && w.soreness >= t.sorenessHigh) {
      push({
        ruleId: "soreness",
        category: "Wellness",
        severity: "warning",
        metric: "Muscle soreness",
        value: `${w.soreness}/5`,
        threshold: `>= ${t.sorenessHigh}/5`,
        message: `${fullName(p)} reported elevated muscle soreness.`,
        action: "Screening before training; confirm participation level.",
        medical: true,
      });
    }

    if (on("fatigue") && w.fatigue <= t.fatigueLow) {
      push({
        ruleId: "fatigue",
        category: "Wellness",
        severity: "warning",
        metric: "Fatigue",
        value: `${w.fatigue}/5`,
        threshold: `<= ${t.fatigueLow}/5`,
        message: `${fullName(p)} is reporting heavy fatigue.`,
        action: "Cut the conditioning block and keep total volume submaximal.",
        medical: false,
      });
    }

    if (on("mood") && w.mood <= t.moodLow) {
      push({
        ruleId: "mood",
        category: "Wellness",
        severity: "info",
        metric: "Mood",
        value: `${w.mood}/5`,
        threshold: `<= ${t.moodLow}/5`,
        message: `${fullName(p)} reported low mood or high stress.`,
        action: "Short individual conversation before the session starts.",
        medical: false,
      });
    }

    if (on("availability") && av.availability < t.availabilityLow) {
      push({
        ruleId: "availability",
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

    if (on("status") && (p.availability === "injured" || p.availability === "rehab" || p.availability === "ill")) {
      push({
        ruleId: "status",
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

    if (on("inactivity")) {
      const last = playerDays(p.id).slice(-1)[0];
      const gap = last ? daysBetween(last.date, today) : 999;
      if (gap > t.inactivityDays) {
        push({
          ruleId: "inactivity",
          category: "Availability",
          severity: "warning",
          metric: "Days without data",
          value: last ? `${gap} days` : "no data",
          threshold: `> ${t.inactivityDays} days`,
          message: `${fullName(p)} has no GPS record since ${last?.date ?? "the start of the season"}.`,
          action: "Check participation and reload progressively before full exposure.",
          medical: false,
        });
      }
    }

    if (on("hsrSpike")) {
      const norm = positionAverage(p.position, (x) => x.hsr7) || 0;
      if (norm > 0) {
        const dev = ((m.hsr7 - norm) / norm) * 100;
        if (dev > t.hsrDeviationPct) {
          push({
            ruleId: "hsrSpike",
            category: "Performance",
            severity: dev > t.hsrDeviationPct * 1.5 ? "critical" : "warning",
            metric: "HSR vs position average",
            value: `+${Math.round(dev)}%`,
            threshold: `> +${t.hsrDeviationPct}%`,
            message: `${fullName(p)} is running far more high-speed metres than the ${p.position} norm.`,
            action: "Protect the hamstrings: reduce high-speed exposure in the next session.",
            medical: false,
          });
        }
      }
    }

    if (on("sprintSpike")) {
      const norm = positionAverage(p.position, (x) => x.sprint7) || 0;
      if (norm > 0) {
        const dev = ((m.sprint7 - norm) / norm) * 100;
        if (dev > t.sprintDeviationPct) {
          push({
            ruleId: "sprintSpike",
            category: "Performance",
            severity: "warning",
            metric: "Sprint vs position average",
            value: `+${Math.round(dev)}%`,
            threshold: `> +${t.sprintDeviationPct}%`,
            message: `${fullName(p)} has sprint exposure well above the ${p.position} norm.`,
            action: "Keep maximal sprint efforts low and monitor the wellness response.",
            medical: false,
          });
        }
      }
    }
  });

  if (enabled.includes("speedPb")) {
    for (const f of detectSpeedPbs()) {
      const p = players.find((x) => x.id === f.playerId);
      if (!p) continue;
      out.push({
        id: `${f.playerId}-pb-${f.date}`,
        ruleId: "speedPb",
        player: p,
        category: "Performance",
        severity: "info",
        metric: "Maximum speed",
        value: `${f.value.toFixed(1)} km/h`,
        threshold: f.previous ? `previous best ${f.previous.toFixed(1)} km/h` : "no previous test",
        message: `${findingPlayerName(f.playerId)} exceeded his recorded maximum speed on ${f.date}.`,
        action: "The test record is updated with this new personal best — rebuild speed zones from it.",
        medical: false,
      });
    }
  }

  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

export const squadSize = players.length;
