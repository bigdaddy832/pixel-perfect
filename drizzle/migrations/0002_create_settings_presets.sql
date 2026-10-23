CREATE TABLE public.settings_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  settings jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings_presets TO authenticated;
GRANT ALL ON public.settings_presets TO service_role;
ALTER TABLE public.settings_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own presets read" ON public.settings_presets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own presets insert" ON public.settings_presets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own presets update" ON public.settings_presets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own presets delete" ON public.settings_presets FOR DELETE TO authenticated USING (auth.uid() = user_id);