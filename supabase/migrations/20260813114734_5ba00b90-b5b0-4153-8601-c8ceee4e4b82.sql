CREATE TABLE public.library_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'STRENGTH',
  name text NOT NULL,
  description text,
  notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.library_blocks TO authenticated;
GRANT ALL ON public.library_blocks TO service_role;

ALTER TABLE public.library_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribers read published library blocks"
  ON public.library_blocks FOR SELECT TO authenticated
  USING (published AND public.has_active_workspace_access(auth.uid()));

CREATE POLICY "Admins read all library blocks"
  ON public.library_blocks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage library blocks"
  ON public.library_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER library_blocks_updated_at
  BEFORE UPDATE ON public.library_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_data_updated_at();

CREATE INDEX library_blocks_category_idx ON public.library_blocks (category, sort_order);