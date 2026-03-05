-- Taille des fichiers pour les versions (pour calcul stockage)
ALTER TABLE public.versions
  ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Quota de stockage par utilisateur (en octets). NULL = défaut applicatif (ex. 10 Go)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT;

-- RPC : retourne l'usage et la limite pour le designer connecté (auth.uid())
CREATE OR REPLACE FUNCTION public.get_designer_storage()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'used',
    COALESCE((
      SELECT SUM(COALESCE(a.file_size, 0))
      FROM public.assets a
      JOIN public.projects p ON p.id = a.project_id
      WHERE p.designer_id = auth.uid()
    ), 0) + COALESCE((
      SELECT SUM(COALESCE(v.file_size, 0))
      FROM public.versions v
      JOIN public.projects p ON p.id = v.project_id
      WHERE p.designer_id = auth.uid()
    ), 0),
    'limit',
    COALESCE(
      (SELECT storage_limit_bytes FROM public.profiles WHERE id = auth.uid()),
      10 * 1024 * 1024 * 1024
    )
  );
$$;

-- Autoriser les utilisateurs authentifiés à appeler la fonction
GRANT EXECUTE ON FUNCTION public.get_designer_storage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_designer_storage() TO anon;

-- get_designer_storage() : utilisé côté app pour la barre de stockage (designer).
-- Limite par défaut = 10 Go si storage_limit_bytes est NULL (modifiable plus tard par offre).
