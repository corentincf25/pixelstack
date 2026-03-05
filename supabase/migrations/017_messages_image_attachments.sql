-- Pièces jointes images dans le chat (stockées dans le bucket assets sous project_id/chat/)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_size_bytes BIGINT;

COMMENT ON COLUMN public.messages.image_url IS 'Chemin Storage (ex. project_id/chat/uuid.jpg) ou URL publique legacy.';
COMMENT ON COLUMN public.messages.image_size_bytes IS 'Taille du fichier image (octets) pour quota stockage graphiste.';

-- RLS inchangé : les membres du projet peuvent déjà lire/insérer messages.
-- Les fichiers sont dans le bucket assets, policies existantes couvrent project_id/chat/*.
