-- Monthly subscription support
ALTER TABLE public.subscriptions
  ALTER COLUMN price_eur SET DEFAULT 69.90,
  ALTER COLUMN season_start SET DEFAULT CURRENT_DATE,
  ALTER COLUMN season_end SET DEFAULT (CURRENT_DATE + INTERVAL '1 month')::date,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz;

CREATE OR REPLACE FUNCTION public.guard_subscription_self_service()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Customers may only toggle auto-renew on their own subscription.
  NEW.status := OLD.status;
  NEW.complimentary := OLD.complimentary;
  NEW.season_start := OLD.season_start;
  NEW.season_end := OLD.season_end;
  NEW.price_eur := OLD.price_eur;
  NEW.admin_note := OLD.admin_note;
  NEW.user_id := OLD.user_id;
  IF NEW.cancel_at_period_end IS DISTINCT FROM OLD.cancel_at_period_end THEN
    NEW.canceled_at := CASE WHEN NEW.cancel_at_period_end THEN now() ELSE NULL END;
  ELSE
    NEW.canceled_at := OLD.canceled_at;
  END IF;
  RETURN NEW;
END;
$function$;

-- Notifications shown in the account area
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);

-- Support tickets (communication centre)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_for_user boolean NOT NULL DEFAULT false,
  unread_for_admin boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_tickets_select ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY support_tickets_insert_own ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY support_tickets_update ON public.support_tickets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'user',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_messages_select ON public.support_messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );
CREATE POLICY support_messages_insert ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    )
  );
CREATE INDEX IF NOT EXISTS support_messages_ticket_idx ON public.support_messages (ticket_id, created_at);

CREATE OR REPLACE FUNCTION public.support_message_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_tickets
     SET last_message_at = now(),
         updated_at = now(),
         status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
         unread_for_admin = CASE WHEN NEW.sender_role = 'admin' THEN false ELSE true END,
         unread_for_user = CASE WHEN NEW.sender_role = 'admin' THEN true ELSE false END
   WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_messages_touch ON public.support_messages;
CREATE TRIGGER support_messages_touch AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.support_message_touch();

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_workspace_data_updated_at();