-- Réponses aux commentaires (thread)
ALTER TABLE public.version_feedback
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.version_feedback(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_version_feedback_parent_id ON public.version_feedback(parent_id);
