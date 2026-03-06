/**
 * Limite de stockage par défaut (octets) quand profiles.storage_limit_bytes est NULL.
 * Plan gratuit = 100 Mo (aligné avec le webhook Stripe).
 */
export const DEFAULT_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024; // 100 Mo
