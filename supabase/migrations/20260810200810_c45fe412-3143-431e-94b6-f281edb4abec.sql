CREATE OR REPLACE FUNCTION public.has_active_workspace_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND s.status IN ('active', 'trial')
        AND s.season_end >= CURRENT_DATE
    )
$$;

REVOKE ALL ON FUNCTION public.has_active_workspace_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_workspace_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_workspace_access(uuid) TO service_role;

DROP POLICY IF EXISTS workspace_data_insert_own ON public.workspace_data;
DROP POLICY IF EXISTS workspace_data_update_own ON public.workspace_data;
DROP POLICY IF EXISTS workspace_data_delete_own ON public.workspace_data;

CREATE POLICY workspace_data_insert_paid_own
ON public.workspace_data
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

CREATE POLICY workspace_data_update_paid_own
ON public.workspace_data
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

CREATE POLICY workspace_data_delete_paid_own
ON public.workspace_data
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

DROP POLICY IF EXISTS usage_insert_own ON public.usage_snapshots;
DROP POLICY IF EXISTS usage_update_own ON public.usage_snapshots;

CREATE POLICY usage_insert_paid_own
ON public.usage_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

CREATE POLICY usage_update_paid_own
ON public.usage_snapshots
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

DROP POLICY IF EXISTS sub_teams_insert_own ON public.sub_teams;
DROP POLICY IF EXISTS sub_teams_update_own ON public.sub_teams;
DROP POLICY IF EXISTS sub_teams_delete_own ON public.sub_teams;

CREATE POLICY sub_teams_insert_paid_own
ON public.sub_teams
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

CREATE POLICY sub_teams_update_paid_own
ON public.sub_teams
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);

CREATE POLICY sub_teams_delete_paid_own
ON public.sub_teams
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND public.has_active_workspace_access(auth.uid())
);