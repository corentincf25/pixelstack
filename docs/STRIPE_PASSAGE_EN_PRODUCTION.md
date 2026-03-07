# Passer Stripe en production (plus de mode test)

Pour accepter de vrais paiements sur Pixelstack, il faut configurer Stripe en **mode Live** et mettre à jour les variables d’environnement.

---

## 1. Stripe Dashboard : passer en Live

1. Ouvre [dashboard.stripe.com](https://dashboard.stripe.com).
2. En haut à droite, bascule du **Mode test** vers **Mode Live** (interrupteur).
3. Tu es maintenant en mode production : les clés et les webhooks seront ceux du Live.

---

## 2. Créer les produits et prix en Live

En mode **Live**, les produits/prix du mode test ne sont pas copiés. Il faut les recréer :

1. **Stripe Dashboard** → **Produits** → **Ajouter un produit**.
2. Crée **2 produits** (comme en test) :
   - **Pixelstack Pro** (ou nom identique à ton test)
   - **Pixelstack Studio**
3. Pour chaque produit, ajoute **2 prix** :
   - Un **récurrent mensuel** (10 € et 25 € par exemple)
   - Un **récurrent annuel** (avec remise si tu en avais une en test)
4. Après création, note les **ID des prix** (commencent par `price_`) :
   - Pro mensuel → pour `STRIPE_PRICE_PRO_MONTHLY`
   - Pro annuel → pour `STRIPE_PRICE_PRO_YEARLY`
   - Studio mensuel → pour `STRIPE_PRICE_STUDIO_MONTHLY`
   - Studio annuel → pour `STRIPE_PRICE_STUDIO_YEARLY`

Tu peux les copier depuis la fiche de chaque prix (ex. `price_1ABC...`).

---

## 3. Récupérer la clé secrète Live

1. **Stripe Dashboard** (en Live) → **Développeurs** → **Clés API**.
2. Dans **Clé secrète** (Secret key), clique sur **Révéler** et copie la clé (elle commence par `sk_live_`).
3. Tu l’utiliseras pour `STRIPE_SECRET_KEY` sur Vercel.

---

## 4. Créer le webhook en Live

1. **Stripe Dashboard** (en Live) → **Développeurs** → **Webhooks** → **Ajouter un endpoint**.
2. **URL de l’endpoint** :  
   `https://pixelstack.fr/api/webhooks/stripe`  
   (ou ton domaine de prod si différent).
3. **Événements à écouter** : sélectionne au minimum :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Crée l’endpoint, puis ouvre-le et clique sur **Révéler** à côté de **Signing secret** (commence par `whsec_`).
5. Copie ce secret : c’est la valeur de `STRIPE_WEBHOOK_SECRET` en production.

---

## 5. Portail client Stripe (optionnel)

Si tu utilises le portail client (gestion d’abonnement / annulation) :

1. **Stripe Dashboard** (en Live) → **Paramètres** → **Produits et tarification** (ou **Billing** → **Customer portal**).
2. Configure le portail (produits autorisés, annulation, etc.) comme en test si besoin.

L’app utilise déjà l’URL de retour définie via `NEXT_PUBLIC_APP_URL`, donc pas de changement de code.

---

## 6. Variables d’environnement sur Vercel

Dans **Vercel** → ton projet → **Settings** → **Environment Variables**, définis pour l’environnement **Production** (et **Preview** si tu veux les mêmes en préview) :

| Variable | Valeur (exemple) |
|----------|-------------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (clé secrète Live) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (signing secret du webhook Live) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` (ID prix Pro mensuel Live) |
| `STRIPE_PRICE_PRO_YEARLY` | `price_...` (ID prix Pro annuel Live) |
| `STRIPE_PRICE_STUDIO_MONTHLY` | `price_...` (ID prix Studio mensuel Live) |
| `STRIPE_PRICE_STUDIO_YEARLY` | `price_...` (ID prix Studio annuel Live) |

Vérifie aussi que `NEXT_PUBLIC_APP_URL` est bien `https://pixelstack.fr` (ou ton domaine) pour les redirections après paiement.

---

## 7. Redéployer

Après avoir enregistré les variables :

1. **Vercel** → **Deployments** → déclencher un **Redeploy** du dernier déploiement (ou pousser un commit).
2. Ainsi, l’app en prod utilisera les clés et prix Live.

---

## 8. Vérifications rapides

- **Checkout** : depuis l’app (bouton souscrire Pro/Studio), tu dois arriver sur une page Stripe en **Live** (sans bandeau « Mode test »).
- **Webhook** : après un paiement test en Live (carte réelle ou carte test Stripe si activée), onglet **Développeurs** → **Webhooks** → ton endpoint → **Événements récents** : les événements doivent être envoyés et renvoyer **200**.
- **Profil** : après un checkout réussi, le profil Supabase doit passer en `plan = 'pro'` ou `'studio'` et le stockage être mis à jour (25 Mo → 2 Go / 10 Go).

---

## Résumé

1. Stripe en **Live** → créer produits/prix Live → noter les 4 `price_...`.
2. Clé API **sk_live_...** → `STRIPE_SECRET_KEY`.
3. Webhook **https://pixelstack.fr/api/webhooks/stripe** en Live → signing secret **whsec_...** → `STRIPE_WEBHOOK_SECRET`.
4. Sur **Vercel**, mettre les 6 variables Stripe + `NEXT_PUBLIC_APP_URL`, puis redéployer.

Après ça, Stripe ne tourne plus en environnement de test et les abonnements sont réels.
