import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findSupportAnswer, SUPPORT_FALLBACK } from "@/lib/support-knowledge";

/**
 * Answers a customer's latest ticket message from the built-in answer book.
 * No AI request is made, so no credits are consumed. When the question is not
 * covered, nothing is posted and the ticket stays in the owner's queue.
 */
export const autoAnswerTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ticketId: string }) => data)
  .handler(async ({ context, data }): Promise<{ answered: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ticket } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_id, subject, status")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (!ticket || ticket.user_id !== context.userId) return { answered: false };

    const { data: rows } = await supabaseAdmin
      .from("support_messages")
      .select("id, sender_role, body, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: false })
      .limit(2);

    const last = rows?.[0];
    if (!last || last.sender_role !== "user") return { answered: false };

    const question = `${ticket.subject} ${last.body}`;
    const entry = findSupportAnswer(question);
    const body = entry?.answer ?? SUPPORT_FALLBACK;

    // Do not repeat the same answer twice in a row.
    const previous = rows?.[1];
    if (previous && previous.sender_role !== "user" && previous.body === body) {
      return { answered: false };
    }


    const { error } = await supabaseAdmin.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: ticket.user_id,
      sender_role: "auto",
      body: entry.answer,
    });
    if (error) return { answered: false };

    // The customer must see the reply, and the owner must still see the thread.
    await supabaseAdmin
      .from("support_tickets")
      .update({ unread_for_user: true, unread_for_admin: true })
      .eq("id", ticket.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: ticket.user_id,
      kind: "message",
      title: "New reply from T4P support",
      body: entry.answer,
    });

    return { answered: true };
  });
