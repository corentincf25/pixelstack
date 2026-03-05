/**
 * Limite de stockage par défaut (octets) quand profiles.storage_limit_bytes est NULL.
 * Supabase free tier = 1 Go ; ajuster selon ton offre (ex. 10 * 1024**3 pour 10 Go).
 */
export const DEFAULT_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 Go
