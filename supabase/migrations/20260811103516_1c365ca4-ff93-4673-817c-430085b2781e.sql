CREATE TABLE public.assistant_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_threads TO authenticated;
GRANT ALL ON public.assistant_threads TO service_role;

ALTER TABLE public.assistant_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their own assistant threads"
ON public.assistant_threads
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assistant threads"
ON public.assistant_threads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assistant_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.assistant_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool')),
  content TEXT,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;

ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their own assistant messages"
ON public.assistant_messages
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assistant messages"
ON public.assistant_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assistant_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_memory TO authenticated;
GRANT ALL ON public.assistant_memory TO service_role;

ALTER TABLE public.assistant_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage their own assistant memory"
ON public.assistant_memory
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assistant memory"
ON public.assistant_memory
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assistant_credits (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.assistant_credits TO authenticated;
GRANT ALL ON public.assistant_credits TO service_role;

ALTER TABLE public.assistant_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view their own credit balance"
ON public.assistant_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages assistant credits"
ON public.assistant_credits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE TABLE public.assistant_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.assistant_threads(id) ON DELETE SET NULL,
  request_tokens INTEGER,
  response_tokens INTEGER,
  cost_eur NUMERIC(12,6),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.assistant_usage TO authenticated;
GRANT ALL ON public.assistant_usage TO service_role;

ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view their own assistant usage"
ON public.assistant_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role logs assistant usage"
ON public.assistant_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_assistant_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_assistant_threads_updated_at
BEFORE UPDATE ON public.assistant_threads
FOR EACH ROW EXECUTE FUNCTION public.update_assistant_updated_at_column();

CREATE TRIGGER update_assistant_memory_updated_at
BEFORE UPDATE ON public.assistant_memory
FOR EACH ROW EXECUTE FUNCTION public.update_assistant_updated_at_column();

CREATE TRIGGER update_assistant_credits_updated_at
BEFORE UPDATE ON public.assistant_credits
FOR EACH ROW EXECUTE FUNCTION public.update_assistant_updated_at_column();