CREATE TABLE public.generated_season_twists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 season_title text NOT NULL,
 name_key text NOT NULL UNIQUE,
 rules_key text NOT NULL UNIQUE,
 twist jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.generated_season_twists TO service_role;
ALTER TABLE public.generated_season_twists ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.generated_season_twists IS 'Server-only reservation ledger for generated season twists; no browser access or private player data.';