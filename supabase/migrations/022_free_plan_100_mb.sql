-- Plan gratuit : 1 Go → 100 Mo
-- Met à jour get_storage_limit_for_plan et les profils free existants.

COMMENT ON COLUMN public.profiles.plan IS 'Plan abonnement : free (100 Mo), pro (10 Go), studio (50 Go).';

CREATE OR REPLACE FUNCTION public.get_storage_limit_for_plan(p_plan TEXT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'studio' THEN 50::BIGINT * 1024 * 1024 * 1024
    WHEN 'pro'   THEN 10::BIGINT * 1024 * 1024 * 1024
    ELSE 100::BIGINT * 1024 * 1024  -- 'free' = 100 Mo
  END;
$$;

-- Aligner les profils free sur 100 Mo
UPDATE public.profiles
SET storage_limit_bytes = public.get_storage_limit_for_plan('free')
WHERE plan = 'free';
