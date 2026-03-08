-- Limite d’envoi d’emails de notification : au plus 1 email par (projet, destinataire) par fenêtre de temps.
-- Utilisé par l’API notify-project-update pour éviter le spam et préserver le quota Resend.
CREATE TABLE IF NOT EXISTS public.notification_email_throttle (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, recipient_id)
);

COMMENT ON TABLE public.notification_email_throttle IS 'Dernier envoi d’email de notification par (projet, destinataire). Rate limit côté API (ex. 1 email / 15 min).';

ALTER TABLE public.notification_email_throttle ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour anon/authenticated : seul le backend (service_role) lit/écrit cette table.
-- Le backend utilise createAdminClient() qui bypass RLS.
