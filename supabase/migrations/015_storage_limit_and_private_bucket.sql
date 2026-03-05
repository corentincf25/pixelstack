-- Limite par défaut réaliste (1 Go, typique du free tier Supabase)
-- Tu peux modifier storage_limit_bytes par profil ou via une table d'offres plus tard.
COMMENT ON COLUMN public.profiles.storage_limit_bytes IS 'Quota stockage en octets. NULL = 1 Go par défaut (aligné free tier Supabase).';

-- RPC get_designer_storage : défaut 1 Go au lieu de 10 Go
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
    ), 0),
    'limit',
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = auth.uid()),
      1 * 1024 * 1024 * 1024
    )
  );
$$;

-- RPC get_designer_storage_breakdown : défaut 1 Go
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
  per_project AS (
    SELECT
      dp.project_id,
      dp.project_title,
      COALESCE(ab.size, 0) AS assets_size,
      COALESCE(vb.size, 0) AS versions_size,
      COALESCE(rb.size, 0) AS refs_size
    FROM designer_projects dp
    LEFT JOIN assets_by_project ab ON ab.project_id = dp.project_id
    LEFT JOIN versions_by_project vb ON vb.project_id = dp.project_id
    LEFT JOIN refs_by_project rb ON rb.project_id = dp.project_id
  )
  SELECT jsonb_build_object(
    'used',
    (SELECT COALESCE(SUM(assets_size + versions_size + refs_size), 0) FROM per_project),
    'limit',
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = auth.uid()),
      1 * 1024 * 1024 * 1024
    ),
    'assets_bytes',
    (SELECT COALESCE(SUM(assets_size), 0) FROM per_project),
    'versions_bytes',
    (SELECT COALESCE(SUM(versions_size), 0) FROM per_project),
    'refs_bytes',
    (SELECT COALESCE(SUM(refs_size), 0) FROM per_project),
    'projects',
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'project_id', project_id,
          'project_title', project_title,
          'assets_size', assets_size,
          'versions_size', versions_size,
          'refs_size', refs_size
        )
        ORDER BY (assets_size + versions_size + refs_size) DESC
      ) FROM per_project),
      '[]'::jsonb
    )
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_designer_storage_breakdown() TO authenticated;

-- Bucket "assets" en PRIVÉ : les fichiers ne sont plus accessibles via l’URL publique.
-- L’app doit utiliser des URLs signées (API) pour afficher/télécharger les fichiers.
UPDATE storage.buckets
SET public = false
WHERE id = 'assets';

-- Les policies existantes (SELECT/INSERT pour membres du projet) restent valides
-- pour l’API Storage (upload, list, createSignedUrl côté serveur).
