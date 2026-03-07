-- Nouvelles limites : free 25 Mo, pro 2 Go, studio 10 Go

COMMENT ON COLUMN public.profiles.plan IS 'Plan abonnement : free (25 Mo), pro (2 Go), studio (10 Go).';

CREATE OR REPLACE FUNCTION public.get_storage_limit_for_plan(p_plan TEXT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'studio' THEN 10::BIGINT * 1024 * 1024 * 1024
    WHEN 'pro'   THEN 2::BIGINT * 1024 * 1024 * 1024
    ELSE 25::BIGINT * 1024 * 1024  -- 'free' = 25 Mo
  END;
$$;

-- Aligner les profils pro et studio sur les nouvelles limites
UPDATE public.profiles
SET storage_limit_bytes = public.get_storage_limit_for_plan(plan)
WHERE plan IN ('pro', 'studio');
