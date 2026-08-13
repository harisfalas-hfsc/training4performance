import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { asArray, fail, loadWorkspace, ok } from "../workspace";

export default defineTool({
  name: "list_players",
  title: "List players",
  description: "List the players in the signed-in coach's squad, optionally filtered by a name search.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional case-insensitive name filter."),
    limit: z.number().int().min(1).max(200).optional().describe("Maximum players to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const ws = await loadWorkspace(ctx);
    const players = asArray(ws?.players);
    const needle = search?.toLowerCase();
    const filtered = needle
      ? players.filter((p) => String(p["name"] ?? "").toLowerCase().includes(needle))
      : players;
    return ok({ total: filtered.length, players: filtered.slice(0, limit ?? 50) });
  },
});
