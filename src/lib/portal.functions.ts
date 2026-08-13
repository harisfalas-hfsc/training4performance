import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

type JsonRow = { [key: string]: Json | undefined };

/* Public, credential-authenticated endpoints for the player portal.
 * A player never gets a Supabase account: the coach creates an email +
 * password (or a short access code) inside the player's profile, and every
 * call is authorised against that single row. A player can only ever reach
 * his own data, and only the report sections the coach shared with him. */

export interface PortalReports {
  wellness: boolean;
  gps: boolean;
  tests: boolean;
  load: boolean;
  /** GPS metrics the coach decided this player may see. */
  metrics: string[];
}

export const DEFAULT_REPORTS: PortalReports = {
  wellness: true,
  gps: true,
  tests: true,
  load: true,
  metrics: ["distance", "hsr", "sprint", "accel", "decel", "load"],
};

export interface PortalIdentity {
  token: string;
  playerId: string;
  playerName: string;
  clubName: string;
  teamName: string;
  season: string;
  reports: PortalReports;
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
const cleanEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();

function toReports(value: unknown): PortalReports {
  const v = (value ?? {}) as Partial<PortalReports>;
  return {
    wellness: v.wellness !== false,
    gps: v.gps !== false,
    tests: v.tests !== false,
    load: v.load !== false,
    metrics: Array.isArray(v.metrics) ? v.metrics.map(String) : DEFAULT_REPORTS.metrics,
  };
}

async function hashPassword(password: string, salt: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomHex(bytes = 16) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type AccessRow = {
  coach_id: string;
  player_id: string;
  player_name: string;
  code: string;
  active: boolean;
  reports: Json;
};

async function accessByToken(token: string): Promise<AccessRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("player_access")
    .select("coach_id,player_id,player_name,code,active,reports")
    .eq("code", clean(token))
    .maybeSingle();
  if (!data || !data.active) throw new Error("Your access has been revoked. Ask your coach.");
  return data as AccessRow;
}

async function identityFrom(row: AccessRow): Promise<PortalIdentity> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ws } = await supabaseAdmin
    .from("workspace_data")
    .select("team")
    .eq("user_id", row.coach_id)
    .maybeSingle();
  const team = (ws?.team ?? {}) as { club?: string; name?: string; season?: string };
  return {
    token: row.code,
    playerId: row.player_id,
    playerName: row.player_name,
    clubName: team.club ?? "",
    teamName: team.name ?? "",
    season: team.season ?? "",
    reports: toReports(row.reports),
  };
}

/** Sign in with the email + password the coach created in the player profile. */
export const portalSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => ({
    email: cleanEmail(input?.email),
    password: String(input?.password ?? ""),
  }))
  .handler(async ({ data }): Promise<PortalIdentity> => {
    if (!data.email || data.password.length < 6) throw new Error("Wrong email or password");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("player_access")
      .select("coach_id,player_id,player_name,code,active,reports,password_hash,password_salt")
      .eq("email", data.email)
      .maybeSingle();
    if (!row || !row.password_hash || !row.password_salt) throw new Error("Wrong email or password");
    const hash = await hashPassword(data.password, row.password_salt);
    if (hash !== row.password_hash) throw new Error("Wrong email or password");
    if (!row.active) throw new Error("Your access has been revoked. Ask your coach.");
    await supabaseAdmin
      .from("player_access")
      .update({ last_login_at: new Date().toISOString() })
      .eq("code", row.code);
    return identityFrom(row as AccessRow);
  });

/** Fallback sign-in for coaches who only handed out a short code. */
export const portalLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({ code: clean(input?.code) }))
  .handler(async ({ data }): Promise<PortalIdentity> => {
    if (data.code.length < 6) throw new Error("Invalid access code");
    const row = await accessByToken(data.code);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("player_access")
      .update({ last_login_at: new Date().toISOString() })
      .eq("code", row.code);
    return identityFrom(row);
  });

export const portalPayload = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => ({ code: clean(input?.code) }))
  .handler(async ({ data }): Promise<PortalPayload> => {
    if (data.code.length < 6) throw new Error("Invalid access code");
    const access = await accessByToken(data.code);
    const reports = toReports(access.reports);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: ws }, { data: wellness }] = await Promise.all([
      supabaseAdmin
        .from("workspace_data")
        .select("team,players,sessions,gps_history,test_records")
        .eq("user_id", access.coach_id)
        .maybeSingle(),
      reports.wellness
        ? supabaseAdmin
            .from("player_wellness")
            .select("entry_date,sleep_hours,sleep,fatigue,soreness,stress,mood,hydration,readiness,note")
            .eq("coach_id", access.coach_id)
            .eq("player_id", access.player_id)
            .order("entry_date", { ascending: false })
            .limit(400)
        : Promise.resolve({ data: [] as never[] }),
    ]);

    const rows = <T,>(value: unknown) => (Array.isArray(value) ? (value as T[]) : []);
    const mine = (r: JsonRow) => r["playerId"] === access.player_id;

    return {
      identity: await identityFrom(access),
      player: rows<JsonRow>(ws?.players).find((p) => p["id"] === access.player_id) ?? null,
      // Only ever this player's own rows leave the server.
      gps: reports.gps || reports.load ? rows<JsonRow>(ws?.gps_history).filter(mine) : [],
      sessions: rows<JsonRow>(ws?.sessions),
      tests: reports.tests ? rows<JsonRow>(ws?.test_records).filter(mine) : [],
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
  .inputValidator(
    (input: {
      code: string;
      entry: {
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
      };
    }) => {
      const scale = (v: unknown) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));
      const e = input?.entry;
      return {
        code: clean(input?.code),
        entry: {
          date: String(e?.date ?? "").slice(0, 10),
          sleepHours:
            e?.sleepHours === null || e?.sleepHours === undefined ? null : Math.min(16, Math.max(0, Number(e.sleepHours))),
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
    },
  )
  .handler(async ({ data }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.entry.date)) throw new Error("Invalid date");
    const access = await accessByToken(data.code);
    if (!toReports(access.reports).wellness) throw new Error("Wellness is not shared with you");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

/* ------------------------------------------------------------------ */
/* Coach side — create, update and revoke a player's login             */
/* ------------------------------------------------------------------ */

export const savePlayerAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      playerId: string;
      playerName: string;
      email?: string | null;
      password?: string | null;
      active?: boolean;
      reports?: Partial<PortalReports>;
    }) => ({
      playerId: String(input?.playerId ?? ""),
      playerName: String(input?.playerName ?? "").slice(0, 120),
      email: input?.email ? cleanEmail(input.email) : null,
      password: input?.password ? String(input.password) : null,
      active: input?.active !== false,
      reports: input?.reports ? toReports(input.reports) : null,
    }),
  )
  .handler(async ({ data, context }) => {
    if (!data.playerId) throw new Error("Missing player");
    if (data.password && data.password.length < 6) throw new Error("Password must be at least 6 characters");
    if (data.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error("Invalid email");

    const { data: existing } = await context.supabase
      .from("player_access")
      .select("id,code,reports")
      .eq("coach_id", context.userId)
      .eq("player_id", data.playerId)
      .maybeSingle();

    const patch: {
      coach_id: string;
      player_id: string;
      player_name: string;
      active: boolean;
      code: string;
      email?: string | null;
      reports?: Json;
      password_salt?: string;
      password_hash?: string;
    } = {
      coach_id: context.userId,
      player_id: data.playerId,
      player_name: data.playerName,
      active: data.active,
      code: existing?.code ?? randomHex(5).toUpperCase(),
    };
    if (data.email !== null) patch.email = data.email;
    if (data.reports) patch.reports = data.reports as unknown as Json;
    if (data.password) {
      const salt = randomHex(16);
      patch.password_salt = salt;
      patch.password_hash = await hashPassword(data.password, salt);
    }

    const query = existing
      ? context.supabase.from("player_access").update(patch).eq("id", existing.id)
      : context.supabase.from("player_access").insert(patch);
    const { error } = await query;
    if (error) throw new Error(error.message.includes("player_access_email_key") ? "That email is already used by another player" : "Could not save the player login");
    return { ok: true };
  });

export const revokePlayerAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { playerId: string; remove?: boolean }) => ({
    playerId: String(input?.playerId ?? ""),
    remove: Boolean(input?.remove),
  }))
  .handler(async ({ data, context }) => {
    const base = context.supabase.from("player_access");
    const { error } = data.remove
      ? await base.delete().eq("coach_id", context.userId).eq("player_id", data.playerId)
      : await base.update({ active: false }).eq("coach_id", context.userId).eq("player_id", data.playerId);
    if (error) throw new Error("Could not update the player login");
    return { ok: true };
  });
