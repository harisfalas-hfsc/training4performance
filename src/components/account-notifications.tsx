import { useCallback, useEffect, useMemo, useState } from "react";
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

type Filter = "all" | "unread" | "read";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AccountNotifications({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as Row[]) ?? []);
    setSelected([]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => rows.filter((r) => (filter === "unread" ? !r.read_at : filter === "read" ? !!r.read_at : true)),
    [rows, filter],
  );
  const unread = rows.filter((r) => !r.read_at).length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selectedSet.has(r.id));

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? [] : visible.map((r) => r.id));
  }

  async function setRead(ids: string[], read: boolean) {
    if (!ids.length) return;
    setBusy(true);
    const read_at = read ? new Date().toISOString() : null;
    await supabase.from("notifications").update({ read_at }).in("id", ids).eq("user_id", userId);
    setRows((r) => r.map((x) => (ids.includes(x.id) ? { ...x, read_at } : x)));
    setBusy(false);
  }

  async function remove(ids: string[]) {
    if (!ids.length) return;
    setBusy(true);
    await supabase.from("notifications").delete().in("id", ids).eq("user_id", userId);
    setRows((r) => r.filter((x) => !ids.includes(x.id)));
    setSelected((s) => s.filter((x) => !ids.includes(x)));
    setBusy(false);
  }

  const actionable = selected.length ? selected : [];

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Notifications</p>
        <span className="text-xs text-muted-foreground">
          {rows.length} total · {unread} unread
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Notifications are one-way announcements you receive: payment and renewal events, alerts, and messages sent by the{" "}
        <span className="font-semibold">T4P</span> owner to customers. Two-way conversations — where you ask and get an
        answer — live in the <span className="font-semibold">Messages</span> tab.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["all", "unread", "read"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold capitalize ${
              filter === f ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <button
          onClick={toggleAll}
          disabled={visible.length === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {allVisibleSelected ? "Clear selection" : "Select all"}
        </button>
        <button
          onClick={() => setRead(actionable, true)}
          disabled={busy || !actionable.length}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          Mark as read
        </button>
        <button
          onClick={() => setRead(actionable, false)}
          disabled={busy || !actionable.length}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          Mark as unread
        </button>
        <button
          onClick={() => remove(actionable)}
          disabled={busy || !actionable.length}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-50"
        >
          Delete selected ({selected.length})
        </button>
        <button
          onClick={() => setRead(rows.filter((r) => !r.read_at).map((r) => r.id), true)}
          disabled={busy || unread === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          Mark all read
        </button>
        <button
          onClick={() => {
            if (window.confirm("Delete all notifications? This cannot be undone.")) void remove(rows.map((r) => r.id));
          }}
          disabled={busy || rows.length === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-50"
        >
          Delete all
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="mt-4 rounded-md bg-surface-2 px-3 py-4 text-sm text-muted-foreground">
          {rows.length === 0 ? "Nothing yet. Billing events, alerts and announcements will show up here." : "Nothing in this filter."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((r) => {
            const conf = ICONS[r.kind] ?? ICONS["info"]!;
            const Icon = conf.icon;
            return (
              <li
                key={r.id}
                className={`flex gap-3 rounded-md border px-3 py-3 ${
                  selectedSet.has(r.id) ? "border-primary" : "border-border"
                } ${r.read_at ? "bg-card" : "bg-surface-2"}`}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(r.id)}
                  onChange={() => toggle(r.id)}
                  aria-label={`Select ${r.title}`}
                  className="mt-1 size-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <Icon className={`mt-0.5 size-4 shrink-0 ${conf.tone}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {r.title}
                    {!r.read_at ? <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase text-primary">New</span> : null}
                  </p>
                  {r.body ? <p className="mt-1 text-sm text-muted-foreground">{r.body}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{when(r.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => setRead([r.id], !r.read_at)}
                    className="text-xs font-semibold text-primary"
                  >
                    {r.read_at ? "Unread" : "Read"}
                  </button>
                  <button onClick={() => remove([r.id])} aria-label="Delete notification" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
