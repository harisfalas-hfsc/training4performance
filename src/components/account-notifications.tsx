import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, Mail, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

const ICONS: Record<string, { icon: typeof Info; tone: string }> = {
  info: { icon: Info, tone: "text-brand-blue" },
  success: { icon: CheckCircle2, tone: "text-brand-green" },
  billing: { icon: Bell, tone: "text-brand-indigo" },
  warning: { icon: AlertTriangle, tone: "text-brand-amber" },
  error: { icon: AlertTriangle, tone: "text-destructive" },
  message: { icon: Mail, tone: "text-brand-teal" },
};

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AccountNotifications({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
    void load();
  }

  async function remove(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  }

  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Notifications</p>
        {unread > 0 ? (
          <button onClick={markAllRead} className="text-xs font-semibold text-primary">
            Mark all as read ({unread})
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Payments, renewals, replies from support and announcements from <span className="font-semibold">T4P</span>.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 rounded-md bg-surface-2 px-3 py-4 text-sm text-muted-foreground">
          Nothing yet. Billing events and support replies will show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => {
            const conf = ICONS[r.kind] ?? ICONS["info"]!;
            const Icon = conf.icon;
            return (
              <li
                key={r.id}
                className={`flex gap-3 rounded-md border border-border px-3 py-3 ${r.read_at ? "bg-card" : "bg-surface-2"}`}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${conf.tone}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.title}</p>
                  {r.body ? <p className="mt-1 text-sm text-muted-foreground">{r.body}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{when(r.created_at)}</p>
                </div>
                <button onClick={() => remove(r.id)} aria-label="Delete notification" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
