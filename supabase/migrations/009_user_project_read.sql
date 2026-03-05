-- Suivi "dernière lecture" par utilisateur et par projet (pour pastilles "nouveaux messages" / "nouvelles versions")
CREATE TABLE IF NOT EXISTS public.user_project_read (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  last_read_messages_at TIMESTAMPTZ,
  last_read_versions_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_read_project_id ON public.user_project_read(project_id);
ALTER TABLE public.user_project_read ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur ne voit et ne modifie que ses propres lignes
CREATE POLICY "Users manage own read state"
  ON public.user_project_read FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RPC : pour l'utilisateur connecté, retourne les projets avec titre et nombres de nouveaux messages / versions
-- Uniquement les interactions de l'AUTRE partie : messages reçus (sender_id != moi), versions déposées par le graphiste (donc comptées seulement pour le client)
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

GRANT EXECUTE ON FUNCTION public.get_project_unread_counts() TO authenticated;

-- Marquer les messages comme lus (met à jour uniquement last_read_messages_at)
CREATE OR REPLACE FUNCTION public.mark_project_messages_read(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_project_read (user_id, project_id, last_read_messages_at, updated_at)
  VALUES (auth.uid(), p_project_id, now(), now())
  ON CONFLICT (user_id, project_id)
  DO UPDATE SET last_read_messages_at = now(), updated_at = now();
END;
$$;

-- Marquer les versions comme vues (met à jour uniquement last_read_versions_at)
CREATE OR REPLACE FUNCTION public.mark_project_versions_read(p_project_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_project_read (user_id, project_id, last_read_versions_at, updated_at)
  VALUES (auth.uid(), p_project_id, now(), now())
  ON CONFLICT (user_id, project_id)
  DO UPDATE SET last_read_versions_at = now(), updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_project_messages_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_project_versions_read(UUID) TO authenticated;
