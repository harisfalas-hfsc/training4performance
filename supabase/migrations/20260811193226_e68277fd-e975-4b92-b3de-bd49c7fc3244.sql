ALTER TABLE public.player_access
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS password_salt text,
  ADD COLUMN IF NOT EXISTS reports jsonb NOT NULL DEFAULT '{"wellness":true,"gps":true,"tests":true,"load":true,"metrics":["distance","hsr","sprint","accel","decel","load"]}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS player_access_email_key
  ON public.player_access (lower(email))
  WHERE email IS NOT NULL;