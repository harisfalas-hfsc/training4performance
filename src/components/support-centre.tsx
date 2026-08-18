import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { offlineFirst } from "@/lib/offline-db";
import { guardOnline } from "@/lib/use-online";
import { autoAnswerTicket } from "@/lib/support-auto.functions";
import { RichText } from "@/components/rich-text";

type Ticket = {
  id: string;
  subject: string;
  topic: string;
  status: string;
  last_message_at: string;
  unread_for_user: boolean;
};

type Message = { id: string; sender_role: string; body: string; created_at: string };

const TOPICS = [
  { v: "general", l: "General question" },
  { v: "billing", l: "Billing & subscription" },
  { v: "bug", l: "Something is not working" },
  { v: "data", l: "Data, import or export" },
  { v: "feature", l: "Feature request" },
];

type Filter = "all" | "unread" | "read";

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Support centre — the two-way half of the communication centre.
 * A conversation behaves exactly like a notification: select, mark read or
 * unread, delete one, delete the selected ones or delete everything.
 */
export function SupportCentre({ userId }: { userId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("general");
  const [firstMessage, setFirstMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const loadTickets = useCallback(async () => {
    const data = await offlineFirst<Ticket[]>(
      "support",
      async () => {
        const { data: rows, error } = await supabase
          .from("support_tickets")
          .select("id, subject, topic, status, last_message_at, unread_for_user")
          .eq("user_id", userId)
          .order("last_message_at", { ascending: false });
        if (error) throw new Error(error.message);
        return (rows as Ticket[]) ?? [];
      },
      userId,
    ).catch(() => [] as Ticket[]);
    setTickets(data);
  }, [userId]);

  const loadMessages = useCallback(async (ticketId: string) => {
    const data = await offlineFirst<Message[]>(
      `support:${ticketId}`,
      async () => {
        const { data: rows, error } = await supabase
          .from("support_messages")
          .select("id, sender_role, body, created_at")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });
        if (error) throw new Error(error.message);
        return (rows as Message[]) ?? [];
      },
      userId,
    ).catch(() => [] as Message[]);
    setMessages(data);
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    await supabase.from("support_tickets").update({ unread_for_user: false }).eq("id", ticketId);
    setTickets((t) => t.map((x) => (x.id === ticketId ? { ...x, unread_for_user: false } : x)));
  }, [userId]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (openId) void loadMessages(openId);
  }, [openId, loadMessages]);

  const visible = useMemo(
    () =>
      tickets.filter((t) => (filter === "unread" ? t.unread_for_user : filter === "read" ? !t.unread_for_user : true)),
    [tickets, filter],
  );
  const unread = tickets.filter((t) => t.unread_for_user).length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((t) => selectedSet.has(t.id));

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function setRead(ids: string[], read: boolean) {
    if (!ids.length) return;
    setBusy(true);
    await supabase.from("support_tickets").update({ unread_for_user: !read }).in("id", ids).eq("user_id", userId);
    setTickets((t) => t.map((x) => (ids.includes(x.id) ? { ...x, unread_for_user: !read } : x)));
    setBusy(false);
  }

  async function remove(ids: string[]) {
    if (!ids.length) return;
    setBusy(true);
    await supabase.from("support_messages").delete().in("ticket_id", ids);
    const { error: err } = await supabase.from("support_tickets").delete().in("id", ids).eq("user_id", userId);
    if (err) setError(err.message);
    else {
      setTickets((t) => t.filter((x) => !ids.includes(x.id)));
      setSelected((s) => s.filter((x) => !ids.includes(x)));
      if (openId && ids.includes(openId)) {
        setOpenId(null);
        setMessages([]);
      }
    }
    setBusy(false);
  }

  /** Instant answer from the built-in answer book, when the question is covered. */
  async function autoReply(ticketId: string) {
    try {
      await autoAnswerTicket({ data: { ticketId } });
    } catch {
      /* an unanswered question simply waits for a human reply */
    }
  }

  async function createTicket() {
    if (!guardOnline()) return;
    if (!subject.trim() || !firstMessage.trim()) {
      setError("Add a subject and a message.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("support_tickets")
      .insert({ user_id: userId, subject: subject.trim().slice(0, 160), topic })
      .select("id")
      .single();
    if (err || !data) {
      setError(err?.message ?? "Could not open the conversation");
      setBusy(false);
      return;
    }
    const { error: mErr } = await supabase.from("support_messages").insert({
      ticket_id: data.id,
      sender_id: userId,
      sender_role: "user",
      body: firstMessage.trim().slice(0, 4000),
    });
    if (mErr) setError(mErr.message);
    else await autoReply(data.id);
    setSubject("");
    setFirstMessage("");
    setComposing(false);
    setBusy(false);
    await loadTickets();
    setOpenId(data.id);
  }

  async function sendReply() {
    if (!guardOnline()) return;
    if (!openId || !reply.trim()) return;
    setBusy(true);
    const { error: err } = await supabase.from("support_messages").insert({
      ticket_id: openId,
      sender_id: userId,
      sender_role: "user",
      body: reply.trim().slice(0, 4000),
    });
    if (err) setError(err.message);
    else await autoReply(openId);
    setReply("");
    setBusy(false);
    await loadMessages(openId);
    await loadTickets();
  }

  const btn = "rounded-md border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50";

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow">Support centre</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask T4P anything — a question, a problem, a request. The Smarty assistant answers instantly from what it
            already knows, and the T4P owner answers everything else here. {tickets.length} conversation
            {tickets.length === 1 ? "" : "s"} · {unread} unread.
          </p>
        </div>
        <button
          onClick={() => setComposing((c) => !c)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {composing ? "Close" : "Send a message to T4P"}
        </button>
      </div>

      {composing ? (
        <div className="mt-4 rounded-md border border-border bg-surface-2 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">Subject</span>
              <input className="control" value={subject} maxLength={160} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Topic</span>
              <select className="control" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {TOPICS.map((t) => (
                  <option key={t.v} value={t.v}>
                    {t.l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field mt-3">
            <span className="field-label">Message</span>
            <textarea
              className="control min-h-24"
              maxLength={4000}
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              placeholder="Describe what you need help with…"
            />
          </label>
          <button
            onClick={createTicket}
            disabled={busy}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send message"}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

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
        <button onClick={() => setSelected(allVisibleSelected ? [] : visible.map((t) => t.id))} disabled={!visible.length} className={btn}>
          {allVisibleSelected ? "Clear selection" : "Select all"}
        </button>
        <button onClick={() => setRead(selected, true)} disabled={busy || !selected.length} className={btn}>
          Mark as read
        </button>
        <button onClick={() => setRead(selected, false)} disabled={busy || !selected.length} className={btn}>
          Mark as unread
        </button>
        <button
          onClick={() => {
            if (window.confirm("Delete the selected conversations? This cannot be undone.")) void remove(selected);
          }}
          disabled={busy || !selected.length}
          className={`${btn} text-destructive`}
        >
          Delete selected ({selected.length})
        </button>
        <button
          onClick={() => setRead(tickets.filter((t) => t.unread_for_user).map((t) => t.id), true)}
          disabled={busy || unread === 0}
          className={btn}
        >
          Mark all read
        </button>
        <button
          onClick={() => {
            if (window.confirm("Delete all conversations? This cannot be undone.")) void remove(tickets.map((t) => t.id));
          }}
          disabled={busy || !tickets.length}
          className={`${btn} text-destructive`}
        >
          Delete all
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-2">
          {visible.length === 0 ? (
            <p className="rounded-md bg-surface-2 px-3 py-4 text-sm text-muted-foreground">
              {tickets.length === 0 ? "No conversations yet." : "Nothing in this filter."}
            </p>
          ) : (
            visible.map((t) => (
              <div
                key={t.id}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 ${
                  openId === t.id ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(t.id)}
                  onChange={() => toggle(t.id)}
                  aria-label={`Select ${t.subject}`}
                  className="mt-1.5 size-4 shrink-0 accent-[hsl(var(--primary))]"
                />
                <button onClick={() => setOpenId(t.id)} className="min-w-0 flex-1 text-left">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <MessageSquare className="size-4 shrink-0 text-brand-teal" />
                    <span className="min-w-0 flex-1 truncate">{t.subject}</span>
                    {t.unread_for_user ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t.status === "closed" ? "Closed" : "Open"} · {when(t.last_message_at)}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Delete this conversation?")) void remove([t.id]);
                  }}
                  aria-label="Delete conversation"
                  className="mt-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="rounded-md border border-border p-3">
          {!openId ? (
            <p className="text-sm text-muted-foreground">Select a conversation to read it.</p>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md px-3 py-2 text-sm ${m.sender_role === "user" ? "bg-surface-2" : "bg-primary/10"}`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      {m.sender_role === "user" ? "You" : "T4P support"} · {when(m.created_at)}
                    </p>
                    <RichText text={m.body} className="mt-1 whitespace-pre-wrap" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="control flex-1"
                  value={reply}
                  maxLength={4000}
                  placeholder="Write a reply…"
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendReply();
                    }
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={busy || !reply.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  <Send className="size-4" /> Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
