import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fail, ok } from "../workspace";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_notifications",
  title: "List notifications",
  description: "List the signed-in user's T4P notifications (alerts, billing and account messages), newest first.",
  inputSchema: {
    unreadOnly: z.boolean().optional().describe("Return only unread notifications."),
    limit: z.number().int().min(1).max(100).optional().describe("Maximum notifications to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ unreadOnly, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("notifications")
      .select("id, kind, title, body, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (unreadOnly) query = query.is("read_at", null);
    const { data, error } = await query;
    if (error) return fail(error.message);
    return ok({ total: data?.length ?? 0, notifications: data ?? [] });
  },
});
