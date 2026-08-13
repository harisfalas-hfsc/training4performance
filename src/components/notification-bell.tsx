import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Permanent bell next to the avatar. It never opens a dropdown — pressing it
 * goes straight to the communication centre, where the full conversation and
 * every notification live.
 */
export function NotificationBell({ userId }: { userId?: string | undefined }) {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!userId) {
      setUnread(0);
      return;
    }
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    setUnread(count ?? 0);
  }, [userId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(t);
  }, [load]);

  return (
    <Link
      to="/account"
      search={{ tab: "messages" }}
      aria-label={unread ? `${unread} unread messages — open communication centre` : "Open communication centre"}
      className="relative grid size-12 shrink-0 place-items-center rounded-full text-primary transition-opacity hover:opacity-70"
    >
      <Bell className="size-6" />
      {unread ? (
        <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-4 text-destructive-foreground">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
