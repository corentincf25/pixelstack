-- Quand le projet n'a pas encore de designer (ex: créé par le YouTuber, designer pas encore joint),
-- autoriser les uploads au lieu de bloquer avec "Quota dépassé".
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

  -- Pas encore de designer sur le projet : autoriser l'upload (côté YouTuber par ex.)
  IF v_designer_id IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'used', 0, 'limit', 1073741824);
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

COMMENT ON FUNCTION public.check_project_storage_quota(UUID, BIGINT) IS 'Vérifie si l''upload est autorisé pour le projet (quota du designer). Si pas de designer sur le projet, autorise l''upload.';
