import type { GpsDay, MedicalEvent, Player, RpeEntry, Session, WorkspaceData } from "@/data/performance";
import type { SavedBlock } from "@/data/presets";
import type { TestRecord } from "@/data/testing";
import type { WellnessEntry } from "@/data/wellness";

const DAY = 86_400_000;
const iso = (offset: number) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);

export const DEMO_PLAYERS: Player[] = [
  { id: "demo-p1", firstName: "Alex", lastName: "Keeper", dob: "1998-03-12", position: "GK", dominantLeg: "Right", nationality: "Cyprus", number: 1, heightCm: 189, weightKg: 84, bodyFat: 11.2, availability: "available" },
  { id: "demo-p2", firstName: "Theo", lastName: "Defender", dob: "1999-07-21", position: "CB", dominantLeg: "Right", nationality: "Greece", number: 4, heightCm: 186, weightKg: 80, bodyFat: 10.8, availability: "available" },
  { id: "demo-p3", firstName: "Niko", lastName: "Midfielder", dob: "2000-01-18", position: "CM", dominantLeg: "Left", nationality: "Cyprus", number: 8, heightCm: 178, weightKg: 73, bodyFat: 9.7, availability: "partial", note: "Modified training" },
  { id: "demo-p4", firstName: "Leo", lastName: "Winger", dob: "2001-09-04", position: "W", dominantLeg: "Right", nationality: "Greece", number: 11, heightCm: 175, weightKg: 70, bodyFat: 9.4, availability: "available" },
  { id: "demo-p5", firstName: "Marco", lastName: "Striker", dob: "1997-11-29", position: "ST", dominantLeg: "Left", nationality: "Italy", number: 9, heightCm: 183, weightKg: 78, bodyFat: 10.1, availability: "available" },
];

const sessionTypes = ["RECOVERY", "STRENGTH TRAINING", "FULL TRAINING", "FULL TRAINING", "PARTIAL TRAINING", "ACTIVATION", "GAME"];

export function buildDemoSessions(): Session[] {
  return sessionTypes.map((type, index) => ({
    id: `demo-session-${index + 1}`,
    date: iso(index - 6),
    label: index === 6 ? "MD" : index === 5 ? "MD -1" : `MD -${6 - index}`,
    title: type,
    type,
    durationMin: [40, 60, 85, 80, 65, 45, 95][index] ?? 60,
    objective: index === 6 ? "Competitive match" : "Prepare the squad for match day",
    plannedRpe: [3, 6, 7, 7, 5, 3, 9][index] ?? 5,
    actualRpe: [3, 6, 7, 6, 5, 3, 8][index] ?? 5,
    drills: ["Activation", index === 6 ? "Match" : "Football conditioning"],
    blockNames: ["ACTIVATION & WARM UP", "MAIN BLOCK", "FOOTBALL", "COOL DOWN"],
    plan: [
      { drill: "Movement preparation", purpose: "WARM UP", durationMin: 12, rpe: 3, block: "ACTIVATION & WARM UP", location: "Pitch", tags: ["mobility", "activation"] },
      { drill: index === 6 ? "Match" : "Possession game", purpose: "TACTICS", durationMin: index === 6 ? 70 : 30, rpe: index === 6 ? 9 : 7, block: "MAIN BLOCK", location: "Pitch", tags: ["possession", "football"] },
      { drill: "Small-sided game", purpose: "METABOLIC", durationMin: 20, rpe: 8, block: "FOOTBALL", location: "Pitch", tags: ["SSG", "high intensity"] },
    ],
    status: index < 6 ? "completed" : "scheduled",
  }));
}

export function buildDemoGps(): GpsDay[] {
  const rows: GpsDay[] = [];
  for (let day = -27; day <= 0; day += 1) {
    if ((day + 28) % 4 === 0) continue;
    DEMO_PLAYERS.forEach((player, playerIndex) => {
      const intensity = 0.82 + ((day + playerIndex + 30) % 6) * 0.07;
      rows.push({
        date: iso(day),
        playerId: player.id,
        minutes: Math.round(62 + intensity * 18),
        distance: Math.round((5600 + playerIndex * 260) * intensity),
        hsr: Math.round((310 + playerIndex * 24) * intensity),
        sprint: Math.round((92 + playerIndex * 11) * intensity),
        maxSpeed: +(27.8 + playerIndex * 0.7).toFixed(1),
        accel: Math.round((48 + playerIndex * 3) * intensity),
        decel: Math.round((44 + playerIndex * 3) * intensity),
        jumps: Math.round((8 + playerIndex) * intensity),
        rpe: Math.min(9, Math.round(5 + intensity * 2)),
        status: player.availability === "partial" ? "Partial Training" : "Full Training",
      });
    });
  }
  return rows;
}

export function buildDemoWorkspace(): WorkspaceData {
  const sessions = buildDemoSessions();
  const rpeEntries: RpeEntry[] = DEMO_PLAYERS.map((player, index) => ({
    id: `demo-rpe-${player.id}`,
    date: iso(-5),
    playerId: player.id,
    block: "STRENGTH",
    rpe: 5 + (index % 3),
    minutes: 45,
    note: "Demo strength load",
  }));
  return {
    team: { id: "team-demo", name: "T4P Demo Team", club: "Training 4 Performance", season: "Demo season", competition: "Demo league", ageGroup: "Senior", gender: "Male", headCoach: "Demo Coach", fitnessCoach: "T4P", configured: true },
    players: DEMO_PLAYERS.map((player) => ({ ...player })),
    sessions,
    gpsHistory: buildDemoGps(),
    gpsBlocks: [],
    rpeEntries,
    manualTests: [],
    medicalEvents: [] as MedicalEvent[],
  };
}

export function buildDemoTests(): TestRecord[] {
  return DEMO_PLAYERS.flatMap((player, index) => [
    { id: `demo-cmj-${player.id}`, playerId: player.id, testId: "cmj", date: iso(-14), value: 35 + index * 1.8, source: "manual" as const },
    { id: `demo-sprint-${player.id}`, playerId: player.id, testId: "sprint-10m", date: iso(-14), value: +(1.82 - index * 0.025).toFixed(2), source: "manual" as const },
  ]);
}

export function buildDemoWellness(): WellnessEntry[] {
  return Array.from({ length: 7 }, (_, dayIndex) =>
    DEMO_PLAYERS.map((player, playerIndex) => ({
      id: `demo-w-${dayIndex}-${player.id}`,
      playerId: player.id,
      date: iso(dayIndex - 6),
      sleepHours: 7 + ((dayIndex + playerIndex) % 4) * 0.3,
      sleep: 3 + ((dayIndex + playerIndex) % 3),
      fatigue: 3 + ((dayIndex + playerIndex + 1) % 3),
      soreness: 3 + ((dayIndex + playerIndex + 2) % 3),
      stress: 4,
      mood: 4,
      hydration: 4,
      readiness: player.availability === "partial" ? 3 : 4,
      source: "coach" as const,
    })),
  ).flat();
}

export const DEMO_BLOCKS: SavedBlock[] = [
  { id: "demo-block-speed", name: "Speed exposure", savedAt: "2026-01-01T00:00:00.000Z", category: "SPEED", description: "Progressive accelerations and maximal-speed exposure.", items: [{ drill: "Linear speed", purpose: "POWER", durationMin: 18, rpe: 7, block: "SPEED", location: "Pitch", tags: ["speed", "acceleration"] }] },
  { id: "demo-block-strength", name: "Lower-body strength", savedAt: "2026-01-01T00:00:00.000Z", category: "STRENGTH", description: "Primary lower-body strength block.", items: [{ drill: "Back squat", purpose: "STRENGTH", durationMin: 25, rpe: 7, block: "STRENGTH", location: "Gym", strength: { sets: 4, reps: 5, intensityPct: 80, restSec: 150 }, tags: ["strength"] }] },
];