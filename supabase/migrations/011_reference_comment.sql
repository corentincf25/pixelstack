-- Commentaire optionnel par référence (ex. "J'aime bien le texte", "Style à reproduire")
ALTER TABLE public.project_references
ADD COLUMN IF NOT EXISTS comment TEXT;

COMMENT ON COLUMN public.project_references.comment IS 'Commentaire / note sur cette référence (ex. ce qu''on aime, style à reproduire).';
