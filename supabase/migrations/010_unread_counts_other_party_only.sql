-- Pastilles : ne compter que les interactions de l'autre partie (pas les siennes)
-- Messages : uniquement ceux où sender_id != auth.uid()
-- Versions : uniquement pour le client (les versions sont déposées par le graphiste)
CREATE OR REPLACE FUNCTION public.get_project_unread_counts()
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  new_messages_count BIGINT,
  new_versions_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_id,
    p.title AS project_title,
    (SELECT COUNT(*) FROM public.messages m
     WHERE m.project_id = p.id
       AND (r.last_read_messages_at IS NULL OR m.created_at > r.last_read_messages_at)
       AND m.sender_id != auth.uid()) AS new_messages_count,
    (SELECT COUNT(*) FROM public.versions v
     WHERE v.project_id = p.id
       AND (r.last_read_versions_at IS NULL OR v.created_at > r.last_read_versions_at)
       AND p.client_id = auth.uid()) AS new_versions_count
  FROM public.projects p
  LEFT JOIN public.user_project_read r ON r.project_id = p.id AND r.user_id = auth.uid()
  WHERE p.client_id = auth.uid() OR p.designer_id = auth.uid();
$$;
