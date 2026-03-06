# Variables Vercel : quoi mettre où

## Où les ajouter dans Vercel

1. Va sur **https://vercel.com** → ton projet Pixelstack.
2. Onglet **Settings** (Paramètres).
3. Menu de gauche : **Environment Variables**.
4. Pour chaque variable ci‑dessous : **Name** = le nom exact, **Value** = la valeur (colle sans espace). Choisis **Production** (et **Preview** si tu veux que les previews de PR aient la même config).

---

## 1. Supabase (obligatoire pour l’app + storage + images)

| Variable dans Vercel | Où trouver la valeur | À faire |
|----------------------|----------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Supabase** → ton projet → **Settings** (⚙️) → **API** → section "Project URL" → copie l’URL (ex. `https://xxxxx.supabase.co`). | Coller dans **Value**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même page **API** → "Project API keys" → **anon** **public** → cliquer "Reveal" puis copier la clé (commence par `eyJ...`). | Coller dans **Value**. |
| `SUPABASE_SERVICE_ROLE_KEY` | Même page **API** → **service_role** (⚠️ secret) → "Reveal" puis copier. | Coller dans **Value**. Ne jamais la mettre dans du code côté client. |

**Important :**  
- Utilise **le même projet Supabase** que celui où tu as créé les buckets **`assets`** et **`avatars`** et où tu as exécuté les migrations.  
- Si en local tu utilises un projet Supabase “dev” et en prod un autre projet “prod”, alors en prod tu mets ici l’URL et les clés **du projet prod**.

---

## 2. Emails (Resend) – notifications projet

| Variable dans Vercel | Où trouver la valeur | À faire |
|----------------------|----------------------|--------|
| `RESEND_API_KEY` | **https://resend.com** → **API Keys** → **Create API Key** (nom ex. « Pixelstack Vercel ») → copier la clé (commence par `re_`). Tu peux recréer une clé dédiée pour la prod. | Coller dans **Value**. |
| `RESEND_FROM` | Adresse d’envoi autorisée dans Resend (ex. `Pixelstack <contact@tondomaine.com>` ou `onboarding@resend.dev` pour les tests). | Optionnel ; par défaut le code utilise `Pixelstack <onboarding@resend.dev>`. |

**Comportement :** quand quelqu’un dépose une version, des assets, un message ou une référence, **tous les autres membres du projet** (client YouTuber, graphiste, relecteurs) reçoivent un email — chacun à son adresse. L’email du destinataire est récupéré via l’API Auth (fiable pour Google/OAuth), puis en secours via la base.

---

## 3. Stripe – abonnements (Checkout + portail facturation)

| Variable dans Vercel | Où trouver la valeur | À faire |
|----------------------|----------------------|--------|
| `STRIPE_SECRET_KEY` | **https://dashboard.stripe.com** → **Developers** → **API keys** → "Secret key" (commence par `sk_live_` en prod, `sk_test_` en test). | Coller dans **Value**. |
| `STRIPE_WEBHOOK_SECRET` | **Stripe** → **Developers** → **Webhooks** → ajouter un endpoint (URL de ton app + `/api/webhooks/stripe`) → après création, cliquer sur le webhook → "Signing secret" (commence par `whsec_`). Événements à écouter : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. | Coller dans **Value**. |
| `STRIPE_PRICE_PRO_MONTHLY` | **Stripe** → **Products** → Pro → prix mensuel → ID (price_…). | Plan Pro facturé au mois. |
| `STRIPE_PRICE_PRO_YEARLY` | **Stripe** → **Products** → Pro → prix annuel → ID (price_…). | Plan Pro facturé à l’année. |
| `STRIPE_PRICE_STUDIO_MONTHLY` | **Stripe** → **Products** → Studio → prix mensuel → ID (price_…). | Plan Studio facturé au mois. |
| `STRIPE_PRICE_STUDIO_YEARLY` | **Stripe** → **Products** → Studio → prix annuel → ID (price_…). | Plan Studio facturé à l’année. |

Dans Stripe, pour chaque **Produit** (Pro, Studio), configurer le **metadata** du prix ou de la souscription avec `plan: "pro"` ou `plan: "studio"` pour que le webhook mette à jour correctement le profil (voir doc webhook). Lors de la création de la Checkout Session, l’app envoie déjà `subscription_data.metadata.plan`.

---

## 4. URL de l’app (optionnel)

| Variable dans Vercel | Où la mettre | À faire |
|----------------------|--------------|--------|
| `NEXT_PUBLIC_APP_URL` | L’URL publique de ton site (ex. `https://pixelstack.vercel.app` ou `https://tondomaine.com`). | Utilisée pour les liens dans les emails. Si tu ne la mets pas, le code utilise automatiquement `https://${VERCEL_URL}` (domaine Vercel du déploiement). |

---

## 5. Cron – nettoyage des projets orphelins (optionnel)

| Variable dans Vercel | À faire |
|----------------------|--------|
| `CRON_SECRET` | Une chaîne secrète de ton choix (ex. mot de passe fort ou `openssl rand -hex 32`). Protège l’appel à `POST /api/cron/cleanup-orphan-projects` qui supprime les projets sans graphiste après 7 jours. |

**Configurer un cron (une fois par jour) :**  
- **Vercel Cron** : dans le repo, ajouter `vercel.json` avec une entrée `crons` qui appelle l’URL avec l’en-tête `Authorization: Bearer <CRON_SECRET>`.  
- Ou un service externe (cron-job.org, GitHub Actions) qui envoie `POST https://ton-app.vercel.app/api/cron/cleanup-orphan-projects` avec `Authorization: Bearer <CRON_SECRET>`.

---

## Récap minimal pour que tout marche (auth + storage + images)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Ces 3 doivent pointer vers **le projet Supabase où les buckets `assets` et `avatars` existent** et où les migrations ont été exécutées. Après avoir ajouté ou modifié les variables, faire un **redeploy** (Deployments → … sur le dernier → Redeploy).
