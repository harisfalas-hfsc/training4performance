ALTER TABLE public.workspace_data
  ADD COLUMN IF NOT EXISTS gps_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rpe_entries jsonb NOT NULL DEFAULT '[]'::jsonb;