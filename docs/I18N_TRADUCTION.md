# Internationalisation (FR / EN) — Pixelstack

Le site est disponible en **français** (par défaut) et en **anglais**. La langue est stockée dans un cookie (`NEXT_LOCALE`) et ne change pas l’URL.

## Où changer la langue

- **Landing** : boutons **FR | EN** dans la barre de navigation (desktop) ou dans le menu mobile (section « Langue »).
- **Dashboard** : icône **globe** (langues) en bas de la sidebar, au-dessus de la zone « Connecté » / déconnexion.

Après un clic, la page se recharge avec la nouvelle langue.

## Fichiers de traduction

- **`messages/fr.json`** : textes en français
- **`messages/en.json`** : textes en anglais

Structure par « namespaces » : `common`, `nav`, `hero`, `sidebar`, `locale`, etc. Chaque clé peut être une chaîne ou un objet pour les sous-clés.

## Utiliser les traductions dans un composant

### Client Component

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("nav");  // namespace = "nav"
  return <button>{t("login")}</button>;  // → "Connexion" ou "Log in"
}
```

Pour un sous-objet :

```tsx
const t = useTranslations("hero");
t("title");       // hero.title
t("inviteHint");  // hero.inviteHint
```

### Server Component

En Server Component, utiliser `getTranslations` (next-intl) en passant la locale et les messages. Pour l’instant la plupart des textes traduits sont dans des Client Components ; si besoin en server, on peut récupérer la locale avec `getLocale()` depuis `@/lib/i18n` et charger les messages avec `getMessages(locale)`.

## Ajouter de nouvelles chaînes

1. Ajouter la clé dans **`messages/fr.json`** (et éventuellement dans un namespace existant, ex. `"dashboard": { "welcome": "Bienvenue" }`).
2. Ajouter la même clé dans **`messages/en.json`** avec la traduction anglaise.
3. Dans le composant : `const t = useTranslations("dashboard");` puis `t("welcome")`.

## Déjà traduit (exemples)

- **Nav** : liens (Comment ça marche, Tarifs, FAQ…), Connexion, Créer un compte, Commencer gratuitement, Dashboard, etc.
- **Hero** : badge, titre, sous-titre, origine, boutons « Commencer gratuitement » et « Comment ça marche ? », invite hint.
- **Sidebar** : libellés (Dashboard, Projets, Paramètres, Mon stockage, Abonnement), plans (Gratuit, Pro, Studio), Connecté, Se déconnecter.

## Étendre la traduction au reste de l’app

Pour une page ou un composant encore en français :

1. Créer un namespace dans `fr.json` et `en.json` (ex. `"projects": { "title": "Projets", "create": "Créer un projet" }`).
2. Dans le composant : `useTranslations("projects")` puis remplacer les chaînes en dur par `t("title")`, `t("create")`, etc.

Les pages (login, signup, dashboard, projet, paramètres, facturation, etc.) peuvent être migrées progressivement en suivant ce schéma.

## Technique

- **next-intl** : provider dans le layout racine avec `locale` et `messages` chargés côté serveur (cookie `NEXT_LOCALE`).
- **Cookie** : nom `NEXT_LOCALE`, valeurs `fr` | `en`, durée 1 an.
- **`lib/i18n.ts`** : `getLocale()`, `getMessages(locale)`, constantes `LOCALES`, `DEFAULT_LOCALE`.
- **`components/LocaleSwitcher.tsx`** : boutons FR/EN ou icône globe ; écrit le cookie puis `router.refresh()` pour recharger avec la bonne langue.
