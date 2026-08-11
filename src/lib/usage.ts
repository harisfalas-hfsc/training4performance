import { supabase } from "@/integrations/supabase/client";
import {
  applyWorkspaceData,
  workspaceSnapshot,
  type GpsDay,
  type ManualTest,
  type MedicalEvent,
  type Player,
  type Session,
  type Team,
} from "@/data/performance";
import type { Json } from "@/integrations/supabase/types";
import { canWrite } from "@/lib/access";
import { getWorkspaceScope } from "@/lib/workspace-scope";

let activeWorkspaceUser: string | null = null;

export async function hydrateWorkspace(userId: string) {
  activeWorkspaceUser = userId;
  const { data, error } = await supabase
    .from("workspace_data")
    .select("team,players,sessions,gps_history,gps_blocks,rpe_entries,manual_tests,medical_events")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || activeWorkspaceUser !== userId) return;
  if (!data) {
    applyWorkspaceData({
      team: { id: `team-${userId}`, name: "First Team", club: "Your club", season: "2025/26", competition: "", ageGroup: "Senior", gender: "Male", headCoach: "", fitnessCoach: "" },
      players: [],
      sessions: [],
      gpsHistory: [],
      gpsBlocks: [],
      rpeEntries: [],
      manualTests: [],
      medicalEvents: [],
    });
    return;
  }
  applyWorkspaceData({
    team: data.team as unknown as Team,
    players: data.players as unknown as Player[],
    sessions: data.sessions as unknown as Session[],
    gpsHistory: data.gps_history as unknown as GpsDay[],
    gpsBlocks: (data.gps_blocks ?? []) as unknown as GpsBlockRow[],
    rpeEntries: (data.rpe_entries ?? []) as unknown as RpeEntry[],
    manualTests: data.manual_tests as unknown as ManualTest[],
    medicalEvents: data.medical_events as unknown as MedicalEvent[],
  });
}

export async function syncWorkspace(userId: string) {
  const scope = getWorkspaceScope();
  if (!canWrite() || scope.userId !== userId) return;
  const data = workspaceSnapshot();
  const toJson = (value: unknown) => JSON.parse(JSON.stringify(value)) as Json;
  await supabase.from("workspace_data").upsert(
    {
      user_id: userId,
      team: toJson(data.team),
      players: toJson(data.players),
      sessions: toJson(data.sessions),
      gps_history: toJson(data.gpsHistory),
      gps_blocks: toJson(data.gpsBlocks),
      rpe_entries: toJson(data.rpeEntries),
      manual_tests: toJson(data.manualTests),
      medical_events: toJson(data.medicalEvents),
    },
    { onConflict: "user_id" },
  );
}

/**
 * Pushes a lightweight usage snapshot (counts only, no reports) so the
 * administrator can see what each coach has created.
 */
export async function syncUsageSnapshot(input: {
  userId: string;
  clubName: string | null;
  teamName: string | null;
  players: number;
  sessions: number;
  gpsRows: number;
  tests: number;
  playerNames: string[];
}) {
  try {
    await Promise.all([
      supabase.from("usage_snapshots").upsert(
        {
          user_id: input.userId,
          club_name: input.clubName,
          team_name: input.teamName,
          players: input.players,
          sessions: input.sessions,
          gps_rows: input.gpsRows,
          tests: input.tests,
          player_names: input.playerNames,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      ),
      syncWorkspace(input.userId),
    ]);
  } catch {
    /* usage reporting is best-effort */
  }
}

/** Removes the coach's synced workspace + usage snapshot from the cloud. */
export async function clearRemoteWorkspace(userId: string) {
  try {
    await Promise.all([
      supabase.from("workspace_data").delete().eq("user_id", userId),
      supabase
        .from("usage_snapshots")
        .update({ players: 0, sessions: 0, gps_rows: 0, tests: 0, player_names: [], updated_at: new Date().toISOString() })
        .eq("user_id", userId),
    ]);
  } catch {
    /* best effort */
  }
}
