# Stripe : guide pas à pas pour Pixelstack

Tu es sur le dashboard Stripe. Voici exactement quoi faire, dans l’ordre.

---

## Étape 1 : Récupérer ta clé secrète (Secret key)

1. Dans le menu de gauche, clique sur **Developers** (ou **Développeurs**).
2. Clique sur **API keys** (Clés API).
3. Tu vois deux clés :
   - **Publishable key** (pk_…) → on n’en a pas besoin pour l’instant.
   - **Secret key** (sk_test_… en test, sk_live_… en prod) → clique sur **Reveal** (Révéler).
4. Clique sur **Copy** (Copier).
5. **Garde cette clé** : tu la colleras dans Vercel (ou `.env.local`) dans la variable **`STRIPE_SECRET_KEY`**.

---

## Étape 2 : Créer le produit "Pro" (10 Go)

1. Dans le menu de gauche, clique sur **Product catalog** (Catalogue de produits) puis **Products** (Produits).
2. Clique sur **+ Add product** (Ajouter un produit).
3. Remplis :
   - **Name** : `Pro` (ou "Pixelstack Pro").
   - **Description** (optionnel) : ex. "10 Go de stockage".
   - Laisse **One-time** ou **Recurring** : choisis **Recurring** (Récurrent) pour un abonnement.
4. Dans la section **Pricing** (Tarification) :
   - **Pricing model** : **Standard pricing**.
   - **Price** : mets ton prix (ex. 10 €).
   - **Billing period** : **Monthly** (Mensuel) ou **Yearly** (Annuel), comme tu veux.
   - **Currency** : EUR (ou autre).
5. Clique sur **Save product** (Enregistrer).

Le produit est créé. Tu vois maintenant une **liste de prix** sous ce produit.

6. Clique sur le **prix** que tu viens de créer (ou sur les 3 points à côté → **Copy price ID**).
7. Tu vois un identifiant qui commence par **`price_`** (ex. `price_1ABC123xyz`).
8. **Copie cet ID** : c’est la valeur pour **`STRIPE_PRICE_PRO`** (à mettre dans Vercel / .env).

---

## Étape 3 : Créer le produit "Studio" (50 Go)

1. Retourne dans **Products** (Produits).
2. Clique à nouveau sur **+ Add product**.
3. Remplis :
   - **Name** : `Studio` (ou "Pixelstack Studio").
   - **Description** (optionnel) : ex. "50 Go de stockage".
   - **Recurring** (Récurrent).
4. Dans **Pricing** :
   - Mets ton prix (ex. 25 €).
   - **Monthly** ou **Yearly**.
   - **Save product**.
5. Comme pour Pro : récupère l’ID du prix (**`price_...`**).
6. **Copie cet ID** : c’est la valeur pour **`STRIPE_PRICE_STUDIO`**.

---

## Étape 4 : Créer le webhook

Le webhook permet à Stripe de prévenir ton app quand un paiement est fait ou qu’un abonnement change.

1. Menu de gauche → **Developers** → **Webhooks**.
2. Clique sur **+ Add endpoint** (Ajouter un endpoint).
3. **Endpoint URL** :  
   - En local (test) : tu peux mettre une URL temporaire ou utiliser un outil comme ngrok.  
   - En prod : `https://TON-URL-VERCEL.vercel.app/api/webhooks/stripe`  
   Remplace `TON-URL-VERCEL` par l’URL réelle de ton app (ex. `pixelstack-abc123`).
4. **Description** (optionnel) : "Pixelstack production".
5. Clique sur **Select events** (Sélectionner des événements).
6. Cherche et coche **exactement** ces 3 événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
7. Clique sur **Add endpoint** (Ajouter l’endpoint).
8. Sur la page du webhook qui s’ouvre, tu vois **Signing secret** (Secret de signature).
9. Clique sur **Reveal** puis **Copy**.
10. Cette valeur commence par **`whsec_`** : c’est **`STRIPE_WEBHOOK_SECRET`** (à mettre dans Vercel / .env).

---

## Récap : les 4 valeurs à mettre dans Vercel (ou .env.local)

| Variable dans Vercel / .env | Où la trouver |
|-----------------------------|---------------|
| `STRIPE_SECRET_KEY` | Developers → API keys → Secret key (Reveal → Copy) |
| `STRIPE_PRICE_PRO` | Products → Pro → clic sur le prix → ID qui commence par `price_` |
| `STRIPE_PRICE_STUDIO` | Products → Studio → clic sur le prix → ID qui commence par `price_` |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → ton endpoint → Signing secret (Reveal → Copy) |

---

## Si ton app n’est pas encore déployée

- Tu peux créer le webhook **après** le déploiement sur Vercel, et mettre une URL temporaire (ex. `https://placeholder.com`) pour l’instant, puis **modifier** l’URL du webhook plus tard pour mettre ta vraie URL.
- Ou tu déploies d’abord sur Vercel, tu récupères l’URL, puis tu crées le webhook avec la bonne URL du premier coup.

---

## Test vs production

- En **test** (bouton "Test mode" activé en haut à droite) : tu utilises les clés `sk_test_...` et `pk_test_...`, et les ID de prix créés en mode test.
- Quand tu passeras en **production** : tu activeras "Live mode", tu créeras les mêmes produits/prix en live, et un nouveau webhook avec l’URL de prod. Tu mettras alors les clés et secrets **live** dans les variables Vercel pour la prod.

Pour l’instant, reste en **mode test** et configure ces 4 variables ; ça suffit pour que Pixelstack fonctionne avec Stripe.
