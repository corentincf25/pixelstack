-- Intervenants supplémentaires (relecteurs / YouTubers) : plusieurs personnes peuvent voir les miniatures et demander des modifs.
-- 1) Table des collaborateurs supplémentaires (rôle relecteur)
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON public.project_collaborators(user_id);

COMMENT ON TABLE public.project_collaborators IS 'Intervenants supplémentaires (relecteurs) : même accès que le client YouTuber (voir, commenter, demander des modifs).';

-- 2) Fonction : l'utilisateur connecté est-il membre du projet (client, graphiste ou relecteur) ?
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects pr
    WHERE pr.id = p_project_id
      AND (pr.client_id = auth.uid() OR pr.designer_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM public.project_collaborators c
    WHERE c.project_id = p_project_id AND c.user_id = auth.uid()
  );
$$;

-- 3) Rôle du user connecté dans le projet (pour l'UI)
CREATE OR REPLACE FUNCTION public.get_my_project_role(p_project_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT designer_id FROM public.projects WHERE id = p_project_id) = auth.uid() THEN 'designer'
    WHEN (SELECT client_id FROM public.projects WHERE id = p_project_id) = auth.uid() THEN 'client'
    WHEN EXISTS (SELECT 1 FROM public.project_collaborators c WHERE c.project_id = p_project_id AND c.user_id = auth.uid()) THEN 'reviewer'
    ELSE NULL
  END;
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_project_role(UUID) TO authenticated;

-- 4) Invitations : autoriser le rôle 'reviewer'
ALTER TABLE public.project_invites DROP CONSTRAINT IF EXISTS project_invites_role_check;
ALTER TABLE public.project_invites ADD CONSTRAINT project_invites_role_check CHECK (role IN ('client', 'designer', 'reviewer'));

-- 5) Accepter une invitation "reviewer" → ajout dans project_collaborators
CREATE OR REPLACE FUNCTION public.accept_project_invite(invite_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
  v_project_id UUID;
  v_role TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, project_id, role
  INTO v_invite_id, v_project_id, v_role
  FROM public.project_invites
  WHERE token = invite_token
    AND expires_at > now();

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF v_role = 'client' THEN
    UPDATE public.projects SET client_id = v_user_id WHERE id = v_project_id;
  ELSIF v_role = 'designer' THEN
    UPDATE public.projects SET designer_id = v_user_id WHERE id = v_project_id;
  ELSIF v_role = 'reviewer' THEN
    INSERT INTO public.project_collaborators (project_id, user_id)
    VALUES (v_project_id, v_user_id)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  ELSE
    RAISE EXCEPTION 'Invalid invite role';
  END IF;

  DELETE FROM public.project_invites WHERE id = v_invite_id;

  RETURN v_project_id;
END;
$$;

-- 6) RLS project_collaborators
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can read collaborators"
  ON public.project_collaborators FOR SELECT
  USING (public.is_project_member(project_id));

CREATE POLICY "Client or designer can add collaborators"
  ON public.project_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

CREATE POLICY "Client or designer can remove collaborators"
  ON public.project_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- 7) RLS projects : lecture si membre (client, designer ou relecteur)
DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (public.is_project_member(id));

-- 8) RLS briefs, assets, versions, messages : accès si membre
DROP POLICY IF EXISTS "Project members can manage briefs" ON public.briefs;
CREATE POLICY "Project members can manage briefs"
  ON public.briefs FOR ALL
  USING (public.is_project_member(briefs.project_id))
  WITH CHECK (public.is_project_member(briefs.project_id));

DROP POLICY IF EXISTS "Project members can read assets" ON public.assets;
DROP POLICY IF EXISTS "Project members can insert assets" ON public.assets;
CREATE POLICY "Project members can read assets"
  ON public.assets FOR SELECT
  USING (public.is_project_member(assets.project_id));
CREATE POLICY "Project members can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (public.is_project_member(assets.project_id));

DROP POLICY IF EXISTS "Project members can read versions" ON public.versions;
DROP POLICY IF EXISTS "Project members can insert versions" ON public.versions;
DROP POLICY IF EXISTS "Project members can update versions" ON public.versions;
CREATE POLICY "Project members can read versions"
  ON public.versions FOR SELECT
  USING (public.is_project_member(versions.project_id));
CREATE POLICY "Project members can insert versions"
  ON public.versions FOR INSERT
  WITH CHECK (public.is_project_member(versions.project_id));
CREATE POLICY "Project members can update versions"
  ON public.versions FOR UPDATE
  USING (public.is_project_member(versions.project_id));

DROP POLICY IF EXISTS "Project members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Project members can insert messages" ON public.messages;
CREATE POLICY "Project members can read messages"
  ON public.messages FOR SELECT
  USING (public.is_project_member(messages.project_id));
CREATE POLICY "Project members can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND public.is_project_member(messages.project_id)
  );

-- 9) project_invites : client ou designer peut gérer ; pour "reviewer" ils peuvent créer des invites
DROP POLICY IF EXISTS "Project creator can manage invites" ON public.project_invites;
CREATE POLICY "Project creator can manage invites"
  ON public.project_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_invites.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_invites.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- 10) Profils : lire les profils des membres du même projet (y compris relecteurs)
DROP POLICY IF EXISTS "Project members can read each other profiles" ON public.profiles;
CREATE POLICY "Project members can read each other profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE (p.client_id = auth.uid() OR p.designer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_collaborators c WHERE c.project_id = p.id AND c.user_id = auth.uid()))
        AND (p.client_id = profiles.id OR p.designer_id = profiles.id OR EXISTS (SELECT 1 FROM public.project_collaborators c2 WHERE c2.project_id = p.id AND c2.user_id = profiles.id))
    )
  );

-- 11) version_feedback et project_references : accès si membre (client, designer ou relecteur)
DROP POLICY IF EXISTS "Project members can manage version_feedback" ON public.version_feedback;
CREATE POLICY "Project members can manage version_feedback"
  ON public.version_feedback FOR ALL
  USING (
    public.is_project_member((
      SELECT v.project_id FROM public.versions v WHERE v.id = version_feedback.version_id
    ))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    public.is_project_member((SELECT v.project_id FROM public.versions v WHERE v.id = version_feedback.version_id))
  );

DROP POLICY IF EXISTS "Project members can manage project_references" ON public.project_references;
CREATE POLICY "Project members can manage project_references"
  ON public.project_references FOR ALL
  USING (public.is_project_member(project_references.project_id))
  WITH CHECK (public.is_project_member(project_references.project_id));

-- 12) get_project_unread_counts : inclure les projets où l'utilisateur est relecteur
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
       AND (p.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.project_collaborators c WHERE c.project_id = p.id AND c.user_id = auth.uid()))) AS new_versions_count,
    (SELECT COUNT(*) FROM public.version_feedback vf
     JOIN public.versions v ON v.id = vf.version_id
     WHERE v.project_id = p.id
       AND (r.last_read_feedback_at IS NULL OR vf.created_at > r.last_read_feedback_at)
       AND vf.user_id = p.client_id
       AND p.designer_id = auth.uid()) AS new_feedback_count
  FROM public.projects p
  LEFT JOIN public.user_project_read r ON r.project_id = p.id AND r.user_id = auth.uid()
  WHERE p.client_id = auth.uid() OR p.designer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.project_collaborators c WHERE c.project_id = p.id AND c.user_id = auth.uid());
$$;

GRANT EXECUTE ON FUNCTION public.get_project_unread_counts() TO authenticated;

-- 13) Storage assets : lecture/écriture si membre du projet (client, designer ou relecteur)
DROP POLICY IF EXISTS "Project members can read assets storage" ON storage.objects;
CREATE POLICY "Project members can read assets storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id::text = split_part(name, '/', 1)
        AND public.is_project_member(pr.id)
    )
  );

DROP POLICY IF EXISTS "Project members can upload assets storage" ON storage.objects;
CREATE POLICY "Project members can upload assets storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.projects pr
      WHERE pr.id::text = split_part(name, '/', 1)
        AND public.is_project_member(pr.id)
    )
  );
