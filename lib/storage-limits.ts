/**
 * Limite de stockage par défaut (octets) quand profiles.storage_limit_bytes est NULL.
 * Plan gratuit = 25 Mo (aligné avec le webhook Stripe).
 */
export const DEFAULT_STORAGE_LIMIT_BYTES = 25 * 1024 * 1024; // 25 Mo
