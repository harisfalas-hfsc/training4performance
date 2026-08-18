import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "@/lib/admin";
import { setWriteAccess } from "@/lib/access";
import { setWorkspaceScope } from "@/lib/workspace-scope";
import { resetWorkspaceHydration } from "@/lib/usage";
import { isDemoActive } from "@/lib/demo";
import { activeScopeFor } from "@/lib/teams";
import { browserOnline, offlineFirst } from "@/lib/offline-db";
import { cachedSession, clearOfflineSignIn, offlineSignInUser, rememberSession } from "@/lib/offline-auth";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  club_name: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  team_name: string;
  status: string;
  season_start: string;
  season_end: string;
  price_eur: number;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
}

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  subscription: Subscription | null;
  hasAccess: boolean;
  /** True when the app is running on a session restored from this device. */
  offlineSession: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Season runs 1 June -> 31 May. */
export function currentSeason(now = new Date()) {
  const y = now.getUTCFullYear();
  const startYear = now.getUTCMonth() >= 5 ? y : y - 1;
  return {
    start: `${startYear}-06-01`,
    end: `${startYear + 1}-05-31`,
    label: `${startYear}/${String(startYear + 1).slice(2)}`,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [offlineSession, setOfflineSession] = useState(false);

  const load = useCallback(async (uid: string | undefined, email?: string | null) => {
    // The public demo owns the workspace scope while it is running.
    let demo = isDemoActive();
    // The explicitly activated shared demo remains isolated even when the
    // visitor already has an authenticated account session.
    if (!uid) {
      if (!demo) setWorkspaceScope(null);
      setProfile(null);
      setIsAdmin(false);
      setSubscription(null);
      return;
    }
    if (!demo) setWorkspaceScope(activeScopeFor(uid), isAdminEmail(email));
    // Both reads go through the offline store: online they refresh the saved
    // copy, offline they return the copy already on this device.
    const [prof, sub] = await Promise.all([
      offlineFirst<Profile | null>(
        "profile",
        async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("id,email,full_name,club_name")
            .eq("id", uid)
            .maybeSingle();
          if (error) throw new Error(error.message);
          return (data as Profile) ?? null;
        },
        uid,
      ).catch(() => null),
      offlineFirst<Subscription | null>(
        "subscription",
        async () => {
          const { data, error } = await supabase
            .from("subscriptions")
            .select("id,user_id,team_name,status,season_start,season_end,price_eur,cancel_at_period_end,canceled_at")
            .eq("user_id", uid)
            .maybeSingle();
          if (error) throw new Error(error.message);
          return (data as Subscription) ?? null;
        },
        uid,
      ).catch(() => null),
    ]);
    setProfile(prof ?? null);
    setIsAdmin(isAdminEmail(email));
    setSubscription(sub ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) {
        setOfflineSession(false);
        clearOfflineSignIn();
        rememberSession(s);
      }
      setSession(s);
      void load(s?.user?.id, s?.user?.email);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      let active = data.session;
      if (active) {
        rememberSession(active);
      } else if (!browserOnline()) {
        // No connection: accept the copy of the last session kept on this
        // device, either because the tab was reopened or because the coach
        // signed in offline with their stored verifier.
        const cached = cachedSession();
        const approved = offlineSignInUser();
        if (cached && (approved === cached.user.id || approved === null)) {
          active = { user: cached.user, access_token: cached.access_token ?? "" } as unknown as Session;
          setOfflineSession(true);
        }
      }
      setSession(active);
      await load(active?.user?.id, active?.user?.email);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);


  const value = useMemo<AuthValue>(() => {
    const notExpired =
      !subscription?.season_end || new Date(`${subscription.season_end}T23:59:59Z`).getTime() > Date.now();
    // `past_due` is a failed renewal that the card issuer may still retry —
    // keep full access during the paid season instead of locking instantly.
    const active =
      (subscription?.status === "active" ||
        subscription?.status === "trial" ||
        subscription?.status === "past_due") &&
      notExpired;
    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      subscription,
      hasAccess: Boolean(session) && (isAdmin || active),
      offlineSession,
      refresh: () => load(session?.user?.id, session?.user?.email),
      signOut: async () => {
        resetWorkspaceHydration();
        setWorkspaceScope(null);
        // The saved copy of this account's data stays on the device so the
        // coach can sign in again offline; only the live session is dropped.
        clearOfflineSignIn();
        setOfflineSession(false);
        setSession(null);
        if (typeof window !== "undefined") window.sessionStorage.removeItem("t4p.adminSession");
        await supabase.auth.signOut();
      },
    };
  }, [loading, session, profile, isAdmin, subscription, offlineSession, load]);

  useEffect(() => {
    // Browsing is always allowed; writing needs an active subscription.
    if (isDemoActive()) return;
    setWriteAccess(value.hasAccess);
  }, [value.hasAccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
