# Récap : ce qu’il faut faire pour lancer Pixelstack en production

**Objectif :** avoir une app déployée, sécurisée, avec abonnements Stripe, emails et nettoyage automatique, dans le bon ordre.

---

## Vue d’ensemble (dans l’ordre)

1. **Supabase** — Projet, base, storage, migrations, RLS  
2. **Stripe** — Produits, prix, webhook  
3. **Resend** — Domaine et clé API (emails)  
4. **Vercel** — Déploiement + variables d’environnement  
5. **Cron** — Nettoyage des projets orphelins (optionnel mais recommandé)  
6. **Tests manuels** — Auth, projet, upload, facturation, legal  

---

## 1. Supabase

### 1.1 Créer le projet (si pas déjà fait)

- Va sur [supabase.com](https://supabase.com) → **New project**  
- Choisis organisation, nom du projet, mot de passe DB, région  
- Attends que le projet soit prêt  

### 1.2 Récupérer les clés

- **Settings** (⚙️) → **API**  
- Note :
  - **Project URL** → pour `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** (Reveal) → pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** (Reveal) → pour `SUPABASE_SERVICE_ROLE_KEY` (ne jamais l’exposer côté client)

### 1.3 Exécuter les migrations

- **SQL Editor** dans Supabase  
- Exécute **dans l’ordre** chaque fichier du dossier `supabase/migrations/` (de `000_` à `022_`)  
- Ou en CLI : `supabase db push` depuis le dossier du projet  

Vérifie qu’il n’y a pas d’erreur (tables `profiles`, `projects`, `assets`, `versions`, `messages`, `briefs`, `project_invites`, `project_collaborators`, `project_references`, `user_project_read`, etc.).

### 1.4 Storage : créer les buckets

- **Storage** dans le menu Supabase  
- Crée deux buckets :
  - **`assets`** : **privé** (pas de case “Public”). Limite fichier : 10 Mo si tu veux (déjà en migration).  
  - **`avatars`** : **public** (pour les photos de profil)  

Les policies RLS du storage sont normalement déjà créées par les migrations (accès par projet pour `assets`, lecture publique pour `avatars`). Si tu as créé les buckets à la main avant les migrations, refais tourner les migrations qui touchent à `storage.objects`.

### 1.5 Auth (optionnel)

- **Authentication** → **Providers** : vérifie que **Email** et **Google** sont activés si tu les utilises  
- **URL de redirection** : ajoute l’URL de ton app (ex. `https://ton-app.vercel.app/auth/callback`)  

---

## 2. Stripe

### 2.1 Compte et clés

- [dashboard.stripe.com](https://dashboard.stripe.com)  
- En test : **Developers** → **API keys** → **Secret key** (sk_test_…) → pour `STRIPE_SECRET_KEY`  

### 2.2 Produits et prix

- **Products** → **Add product**  
- **Pro** : nom "Pro" (ou "Pixelstack Pro"), description optionnelle. Ajoute un **prix** récurrent (mensuel ou annuel), en euros. Après création, copie l’**ID du prix** (price_…) → **`STRIPE_PRICE_PRO`**  
- **Studio** : même chose pour "Studio", un prix récurrent → **`STRIPE_PRICE_STUDIO`**  

Tu n’as pas besoin de mettre le metadata `plan` sur le produit Stripe : l’app l’envoie déjà à la création de la session Checkout.

### 2.3 Webhook

- **Developers** → **Webhooks** → **Add endpoint**  
- **URL** : `https://TON-DOMAINE-VERCEL.vercel.app/api/webhooks/stripe` (remplace par ton URL réelle)  
- **Events** : sélectionne :
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`  
- Crée, puis clique sur le webhook → **Signing secret** (whsec_…) → **`STRIPE_WEBHOOK_SECRET`**  

---

## 3. Resend (emails)

- [resend.com](https://resend.com) → compte  
- **API Keys** → créer une clé → **`RESEND_API_KEY`**  
- **Domains** : ajoute ton domaine pour l’envoi (ou garde `onboarding@resend.dev` en test)  
- Variable optionnelle : **`RESEND_FROM`** (ex. `Pixelstack <contact@tondomaine.com>`) ; sinon l’app utilise `Pixelstack <onboarding@resend.dev>`  

---

## 4. Vercel

### 4.1 Projet

- [vercel.com](https://vercel.com) → **Add New** → **Project**  
- Importe le repo GitHub (ou autre) où se trouve `mini-maker-app`  
- **Root Directory** : si tout le code est dans `mini-maker-app`, mets `mini-maker-app`  
- **Build** : laisse Next.js (détecté automatiquement)  

### 4.2 Variables d’environnement

Dans **Settings** → **Environment Variables**, ajoute **pour Production** (et Preview si tu veux) :

| Nom | Valeur | Où la trouver |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... | Supabase → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... | Supabase → API → service_role |
| `STRIPE_SECRET_KEY` | sk_test_... ou sk_live_... | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | whsec_... | Stripe → Webhooks → ton endpoint → Signing secret |
| `STRIPE_PRICE_PRO` | price_... | Stripe → Products → Pro → prix |
| `STRIPE_PRICE_STUDIO` | price_... | Stripe → Products → Studio → prix |
| `RESEND_API_KEY` | re_... | Resend → API Keys |
| `RESEND_FROM` | (optionnel) | ex. Pixelstack &lt;contact@domaine.com&gt; |
| `NEXT_PUBLIC_APP_URL` | https://ton-app.vercel.app | ton URL Vercel (ou domaine perso) |
| `CRON_SECRET` | (optionnel) | une chaîne secrète forte (ex. `openssl rand -hex 32`) |

Référence complète : `docs/VERCEL_VARIABLES_A_CONFIGURER.md`

### 4.3 Déployer

- **Deployments** → déploie (ou push sur la branche connectée)  
- Vérifie que le build passe (Next.js + TypeScript)  
- Note l’URL du déploiement (ex. `https://pixelstack-xxx.vercel.app`)  

### 4.4 Après le premier déploiement

- **Stripe** : dans le webhook, mets l’URL réelle du déploiement (pas localhost)  
- **Supabase** : dans Authentication → URL redirect, ajoute `https://ton-app.vercel.app/auth/callback`  

---

## 5. Cron (nettoyage projets orphelins)

Pour supprimer automatiquement les projets sans graphiste après 7 jours :

1. Génère un secret : par ex. `openssl rand -hex 32` (ou un mot de passe fort) → **`CRON_SECRET`** dans Vercel  
2. Configure un cron externe (une fois par jour) qui appelle :  
   `POST https://ton-app.vercel.app/api/cron/cleanup-orphan-projects`  
   avec l’en-tête : `Authorization: Bearer TON_CRON_SECRET`  
   (ou paramètre query `?secret=TON_CRON_SECRET`)

Exemples : [cron-job.org](https://cron-job.org), GitHub Actions, ou Vercel Cron si tu ajoutes `vercel.json` avec une entrée `crons`.  
Détails : `docs/CRON_NETTOYAGE_7_JOURS.md`

---

## 6. Ordre recommandé (résumé)

| Étape | Action |
|-------|--------|
| 1 | Supabase : créer projet, noter URL + anon + service_role |
| 2 | Supabase : exécuter toutes les migrations (SQL Editor ou `supabase db push`) |
| 3 | Supabase : créer buckets `assets` (privé) et `avatars` (public) |
| 4 | Stripe : créer produits Pro et Studio + prix, noter `STRIPE_PRICE_PRO` et `STRIPE_PRICE_STUDIO` |
| 5 | Stripe : créer webhook (URL en local ou temporaire d’abord, tu la changeras après déploiement) |
| 6 | Resend : créer clé API (et domaine si tu veux) |
| 7 | Vercel : créer projet, configurer **toutes** les variables d’environnement |
| 8 | Vercel : déployer, vérifier que l’app répond |
| 9 | Stripe : mettre l’URL de prod dans le webhook |
| 10 | Supabase : ajouter l’URL de callback auth en prod |
| 11 | (Optionnel) Configurer le cron de nettoyage avec `CRON_SECRET` |
| 12 | Tester : inscription, connexion, création de projet, upload, passage au plan Pro, portail Stripe, pages /legal/terms et /legal/privacy |

---

## 7. Checklist de vérification

- [ ] Supabase : migrations OK, buckets `assets` et `avatars` présents  
- [ ] Stripe : 2 prix (Pro, Studio), webhook avec les 3 événements, URL en **https** et en prod  
- [ ] Vercel : build vert, variables remplies (au moins Supabase + Stripe)  
- [ ] Inscription / connexion (email + Google si activé)  
- [ ] Création de projet, invitation, upload d’assets  
- [ ] Page **Facturation** : boutons Pro / Studio → redirection Stripe ; après paiement test, plan et stockage mis à jour  
- [ ] Bouton « Ouvrir le portail Stripe » → portail client  
- [ ] Footer landing : liens CGU et Confidentialité → pages /legal/terms et /legal/privacy  
- [ ] Inscription : case CGU/Confidentialité obligatoire  

Une fois tout ça fait, l’app est prête pour une commercialisation réelle (en passant Stripe en mode live et en configurant ton domaine si besoin).
