import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { listLibraryBlocks } from "@/lib/library.functions";
import { browserOnline, trimCache, writeCache } from "@/lib/offline-db";
import { rememberProfileCard, rememberSession } from "@/lib/offline-auth";
import { workspaceSnapshot } from "@/data/performance";
import { testRecordsSnapshot } from "@/data/testing";

/**
 * Downloads the coach's entire world to this device.
 *
 * It runs the moment a session exists, again whenever the connection comes
 * back, and quietly every 10 minutes while online — so no page has to be
 * visited before it works offline.
 */
export function OfflineBootstrap() {
  const { session, user, profile, subscription, isAdmin } = useAuth();
  const running = useRef(false);
  const userId = user?.id ?? null;

  // Keep the session + identity card on the device so the app can render and
  // stay signed in with no connection.
  useEffect(() => {
    if (session) rememberSession(session);
  }, [session]);

  useEffect(() => {
    if (!userId) return;
    rememberProfileCard({
      userId,
      email: user?.email ?? null,
      fullName: profile?.full_name ?? null,
      clubName: profile?.club_name ?? subscription?.team_name ?? null,
    });
    void writeCache(userId, "profile", profile);
    void writeCache(userId, "subscription", subscription);
    void writeCache(userId, "account", { isAdmin, email: user?.email ?? null });
  }, [userId, user?.email, profile, subscription, isAdmin]);

  useEffect(() => {
    if (!userId) return;

    const prefetch = async () => {
      if (!browserOnline() || running.current) return;
      running.current = true;
      const save = (key: string, value: unknown) => writeCache(userId, key, value);

      await Promise.allSettled([
        // Reference library (drills & exercise blocks) + its filter values.
        (async () => {
          const blocks = await listLibraryBlocks();
          await save("library", blocks);
          await save("library-filters", Array.from(new Set(blocks.map((b) => b.category))).sort());
        })(),
        // Notifications.
        (async () => {
          const { data } = await supabase
            .from("notifications")
            .select("id, kind, title, body, read_at, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(200);
          await save("notifications", data ?? []);
          await save("notifications-unread", (data ?? []).filter((r) => !r.read_at).length);
        })(),
        // Wellness answers.
        (async () => {
          const { data } = await supabase
            .from("player_wellness")
            .select(
              "id,player_id,entry_date,sleep_hours,sleep,fatigue,soreness,stress,mood,hydration,readiness,note,source",
            )
            .eq("coach_id", userId)
            .order("entry_date", { ascending: false })
            .limit(5000);
          await save("wellness", data ?? []);
        })(),
        // Player logins the coach manages.
        (async () => {
          const { data } = await supabase
            .from("player_access")
            .select("id,player_id,player_name,code,email,active,last_login_at,reports,password_hash")
            .eq("coach_id", userId);
          await save("player-access", data ?? []);
        })(),
        // Support conversations, each with its full message thread.
        (async () => {
          const { data: tickets } = await supabase
            .from("support_tickets")
            .select("id, subject, topic, status, last_message_at, unread_for_user")
            .eq("user_id", userId)
            .order("last_message_at", { ascending: false });
          await save("support", tickets ?? []);
          await Promise.allSettled(
            (tickets ?? []).map(async (t) => {
              const { data: msgs } = await supabase
                .from("support_messages")
                .select("id, sender_role, body, created_at")
                .eq("ticket_id", t.id)
                .order("created_at", { ascending: true });
              await save(`support:${t.id}`, msgs ?? []);
            }),
          );
        })(),
        // Safety copy of the workspace (squad, sessions, GPS, RPE, medical) and
        // fitness test records — the live copy also lives in local storage.
        (async () => {
          const { data } = await supabase
            .from("workspace_data")
            .select(
              "team,players,sessions,gps_history,gps_blocks,rpe_entries,manual_tests,medical_events,test_records",
            )
            .eq("user_id", userId)
            .maybeSingle();
          if (data) await save("workspace", data);
        })(),
      ]);

      // Only expendable entries are ever dropped; member state is protected.
      await trimCache(userId);
      running.current = false;
    };

    void prefetch();
    const onOnline = () => void prefetch();
    window.addEventListener("online", onOnline);
    const timer = window.setInterval(() => void prefetch(), 10 * 60 * 1000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.clearInterval(timer);
    };
  }, [userId]);

  // Snapshot the in-memory workspace whenever the tab is hidden, so the newest
  // local edits are on the device even if the cloud push has not landed.
  useEffect(() => {
    if (!userId) return;
    const snap = () => {
      void writeCache(userId, "workspace-local", {
        workspace: workspaceSnapshot(),
        tests: testRecordsSnapshot(),
      });
    };
    window.addEventListener("visibilitychange", snap);
    window.addEventListener("pagehide", snap);
    return () => {
      window.removeEventListener("visibilitychange", snap);
      window.removeEventListener("pagehide", snap);
    };
  }, [userId]);

  return null;
}
