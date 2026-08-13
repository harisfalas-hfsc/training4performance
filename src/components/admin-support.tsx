import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquare, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  adminGetTicketMessages,
  adminListTickets,
  adminReplyToTicket,
  adminSendNotification,
  type AdminTicket,
} from "@/lib/support.functions";

type Message = { id: string; sender_role: string; body: string; created_at: string };

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AdminSupport({ customers }: { customers: { id: string; email: string; full_name: string }[] }) {
  const listTickets = useServerFn(adminListTickets);
  const getMessages = useServerFn(adminGetTicketMessages);
  const replyFn = useServerFn(adminReplyToTicket);
  const notifyFn = useServerFn(adminSendNotification);

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [target, setTarget] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("info");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listTickets({ data: { status: statusFilter } });
    if ("error" in res) toast.error(res.error);
    else setTickets(res.tickets);
    setLoading(false);
  }, [listTickets, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openTicket = useCallback(
    async (id: string) => {
      setOpenId(id);
      const res = await getMessages({ data: { ticketId: id } });
      if ("error" in res) toast.error(res.error);
      else setMessages(res.messages);
    },
    [getMessages],
  );

  async function send(close = false) {
    if (!openId || !reply.trim()) return;
    setBusy(true);
    const res = await replyFn({ data: { ticketId: openId, body: reply, close } });
    if ("error" in res) toast.error(res.error);
    else {
      setReply("");
      await openTicket(openId);
      await load();
    }
    setBusy(false);
  }

  async function broadcast() {
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    setBusy(true);
    const res = await notifyFn({
      data: target === "all" ? { all: true, title, body, kind } : { userId: target, title, body, kind },
    });
    if ("error" in res) toast.error(res.error);
    else {
      toast.success(`Sent to ${res.sent} account${res.sent === 1 ? "" : "s"}`);
      setTitle("");
      setBody("");
    }
    setBusy(false);
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="panel p-5">
        <p className="eyebrow flex items-center gap-2">
          <Megaphone className="size-4 text-brand-indigo" /> Send a notification
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="field">
            <span className="field-label">To</span>
            <select className="control" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Type</span>
            <select className="control" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="info">Info</option>
              <option value="success">Payment succeeded / welcome</option>
              <option value="warning">Payment failed / expiring</option>
              <option value="billing">Billing</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Title</span>
            <input className="control" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>
        <label className="field mt-3">
          <span className="field-label">Message</span>
          <textarea className="control min-h-20" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <Button className="mt-3" size="sm" disabled={busy} onClick={broadcast}>
          <Send className="size-4" /> Send notification
        </Button>
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow flex items-center gap-2">
            <MessageSquare className="size-4 text-brand-teal" /> Tickets ({tickets.length})
          </p>
          <select className="control max-w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <div className="space-y-2">
              {tickets.length === 0 ? (
                <p className="rounded-md bg-surface-2 px-3 py-4 text-sm text-muted-foreground">No tickets.</p>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTicket(t.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left ${openId === t.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="min-w-0 flex-1 truncate">{t.subject}</span>
                      {t.unread_for_admin ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {t.full_name || t.email} · {t.topic} · {when(t.last_message_at)}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-md border border-border p-3">
              {!openId ? (
                <p className="text-sm text-muted-foreground">Select a ticket to read and reply.</p>
              ) : (
                <>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-md px-3 py-2 text-sm ${m.sender_role === "admin" ? "bg-primary/10" : "bg-surface-2"}`}
                      >
                        <p className="text-xs font-semibold text-muted-foreground">
                          {m.sender_role === "admin" ? "You (T4P)" : "Customer"} · {when(m.created_at)}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))}
                  </div>
                  <textarea
                    className="control mt-3 min-h-20"
                    placeholder="Write a reply…"
                    maxLength={4000}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" disabled={busy || !reply.trim()} onClick={() => send(false)}>
                      <Send className="size-4" /> Reply
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy || !reply.trim()} onClick={() => send(true)}>
                      Reply &amp; close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
