import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdminEmail } from "@/lib/admin";
import type { SessionPlanItem } from "@/data/performance";

export type LibraryBlock = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  notes: string | null;
  items: SessionPlanItem[];
  published: boolean;
  sort_order: number;
  updated_at: string;
};

function assertAdmin(claims: Record<string, unknown>) {
  const email = claims?.["email"] as string | undefined;
  if (!isAdminEmail(email)) throw new Error("Forbidden: owner access required");
}

/**
 * Template blocks published by T4P.
 * Row-level security only returns them to accounts with an active
 * subscription (and to the owner), so an expired coach simply gets [].
 */
export const listLibraryBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("library_blocks")
      .select("id, category, name, description, notes, items, published, sort_order, updated_at")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      ...row,
      items: (Array.isArray(row.items) ? row.items : []) as unknown as SessionPlanItem[],
    })) as LibraryBlock[];
  });

export const saveLibraryBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id?: string;
      category: string;
      name: string;
      description?: string;
      notes?: string;
      items: SessionPlanItem[];
      published?: boolean;
      sort_order?: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims as Record<string, unknown>);
    const payload = {
      category: data.category.trim().toUpperCase() || "STRENGTH",
      name: data.name.trim(),
      description: data.description?.trim() || null,
      notes: data.notes?.trim() || null,
      items: data.items as unknown as never,
      published: data.published ?? true,
      sort_order: data.sort_order ?? 0,
      created_by: context.userId,
    };
    if (!payload.name) throw new Error("A block needs a name");

    if (data.id) {
      const { error } = await context.supabase.from("library_blocks").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("library_blocks")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const deleteLibraryBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims as Record<string, unknown>);
    const { error } = await context.supabase.from("library_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
