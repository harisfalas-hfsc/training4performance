/**
 * Public demo workspace.
 *
 * Anyone — subscriber or not — can switch the platform into a sandbox that
 * holds the ready-made "T4P" team. It lives in its own storage scope, never
 * touches a real account and never syncs to the cloud.
 */
import { setDemoMode, setWriteAccess } from "@/lib/access";
import { getWorkspaceScope, setWorkspaceScope } from "@/lib/workspace-scope";
import { applyWorkspaceData, workspaceSnapshot } from "@/data/performance";
import { applyTestRecords, testRecordsSnapshot } from "@/data/testing";
import { applyLocalWellness, clearWellness, setWellnessLocalOnly } from "@/data/wellness";
import { buildDemoTests, buildDemoWellness, buildDemoWorkspace } from "@/data/demo-seed";

export const DEMO_SCOPE = "t4p-demo";
const FLAG = "t4p.demo.active";
const SEED_VERSION_KEY = "t4p.demo.seed-version";
const SEED_VERSION = "3";

export function isDemoActive() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

/** Turns the demo on and seeds the T4P squad when the sandbox is empty. */
export function activateDemo(reseed = false) {
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
  const snapshot = workspaceSnapshot();
  const needsUpgrade = window.localStorage.getItem(SEED_VERSION_KEY) !== SEED_VERSION;
  if (reseed || needsUpgrade || snapshot.players.length === 0) {
    applyWorkspaceData(buildDemoWorkspace());
    window.localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }
  if (reseed || needsUpgrade || testRecordsSnapshot().length === 0) {
    applyTestRecords(buildDemoTests());
  }
  // Wellness never touches the cloud in the demo — it is kept in memory only.
  setWellnessLocalOnly(true);
  applyLocalWellness(buildDemoWellness());
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
