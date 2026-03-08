import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isValidLocale, LOCALE_COOKIE, type Locale } from "./i18n-config";

export type { Locale };
export { LOCALE_COOKIE, DEFAULT_LOCALE, LOCALES } from "./i18n-config";

/** Utiliser côté serveur (layout, page) pour lire la locale depuis le cookie. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isValidLocale(value) ? value : DEFAULT_LOCALE;
}

/** Charger les messages pour une locale (côté serveur). */
export async function getMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (locale === "en") {
    return (await import("@/messages/en.json")).default;
  }
  return (await import("@/messages/fr.json")).default;
}
