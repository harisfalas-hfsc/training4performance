import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireOwner } from "@/lib/support.server";
import { extractKeywords } from "@/lib/support-knowledge";

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  status: string;
  last_message_at: string;
  unread_for_user: boolean;
  unread_for_admin: boolean;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */

/** Customer asks for the monthly subscription — saved as pending for the owner. */
export const requestSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { teamName?: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const end = new Date(now.getTime());
    end.setMonth(end.getMonth() + 1);
    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: context.userId,
        team_name: (data.teamName || "First team").slice(0, 120),
        status: "pending",
        cancel_at_period_end: false,
        canceled_at: null,
        season_start: now.toISOString().slice(0, 10),
        season_end: end.toISOString().slice(0, 10),
        price_eur: 69.9,
      },
      { onConflict: "user_id" },
    );
    if (error) return { error: error.message };
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      kind: "billing",
      title: "Subscription request received",
      body: "Your monthly subscription (€69.90 / month) is being set up. You will get a message here as soon as the payment is confirmed and full editing is unlocked.",
    });
    return { ok: true };
  });

/** Customer cancels (or resumes) the automatic monthly renewal. */
export const setAutoRenew = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cancel: boolean }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: data.cancel, canceled_at: data.cancel ? new Date().toISOString() : null })
      .eq("user_id", context.userId)
      .select("season_end")
      .maybeSingle();
    if (error) return { error: error.message };
    await supabaseAdmin.from("notifications").insert({
      user_id: context.userId,
      kind: data.cancel ? "warning" : "success",
      title: data.cancel ? "Subscription cancelled" : "Subscription resumed",
      body: data.cancel
        ? `Automatic renewal is off. You keep full access until ${sub?.season_end ?? "the end of the paid month"}, then the account becomes read-only — your data, reports and exports stay available.`
        : "Automatic monthly renewal is back on. Nothing else to do.",
    });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Owner messaging                                                     */
/* ------------------------------------------------------------------ */

export const adminSendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId?: string; all?: boolean; title: string; body?: string; kind?: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true; sent: number } | { error: string }> => {
    try {
      requireOwner(context.claims);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const title = (data.title || "").trim().slice(0, 160);
      if (!title) return { error: "A title is required" };
      const body = (data.body || "").trim().slice(0, 4000) || null;
      const kind = data.kind || "info";

      let targets: string[] = [];
      if (data.all) {
        const { data: profiles, error } = await supabaseAdmin.from("profiles").select("id").limit(1000);
        if (error) return { error: error.message };
        targets = (profiles ?? []).map((p) => p.id);
      } else if (data.userId) {
        targets = [data.userId];
      }
      if (!targets.length) return { error: "No recipient" };

      const { error: insErr } = await supabaseAdmin
        .from("notifications")
        .insert(targets.map((user_id) => ({ user_id, kind, title, body })));
      if (insErr) return { error: insErr.message };
      return { ok: true, sent: targets.length };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

/** Owner replies inside a customer ticket. */
export const adminReplyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ticketId: string; body: string; close?: boolean; learn?: boolean }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      requireOwner(context.claims);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const body = (data.body || "").trim().slice(0, 4000);
      if (!body) return { error: "Message is empty" };
      const { data: ticket, error: tErr } = await supabaseAdmin
        .from("support_tickets")
        .select("id, user_id, subject")
        .eq("id", data.ticketId)
        .maybeSingle();
      if (tErr || !ticket) return { error: tErr?.message ?? "Ticket not found" };

      const { error } = await supabaseAdmin.from("support_messages").insert({
        ticket_id: ticket.id,
        sender_id: context.userId,
        sender_role: "admin",
        body,
      });
      if (error) return { error: error.message };

      // Self-training: remember the owner's answer against the customer's last
      // question, so the assistant can answer it on its own next time.
      const { data: lastUser } = await supabaseAdmin
        .from("support_messages")
        .select("body")
        .eq("ticket_id", ticket.id)
        .eq("sender_role", "user")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data.learn !== false && lastUser?.body) {
        const question = `${ticket.subject} ${lastUser.body}`.slice(0, 1000);
        const keywords = extractKeywords(question);
        if (keywords.length >= 2 && body.length >= 20) {
          const { data: existing } = await supabaseAdmin
            .from("support_learned")
            .select("id")
            .eq("question", question)
            .maybeSingle();
          if (existing) {
            await supabaseAdmin.from("support_learned").update({ answer: body, keywords }).eq("id", existing.id);
          } else {
            await supabaseAdmin
              .from("support_learned")
              .insert({ question, answer: body, keywords, created_by: context.userId });
          }
        }
      }

      if (data.close) {
        await supabaseAdmin
          .from("support_tickets")
          .update({ status: "closed", unread_for_user: true })
          .eq("id", ticket.id);
      }
      await supabaseAdmin.from("notifications").insert({
        user_id: ticket.user_id,
        kind: "message",
        title: "New reply from T4P support",
        body,
      });
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

export type AdminTicket = TicketRow & { email: string | null; full_name: string | null };

export const adminListTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { status?: string }) => data)
  .handler(async ({ context, data }): Promise<{ tickets: AdminTicket[] } | { error: string }> => {
    try {
      requireOwner(context.claims);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let q = supabaseAdmin
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(300);
      if (data.status && data.status !== "all") q = q.eq("status", data.status);
      const { data: rows, error } = await q;
      if (error) return { error: error.message };
      const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return {
        tickets: (rows ?? []).map((r) => ({
          ...(r as TicketRow),
          email: map.get(r.user_id)?.email ?? null,
          full_name: map.get(r.user_id)?.full_name ?? null,
        })),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const adminGetTicketMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ticketId: string }) => data)
  .handler(
    async ({
      context,
      data,
    }): Promise<
      { messages: { id: string; sender_role: string; body: string; created_at: string }[] } | { error: string }
    > => {
      try {
        requireOwner(context.claims);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: rows, error } = await supabaseAdmin
          .from("support_messages")
          .select("id, sender_role, body, created_at")
          .eq("ticket_id", data.ticketId)
          .order("created_at", { ascending: true });
        if (error) return { error: error.message };
        await supabaseAdmin.from("support_tickets").update({ unread_for_admin: false }).eq("id", data.ticketId);
        return { messages: rows ?? [] };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Failed" };
      }
    },
  );
