CREATE TABLE public.support_learned (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  uses integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.support_learned TO authenticated;
GRANT ALL ON public.support_learned TO service_role;
ALTER TABLE public.support_learned ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read learned answers" ON public.support_learned FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage learned answers" ON public.support_learned FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER support_learned_updated_at BEFORE UPDATE ON public.support_learned FOR EACH ROW EXECUTE FUNCTION public.set_workspace_data_updated_at();