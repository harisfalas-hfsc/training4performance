import { toast } from "sonner";

/**
 * Browsing T4P is free for any signed-in coach: every page, chart and screen is
 * visible. Creating or changing data requires an active team subscription.
 *
 * The flag is mirrored here (outside React) so the data layer can refuse writes
 * without every store importing auth context.
 */
let writeAllowed = false;

export function setWriteAccess(value: boolean) {
  writeAllowed = value;
}

export function canWrite() {
  return writeAllowed;
}

/* ------------------------------------------------------------------ */
/* Demo mode                                                           */
/* ------------------------------------------------------------------ */

/**
 * In the public demo everything is editable (sessions, RPE, tests, wellness)
 * except the actions that either change the demo squad itself or take data out
 * of the platform: new teams / players, GPS edits and every export.
 */
let demoMode = false;

export function setDemoMode(value: boolean) {
  demoMode = value;
}

export function isDemoMode() {
  return demoMode;
}

let lastNotice = 0;

function notice(title: string, description: string) {
  const now = Date.now();
  if (now - lastNotice < 1500) return;
  lastNotice = now;
  toast.error(title, {
    description,
    action: {
      label: "See pricing",
      onClick: () => {
        if (typeof window !== "undefined") window.location.href = "/pricing";
      },
    },
  });
}

/** Returns true when the write may proceed; otherwise nudges towards pricing. */
export function guardWrite(): boolean {
  if (writeAllowed) return true;
  notice(
    "Subscription required",
    "Your data stays readable and exportable — adding or editing needs an active subscription (€699 / season).",
  );
  return false;
}

/**
 * Blocks the few actions the demo does not allow.
 * Returns true when the action may proceed.
 */
export function guardDemo(action = "This action"): boolean {
  if (!demoMode) return true;
  notice("Not available in the demo", `${action} is disabled here. It works normally with your own subscription.`);
  return false;
}
