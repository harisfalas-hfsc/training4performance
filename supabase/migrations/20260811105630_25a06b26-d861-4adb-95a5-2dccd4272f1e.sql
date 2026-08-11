-- Seed Smarty Assistant credits and allow coaches to spend their own balance.

-- Coaches must be able to read/update/insert their own credit row.
GRANT SELECT, INSERT, UPDATE ON public.assistant_credits TO authenticated;

-- Coaches can update/insert only their own row. Service role already has full access.
CREATE POLICY "Coaches manage their own assistant credits"
ON public.assistant_credits
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Seed 100 starter credits for every existing user that does not yet have a row.
INSERT INTO public.assistant_credits (user_id, balance)
SELECT id, 100
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- New sign-ups receive 100 starter credits automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, club_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'club_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.assistant_credits (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  IF lower(coalesce(NEW.email,'')) = 'harisfalas@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;