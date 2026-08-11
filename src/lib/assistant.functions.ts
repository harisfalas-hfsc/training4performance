import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdminEmail } from "@/lib/admin";
import type { Json } from "@/integrations/supabase/types";

function assertAdmin(claims: Record<string, unknown>) {
  if (isAdminEmail(claims?.["email"] as string | undefined)) return;
  throw new Error("Forbidden: owner access required");
}

export const assistantListThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("assistant_threads")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { threads: data ?? [] };
  });

export const assistantCreateThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { title?: string }) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("assistant_threads")
      .insert({ user_id: userId, title: data.title?.trim() || "New chat" })
      .select("id, title, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return { thread: row };
  });

export const assistantRenameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; title: string }) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("assistant_threads")
      .update({ title: data.title.trim() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assistantDeleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("assistant_threads")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assistantListMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId: string }) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("assistant_messages")
      .select("id, role, content, parts, created_at")
      .eq("thread_id", data.threadId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return { messages: rows ?? [] };
  });

export const assistantSaveMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { threadId: string; role: "user" | "assistant" | "tool"; content: string; parts?: Json }) => data,
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("assistant_messages").insert({
      thread_id: data.threadId,
      user_id: userId,
      role: data.role,
      content: data.content,
      parts: data.parts ?? [],
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assistantGetCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("assistant_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return { balance: data?.balance ?? 0 };
  });

export const assistantSpendCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId?: string; requestTokens?: number; responseTokens?: number; costEur?: number }) => data)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("assistant_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const balance = existing?.balance ?? 0;
    if (balance <= 0) throw new Error("No assistant credits remaining");

    const newBalance = balance - 1;
    const { error } = await supabase
      .from("assistant_credits")
      .upsert({ user_id: userId, balance: newBalance });
    if (error) throw new Error(error.message);

    await supabase.from("assistant_usage").insert({
      user_id: userId,
      thread_id: data.threadId ?? null,
      request_tokens: data.requestTokens ?? null,
      response_tokens: data.responseTokens ?? null,
      cost_eur: data.costEur ?? null,
    });

    return { balance: newBalance };
  });

export const assistantAdminGrantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; amount: number }) => data)
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("assistant_credits")
      .select("balance")
      .eq("user_id", data.userId)
      .single();
    const balance = (existing?.balance ?? 0) + data.amount;
    const { error } = await supabaseAdmin
      .from("assistant_credits")
      .upsert({ user_id: data.userId, balance });
    if (error) throw new Error(error.message);
    return { balance };
  });

export const assistantAdminUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId?: string }) => data)
  .handler(async ({ context, data }) => {
    assertAdmin(context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("assistant_usage").select("id, user_id, thread_id, request_tokens, response_tokens, cost_eur, created_at").order("created_at", { ascending: false }).limit(500);
    if (data.userId) q = q.eq("user_id", data.userId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { usage: rows ?? [] };
  });
