import { useEffect, useState } from "react";
import { toast } from "sonner";

/** The single wording used everywhere an action needs the internet. */
export const OFFLINE_MESSAGE =
  "You're offline — you can view everything saved on this device. Creating new items needs an internet connection.";

/** The single wording used when a page has nothing saved on this device yet. */
export const OFFLINE_EMPTY_MESSAGE =
  "You're offline and this device has no saved copy yet. Connect once and it will be stored here.";

export function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine !== false,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    setOnline(navigator.onLine !== false);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

let lastOfflineNotice = 0;

/**
 * Guard for anything that genuinely needs a server: sign-up, payments, AI,
 * uploads, invites. Returns false and explains once when there is no network.
 */
export function guardOnline(): boolean {
  if (typeof navigator === "undefined" || navigator.onLine !== false) return true;
  const now = Date.now();
  if (now - lastOfflineNotice > 1500) {
    lastOfflineNotice = now;
    toast.error("You're offline", { description: OFFLINE_MESSAGE });
  }
  return false;
}
