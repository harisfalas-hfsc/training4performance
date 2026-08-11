CREATE TABLE public.player_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  player_name text NOT NULL,
  code text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, player_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_access TO authenticated;
GRANT ALL ON public.player_access TO service_role;
ALTER TABLE public.player_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_access_select_own" ON public.player_access FOR SELECT TO authenticated
  USING ((auth.uid() = coach_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "player_access_insert_own" ON public.player_access FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "player_access_update_own" ON public.player_access FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "player_access_delete_own" ON public.player_access FOR DELETE TO authenticated
  USING (auth.uid() = coach_id);

CREATE TABLE public.player_wellness (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  entry_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  sleep_hours numeric,
  sleep integer NOT NULL DEFAULT 3,
  fatigue integer NOT NULL DEFAULT 3,
  soreness integer NOT NULL DEFAULT 3,
  stress integer NOT NULL DEFAULT 3,
  mood integer NOT NULL DEFAULT 3,
  hydration integer NOT NULL DEFAULT 3,
  readiness integer NOT NULL DEFAULT 3,
  note text,
  source text NOT NULL DEFAULT 'player',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, player_id, entry_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_wellness TO authenticated;
GRANT ALL ON public.player_wellness TO service_role;
ALTER TABLE public.player_wellness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_wellness_select_own" ON public.player_wellness FOR SELECT TO authenticated
  USING ((auth.uid() = coach_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "player_wellness_insert_own" ON public.player_wellness FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "player_wellness_update_own" ON public.player_wellness FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "player_wellness_delete_own" ON public.player_wellness FOR DELETE TO authenticated
  USING (auth.uid() = coach_id);

CREATE TRIGGER player_access_updated_at BEFORE UPDATE ON public.player_access
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_data_updated_at();
CREATE TRIGGER player_wellness_updated_at BEFORE UPDATE ON public.player_wellness
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_data_updated_at();

ALTER TABLE public.workspace_data ADD COLUMN IF NOT EXISTS test_records jsonb NOT NULL DEFAULT '[]'::jsonb;