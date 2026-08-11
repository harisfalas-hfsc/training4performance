/**
 * Summarise the signed-in coach's workspace into a compact, structured
 * context that the Smarty Assistant can reason over. All numbers come from
 * the real workspace data, never from the model guessing.
 */

import type {
  GpsDay,
  ManualTest,
  MedicalEvent,
  Player,
  Session,
  Team,
  Wellness,
} from "@/data/performance";

export interface AssistantWorkspaceContext {
  team: Team;
  squadSize: number;
  players: AssistantPlayer[];
  sessions: AssistantSession[];
  gpsDays: number;
  customKpis: Array<{ key: string; label: string }>;
  recentAlerts: AssistantAlert[];
  lastSessionDate: string;
  dataRange: { from: string; to: string };
  /** Per-player, per-date GPS rows so the assistant can compare sessions. */
  playerDateMetrics: AssistantPlayerDateMetrics[];
}

export interface AssistantPlayerDateMetrics {
  playerId: string;
  playerName: string;
  position: string;
  rows: AssistantDateRow[];
}

export interface AssistantDateRow {
  date: string;
  minutes: number;
  distance: number;
  hsr: number;
  sprint: number;
  maxSpeed: number;
  accel: number;
  decel: number;
  rpe: number;
  jumps: number | undefined;
  energy: number | undefined;
  avgSpeed: number | undefined;
}

export interface AssistantPlayer {
  id: string;
  name: string;
  position: string;
  number: number;
  availability: string;
  age?: number | undefined;
  heightCm: number;
  weightKg: number;
  bodyFat: number;
  distance7: number;
  hsr7: number;
  sprint7: number;
  maxSpeed: number;
  acwr: number;
  wellnessScore: number;
  tests: number;
}

export interface AssistantSession {
  id: string;
  date: string;
  title: string;
  label: string;
  status: string;
  durationMin: number;
  rpe: number;
  blocks: string[];
}

export interface AssistantAlert {
  playerId: string;
  playerName: string;
  severity: string;
  text: string;
}

export function buildAssistantContext(
  team: Team,
  players: Player[],
  gpsHistory: GpsDay[],
  sessions: Session[],
  manualTests: ManualTest[],
  medicalEvents: MedicalEvent[],
  wellnessToday: Wellness[],
): AssistantWorkspaceContext {
  const dates = gpsHistory.map((g) => g.date).sort();
  const from = dates[0] ?? "";
  const to = dates[dates.length - 1] ?? "";

  const playerMetrics = players.map((p) => {
    const days = gpsHistory.filter((g) => g.playerId === p.id);
    const d7 = days.filter((g) => g.date >= nDaysAgo(7));
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

    const distance7 = Math.round(sum(d7.map((g) => g.distance)));
    const hsr7 = Math.round(sum(d7.map((g) => g.hsr)));
    const sprint7 = Math.round(sum(d7.map((g) => g.sprint)));
    const maxSpeed = +Math.max(...d7.map((g) => g.maxSpeed), 0).toFixed(1);

    const acute = sum(d7.map((g) => g.rpe * g.minutes));
    const chronic28 = days
      .filter((g) => g.date >= nDaysAgo(28))
      .map((g) => g.rpe * g.minutes);
    const chronic = chronic28.length ? sum(chronic28) / 4 : 0;
    const acwr = chronic ? +(acute / chronic).toFixed(2) : 0;

    const w = wellnessToday.find((x) => x.playerId === p.id);
    const wellnessScore = w
      ? Math.round(((w.sleep + w.fatigue + w.soreness + w.stress + w.mood) / 25) * 100)
      : 0;

    const age = p.dob ? calculateAge(p.dob, to || new Date().toISOString().slice(0, 10)) : undefined;

    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      position: p.position,
      number: p.number,
      availability: p.availability,
      age,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      bodyFat: p.bodyFat,
      distance7,
      hsr7,
      sprint7,
      maxSpeed,
      acwr,
      wellnessScore,
      tests: manualTests.filter((t) => t.playerId === p.id).length + (medicalEvents.filter((m) => m.playerId === p.id).length ? 1 : 0),
    };
  });

  const customKpis = new Map<string, string>();
  for (const g of gpsHistory) {
    for (const k of Object.keys(g.extra ?? {})) {
      if (!customKpis.has(k)) customKpis.set(k, g.extraLabels?.[k] ?? k);
    }
  }

  const hsrMean = avg(playerMetrics.map((p) => p.hsr7).filter((v) => v > 0)) || 1;
  const alerts: AssistantAlert[] = [];
  playerMetrics.forEach((p) => {
    if (p.acwr > 1.35) {
      alerts.push({
        playerId: p.id,
        playerName: p.name,
        severity: "high",
        text: `Seven-day workload is substantially higher than baseline (ACWR ${p.acwr}).`,
      });
    }
    if (p.hsr7 > hsrMean * 1.3) {
      alerts.push({
        playerId: p.id,
        playerName: p.name,
        severity: "medium",
        text: `HSR over 7 days is ${Math.round(((p.hsr7 - hsrMean) / hsrMean) * 100)}% above squad average.`,
      });
    }
    if (p.wellnessScore < 55) {
      alerts.push({
        playerId: p.id,
        playerName: p.name,
        severity: "medium",
        text: `Wellness score ${p.wellnessScore}% — elevated fatigue or soreness reported today.`,
      });
    }
  });

  const playerDateMetrics: AssistantPlayerDateMetrics[] = players.map((p) => {
    const rows = gpsHistory
      .filter((g) => g.playerId === p.id)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((g) => ({
        date: g.date,
        minutes: g.minutes,
        distance: Math.round(g.distance),
        hsr: Math.round(g.hsr),
        sprint: Math.round(g.sprint),
        maxSpeed: +g.maxSpeed.toFixed(1),
        accel: Math.round(g.accel),
        decel: Math.round(g.decel),
        rpe: g.rpe,
        jumps: g.jumps ? Math.round(g.jumps) : undefined,
        energy: g.energy ? Math.round(g.energy) : undefined,
        avgSpeed: g.avgSpeed ? +g.avgSpeed.toFixed(1) : undefined,
      }));
    return {
      playerId: p.id,
      playerName: `${p.firstName} ${p.lastName}`,
      position: p.position,
      rows,
    };
  });

  return {
    team,
    squadSize: players.length,
    players: playerMetrics,
    sessions: sessions.slice(-20).map((s) => ({
      id: s.id,
      date: s.date,
      title: s.title,
      label: s.label,
      status: s.status ?? (s.date > new Date().toISOString().slice(0, 10) ? "scheduled" : s.actualRpe ? "completed" : "pending"),
      durationMin: s.durationMin,
      rpe: s.actualRpe ?? s.plannedRpe ?? 0,
      blocks: [...new Set((s.plan ?? []).map((i) => i.block ?? "BLOCK 1"))],
    })),
    gpsDays: gpsHistory.length,
    customKpis: [...customKpis].map(([key, label]) => ({ key, label })),
    recentAlerts: alerts.slice(0, 12),
    lastSessionDate: to,
    dataRange: { from, to },
    playerDateMetrics,
  };
}

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function calculateAge(dob: string, asOf: string) {
  const birth = new Date(dob);
  const now = new Date(asOf);
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export function contextPrompt(ctx: AssistantWorkspaceContext): string {
  const players = ctx.players
    .map(
      (p) =>
        `- ${p.name} (#${p.number}, ${p.position}, ${p.availability}): distance7=${p.distance7}m, hsr7=${p.hsr7}m, sprint7=${p.sprint7}m, maxSpeed=${p.maxSpeed}km/h, ACWR=${p.acwr}, wellness=${p.wellnessScore}%`,
    )
    .join("\n");

  const sessions = ctx.sessions
    .map((s) => `- ${s.date} [${s.status}] ${s.title} (${s.label}), ${s.durationMin}min, RPE ${s.rpe}`)
    .join("\n");

  const alerts = ctx.recentAlerts
    .map((a) => `- [${a.severity}] ${a.playerName}: ${a.text}`)
    .join("\n") || "No active alerts.";

  const playerSessions = ctx.playerDateMetrics
    .map((p) => {
      const rows = p.rows
        .map(
          (r) =>
            `  ${r.date}: dist=${r.distance}m hsr=${r.hsr}m sprint=${r.sprint}m maxSpeed=${r.maxSpeed}km/h avgSpeed=${r.avgSpeed ?? "-"}km/h rpe=${r.rpe}`,
        )
        .join("\n");
      return `- ${p.playerName} (${p.position}):\n${rows || "  No GPS rows"}`;
    })
    .join("\n");

  return `You are Smarty Assistant, the AI analyst inside T4P (Training 4 Performance).
Team: ${ctx.team.club} — ${ctx.team.name}, season ${ctx.team.season}.
Squad size: ${ctx.squadSize} players.
Data range: ${ctx.dataRange.from || "n/a"} to ${ctx.dataRange.to || "n/a"}.
GPS rows loaded: ${ctx.gpsDays}.
Custom KPIs: ${ctx.customKpis.map((k) => `${k.key} (${k.label})`).join(", ") || "none"}.

SQUAD OVERVIEW:
${players}

RECENT SESSIONS:
${sessions || "No sessions recorded."}

PLAYER SESSION-BY-SESSION METRICS (last 30 GPS rows per player):
${playerSessions || "No per-session GPS data."}

ACTIVE ALERTS:
${alerts}

Answer the coach's questions using ONLY the data above. If you do not have the data, say so. Always be concise, practical and coach-facing. When you mention a player, include their name and position. When discussing load, reference ACWR, distance, HSR or wellness as appropriate. Never make medical diagnoses. The coach keeps the final decision.

If the coach asks for a graph or chart, AFTER your explanation output a chart tag on its own line exactly like this:
[CHART player="Demetriou Andreas" metric="maxSpeed" kind="line"]
Available metrics: distance, hsr, sprint, maxSpeed, avgSpeed, accel, decel, rpe, jumps, energy. Available kinds: line, bar, area. Use the player's per-session rows above to describe the trend in your explanation. Only include the chart tag when a chart is explicitly requested.`;
}
