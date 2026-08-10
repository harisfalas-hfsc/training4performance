import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
}

interface AuthValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  subscription: Subscription | null;
  hasAccess: boolean;
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

  const load = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setIsAdmin(false);
      setSubscription(null);
      return;
    }
    const [{ data: prof }, { data: roles }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,club_name").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase
        .from("subscriptions")
        .select("id,user_id,team_name,status,season_start,season_end,price_eur")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    setProfile((prof as Profile) ?? null);
    setIsAdmin(Boolean(roles?.some((r) => r.role === "admin")));
    setSubscription((sub as Subscription) ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void load(s?.user?.id);
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const value = useMemo<AuthValue>(() => {
    const active = subscription?.status === "active" || subscription?.status === "trial";
    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      subscription,
      hasAccess: Boolean(session) && (isAdmin || active),
      refresh: () => load(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [loading, session, profile, isAdmin, subscription, load]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
