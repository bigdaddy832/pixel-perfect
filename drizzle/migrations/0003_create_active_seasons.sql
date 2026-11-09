CREATE TABLE public.active_seasons (
  user_id UUID PRIMARY KEY,
  data JSONB NOT NULL,
  saved_at BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_seasons TO authenticated;
GRANT ALL ON public.active_seasons TO service_role;
ALTER TABLE public.active_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own active season" ON public.active_seasons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own active season" ON public.active_seasons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own active season" ON public.active_seasons FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own active season" ON public.active_seasons FOR DELETE TO authenticated USING (auth.uid() = user_id);