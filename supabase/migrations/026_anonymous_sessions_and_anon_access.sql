-- Accès anonyme au projet : sessions anonymes + messages/assets/feedback sans compte
-- Ne modifie pas le comportement des utilisateurs connectés.

-- 1) Table anonymous_sessions : une session par visiteur anonyme par projet
CREATE TABLE IF NOT EXISTS public.anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invite_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_project_id ON public.anonymous_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_invite_token ON public.anonymous_sessions(invite_token);

ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accès uniquement via service role (API backend)

COMMENT ON TABLE public.anonymous_sessions IS 'Sessions des visiteurs anonymes (lien invite) pour un projet. Liée aux messages/assets/feedback anonymes.';

-- 2) Messages : autoriser sender_id NULL si anonymous_session_id renseigné
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID REFERENCES public.anonymous_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.messages
  ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_or_anonymous_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_or_anonymous_check
  CHECK (
    (sender_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (sender_id IS NULL AND anonymous_session_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_messages_anonymous_session_id ON public.messages(anonymous_session_id);

-- 3) Assets : lier un upload anonyme à une session (pour conversion)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID REFERENCES public.anonymous_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_anonymous_session_id ON public.assets(anonymous_session_id);

-- 4) version_feedback : autoriser commentaires anonymes
ALTER TABLE public.version_feedback
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID REFERENCES public.anonymous_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.version_feedback
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.version_feedback
  DROP CONSTRAINT IF EXISTS version_feedback_user_or_anonymous_check;

ALTER TABLE public.version_feedback
  ADD CONSTRAINT version_feedback_user_or_anonymous_check
  CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_version_feedback_anonymous_session_id ON public.version_feedback(anonymous_session_id);

-- 5) asset_feedback : autoriser commentaires anonymes
ALTER TABLE public.asset_feedback
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID REFERENCES public.anonymous_sessions(id) ON DELETE SET NULL;

ALTER TABLE public.asset_feedback
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.asset_feedback
  DROP CONSTRAINT IF EXISTS asset_feedback_user_or_anonymous_check;

ALTER TABLE public.asset_feedback
  ADD CONSTRAINT asset_feedback_user_or_anonymous_check
  CHECK (
    (user_id IS NOT NULL AND anonymous_session_id IS NULL)
    OR (user_id IS NULL AND anonymous_session_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_asset_feedback_anonymous_session_id ON public.asset_feedback(anonymous_session_id);

-- 6) RPC : valider un token d'invitation et retourner project_id (pour accès anonyme)
CREATE OR REPLACE FUNCTION public.get_project_id_by_invite_token(p_token TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id
  FROM public.project_invites
  WHERE token = p_token
    AND expires_at > now()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_id_by_invite_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_project_id_by_invite_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_id_by_invite_token(TEXT) TO service_role;

COMMENT ON FUNCTION public.get_project_id_by_invite_token(TEXT) IS 'Retourne le project_id si le token d''invitation est valide et non expiré. Utilisé pour l''accès anonyme /p/[token].';
