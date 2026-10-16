CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'username',''), NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1), 'Castaway'));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  winner text,
  cast_size int NOT NULL DEFAULT 0,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.seasons TO authenticated;
GRANT ALL ON public.seasons TO service_role;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own seasons read" ON public.seasons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own seasons insert" ON public.seasons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own seasons delete" ON public.seasons FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX seasons_user_idx ON public.seasons(user_id, created_at DESC);