import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getTeamOverview from "./tools/get-team-overview";
import listPlayers from "./tools/list-players";
import listSessions from "./tools/list-sessions";
import listWellness from "./tools/list-wellness";
import listNotifications from "./tools/list-notifications";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "training-4-performance",
  title: "TRAINING 4 PERFORMANCE",
  version: "0.1.0",
  instructions:
    "Read-only tools for a T4P (Training 4 Performance) football performance workspace. Use get_team_overview for team and squad totals, list_players for the squad, list_sessions for training sessions, list_wellness for daily player wellness entries and list_notifications for account alerts. All data is scoped to the signed-in coach.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getTeamOverview, listPlayers, listSessions, listWellness, listNotifications],
});
