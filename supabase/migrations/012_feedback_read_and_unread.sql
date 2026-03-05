-- Retours demandés par le YouTuber (feedback sur versions) : suivi "lu" pour les notifs graphiste
ALTER TABLE public.user_project_read
ADD COLUMN IF NOT EXISTS last_read_feedback_at TIMESTAMPTZ;

-- Recréer la fonction (le type de retour change : ajout de new_feedback_count)
DROP FUNCTION IF EXISTS public.get_project_unread_counts();

CREATE OR REPLACE FUNCTION public.get_project_unread_counts()
RETURNS TABLE (
  project_id UUID,
  project_title TEXT,
  new_messages_count BIGINT,
  new_versions_count BIGINT,
  new_feedback_count BIGINT
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
       AND p.client_id = auth.uid()) AS new_versions_count,
    (SELECT COUNT(*) FROM public.version_feedback vf
     JOIN public.versions v ON v.id = vf.version_id
     WHERE v.project_id = p.id
       AND (r.last_read_feedback_at IS NULL OR vf.created_at > r.last_read_feedback_at)
       AND vf.user_id = p.client_id
       AND p.designer_id = auth.uid()) AS new_feedback_count
  FROM public.projects p
  LEFT JOIN public.user_project_read r ON r.project_id = p.id AND r.user_id = auth.uid()
  WHERE p.client_id = auth.uid() OR p.designer_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_project_unread_counts() TO authenticated;

-- Marquer les retours (feedback) comme lus pour l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.mark_project_feedback_read(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_project_read (user_id, project_id, last_read_feedback_at, updated_at)
  VALUES (auth.uid(), p_project_id, now(), now())
  ON CONFLICT (user_id, project_id)
  DO UPDATE SET last_read_feedback_at = now(), updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_project_feedback_read(UUID) TO authenticated;
