import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

function when(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AccountMessages({ userId }: { userId: string }) {
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

  const loadTickets = useCallback(async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, topic, status, last_message_at, unread_for_user")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });
    setTickets((data as Ticket[]) ?? []);
  }, [userId]);

  const loadMessages = useCallback(async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id, sender_role, body, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    await supabase.from("support_tickets").update({ unread_for_user: false }).eq("id", ticketId);
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (openId) void loadMessages(openId);
  }, [openId, loadMessages]);

  async function createTicket() {
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
      setError(err?.message ?? "Could not open the ticket");
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
    setSubject("");
    setFirstMessage("");
    setComposing(false);
    setBusy(false);
    await loadTickets();
    setOpenId(data.id);
  }

  async function sendReply() {
    if (!openId || !reply.trim()) return;
    setBusy(true);
    const { error: err } = await supabase.from("support_messages").insert({
      ticket_id: openId,
      sender_id: userId,
      sender_role: "user",
      body: reply.trim().slice(0, 4000),
    });
    if (err) setError(err.message);
    setReply("");
    setBusy(false);
    await loadMessages(openId);
    await loadTickets();
  }

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Communication centre</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a ticket, ask a question, report a problem — and read the answers here.
          </p>
        </div>
        <button
          onClick={() => setComposing((c) => !c)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {composing ? "Close" : "New ticket"}
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
            {busy ? "Sending…" : "Send ticket"}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-2">
          {tickets.length === 0 ? (
            <p className="rounded-md bg-surface-2 px-3 py-4 text-sm text-muted-foreground">No tickets yet.</p>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setOpenId(t.id)}
                className={`w-full rounded-md border px-3 py-2 text-left ${openId === t.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="size-4 shrink-0 text-brand-teal" />
                  <span className="min-w-0 flex-1 truncate">{t.subject}</span>
                  {t.unread_for_user ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t.status === "closed" ? "Closed" : "Open"} · {when(t.last_message_at)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="rounded-md border border-border p-3">
          {!openId ? (
            <p className="text-sm text-muted-foreground">Select a ticket to read the conversation.</p>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md px-3 py-2 text-sm ${m.sender_role === "admin" ? "bg-primary/10" : "bg-surface-2"}`}
                  >
                    <p className="text-xs font-semibold text-muted-foreground">
                      {m.sender_role === "admin" ? "T4P support" : "You"} · {when(m.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
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
