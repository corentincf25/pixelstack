-- Offres de stockage et aide à la notification (email depuis auth.users)
-- 1) RPC pour récupérer l'email d'un utilisateur (auth.users) — utilisé par l'API de notification
--    si l'API Auth ne renvoie pas l'email (ex. certains providers OAuth).
CREATE OR REPLACE FUNCTION public.get_user_email(target_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT email FROM auth.users WHERE id = target_id LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_email(UUID) IS 'Retourne l''email de l''utilisateur depuis auth.users. Utilisé par l''API notify pour le destinataire.';

-- Seul le service role (backend) doit appeler cette fonction ; pas d'exposition aux clients.
-- Si tu appelles depuis Next.js avec createAdminClient(), le service role a tous les droits.
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO service_role;

-- 2) Colonne email sur profiles (fallback pour notifications ; peut être remplie par ton app à la connexion)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.email IS 'Email (copie optionnelle depuis auth). Remplir à la connexion ou via get_user_email.';

-- Mettre à jour les profils existants avec l''email depuis auth.users (une fois)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS DISTINCT FROM u.email);

-- 3) Pas de table "offres" pour l'instant : on utilise storage_limit_bytes sur profiles.
-- Free = NULL ou 1 Go (1 * 1024^3), Payant 10 € = 10 Go (10 * 1024^3).
-- En prod : après paiement, faire UPDATE profiles SET storage_limit_bytes = 10*1024*1024*1024 WHERE id = ...;
