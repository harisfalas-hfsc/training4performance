import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok } from "../workspace";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_wellness",
  title: "List wellness entries",
  description:
    "List recent daily wellness questionnaire entries (sleep, fatigue, soreness, stress, mood, readiness) submitted by the signed-in coach's players.",
  inputSchema: {
    playerId: z.string().trim().optional().describe("Optional player id to filter by."),
    from: z.string().trim().optional().describe("Only entries on/after this ISO date (YYYY-MM-DD)."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum entries to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ playerId, from, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("player_wellness")
      .select("id, player_id, entry_date, sleep, sleep_hours, fatigue, soreness, stress, mood, hydration, readiness, note, source")
      .order("entry_date", { ascending: false })
      .limit(limit ?? 50);
    if (playerId) query = query.eq("player_id", playerId);
    if (from) query = query.gte("entry_date", from);
    const { data, error } = await query;
    if (error) return fail(error.message);
    return ok({ total: data?.length ?? 0, entries: data ?? [] });
  },
});
