CREATE TABLE public.workspace_data (
  user_id uuid PRIMARY KEY,
  team jsonb NOT NULL DEFAULT '{}'::jsonb,
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  sessions jsonb NOT NULL DEFAULT '[]'::jsonb,
  gps_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  manual_tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  medical_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_data TO authenticated;
GRANT ALL ON public.workspace_data TO service_role;

ALTER TABLE public.workspace_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_data_select_own"
ON public.workspace_data FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "workspace_data_insert_own"
ON public.workspace_data FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workspace_data_update_own"
ON public.workspace_data FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workspace_data_delete_own"
ON public.workspace_data FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_workspace_data_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER workspace_data_set_updated_at
BEFORE UPDATE ON public.workspace_data
FOR EACH ROW EXECUTE FUNCTION public.set_workspace_data_updated_at();