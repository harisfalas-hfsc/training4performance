/**
 * Training presets — taken from the "DATA" sheet of
 * SALAMINA_FC_LOGBOOK_TRAINING_MONITOR.xlsx.
 *
 * Everything here is a *default*: staff can add their own entries, which are
 * persisted in the browser and merged on top of the defaults.
 */

import type { SessionPlanItem } from "@/data/performance";
import { useSyncExternalStore } from "react";
import { guardWrite } from "@/lib/access";
import { getWorkspaceScope, scopedStorageKey, subscribeWorkspaceScope } from "@/lib/workspace-scope";

/* ------------------------------------------------------------------ */
/* Session types (PLAYER TRAINING DESCRIPTION)                         */
/* ------------------------------------------------------------------ */

export type SessionKind = "field" | "indoor" | "gym" | "recovery" | "game" | "other";

export interface SessionTypePreset {
  name: string;
  kind: SessionKind;
  /** Default block names for this type of day. */
  blocks: string[];
  defaultRpe: number;
  defaultMinutes: number;
}

export const SESSION_TYPES: SessionTypePreset[] = [
  {
    name: "FULL TRAINING",
    kind: "field",
    blocks: ["ACTIVATION & WARM UP", "BLOCK 1", "BLOCK 2", "BLOCK 3"],
    defaultRpe: 7,
    defaultMinutes: 85,
  },
  {
    name: "PARTIAL TRAINING",
    kind: "field",
    blocks: ["ACTIVATION & WARM UP", "BLOCK 1", "BLOCK 2", "COOL DOWN"],
    defaultRpe: 5,
    defaultMinutes: 60,
  },
  {
    name: "RECOVERY",
    kind: "recovery",
    blocks: ["MOBILITY & STABILITY", "REGENERATION", "STRETCHING", "BLOCK 4"],
    defaultRpe: 3,
    defaultMinutes: 40,
  },
  {
    name: "REGENERATION TRAINING",
    kind: "recovery",
    blocks: ["ACTIVATION", "BICYCLE / JOGGING", "MOBILITY & STABILITY", "STRETCHING"],
    defaultRpe: 3,
    defaultMinutes: 45,
  },
  {
    name: "STRENGTH TRAINING",
    kind: "gym",
    blocks: ["ACTIVATION & WARM UP", "MAIN LIFTS", "ACCESSORY", "CORE"],
    defaultRpe: 6,
    defaultMinutes: 60,
  },
  {
    name: "INDOOR TRAINING",
    kind: "indoor",
    blocks: ["ACTIVATION & WARM UP", "BLOCK 1", "BLOCK 2", "COOL DOWN"],
    defaultRpe: 5,
    defaultMinutes: 55,
  },
  {
    name: "PERSONAL TRAINING",
    kind: "gym",
    blocks: ["ACTIVATION & WARM UP", "BLOCK 1", "BLOCK 2", "BLOCK 3"],
    defaultRpe: 5,
    defaultMinutes: 50,
  },
  {
    name: "REHAB",
    kind: "other",
    blocks: ["ACTIVATION", "CORRECTIVES", "RECONDITIONING", "RETURN TO RUN"],
    defaultRpe: 4,
    defaultMinutes: 45,
  },
  {
    name: "FRIENDLY GAME",
    kind: "game",
    blocks: ["ACTIVATION & WARM UP", "1st HALF", "2nd HALF", "COOL DOWN"],
    defaultRpe: 8,
    defaultMinutes: 90,
  },
  {
    name: "GAME",
    kind: "game",
    blocks: ["ACTIVATION & WARM UP", "1st HALF", "2nd HALF", "COOL DOWN"],
    defaultRpe: 9,
    defaultMinutes: 95,
  },
  {
    name: "OFF SEASON TRAINING",
    kind: "other",
    blocks: ["ACTIVATION & WARM UP", "BLOCK 1", "BLOCK 2", "BLOCK 3"],
    defaultRpe: 6,
    defaultMinutes: 70,
  },
  {
    name: "OTHER TRAINING",
    kind: "other",
    blocks: ["BLOCK 1", "BLOCK 2", "BLOCK 3", "BLOCK 4"],
    defaultRpe: 5,
    defaultMinutes: 60,
  },
];

export const sessionTypeOf = (name?: string) =>
  SESSION_TYPES.find((t) => t.name === name) ?? SESSION_TYPES[0]!;

export const DAY_DESCRIPTIONS = [
  "MD",
  "MD -1",
  "MD -2",
  "MD -3",
  "MD +1",
  "MD +2",
  "MD +3",
  "OFF SEASON TRAINING",
  "TRAINING",
  "SP. GROUP TRAINING",
];

export const TRAINING_GROUPS = [
  "ALL TEAM ATHLETES",
  "ATHLETES WHO PLAYED MORE THAN 60'",
  "ATHLETES WHO PLAYED LESS THAN 60'",
  "OUT OF ROSTER ATHLETES",
  "INJURED ATHLETES",
  "BANNED ATHLETES",
  "OTHER ATHLETES",
];

export const DRILL_PURPOSES = [
  "FUN",
  "ACTIVATION",
  "WARM UP",
  "METABOLIC",
  "STRENGTH",
  "POWER",
  "TACTICS",
];

/** TRAINING DRILL list from the workbook. */
export const DRILL_LIBRARY: { name: string; purpose: string; rpe: number; minutes: number }[] = [
  { name: "MINI BANDS", purpose: "ACTIVATION", rpe: 3, minutes: 8 },
  { name: "JOGGING", purpose: "WARM UP", rpe: 3, minutes: 10 },
  { name: "BICYCLE", purpose: "METABOLIC", rpe: 4, minutes: 15 },
  { name: "CORRECTIVES", purpose: "ACTIVATION", rpe: 3, minutes: 10 },
  { name: "MOBILITY & STABILITY", purpose: "ACTIVATION", rpe: 3, minutes: 10 },
  { name: "STRETCHING", purpose: "ACTIVATION", rpe: 2, minutes: 10 },
  { name: "MOVEMENT PREPERATION", purpose: "WARM UP", rpe: 4, minutes: 12 },
  { name: "BALL MASTERY", purpose: "WARM UP", rpe: 4, minutes: 10 },
  { name: "ACTIVATION & WARM UP", purpose: "WARM UP", rpe: 3, minutes: 15 },
  { name: "FUN GAME", purpose: "FUN", rpe: 5, minutes: 10 },
  { name: "STRENGTH CORE", purpose: "STRENGTH", rpe: 5, minutes: 12 },
  { name: "RONDO = AT", purpose: "METABOLIC", rpe: 6, minutes: 12 },
  { name: "RONDO > AT", purpose: "METABOLIC", rpe: 7, minutes: 12 },
  { name: "RONDO < AT", purpose: "METABOLIC", rpe: 5, minutes: 12 },
  { name: "RUNNING DRILLS  = AT", purpose: "METABOLIC", rpe: 7, minutes: 12 },
  { name: "RUNNING DRILLS  > AT", purpose: "METABOLIC", rpe: 8, minutes: 12 },
  { name: "RUNNING DRILLS  < AT", purpose: "METABOLIC", rpe: 5, minutes: 12 },
  { name: "POWER - PLYOMETRICS", purpose: "POWER", rpe: 6, minutes: 10 },
  { name: "POWER - LINEAR SPEED", purpose: "POWER", rpe: 7, minutes: 12 },
  { name: "POWER - MULTIDIRECTIONAL SPEED", purpose: "POWER", rpe: 7, minutes: 12 },
  { name: "POWER - MED BALL", purpose: "POWER", rpe: 5, minutes: 10 },
  { name: "POWER - SHOOTING & FINISHING", purpose: "POWER", rpe: 6, minutes: 15 },
  { name: "1vs1, 2vs2, 3vs2, etc", purpose: "METABOLIC", rpe: 8, minutes: 12 },
  { name: "REACTION TRAINING", purpose: "POWER", rpe: 6, minutes: 10 },
  { name: "PASSING DRILL = AT", purpose: "TACTICS", rpe: 5, minutes: 12 },
  { name: "PASSING DRILL > AT", purpose: "TACTICS", rpe: 6, minutes: 12 },
  { name: "PASSING DRILL < AT", purpose: "TACTICS", rpe: 4, minutes: 12 },
  { name: "POSSESION = AT", purpose: "METABOLIC", rpe: 6, minutes: 15 },
  { name: "POSSESION > AT", purpose: "METABOLIC", rpe: 7, minutes: 15 },
  { name: "POSSESION < AT", purpose: "METABOLIC", rpe: 5, minutes: 15 },
  { name: "SSG = AT", purpose: "METABOLIC", rpe: 7, minutes: 16 },
  { name: "SSG > AT", purpose: "METABOLIC", rpe: 8, minutes: 16 },
  { name: "SSG < AT", purpose: "METABOLIC", rpe: 6, minutes: 16 },
  { name: "GAME DOUBLE BOX", purpose: "TACTICS", rpe: 7, minutes: 20 },
  { name: "GAME HALF PITCH", purpose: "TACTICS", rpe: 8, minutes: 20 },
  { name: "GAME BOX 2 BOX", purpose: "TACTICS", rpe: 8, minutes: 20 },
  { name: "GAME FULL PITCH", purpose: "TACTICS", rpe: 9, minutes: 25 },
  { name: "TOURNAMENTS", purpose: "METABOLIC", rpe: 8, minutes: 20 },
  { name: "P.O.G", purpose: "TACTICS", rpe: 6, minutes: 15 },
  { name: "SHADOW GAME", purpose: "TACTICS", rpe: 5, minutes: 15 },
  { name: "SET PIECES", purpose: "TACTICS", rpe: 4, minutes: 15 },
  { name: "TACTICAL MOVEMENTS", purpose: "TACTICS", rpe: 5, minutes: 15 },
  { name: "RECOVERY TRAINING - INDOOR", purpose: "ACTIVATION", rpe: 3, minutes: 30 },
  { name: "RECOVERY TRAINING - FIELD", purpose: "ACTIVATION", rpe: 3, minutes: 30 },
  { name: "HANDBALL", purpose: "FUN", rpe: 6, minutes: 12 },
  { name: "TENNIS", purpose: "FUN", rpe: 5, minutes: 12 },
  { name: "STRENGTH LOW PUSH (FOUNDATIONAL)", purpose: "STRENGTH", rpe: 5, minutes: 15 },
  { name: "STRENGTH LOW PULL (FOUNDATIONAL)", purpose: "STRENGTH", rpe: 5, minutes: 15 },
  { name: "STRENGTH LOW PUSH (Max Strength)", purpose: "STRENGTH", rpe: 7, minutes: 20 },
  { name: "STRENGTH LOW PULL (Max Strength)", purpose: "STRENGTH", rpe: 7, minutes: 20 },
  { name: "STRENGTH LOW PUSH (POWER)", purpose: "POWER", rpe: 6, minutes: 15 },
  { name: "STRENGTH LOW PULL (POWER)", purpose: "POWER", rpe: 6, minutes: 15 },
  { name: "STRENGTH UPPER PUSH (FOUNDATIONAL)", purpose: "STRENGTH", rpe: 5, minutes: 15 },
  { name: "STRENGTH UPPER PULL (FOUNDATIONAL)", purpose: "STRENGTH", rpe: 5, minutes: 15 },
  { name: "STRENGTH UPPER PUSH (Max Strength)", purpose: "STRENGTH", rpe: 7, minutes: 20 },
  { name: "STRENGTH UPPER PULL (Max Strength)", purpose: "STRENGTH", rpe: 7, minutes: 20 },
  { name: "STRENGTH UPPER PUSH (POWER)", purpose: "POWER", rpe: 6, minutes: 15 },
  { name: "STRENGTH UPPER PULL (POWER)", purpose: "POWER", rpe: 6, minutes: 15 },
];

/* ------------------------------------------------------------------ */
/* Strength exercise library                                           */
/* ------------------------------------------------------------------ */

export type LiftPattern =
  | "Low push"
  | "Low pull"
  | "Upper push"
  | "Upper pull"
  | "Olympic"
  | "Core"
  | "Plyometric";

export interface StrengthExercise {
  name: string;
  pattern: LiftPattern;
  sets: number;
  reps: number;
  /** % of 1RM as a planning default (0 = bodyweight / load by feel). */
  intensity: number;
  restSec: number;
  custom?: boolean;
}

export const STRENGTH_LIBRARY: StrengthExercise[] = [
  { name: "Back squat", pattern: "Low push", sets: 4, reps: 5, intensity: 80, restSec: 180 },
  { name: "Front squat", pattern: "Low push", sets: 4, reps: 4, intensity: 75, restSec: 180 },
  { name: "Bulgarian split squat", pattern: "Low push", sets: 3, reps: 8, intensity: 40, restSec: 120 },
  { name: "Walking lunge", pattern: "Low push", sets: 3, reps: 10, intensity: 35, restSec: 90 },
  { name: "Leg press", pattern: "Low push", sets: 3, reps: 8, intensity: 70, restSec: 120 },
  { name: "Step-up", pattern: "Low push", sets: 3, reps: 8, intensity: 35, restSec: 90 },
  { name: "Deadlift", pattern: "Low pull", sets: 4, reps: 4, intensity: 82, restSec: 180 },
  { name: "Romanian deadlift (RDL)", pattern: "Low pull", sets: 4, reps: 6, intensity: 65, restSec: 150 },
  { name: "Single-leg RDL", pattern: "Low pull", sets: 3, reps: 8, intensity: 30, restSec: 90 },
  { name: "Hip thrust", pattern: "Low pull", sets: 4, reps: 6, intensity: 75, restSec: 150 },
  { name: "Nordic hamstring curl", pattern: "Low pull", sets: 3, reps: 6, intensity: 0, restSec: 120 },
  { name: "Copenhagen adduction", pattern: "Low pull", sets: 3, reps: 8, intensity: 0, restSec: 90 },
  { name: "Bench press", pattern: "Upper push", sets: 4, reps: 5, intensity: 78, restSec: 150 },
  { name: "Incline dumbbell press", pattern: "Upper push", sets: 3, reps: 8, intensity: 60, restSec: 120 },
  { name: "Military / overhead press", pattern: "Upper push", sets: 3, reps: 6, intensity: 70, restSec: 150 },
  { name: "Push-up (loaded)", pattern: "Upper push", sets: 3, reps: 12, intensity: 0, restSec: 75 },
  { name: "Pull-up / chin-up", pattern: "Upper pull", sets: 4, reps: 6, intensity: 0, restSec: 150 },
  { name: "Bent over row", pattern: "Upper pull", sets: 4, reps: 6, intensity: 70, restSec: 150 },
  { name: "Single-arm dumbbell row", pattern: "Upper pull", sets: 3, reps: 8, intensity: 50, restSec: 90 },
  { name: "Lat pulldown", pattern: "Upper pull", sets: 3, reps: 10, intensity: 60, restSec: 90 },
  { name: "Power clean", pattern: "Olympic", sets: 5, reps: 3, intensity: 75, restSec: 180 },
  { name: "Hang clean", pattern: "Olympic", sets: 5, reps: 3, intensity: 70, restSec: 180 },
  { name: "Push jerk", pattern: "Olympic", sets: 4, reps: 3, intensity: 72, restSec: 180 },
  { name: "Trap bar jump", pattern: "Plyometric", sets: 5, reps: 3, intensity: 30, restSec: 150 },
  { name: "Countermovement jump (loaded)", pattern: "Plyometric", sets: 4, reps: 5, intensity: 20, restSec: 120 },
  { name: "Drop jump", pattern: "Plyometric", sets: 4, reps: 5, intensity: 0, restSec: 120 },
  { name: "Plank / anti-extension", pattern: "Core", sets: 3, reps: 30, intensity: 0, restSec: 60 },
  { name: "Pallof press", pattern: "Core", sets: 3, reps: 10, intensity: 0, restSec: 60 },
  { name: "Side plank + hip abduction", pattern: "Core", sets: 3, reps: 10, intensity: 0, restSec: 60 },
  { name: "Hanging leg raise", pattern: "Core", sets: 3, reps: 10, intensity: 0, restSec: 60 },
];

export const LIFT_PATTERNS: LiftPattern[] = [
  "Low push",
  "Low pull",
  "Upper push",
  "Upper pull",
  "Olympic",
  "Plyometric",
  "Core",
];

/* ------------------------------------------------------------------ */
/* Custom (user) library, persisted locally                            */
/* ------------------------------------------------------------------ */

const KEY = "t4p.library.v2";

/** A saved block: the block name plus every drill/exercise inside it. */
export interface SavedBlock {
  id: string;
  name: string;
  savedAt: string;
  items: SessionPlanItem[];
  /** Library section (STRENGTH, POWER, ESD…). */
  category?: string;
  description?: string;
}

/** A saved training: type, block names and the full plan, reusable on any date. */
export interface SavedSessionTemplate {
  id: string;
  name: string;
  savedAt: string;
  type?: string;
  objective?: string;
  durationMin: number;
  plannedRpe: number;
  blockNames: string[];
  plan: SessionPlanItem[];
}

interface LibraryState {
  strength: StrengthExercise[];
  drills: { name: string; purpose: string; rpe: number; minutes: number }[];
  blockNames: string[];
  blocks: SavedBlock[];
  sessions: SavedSessionTemplate[];
}

const state: LibraryState = { strength: [], drills: [], blockNames: [], blocks: [], sessions: [] };
const listeners = new Set<() => void>();
let version = 0;

function load(userId: string | null, migrateLegacy: boolean) {
  state.strength = [];
  state.drills = [];
  state.blockNames = [];
  state.blocks = [];
  state.sessions = [];
  if (typeof window === "undefined" || !userId) return;
  try {
    const key = scopedStorageKey(KEY, userId);
    if (!key) return;
    let raw = window.localStorage.getItem(key);
    if (!raw && migrateLegacy) {
      raw = window.localStorage.getItem(KEY);
      if (raw) window.localStorage.setItem(key, raw);
    }
    if (raw) {
      const s = JSON.parse(raw) as Partial<LibraryState>;
      state.strength = s.strength ?? [];
      state.drills = s.drills ?? [];
      state.blockNames = s.blockNames ?? [];
      state.blocks = s.blocks ?? [];
      state.sessions = s.sessions ?? [];
    }
  } catch {
    /* ignore */
  }
  version++;
  listeners.forEach((listener) => listener());
}
subscribeWorkspaceScope(load);
const initialScope = getWorkspaceScope();
load(initialScope.userId, initialScope.migrateLegacy);

function emit() {
  version++;
  if (typeof window !== "undefined") {
    const key = scopedStorageKey(KEY);
    try {
      if (key) window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

export function useLibraryVersion() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0,
  );
}

export const customStrength = () => state.strength;
export const customDrills = () => state.drills;

export function allStrengthExercises(): StrengthExercise[] {
  return [...STRENGTH_LIBRARY, ...state.strength];
}

export function allDrills() {
  return [...DRILL_LIBRARY, ...state.drills];
}

export function addStrengthExercise(e: StrengthExercise) {
  if (!guardWrite()) return;
  if (allStrengthExercises().some((x) => x.name.toLowerCase() === e.name.toLowerCase())) return;
  state.strength.push({ ...e, custom: true });
  emit();
}

export function removeStrengthExercise(name: string) {
  if (!guardWrite()) return;
  state.strength = state.strength.filter((x) => x.name !== name);
  emit();
}

export function addCustomDrill(d: { name: string; purpose: string; rpe: number; minutes: number }) {
  if (!guardWrite()) return;
  if (allDrills().some((x) => x.name.toLowerCase() === d.name.toLowerCase())) return;
  state.drills.push(d);
  emit();
}

export function removeCustomDrill(name: string) {
  if (!guardWrite()) return;
  state.drills = state.drills.filter((x) => x.name !== name);
  emit();
}

/* ---------- saved blocks & saved trainings ---------- */

const newId = () => `lib-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const savedBlocks = () => state.blocks;
export const savedSessions = () => state.sessions;

/** Save a block (its drills/exercises) so it can be reused in any other training. */
export function saveBlockTemplate(
  name: string,
  items: SessionPlanItem[],
  meta?: { category?: string; description?: string },
) {
  if (!guardWrite()) return;
  const block: SavedBlock = {
    id: newId(),
    name: name.trim() || "Saved block",
    savedAt: new Date().toISOString(),
    items: items.map((i) => ({ ...i })),
    ...(meta?.category ? { category: meta.category } : {}),
    ...(meta?.description ? { description: meta.description } : {}),
  };
  state.blocks.unshift(block);
  emit();
  return block;
}

/** Rename / re-file a block already in the coach's own library. */
export function updateSavedBlock(id: string, patch: Partial<Omit<SavedBlock, "id" | "savedAt">>) {
  if (!guardWrite()) return;
  state.blocks = state.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
  emit();
}

export function removeSavedBlock(id: string) {
  state.blocks = state.blocks.filter((b) => b.id !== id);
  emit();
}

/** Save a whole training (blocks + plan) as a reusable template. */
export function saveSessionTemplate(t: Omit<SavedSessionTemplate, "id" | "savedAt">) {
  if (!guardWrite()) return;
  const tpl: SavedSessionTemplate = {
    ...t,
    name: t.name.trim() || "Saved training",
    blockNames: [...t.blockNames],
    plan: t.plan.map((i) => ({ ...i })),
    id: newId(),
    savedAt: new Date().toISOString(),
  };
  state.sessions.unshift(tpl);
  emit();
  return tpl;
}

export function removeSavedSession(id: string) {
  if (!guardWrite()) return;
  state.sessions = state.sessions.filter((s) => s.id !== id);
  emit();
}
