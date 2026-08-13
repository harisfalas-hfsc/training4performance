import type { ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

export type WorkspaceRow = {
  team: unknown;
  players: unknown;
  sessions: unknown;
  gps_history: unknown;
  test_records: unknown;
  rpe_entries: unknown;
  updated_at: string;
};

export async function loadWorkspace(ctx: ToolContext): Promise<WorkspaceRow | null> {
  const supabase = supabaseForUser(ctx);
  const { data, error } = await supabase
    .from("workspace_data")
    .select("team, players, sessions, gps_history, test_records, rpe_entries, updated_at")
    .eq("user_id", ctx.getUserId() ?? "")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as WorkspaceRow | null) ?? null;
}

export function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export function ok(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload as Record<string, unknown>,
  };
}

export function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}
