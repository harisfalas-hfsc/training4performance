import { supabase } from "@/integrations/supabase/client";

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
    await supabase.from("usage_snapshots").upsert(
      {
        user_id: input.userId,
        club_name: input.clubName,
        team_name: input.teamName,
        players: input.players,
        sessions: input.sessions,
        gps_rows: input.gpsRows,
        tests: input.tests,
        player_names: input.playerNames.slice(0, 60),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch {
    /* usage reporting is best-effort */
  }
}
