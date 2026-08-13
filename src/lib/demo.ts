/**
 * Public demo workspace.
 *
 * Anyone — subscriber or not — can switch the platform into a sandbox that
 * holds the ready-made "T4P" team. It lives in its own storage scope, never
 * touches a real account and never syncs to the cloud.
 */
import { setDemoMode, setWriteAccess } from "@/lib/access";
import { getWorkspaceScope, setWorkspaceScope } from "@/lib/workspace-scope";
import { applyWorkspaceData } from "@/data/performance";
import { applyTestRecords } from "@/data/testing";
import { clearWellness, setWellnessLocalOnly } from "@/data/wellness";
import { applySavedBlocks } from "@/data/presets";

export const DEMO_SCOPE = "t4p-demo";
const FLAG = "t4p.demo.active";

export function isDemoActive() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

/** Opens an isolated, empty sandbox without creating example records. */
export function activateDemo(_reseed = false) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FLAG, "1");
  } catch {
    /* private mode */
  }
  // Seeding is itself a write, so unlock first and lock the demo rules after.
  setDemoMode(false);
  setWriteAccess(true);
  setWorkspaceScope(DEMO_SCOPE);
  applyWorkspaceData({
    team: { id: "team-demo", name: "", club: "", season: "", competition: "", ageGroup: "Senior", gender: "Male", headCoach: "", fitnessCoach: "", configured: false },
    players: [], sessions: [], gpsHistory: [], gpsBlocks: [], rpeEntries: [], manualTests: [], medicalEvents: [],
  });
  applyTestRecords([]);
  applySavedBlocks([]);
  setWellnessLocalOnly(true);
  clearWellness();
  setDemoMode(true);
}

/**
 * Silently drops the sandbox (no redirect). Used when a real account is
 * signed in — a signed-in workspace must never show the demo team.
 */
export function leaveDemoSilently() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
  setDemoMode(false);
  setWellnessLocalOnly(false);
  clearWellness();
  if (getWorkspaceScope().userId === DEMO_SCOPE) setWorkspaceScope(null);
}

/** Rebuilds the demo data from scratch (used by the "Reset demo" button). */
export function resetDemo() {
  activateDemo(true);
}

/** Leaves the sandbox and hands the workspace back to the signed-in account. */
export function exitDemo() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
  setDemoMode(false);
  setWriteAccess(false);
  setWellnessLocalOnly(false);
  clearWellness();
  if (getWorkspaceScope().userId === DEMO_SCOPE) setWorkspaceScope(null);
  window.location.href = "/";
}

// A page reload inside the demo must land back in the sandbox, not in an empty
// workspace — re-apply the scope as soon as this module is evaluated.
if (typeof window !== "undefined" && isDemoActive()) activateDemo();
