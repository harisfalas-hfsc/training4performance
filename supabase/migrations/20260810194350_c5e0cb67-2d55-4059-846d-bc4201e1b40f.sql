CREATE OR REPLACE FUNCTION public.guard_subscription_self_service()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged boolean;
BEGIN
  is_privileged := auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin');
  IF is_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.complimentary := false;
    NEW.admin_note := NULL;
    RETURN NEW;
  END IF;

  NEW.status := OLD.status;
  NEW.complimentary := OLD.complimentary;
  NEW.season_start := OLD.season_start;
  NEW.season_end := OLD.season_end;
  NEW.price_eur := OLD.price_eur;
  NEW.admin_note := OLD.admin_note;
  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_guard_self_service ON public.subscriptions;
CREATE TRIGGER subscriptions_guard_self_service
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_self_service();

UPDATE public.subscriptions s
SET status = 'pending'
WHERE s.status IN ('active','trial')
  AND s.complimentary = false
  AND s.admin_note IS NULL
  AND lower(coalesce((SELECT p.email FROM public.profiles p WHERE p.id = s.user_id), '')) <> 'harisfalas@gmail.com';