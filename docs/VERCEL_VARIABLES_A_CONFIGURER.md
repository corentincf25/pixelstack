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

## 2. Emails (Resend) – optionnel mais recommandé

| Variable dans Vercel | Où trouver la valeur | À faire |
|----------------------|----------------------|--------|
| `RESEND_API_KEY` | **https://resend.com** → **API Keys** → créer ou copier une clé (commence par `re_`). | Coller dans **Value**. |
| `RESEND_FROM` | Adresse d’envoi autorisée dans Resend (ex. `Pixelstack <onvoi@tondomaine.com>` ou `onboarding@resend.dev` pour les tests). | Optionnel ; par défaut le code utilise `Pixelstack <onboarding@resend.dev>`. |

---

## 3. Stripe – optionnel (pour abonnements plus tard)

| Variable dans Vercel | Où trouver la valeur | À faire |
|----------------------|----------------------|--------|
| `STRIPE_SECRET_KEY` | **https://dashboard.stripe.com** → **Developers** → **API keys** → "Secret key" (commence par `sk_live_` en prod, `sk_test_` en test). | Coller dans **Value**. |
| `STRIPE_WEBHOOK_SECRET` | **Stripe** → **Developers** → **Webhooks** → ajouter un endpoint (URL de ton app + `/api/webhooks/stripe`) → après création, cliquer sur le webhook → "Signing secret" (commence par `whsec_`). | Coller dans **Value**. À configurer seulement si tu actives les webhooks. |

---

## 4. URL de l’app (optionnel)

| Variable dans Vercel | Où la mettre | À faire |
|----------------------|--------------|--------|
| `NEXT_PUBLIC_APP_URL` | L’URL publique de ton site (ex. `https://pixelstack.vercel.app` ou `https://tondomaine.com`). | Utilisée pour les liens dans les emails. Si tu ne la mets pas, le code utilise automatiquement `https://${VERCEL_URL}` (domaine Vercel du déploiement). |

---

## Récap minimal pour que tout marche (auth + storage + images)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Ces 3 doivent pointer vers **le projet Supabase où les buckets `assets` et `avatars` existent** et où les migrations ont été exécutées. Après avoir ajouté ou modifié les variables, faire un **redeploy** (Deployments → … sur le dernier → Redeploy).
