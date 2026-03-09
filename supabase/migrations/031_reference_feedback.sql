-- Table commentaires sur les références (Inspirations & Références), comme version_feedback pour les versions.
-- Permet à graphiste, client et invité de poster plusieurs commentaires par référence.

CREATE TABLE IF NOT EXISTS public.reference_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id UUID NOT NULL REFERENCES public.project_references(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_session_id UUID REFERENCES public.anonymous_sessions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.reference_feedback(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reference_feedback_user_or_anonymous_check
    CHECK (
      (user_id IS NOT NULL AND anonymous_session_id IS NULL)
      OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_reference_feedback_reference_id ON public.reference_feedback(reference_id);
CREATE INDEX IF NOT EXISTS idx_reference_feedback_parent_id ON public.reference_feedback(parent_id);
CREATE INDEX IF NOT EXISTS idx_reference_feedback_anonymous_session_id ON public.reference_feedback(anonymous_session_id);

ALTER TABLE public.reference_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can manage reference_feedback" ON public.reference_feedback;
CREATE POLICY "Project members can manage reference_feedback"
  ON public.reference_feedback FOR ALL
  USING (
    public.is_project_member((
      SELECT pr.project_id FROM public.project_references pr WHERE pr.id = reference_feedback.reference_id
    ))
  )
  WITH CHECK (
    public.is_project_member((
      SELECT pr.project_id FROM public.project_references pr WHERE pr.id = reference_feedback.reference_id
    ))
  );

-- Anon/authenticated peuvent insérer avec anonymous_session_id si la session appartient au projet (vérifié côté API).
COMMENT ON TABLE public.reference_feedback IS 'Commentaires et retours sur les références (inspirations), comme version_feedback pour les versions.';
