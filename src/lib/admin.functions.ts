import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isAdminEmail } from "@/lib/admin";

async function assertAdmin(ctx: { supabase: unknown; userId: string; claims: Record<string, unknown> }) {
  const email = ctx.claims?.["email"] as string | undefined;
  if (isAdminEmail(email)) return;
  throw new Error("Forbidden: owner access required");
}

export type AdminCustomer = {
  id: string;
  email: string;
  full_name: string;
  club_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  active: boolean;
  status: string | null;
  complimentary: boolean;
  season_start: string | null;
  season_end: string | null;
  price_eur: number;
  admin_note: string | null;
  team_name: string | null;
  players: number;
  sessions: number;
  gps_rows: number;
  tests: number;
  player_names: string[];
  usage_updated_at: string | null;
};

export type AdminStats = {
  customers: number;
  newCustomers30d: number;
  activeSubscriptions: number;
  complimentary: number;
  paying: number;
  revenueEur: number;
  teams: number;
  players: number;
  sessions: number;
  gpsRows: number;
};

const isActive = (sub: { status?: string | null; season_end?: string | null } | undefined) =>
  Boolean(
    sub &&
      sub.status === "active" &&
      (!sub.season_end || new Date(`${sub.season_end}T23:59:59Z`).getTime() > Date.now()),
  );

export const adminListCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string }) => data)
  .handler(async ({ context, data }): Promise<{ customers: AdminCustomer[] } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const authMap = new Map<string, { email: string | null; created_at: string; last_sign_in_at: string | null }>();
      for (let page = 1; page <= 10; page++) {
        const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) return { error: error.message };
        for (const u of list.users) {
          authMap.set(u.id, {
            email: u.email ?? null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at ?? null,
          });
        }
        if (list.users.length < 200) break;
      }

      const [{ data: profiles }, { data: subs }, { data: usage }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, email, full_name, club_name, created_at").limit(1000),
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, season_start, season_end, price_eur, team_name, complimentary, admin_note")
          .limit(2000),
        supabaseAdmin.from("usage_snapshots").select("*").limit(2000),
      ]);

      type SubRow = NonNullable<typeof subs>[number];
      const subBy = new Map<string, SubRow>();
      for (const s of subs ?? []) if (!subBy.has(s.user_id)) subBy.set(s.user_id, s);
      const usageBy = new Map((usage ?? []).map((u) => [u.user_id, u]));

      const ids = new Set<string>([...authMap.keys(), ...(profiles ?? []).map((p) => p.id)]);
      const rows: AdminCustomer[] = [...ids].map((id) => {
        const auth = authMap.get(id);
        const p = (profiles ?? []).find((x) => x.id === id);
        const sub = subBy.get(id);
        const u = usageBy.get(id);
        const email = auth?.email ?? p?.email ?? "";
        return {
          id,
          email,
          full_name: p?.full_name ?? "",
          club_name: p?.club_name ?? "",
          created_at: auth?.created_at ?? p?.created_at ?? new Date().toISOString(),
          last_sign_in_at: auth?.last_sign_in_at ?? null,
          is_admin: isAdminEmail(email),
          active: isActive(sub),
          status: sub?.status ?? null,
          complimentary: Boolean(sub?.complimentary),
          season_start: sub?.season_start ?? null,
          season_end: sub?.season_end ?? null,
          price_eur: Number(sub?.price_eur ?? 0),
          admin_note: sub?.admin_note ?? null,
          team_name: sub?.team_name ?? u?.team_name ?? null,
          players: u?.players ?? 0,
          sessions: u?.sessions ?? 0,
          gps_rows: u?.gps_rows ?? 0,
          tests: u?.tests ?? 0,
          player_names: u?.player_names ?? [],
          usage_updated_at: u?.updated_at ?? null,
        };
      });

      rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      const q = data.search?.trim().toLowerCase();
      const filtered = q
        ? rows.filter((r) =>
            [r.email, r.full_name, r.club_name, r.team_name ?? ""].some((v) => v.toLowerCase().includes(q)),
          )
        : rows;
      return { customers: filtered };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load customers" };
    }
  });

export const adminGetStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ stats: AdminStats } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: profiles }, { data: subs }, { data: usage }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, created_at").limit(5000),
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, season_end, price_eur, complimentary")
          .limit(5000),
        supabaseAdmin.from("usage_snapshots").select("players, sessions, gps_rows, team_name").limit(5000),
      ]);

      const since = Date.now() - 30 * 86_400_000;
      const active = (subs ?? []).filter((s) => isActive(s));
      const comp = active.filter((s) => s.complimentary);
      const paying = active.filter((s) => !s.complimentary);

      return {
        stats: {
          customers: (profiles ?? []).length,
          newCustomers30d: (profiles ?? []).filter((p) => new Date(p.created_at).getTime() >= since).length,
          activeSubscriptions: active.length,
          complimentary: comp.length,
          paying: paying.length,
          revenueEur: Number(paying.reduce((t, s) => t + Number(s.price_eur ?? 0), 0).toFixed(2)),
          teams: (usage ?? []).filter((u) => u.team_name).length,
          players: (usage ?? []).reduce((t, u) => t + (u.players ?? 0), 0),
          sessions: (usage ?? []).reduce((t, u) => t + (u.sessions ?? 0), 0),
          gpsRows: (usage ?? []).reduce((t, u) => t + (u.gps_rows ?? 0), 0),
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load stats" };
    }
  });

export type AdminTeam = {
  key: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  club: string;
  team: string;
  active: boolean;
  complimentary: boolean;
  season_end: string | null;
  players: number;
  sessions: number;
  gps_rows: number;
  tests: number;
  player_names: string[];
  updated_at: string | null;
};

/** Every team and squad created by every customer. */
export const adminListTeams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string }) => data)
  .handler(async ({ context, data }): Promise<{ teams: AdminTeam[] } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [{ data: profiles }, { data: subs }, { data: usage }, { data: subTeams }] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, email, full_name, club_name").limit(5000),
        supabaseAdmin
          .from("subscriptions")
          .select("user_id, team_name, status, season_end, complimentary")
          .limit(5000),
        supabaseAdmin.from("usage_snapshots").select("*").limit(5000),
        supabaseAdmin.from("sub_teams").select("id, user_id, name").limit(5000),
      ]);

      const profBy = new Map((profiles ?? []).map((p) => [p.id, p]));
      const usageBy = new Map((usage ?? []).map((u) => [u.user_id, u]));

      const rows: AdminTeam[] = [];
      const push = (userId: string, teamName: string, key: string, withUsage: boolean) => {
        const p = profBy.get(userId);
        const u = usageBy.get(userId);
        const sub = (subs ?? []).find((s) => s.user_id === userId);
        rows.push({
          key,
          ownerId: userId,
          ownerEmail: p?.email ?? "",
          ownerName: p?.full_name ?? "",
          club: p?.club_name ?? u?.club_name ?? "",
          team: teamName,
          active: isActive(sub),
          complimentary: Boolean(sub?.complimentary),
          season_end: sub?.season_end ?? null,
          players: withUsage ? (u?.players ?? 0) : 0,
          sessions: withUsage ? (u?.sessions ?? 0) : 0,
          gps_rows: withUsage ? (u?.gps_rows ?? 0) : 0,
          tests: withUsage ? (u?.tests ?? 0) : 0,
          player_names: withUsage ? (u?.player_names ?? []) : [],
          updated_at: withUsage ? (u?.updated_at ?? null) : null,
        });
      };

      const seenOwners = new Set<string>();
      for (const s of subs ?? []) {
        seenOwners.add(s.user_id);
        push(s.user_id, s.team_name || "Unnamed team", `sub:${s.user_id}`, true);
      }
      for (const u of usage ?? []) {
        if (seenOwners.has(u.user_id)) continue;
        seenOwners.add(u.user_id);
        push(u.user_id, u.team_name || "Unnamed team", `usage:${u.user_id}`, true);
      }
      for (const t of subTeams ?? []) {
        push(t.user_id, t.name, `team:${t.id}`, false);
      }

      rows.sort((a, b) => (a.club + a.team).localeCompare(b.club + b.team));
      const q = data.search?.trim().toLowerCase();
      const filtered = q
        ? rows.filter((r) =>
            [r.club, r.team, r.ownerEmail, r.ownerName, ...r.player_names].some((v) =>
              v.toLowerCase().includes(q),
            ),
          )
        : rows;
      return { teams: filtered };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to load teams" };
    }
  });


/** Grants (or extends) platform access for N months. */
export const adminGrantAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; months: number; complimentary?: boolean; note?: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true; until: string } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      if (!data.userId) return { error: "Missing user" };
      const months = Math.max(1, Math.min(36, Math.round(Number(data.months) || 1)));
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id, season_end, price_eur")
        .eq("user_id", data.userId)
        .maybeSingle();

      const now = new Date();
      const base =
        existing?.season_end && new Date(existing.season_end).getTime() > now.getTime()
          ? new Date(existing.season_end)
          : now;
      const until = new Date(base);
      until.setMonth(until.getMonth() + months);
      const untilDate = until.toISOString().slice(0, 10);

      const patch = {
        status: "active",
        season_end: untilDate,
        complimentary: Boolean(data.complimentary),
        admin_note: data.note ?? null,
        price_eur: data.complimentary ? 0 : (existing?.price_eur ?? 999),
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabaseAdmin.from("subscriptions").update(patch).eq("id", existing.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabaseAdmin.from("subscriptions").insert({
          user_id: data.userId,
          team_name: "First team",
          season_start: now.toISOString().slice(0, 10),
          ...patch,
        });
        if (error) return { error: error.message };
      }
      return { ok: true, until: untilDate };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to grant access" };
    }
  });

export const adminRevokeAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "revoked",
          season_end: new Date().toISOString().slice(0, 10),
          complimentary: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", data.userId);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to revoke access" };
    }
  });

export const adminUpdateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; full_name?: string; club_name?: string; team_name?: string; note?: string }) => data,
  )
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const profilePatch: { full_name?: string; club_name?: string } = {};
      if (data.full_name !== undefined) profilePatch.full_name = data.full_name;
      if (data.club_name !== undefined) profilePatch.club_name = data.club_name;
      if (Object.keys(profilePatch).length) {
        const { error } = await supabaseAdmin.from("profiles").update(profilePatch).eq("id", data.userId);
        if (error) return { error: error.message };
      }
      const subPatch: { team_name?: string; admin_note?: string } = {};
      if (data.team_name !== undefined) subPatch.team_name = data.team_name;
      if (data.note !== undefined) subPatch.admin_note = data.note;
      if (Object.keys(subPatch).length) {
        const { error } = await supabaseAdmin.from("subscriptions").update(subPatch).eq("user_id", data.userId);
        if (error) return { error: error.message };
      }
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to update customer" };
    }
  });

export const adminDeleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      if (data.userId === (context as { userId: string }).userId) return { error: "You cannot delete your own account" };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to delete customer" };
    }
  });

/** Returns a one-time token so the admin can sign in as the customer for support. */
export const adminImpersonate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true; tokenHash: string; email: string } | { error: string }> => {
    try {
      await assertAdmin(context as never);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: user, error: uErr } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (uErr || !user?.user?.email) return { error: uErr?.message ?? "User has no email" };
      const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.user.email,
      });
      if (error || !link?.properties?.hashed_token) return { error: error?.message ?? "Could not create session" };
      return { ok: true, tokenHash: link.properties.hashed_token, email: user.user.email };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to impersonate" };
    }
  });
