-- 1) handle_new_user : utiliser le rôle passé en metadata à l'inscription (signup form)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := NEW.raw_user_meta_data->>'role';
  IF v_role IS NOT NULL AND v_role NOT IN ('designer', 'youtuber') THEN
    v_role := NULL;
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Table commentaires sur les assets (comme version_feedback pour les versions)
CREATE TABLE IF NOT EXISTS public.asset_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.asset_feedback(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_feedback_asset_id ON public.asset_feedback(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_feedback_parent_id ON public.asset_feedback(parent_id);

ALTER TABLE public.asset_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can manage asset_feedback"
  ON public.asset_feedback FOR ALL
  USING (
    public.is_project_member((
      SELECT a.project_id FROM public.assets a WHERE a.id = asset_feedback.asset_id
    ))
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_project_member((
      SELECT a.project_id FROM public.assets a WHERE a.id = asset_feedback.asset_id
    ))
  );

COMMENT ON TABLE public.asset_feedback IS 'Commentaires et réponses sur les assets d''un projet.';
