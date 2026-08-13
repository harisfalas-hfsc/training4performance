import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Note = { id: string; kind: string; title: string; body: string | null; read_at: string | null; created_at: string };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Bell with the unread count, sitting next to the avatar in every shell. */
export function NotificationBell({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(12);
    setNotes((data as Note[]) ?? []);
  }, [userId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = notes.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!userId || !unread) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
    await load();
  }

  if (!userId) return null;

  return (
    <div ref={boxRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
        className="relative size-12 rounded-full border-0 bg-transparent text-primary shadow-none hover:bg-transparent hover:opacity-70"
      >
        <Bell className="size-6" />
        {unread ? (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold leading-4 text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-80 max-w-[85vw] overflow-hidden rounded-md border border-border bg-popover shadow-panel">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</p>
            {unread ? (
              <button onClick={() => void markAllRead()} className="text-xs font-semibold text-primary">
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className={`border-b border-border px-3 py-2 ${n.read_at ? "" : "bg-primary/5"}`}>
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">{when(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
          <Link
            to="/account"
            search={{ tab: "messages" }}
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 text-sm font-semibold text-primary hover:bg-accent"
          >
            Open communication centre
          </Link>
        </div>
      ) : null}
    </div>
  );
}
