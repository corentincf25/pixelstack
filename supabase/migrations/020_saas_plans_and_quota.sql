-- =============================================================================
-- Pixelstack SaaS : plans (free/pro/studio), quota par designer, vérification avant upload
-- =============================================================================

-- 1) Colonne plan sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'studio'));

COMMENT ON COLUMN public.profiles.plan IS 'Plan abonnement : free (1 Go), pro (10 Go), studio (50 Go).';

-- Pour le webhook Stripe : lier le client Stripe au profil (à remplir à la création du client Stripe côté app)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'ID client Stripe (cus_xxx). Renseigné à la création du client ou à la première souscription.';

-- Valeurs par défaut pour storage_limit_bytes selon le plan (utilisées par les RPC)
-- free = 1 GB, pro = 10 GB, studio = 50 GB
CREATE OR REPLACE FUNCTION public.get_storage_limit_for_plan(p_plan TEXT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'studio' THEN 50::BIGINT * 1024 * 1024 * 1024
    WHEN 'pro'   THEN 10::BIGINT * 1024 * 1024 * 1024
    ELSE 1::BIGINT * 1024 * 1024 * 1024  -- 'free' ou NULL
  END;
$$;

-- Mettre à jour les profils existants : plan = free, storage_limit_bytes = 1 Go si non renseigné
UPDATE public.profiles
SET plan = COALESCE(plan, 'free'),
    storage_limit_bytes = COALESCE(storage_limit_bytes, public.get_storage_limit_for_plan(COALESCE(plan, 'free')))
WHERE plan IS NULL OR storage_limit_bytes IS NULL;

-- 2) Trigger signup : à la création du profil, plan = free, storage_limit_bytes = 1 Go
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, plan, storage_limit_bytes)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL,
    'free',
    public.get_storage_limit_for_plan('free')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    plan = COALESCE(profiles.plan, 'free'),
    storage_limit_bytes = COALESCE(profiles.storage_limit_bytes, public.get_storage_limit_for_plan(COALESCE(profiles.plan, 'free')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) RPC get_designer_storage : inclure messages.image_size_bytes
CREATE OR REPLACE FUNCTION public.get_designer_storage()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'used',
    COALESCE((
      SELECT SUM(COALESCE(a.file_size, 0))
      FROM public.assets a
      JOIN public.projects p ON p.id = a.project_id
      WHERE p.designer_id = auth.uid()
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(v.file_size, 0))
      FROM public.versions v
      JOIN public.projects p ON p.id = v.project_id
      WHERE p.designer_id = auth.uid()
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(pr.file_size, 0))
      FROM public.project_references pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE p.designer_id = auth.uid()
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(m.image_size_bytes, 0))
      FROM public.messages m
      JOIN public.projects p ON p.id = m.project_id
      WHERE p.designer_id = auth.uid() AND m.image_size_bytes IS NOT NULL
    ), 0),
    'limit',
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = auth.uid()),
      public.get_storage_limit_for_plan('free')
    )
  );
$$;

-- 4) RPC get_designer_storage_breakdown : inclure messages (chat) dans le total et par projet
DROP FUNCTION IF EXISTS public.get_designer_storage_breakdown();
CREATE OR REPLACE FUNCTION public.get_designer_storage_breakdown()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH designer_projects AS (
    SELECT p.id AS project_id, p.title AS project_title
    FROM public.projects p
    WHERE p.designer_id = auth.uid()
  ),
  assets_by_project AS (
    SELECT a.project_id, COALESCE(SUM(a.file_size), 0)::BIGINT AS size
    FROM public.assets a
    JOIN designer_projects dp ON dp.project_id = a.project_id
    GROUP BY a.project_id
  ),
  versions_by_project AS (
    SELECT v.project_id, COALESCE(SUM(v.file_size), 0)::BIGINT AS size
    FROM public.versions v
    JOIN designer_projects dp ON dp.project_id = v.project_id
    GROUP BY v.project_id
  ),
  refs_by_project AS (
    SELECT pr.project_id, COALESCE(SUM(pr.file_size), 0)::BIGINT AS size
    FROM public.project_references pr
    JOIN designer_projects dp ON dp.project_id = pr.project_id
    WHERE pr.kind = 'image'
    GROUP BY pr.project_id
  ),
  chat_by_project AS (
    SELECT m.project_id, COALESCE(SUM(m.image_size_bytes), 0)::BIGINT AS size
    FROM public.messages m
    JOIN designer_projects dp ON dp.project_id = m.project_id
    WHERE m.image_size_bytes IS NOT NULL
    GROUP BY m.project_id
  ),
  per_project AS (
    SELECT
      dp.project_id,
      dp.project_title,
      COALESCE(ab.size, 0) AS assets_size,
      COALESCE(vb.size, 0) AS versions_size,
      COALESCE(rb.size, 0) AS refs_size,
      COALESCE(cb.size, 0) AS chat_size
    FROM designer_projects dp
    LEFT JOIN assets_by_project ab ON ab.project_id = dp.project_id
    LEFT JOIN versions_by_project vb ON vb.project_id = dp.project_id
    LEFT JOIN refs_by_project rb ON rb.project_id = dp.project_id
    LEFT JOIN chat_by_project cb ON cb.project_id = dp.project_id
  )
  SELECT jsonb_build_object(
    'used',
    (SELECT COALESCE(SUM(assets_size + versions_size + refs_size + chat_size), 0) FROM per_project),
    'limit',
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = auth.uid()),
      public.get_storage_limit_for_plan('free')
    ),
    'assets_bytes',
    (SELECT COALESCE(SUM(assets_size), 0) FROM per_project),
    'versions_bytes',
    (SELECT COALESCE(SUM(versions_size), 0) FROM per_project),
    'refs_bytes',
    (SELECT COALESCE(SUM(refs_size), 0) FROM per_project),
    'chat_bytes',
    (SELECT COALESCE(SUM(chat_size), 0) FROM per_project),
    'projects',
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'project_id', project_id,
          'project_title', project_title,
          'assets_size', assets_size,
          'versions_size', versions_size,
          'refs_size', refs_size,
          'chat_size', chat_size
        )
        ORDER BY (assets_size + versions_size + refs_size + chat_size) DESC
      ) FROM per_project),
      '[]'::jsonb
    )
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_designer_storage_breakdown() TO authenticated;

-- 5) RPC check_project_storage_quota : vérification côté serveur (appelée par l'API check-quota)
-- Appelable uniquement par un membre du projet (client, designer ou relecteur).
-- Retourne { allowed, used, limit } pour le designer du projet.
CREATE OR REPLACE FUNCTION public.check_project_storage_quota(p_project_id UUID, p_file_size BIGINT DEFAULT 0)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_designer_id UUID;
  v_used BIGINT;
  v_limit BIGINT;
  v_allowed BOOLEAN;
BEGIN
  IF NOT public.is_project_member(p_project_id) THEN
    RAISE EXCEPTION 'Access denied: not a project member';
  END IF;

  SELECT designer_id INTO v_designer_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_designer_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'used', 0, 'limit', 0);
  END IF;

  SELECT
    COALESCE((
      SELECT SUM(COALESCE(a.file_size, 0))
      FROM public.assets a
      JOIN public.projects p ON p.id = a.project_id
      WHERE p.designer_id = v_designer_id
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(v.file_size, 0))
      FROM public.versions v
      JOIN public.projects p ON p.id = v.project_id
      WHERE p.designer_id = v_designer_id
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(pr.file_size, 0))
      FROM public.project_references pr
      JOIN public.projects p ON p.id = pr.project_id
      WHERE p.designer_id = v_designer_id
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(m.image_size_bytes, 0))
      FROM public.messages m
      JOIN public.projects p ON p.id = m.project_id
      WHERE p.designer_id = v_designer_id AND m.image_size_bytes IS NOT NULL
    ), 0),
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = v_designer_id),
      public.get_storage_limit_for_plan((SELECT plan FROM public.profiles WHERE id = v_designer_id)),
      public.get_storage_limit_for_plan('free')
    )
  INTO v_used, v_limit;

  v_allowed := (v_used + COALESCE(p_file_size, 0)) <= v_limit;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'used', v_used,
    'limit', v_limit
  );
END;
$$;

COMMENT ON FUNCTION public.check_project_storage_quota(UUID, BIGINT) IS 'Vérifie si l''upload de p_file_size octets est autorisé pour le projet (quota du designer). Appelable uniquement par un membre du projet.';

GRANT EXECUTE ON FUNCTION public.check_project_storage_quota(UUID, BIGINT) TO authenticated;
