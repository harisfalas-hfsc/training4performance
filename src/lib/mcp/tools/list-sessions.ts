import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { asArray, fail, loadWorkspace, ok } from "../workspace";

export default defineTool({
  name: "list_sessions",
  title: "List training sessions",
  description:
    "List the signed-in coach's planned or completed training sessions from the T4P calendar, newest first.",
  inputSchema: {
    from: z.string().trim().optional().describe("Only sessions on/after this ISO date (YYYY-MM-DD)."),
    to: z.string().trim().optional().describe("Only sessions on/before this ISO date (YYYY-MM-DD)."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum sessions to return (default 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const ws = await loadWorkspace(ctx);
    const sessions = asArray(ws?.sessions)
      .filter((s) => {
        const date = String(s["date"] ?? "");
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      })
      .sort((a, b) => String(b["date"] ?? "").localeCompare(String(a["date"] ?? "")));
    return ok({ total: sessions.length, sessions: sessions.slice(0, limit ?? 30) });
  },
});
