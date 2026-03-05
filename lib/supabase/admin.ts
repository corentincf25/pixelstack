import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé service_role (côté serveur uniquement).
 * Utilisé pour accéder à des données protégées par RLS (ex. email d'un autre user).
 * Ne jamais exposer ce client au navigateur.
 * Retourne null si SUPABASE_SERVICE_ROLE_KEY est absent (notifications email désactivées).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
