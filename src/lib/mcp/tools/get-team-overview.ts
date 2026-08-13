import { defineTool } from "@lovable.dev/mcp-js";
import { asArray, fail, loadWorkspace, ok } from "../workspace";

export default defineTool({
  name: "get_team_overview",
  title: "Get team overview",
  description:
    "Summarise the signed-in coach's T4P workspace: team details, squad size, number of training sessions, GPS imports and fitness test records.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return fail("Not authenticated");
    const ws = await loadWorkspace(ctx);
    if (!ws) return ok({ team: null, message: "No workspace saved yet for this account." });
    return ok({
      team: ws.team,
      counts: {
        players: asArray(ws.players).length,
        sessions: asArray(ws.sessions).length,
        gpsRows: asArray(ws.gps_history).length,
        testRecords: asArray(ws.test_records).length,
        rpeEntries: asArray(ws.rpe_entries).length,
      },
      updatedAt: ws.updated_at,
    });
  },
});
