"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n-config";
import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

type Props = {
  /** Variante compacte (icône seule) pour la sidebar / navbar */
  variant?: "default" | "compact";
  className?: string;
};

export function LocaleSwitcher({ variant = "default", className = "" }: Props) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("locale");
  const nextLocale = locale === "fr" ? "en" : "fr";

  const handleSwitch = () => {
    setLocaleCookie(nextLocale);
    router.refresh();
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleSwitch}
        className={`inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground ${className}`}
        title={locale === "fr" ? "Switch to English" : "Passer en français"}
        aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
      >
        <Languages className="h-4 w-4" />
        <span className="sr-only">{t(nextLocale)}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (locale !== "fr") {
            setLocaleCookie("fr");
            router.refresh();
          }
        }}
        className={`cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors rounded-l-md ${locale === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        aria-pressed={locale === "fr"}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => {
          if (locale !== "en") {
            setLocaleCookie("en");
            router.refresh();
          }
        }}
        className={`cursor-pointer px-2.5 py-1.5 text-xs font-medium transition-colors rounded-r-md ${locale === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
