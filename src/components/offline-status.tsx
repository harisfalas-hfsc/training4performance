import { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { OFFLINE_MESSAGE, useOnlineStatus } from "@/lib/use-online";
import { onWaitingWorker, activateWaitingWorker } from "@/lib/offline";

/**
 * Permanent, unobtrusive offline strip plus the "new version available"
 * refresh prompt. Rendered once at the app root, on every page.
 */
export function OfflineStatus() {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("Back online", { description: "Anything you changed offline is being saved now." });
    }
  }, [online]);

  useEffect(() => onWaitingWorker(() => setUpdateReady(true)), []);

  return (
    <>
      {!online ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-amber-500/15 px-4 py-2 text-center text-xs text-foreground backdrop-blur"
          style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
        >
          <span className="inline-flex items-center gap-2">
            <CloudOff className="size-4 text-amber-600" aria-hidden />
            {OFFLINE_MESSAGE}
          </span>
        </div>
      ) : null}
      {updateReady ? (
        <div className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-xs shadow-lg">
          <span className="mr-3 font-semibold">A new version of T4P is ready.</span>
          <button
            type="button"
            onClick={() => activateWaitingWorker()}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"
          >
            <RefreshCw className="size-3.5" aria-hidden /> Refresh
          </button>
        </div>
      ) : null}
    </>
  );
}
