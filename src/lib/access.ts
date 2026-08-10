import { toast } from "sonner";

/**
 * Browsing T4P is free for any signed-in coach: every page, chart and screen is
 * visible. Creating or changing data requires an active team subscription.
 *
 * The flag is mirrored here (outside React) so the data layer can refuse writes
 * without every store importing auth context.
 */
let writeAllowed = true;

export function setWriteAccess(value: boolean) {
  writeAllowed = value;
}

export function canWrite() {
  return writeAllowed;
}

let lastNotice = 0;

/** Returns true when the write may proceed; otherwise nudges towards pricing. */
export function guardWrite(): boolean {
  if (writeAllowed) return true;
  const now = Date.now();
  if (now - lastNotice > 1500) {
    lastNotice = now;
    toast.error("Subscription required", {
      description: "Browsing is free — adding or editing data needs an active team subscription (€999 / season).",
      action: {
        label: "See pricing",
        onClick: () => {
          if (typeof window !== "undefined") window.location.href = "/pricing";
        },
      },
    });
  }
  return false;
}
