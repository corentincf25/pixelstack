-- Commentaires du client sous chaque version
CREATE TABLE IF NOT EXISTS public.version_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_version_feedback_version_id ON public.version_feedback(version_id);
ALTER TABLE public.version_feedback ENABLE ROW LEVEL SECURITY;

-- Lire/écrire si membre du projet (via version -> project)
CREATE POLICY "Project members can manage version_feedback"
  ON public.version_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.versions v
      JOIN public.projects p ON p.id = v.project_id
      WHERE v.id = version_feedback.version_id
      AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.versions v
      JOIN public.projects p ON p.id = v.project_id
      WHERE v.id = version_feedback.version_id
      AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- Références (images + liens YouTube) par projet (inspirations)
CREATE TABLE IF NOT EXISTS public.project_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'youtube')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_references_project_id ON public.project_references(project_id);
ALTER TABLE public.project_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can manage project_references"
  ON public.project_references FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_references.project_id
      AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_references.project_id
      AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );
