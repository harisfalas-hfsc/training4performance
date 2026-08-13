import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findLearnedAnswer, findSupportAnswer, SUPPORT_FALLBACK, type LearnedEntry } from "@/lib/support-knowledge";

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

    // 1) Answers learned from previous conversations, 2) the built-in answer
    // book, 3) an acknowledgement. No AI request is made in any of the three.
    const { data: learnedRows } = await supabaseAdmin
      .from("support_learned")
      .select("id, question, answer, keywords")
      .order("uses", { ascending: false })
      .limit(500);
    const learned = findLearnedAnswer(question, (learnedRows as LearnedEntry[]) ?? []);
    const entry = learned ? null : findSupportAnswer(question);
    const body = learned?.answer ?? entry?.answer ?? SUPPORT_FALLBACK;
    if (learned) {
      const { data: row } = await supabaseAdmin
        .from("support_learned")
        .select("uses")
        .eq("id", learned.id)
        .maybeSingle();
      await supabaseAdmin
        .from("support_learned")
        .update({ uses: (row?.uses ?? 0) + 1 })
        .eq("id", learned.id);
    }

    // Do not repeat the same answer twice in a row.
    const previous = rows?.[1];
    if (previous && previous.sender_role !== "user" && previous.body === body) {
      return { answered: false };
    }


    const { error } = await supabaseAdmin.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: ticket.user_id,
      sender_role: "auto",
      body,

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
      body,
    });

    return { answered: true };
  });
