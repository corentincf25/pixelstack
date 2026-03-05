-- RPC : détail du stockage pour le graphiste (camemberts par type et par projet)
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
  per_project AS (
    SELECT
      dp.project_id,
      dp.project_title,
      COALESCE(ab.size, 0) AS assets_size,
      COALESCE(vb.size, 0) AS versions_size
    FROM designer_projects dp
    LEFT JOIN assets_by_project ab ON ab.project_id = dp.project_id
    LEFT JOIN versions_by_project vb ON vb.project_id = dp.project_id
  )
  SELECT jsonb_build_object(
    'used',
    (SELECT COALESCE(SUM(assets_size + versions_size), 0) FROM per_project),
    'limit',
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = auth.uid()),
      10 * 1024 * 1024 * 1024
    ),
    'assets_bytes',
    (SELECT COALESCE(SUM(assets_size), 0) FROM per_project),
    'versions_bytes',
    (SELECT COALESCE(SUM(versions_size), 0) FROM per_project),
    'projects',
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'project_id', project_id,
          'project_title', project_title,
          'assets_size', assets_size,
          'versions_size', versions_size
        )
        ORDER BY (assets_size + versions_size) DESC
      ) FROM per_project),
      '[]'::jsonb
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_designer_storage_breakdown() TO authenticated;
