# Audit de préparation à la production — Pixelstack

**Date :** mars 2025  
**Périmètre :** application SaaS Next.js (App Router), Supabase, Stripe, Resend, déploiement Vercel.

---

## Verdict

### B) NOT READY

L’application est **techniquement solide** (auth, RLS, quotas, Stripe, emails) et plusieurs correctifs ont été appliqués pendant l’audit. En l’état, elle peut être utilisée en **beta privée** ou **early access**. Pour une **commercialisation pleine** (lancement public, paiements réels), il reste des points critiques et des améliorations à traiter.

---

## 1. Architecture

**Points positifs :**
- Séparation claire client/serveur : `createClient()` (RLS) vs `createAdminClient()` (service role) uniquement côté API.
- Routes API cohérentes : auth, vérification de membership (`is_project_member`), puis opérations sensibles.
- RPC Supabase centralisent la logique métier (quota, stockage, rôles).

**Points d’attention :**
- Pas de fichier `.env.example` : les variables requises sont décrites dans `docs/VERCEL_VARIABLES_A_CONFIGURER.md` mais un template vide aiderait les nouveaux devs.
- Middleware Next.js : la convention "middleware" est dépréciée au profit de "proxy" (warning au build) — à suivre pour les mises à jour Next.js.

**Recommandations :**
- Créer un `.env.example` listant toutes les variables (sans valeurs).
- Documenter le flux d’invitation (client/designer/reviewer) dans un README ou `docs/`.

---

## 2. Sécurité

**Corrections appliquées pendant l’audit :**
- **`/api/projects/[id]/assets/download-all`** : l’accès était limité à `client_id` et `designer_id`. Il utilise maintenant `is_project_member`, ce qui permet aux **relecteurs** de télécharger le ZIP.
- **`/api/notify-project-update`** : ajout d’un contrôle explicite `is_project_member` avant d’envoyer un email, en plus du RLS.
- **`/api/projects/[id]/storage/signed-urls`** : rejet des chemins contenant `..` ou commençant par `/` pour éviter le path traversal.

**Vérifications effectuées :**
- Aucune exposition de `SUPABASE_SERVICE_ROLE_KEY` ou de clés Stripe côté client.
- Variables `NEXT_PUBLIC_*` limitées à l’URL Supabase et à la clé anon (usage attendu).
- Webhook Stripe : signature vérifiée via `stripe.webhooks.constructEvent`.
- Cron cleanup orphelins : protégé par `CRON_SECRET` (header ou query).
- Routes API protégées : auth + vérification projet (member ou designer selon le cas).

**À faire manuellement :**
- En production, s’assurer que `CRON_SECRET` est fort et que l’endpoint cron n’est pas exposé sans authentification.
- Vérifier dans le dashboard Stripe que le webhook pointe bien vers l’URL de prod et que les événements `customer.subscription.*` sont envoyés.

---

## 3. Stockage

**Points positifs :**
- Bucket `assets` en privé (migration 015) ; accès uniquement via URLs signées générées par l’API.
- Quota vérifié côté serveur via `check_project_storage_quota` (RPC) et `/api/storage/check-quota`.
- Tous les points d’upload (assets, versions, références, chat) appellent `check-quota` avant upload.
- Plan gratuit 100 Mo, pro 10 Go, studio 50 Go — cohérent (migrations, RPC, webhook Stripe, UI).

**Points d’attention :**
- `download-all` et `backfill` s’appuient sur `extractPath` avec le préfixe `/object/public/assets/`. Si les URLs stockées en base changent de format (ex. bucket privé avec autre schéma), il faudra adapter l’extraction du chemin.
- Pas de limite globale sur le nombre de requêtes signed-urls (risque d’abus si un client demande des milliers de chemins). Une limite par requête (ex. 100 chemins) pourrait être ajoutée.

**Recommandation :**
- Optionnel : limiter le nombre de `paths` dans `signed-urls` (ex. 200 max) et retourner 400 au-delà.

---

## 4. Abonnements (Stripe)

**Points positifs :**
- Webhook vérifié par signature ; mise à jour de `profiles.plan` et `profiles.storage_limit_bytes` pour `created`, `updated`, `deleted`.
- Plan par défaut `free` (100 Mo) en cas de résiliation.
- Création de client Stripe via `/api/stripe/create-customer` avec enregistrement de `stripe_customer_id` dans `profiles`.

**Points d’attention :**
- Le plan est déduit de `subscription.metadata.plan` ; si Stripe n’envoie pas ce metadata, le plan reste `free`. Il faut s’assurer que le Checkout ou le portail Stripe renseigne bien `metadata.plan` (pro/studio).
- Pas de page dédiée “Abonnement” ou “Facturation” dans l’app : les utilisateurs ne peuvent pas gérer leur abonnement depuis l’interface (à prévoir pour la commercialisation).

**À faire manuellement :**
- Configurer les produits/prix Stripe et le Checkout avec `metadata.plan`.
- Ajouter une page “Mon abonnement” (lien portail client Stripe, affichage du plan actuel, upgrade/downgrade).

---

## 5. Performance

**Constats :**
- Pas de cache explicite (React Query, SWR) sur les données projet/profil ; les pages refetch au chargement.
- Signed URLs : une requête par ensemble de chemins ; pas de mise en cache côté client des URLs (expiration 1 h).
- Build Next.js OK ; pas de surcharge évidente.

**Recommandations (nice-to-have) :**
- Mettre en cache les données projet/liste avec invalidation après mutation.
- Pour les listes longues (projets, assets), envisager la pagination côté API.

---

## 6. Gestion des erreurs

**Points positifs :**
- Les routes API retournent des codes HTTP et des messages cohérents (401, 403, 404, 500).
- Upload : message “Quota dépassé” si `check-quota` refuse.
- Erreurs Stripe et Supabase loguées côté serveur.

**Points d’attention :**
- Côté client, certaines erreurs réseau ou 500 peuvent ne pas afficher de message explicite (toast ou état d’erreur à vérifier sur chaque flux).
- En cas d’échec partiel d’upload (plusieurs fichiers), l’UI peut avoir déjà notifié “assets” ; un rollback ou un message “X/Y fichiers enregistrés” améliorerait l’UX.

---

## 7. UX et produit

**Points positifs :**
- Onboarding (rôle designer/youtuber), création de projet, invitation (client/designer/reviewer), chat, versions, références, feedback.
- Suppression de projet avec accord des deux parties et purge du storage.
- Notifications email (Resend) pour alerter l’autre partie (version, assets, message, référence).

**À améliorer :**
- Page “Mon abonnement” / facturation absente.
- Pas de politique de confidentialité / CGU dans l’app (obligatoire pour une commercialisation).
- Gestion des erreurs et états de chargement à homogénéiser (skeleton, toasts).

---

## 8. Déploiement et configuration

**Points positifs :**
- Documentation des variables Vercel (`docs/VERCEL_VARIABLES_A_CONFIGURER.md`).
- Supabase : buckets `assets` et `avatars` documentés ; migrations numérotées.
- Cron orphelins documenté (`docs/CRON_NETTOYAGE_7_JOURS.md`).

**À faire manuellement :**
- Vérifier que toutes les migrations sont appliquées sur le projet Supabase de production (y compris 021, 022).
- Configurer le cron (Vercel Cron ou service externe) avec `CRON_SECRET`.
- En prod : configurer Stripe (webhook, prix, metadata) et Resend (domaine d’envoi si hors `resend.dev`).

---

## 9. Responsive et mobile

**Constats :**
- Layout adapté (sidebar → drawer sur mobile, grilles responsives, zones de chat scrollables).
- Touch targets et navigation mobile déjà pris en charge dans les composants existants.

**Recommandation :**
- Tester manuellement sur appareils réels (mobile, tablette) les flux critiques : création de projet, upload, chat, ouverture des lightboxes.

---

## 10. Corrections automatiques effectuées

| Fichier | Modification |
|--------|--------------|
| `app/api/projects/[id]/assets/download-all/route.ts` | Accès basé sur `is_project_member` au lieu de `client_id`/`designer_id` uniquement → les relecteurs peuvent télécharger le ZIP. |
| `app/api/notify-project-update/route.ts` | Vérification explicite `is_project_member(projectId)` avant envoi d’email. |
| `app/api/projects/[id]/storage/signed-urls/route.ts` | Rejet des chemins contenant `..` ou commençant par `/` pour éviter le path traversal. |

---

## Synthèse des actions

### Critiques (à traiter avant lancement public)

1. **Stripe en production** : configurer produits/prix, Checkout et metadata `plan` ; vérifier le webhook sur l’URL de prod.
2. **Page abonnement / facturation** : au minimum afficher le plan actuel et un lien vers le portail client Stripe pour gérer l’abonnement.
3. **Mentions légales** : ajouter une page (ou lien) CGU / Politique de confidentialité et les intégrer au signup si requis juridiquement.

### Importantes (recommandées)

4. Créer un `.env.example` avec la liste des variables (sans valeurs).
5. S’assurer que le cron de nettoyage des projets orphelins est bien exécuté en prod (avec `CRON_SECRET`).
6. Tester les flux complets (inscription, projet, invitation, upload, version, chat, suppression) en environnement de staging.

### Nice-to-have

7. Limiter le nombre de chemins par requête dans `signed-urls` (ex. 200).
8. Cache côté client pour les listes (projets, assets) avec invalidation.
9. Messages d’erreur et états de chargement homogènes (toasts, skeletons).

---

*Audit réalisé sur l’ensemble du dépôt (frontend, API, migrations Supabase, Stripe, Resend, déploiement). Les correctifs listés en section 10 ont été appliqués dans le code.*
