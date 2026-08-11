import { createServerFn } from "@tanstack/react-start";
import type { Json } from "@/integrations/supabase/types";

type JsonRow = { [key: string]: Json | undefined };

/* Public, code-authenticated endpoints for the player portal.
 * A player never gets a Supabase account: the coach hands out a personal
 * access code, and every call is authorised by that code alone. */

export interface PortalIdentity {
  playerId: string;
  playerName: string;
  clubName: string;
  teamName: string;
  season: string;
}

export interface PortalWellness {
  date: string;
  sleepHours: number | null;
  sleep: number;
  fatigue: number;
  soreness: number;
  stress: number;
  mood: number;
  hydration: number;
  readiness: number;
  note: string | null;
}

export interface PortalPayload {
  identity: PortalIdentity;
  gps: JsonRow[];
  sessions: JsonRow[];
  tests: JsonRow[];
  player: JsonRow | null;
  wellness: PortalWellness[];
}

const clean = (code: unknown) => String(code ?? "").trim().toUpperCase();

export const portalLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({ code: clean(input?.code) }))
  .handler(async ({ data }): Promise<PortalIdentity> => {
    if (data.code.length < 6) throw new Error("Invalid access code");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: access } = await supabaseAdmin
      .from("player_access")
      .select("coach_id,player_id,player_name,active")
      .eq("code", data.code)
      .maybeSingle();
    if (!access || !access.active) throw new Error("Invalid access code");
    await supabaseAdmin
      .from("player_access")
      .update({ last_login_at: new Date().toISOString() })
      .eq("code", data.code);
    const { data: ws } = await supabaseAdmin
      .from("workspace_data")
      .select("team")
      .eq("user_id", access.coach_id)
      .maybeSingle();
    const team = (ws?.team ?? {}) as { club?: string; name?: string; season?: string };
    return {
      playerId: access.player_id,
      playerName: access.player_name,
      clubName: team.club ?? "",
      teamName: team.name ?? "",
      season: team.season ?? "",
    };
  });

export const portalPayload = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({ code: clean(input?.code) }))
  .handler(async ({ data }): Promise<PortalPayload> => {
    if (data.code.length < 6) throw new Error("Invalid access code");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: access } = await supabaseAdmin
      .from("player_access")
      .select("coach_id,player_id,player_name,active")
      .eq("code", data.code)
      .maybeSingle();
    if (!access || !access.active) throw new Error("Invalid access code");

    const [{ data: ws }, { data: wellness }] = await Promise.all([
      supabaseAdmin
        .from("workspace_data")
        .select("team,players,sessions,gps_history,manual_tests,test_records")
        .eq("user_id", access.coach_id)
        .maybeSingle(),
      supabaseAdmin
        .from("player_wellness")
        .select("entry_date,sleep_hours,sleep,fatigue,soreness,stress,mood,hydration,readiness,note")
        .eq("coach_id", access.coach_id)
        .eq("player_id", access.player_id)
        .order("entry_date", { ascending: false })
        .limit(400),
    ]);

    const team = (ws?.team ?? {}) as { club?: string; name?: string; season?: string };
    const rows = <T,>(value: unknown) => (Array.isArray(value) ? (value as T[]) : []);
    const mine = (r: JsonRow) => r["playerId"] === access.player_id;

    return {
      identity: {
        playerId: access.player_id,
        playerName: access.player_name,
        clubName: team.club ?? "",
        teamName: team.name ?? "",
        season: team.season ?? "",
      },
      player: rows<JsonRow>(ws?.players).find((p) => p["id"] === access.player_id) ?? null,
      gps: rows<JsonRow>(ws?.gps_history).filter(mine),
      sessions: rows<JsonRow>(ws?.sessions),
      tests: [
        ...rows<JsonRow>(ws?.test_records).filter(mine),
      ],
      wellness: (wellness ?? []).map((w) => ({
        date: String(w.entry_date),
        sleepHours: w.sleep_hours === null ? null : Number(w.sleep_hours),
        sleep: w.sleep,
        fatigue: w.fatigue,
        soreness: w.soreness,
        stress: w.stress,
        mood: w.mood,
        hydration: w.hydration,
        readiness: w.readiness,
        note: w.note,
      })),
    };
  });

export const portalSaveWellness = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; entry: PortalWellness }) => {
    const scale = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
    const e = input?.entry;
    return {
      code: clean(input?.code),
      entry: {
        date: String(e?.date ?? "").slice(0, 10),
        sleepHours: e?.sleepHours === null || e?.sleepHours === undefined ? null : Math.min(16, Math.max(0, Number(e.sleepHours))),
        sleep: scale(e?.sleep),
        fatigue: scale(e?.fatigue),
        soreness: scale(e?.soreness),
        stress: scale(e?.stress),
        mood: scale(e?.mood),
        hydration: scale(e?.hydration),
        readiness: scale(e?.readiness),
        note: e?.note ? String(e.note).slice(0, 500) : null,
      },
    };
  })
  .handler(async ({ data }) => {
    if (data.code.length < 6) throw new Error("Invalid access code");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.entry.date)) throw new Error("Invalid date");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: access } = await supabaseAdmin
      .from("player_access")
      .select("coach_id,player_id,active")
      .eq("code", data.code)
      .maybeSingle();
    if (!access || !access.active) throw new Error("Invalid access code");
    const { error } = await supabaseAdmin.from("player_wellness").upsert(
      {
        coach_id: access.coach_id,
        player_id: access.player_id,
        entry_date: data.entry.date,
        sleep_hours: data.entry.sleepHours,
        sleep: data.entry.sleep,
        fatigue: data.entry.fatigue,
        soreness: data.entry.soreness,
        stress: data.entry.stress,
        mood: data.entry.mood,
        hydration: data.entry.hydration,
        readiness: data.entry.readiness,
        note: data.entry.note,
        source: "player",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "coach_id,player_id,entry_date" },
    );
    if (error) throw new Error("Could not save wellness");
    return { ok: true };
  });
