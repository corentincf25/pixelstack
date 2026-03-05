-- Nom personnalisable pour chaque version (ex. V1, V2, "Première proposition")
ALTER TABLE public.versions
  ADD COLUMN IF NOT EXISTS version_name TEXT;
