/**
 * Limites de stockage par plan (octets). Aligné avec get_storage_limit_for_plan en base et webhook Stripe.
 */
export const STORAGE_LIMIT_BYTES = {
  free: 25 * 1024 * 1024,           // 25 Mo
  pro: 2 * 1024 * 1024 * 1024,     // 2 Go
  studio: 10 * 1024 * 1024 * 1024, // 10 Go
} as const;

/** Limite par défaut quand profiles.storage_limit_bytes est NULL (plan free). */
export const DEFAULT_STORAGE_LIMIT_BYTES = STORAGE_LIMIT_BYTES.free;

/** Estimation "projets actifs" pour l’affichage (1 projet ≈ 20–40 Mo). À afficher comme indication. */
export const PLAN_PROJECTS_ESTIMATE: Record<string, string> = {
  free: "≈ 3 à 5 projets actifs",
  pro: "≈ 60 à 100 projets actifs",
  studio: "≈ 250 à 400 projets actifs",
};
