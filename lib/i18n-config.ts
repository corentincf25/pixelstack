/** Constantes et types partagés (côté client et serveur). Ne pas importer next/headers ici. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const DEFAULT_LOCALE = "fr" as const;
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}
