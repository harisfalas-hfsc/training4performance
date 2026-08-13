import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Note = { id: string; kind: string; title: string; body: string | null; read_at: string | null; created_at: string };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Bell with the unread count, sitting next to the avatar in every shell. */
export function NotificationBell({ userId }: { userId?: string | undefined }) {
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
        <div className="fixed inset-x-3 top-16 z-50 flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-md border border-border bg-popover shadow-panel sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:max-h-[min(36rem,calc(100dvh-5rem))] sm:w-96">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">Messages, billing and account updates</p>
            </div>
            {unread ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => void markAllRead()} className="h-8 gap-1.5 px-2 text-xs text-primary">
                <CheckCheck className="size-4" /> Mark all read
              </Button>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {notes.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className={`border-b border-border px-4 py-3 ${n.read_at ? "" : "bg-primary/5"}`}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      {n.kind === "message" ? <MessageSquare className="size-4" /> : <Bell className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5">{n.title}</p>
                      {n.body ? <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-foreground">{n.body}</p> : null}
                      <p className="mt-1.5 text-xs text-muted-foreground">{when(n.created_at)}</p>
                    </div>
                    {!n.read_at ? <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/account"
            search={{ tab: "messages" }}
            onClick={() => setOpen(false)}
            className="flex shrink-0 items-center justify-center gap-2 border-t border-border px-4 py-3 text-sm font-semibold text-primary hover:bg-accent"
          >
            <MessageSquare className="size-4" /> Open Communication Centre
          </Link>
        </div>
      ) : null}
    </div>
  );
}
