CREATE TABLE public.usage_snapshots (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name text,
  team_name text,
  players integer NOT NULL DEFAULT 0,
  sessions integer NOT NULL DEFAULT 0,
  gps_rows integer NOT NULL DEFAULT 0,
  tests integer NOT NULL DEFAULT 0,
  player_names text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_snapshots TO authenticated;
GRANT ALL ON public.usage_snapshots TO service_role;

ALTER TABLE public.usage_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_select_own ON public.usage_snapshots FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY usage_insert_own ON public.usage_snapshots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY usage_update_own ON public.usage_snapshots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS complimentary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_note text;