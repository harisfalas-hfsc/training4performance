/**
 * Team slots.
 *
 * A subscription covers one team. The platform owner (administrator) may keep
 * several teams inside the same account — each one lives in its own storage
 * scope so squads, GPS and sessions are never mixed.
 */
import { setWorkspaceScope } from "@/lib/workspace-scope";

export interface TeamSlot {
  id: string;
  label: string;
}

export const PRIMARY_SLOT = "primary";

interface SlotState {
  slots: TeamSlot[];
  active: string;
}

const storageKey = (userId: string) => `t4p.teamSlots.${userId}`;

const DEFAULT_STATE: SlotState = { slots: [{ id: PRIMARY_SLOT, label: "Team 1" }], active: PRIMARY_SLOT };

function read(userId: string): SlotState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as SlotState;
    if (!Array.isArray(parsed.slots) || parsed.slots.length === 0) return DEFAULT_STATE;
    return { slots: parsed.slots, active: parsed.active || PRIMARY_SLOT };
  } catch {
    return DEFAULT_STATE;
  }
}

function write(userId: string, state: SlotState) {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/** Storage scope used for a given slot — the first team keeps the plain user id. */
export function scopeFor(userId: string, slotId: string) {
  return slotId === PRIMARY_SLOT ? userId : `${userId}::${slotId}`;
}

export function listTeamSlots(userId: string) {
  return read(userId).slots;
}

export function activeSlotId(userId: string) {
  const state = read(userId);
  return state.slots.some((s) => s.id === state.active) ? state.active : PRIMARY_SLOT;
}

/** The scope the account should open with (respects the last team the user opened). */
export function activeScopeFor(userId: string) {
  return scopeFor(userId, activeSlotId(userId));
}

export function switchTeamSlot(userId: string, slotId: string, migrateLegacy = false) {
  const state = read(userId);
  if (!state.slots.some((s) => s.id === slotId)) return;
  write(userId, { ...state, active: slotId });
  setWorkspaceScope(scopeFor(userId, slotId), migrateLegacy && slotId === PRIMARY_SLOT);
}

export function addTeamSlot(userId: string, label: string) {
  const state = read(userId);
  const id = `t${Date.now().toString(36)}`;
  const slot: TeamSlot = { id, label: label.trim() || `Team ${state.slots.length + 1}` };
  write(userId, { slots: [...state.slots, slot], active: id });
  setWorkspaceScope(scopeFor(userId, id));
  return slot;
}

export function renameTeamSlot(userId: string, slotId: string, label: string) {
  const state = read(userId);
  write(userId, {
    ...state,
    slots: state.slots.map((s) => (s.id === slotId ? { ...s, label: label.trim() || s.label } : s)),
  });
}

export function removeTeamSlot(userId: string, slotId: string) {
  if (slotId === PRIMARY_SLOT) return;
  const state = read(userId);
  const slots = state.slots.filter((s) => s.id !== slotId);
  write(userId, { slots, active: PRIMARY_SLOT });
  setWorkspaceScope(scopeFor(userId, PRIMARY_SLOT));
}
