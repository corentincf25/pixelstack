-- last_activity_at pour indiquer qu'un invité anonyme est "en ligne"
ALTER TABLE public.anonymous_sessions
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_last_activity
  ON public.anonymous_sessions(project_id, last_activity_at);

COMMENT ON COLUMN public.anonymous_sessions.last_activity_at IS 'Mis à jour à chaque requête anon (GET project, message, upload) pour afficher "Invité en ligne" côté graphiste.';
