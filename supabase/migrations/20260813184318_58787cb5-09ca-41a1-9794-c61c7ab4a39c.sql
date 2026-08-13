CREATE OR REPLACE FUNCTION public.has_active_workspace_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.user_id = _user_id
        AND s.status IN ('active', 'trial', 'past_due')
        AND s.season_end >= CURRENT_DATE
    )
$function$;