/**
 * Limite de stockage par défaut (octets) quand profiles.storage_limit_bytes est NULL.
 * Plan gratuit = 1 Go (aligné avec le webhook Stripe).
 */
export const DEFAULT_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 Go
