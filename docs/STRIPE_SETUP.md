# Configuration Stripe pour Pixelstack

Ce document décrit comment configurer Stripe (Produits, Prix, Webhook) pour que les abonnements mettent à jour correctement le plan et le stockage des utilisateurs.

---

## 1. Produits et prix

Dans le dashboard Stripe (**Products**), crée deux produits :

| Produit | Stockage | Metadata (optionnel sur le produit) |
|---------|----------|-------------------------------------|
| **Pro** | 10 Go | — |
| **Studio** | 50 Go | — |

Pour chaque produit, ajoute un **prix** récurrent (mensuel ou annuel selon ton choix). Après création, copie l’**ID du prix** (commence par `price_`) :

- Pro → colle dans la variable d’environnement `STRIPE_PRICE_PRO`
- Studio → colle dans `STRIPE_PRICE_STUDIO`

L’application envoie déjà le metadata `plan` lors de la création de la Checkout Session (`subscription_data.metadata.plan` = `"pro"` ou `"studio"`). Le webhook lit ce metadata sur l’objet `subscription` pour mettre à jour `profiles.plan` et `profiles.storage_limit_bytes`.

---

## 2. Webhook

1. **Developers** → **Webhooks** → **Add endpoint**
2. URL : `https://ton-domaine.com/api/webhooks/stripe` (en prod) ou `https://xxx.ngrok.io/api/webhooks/stripe` en local pour tester.
3. Événements à écouter :
   - `checkout.session.completed` — après un paiement réussi, met à jour le profil (stripe_customer_id, plan, stockage).
   - `customer.subscription.updated` — changement de plan ou renouvellement.
   - `customer.subscription.deleted` — résiliation → passage au plan gratuit (100 Mo).
4. Copie le **Signing secret** (whsec_...) dans `STRIPE_WEBHOOK_SECRET`.

---

## 3. Comportement de l’app

- **Create Checkout Session** (`POST /api/stripe/create-checkout-session`, body `{ plan: "pro" | "studio" }`) : crée ou réutilise le client Stripe, crée une session Checkout avec le prix correspondant et `metadata.plan`, redirige vers Stripe.
- **Webhook** : à la réception de `checkout.session.completed`, met à jour le profil (userId depuis `client_reference_id` ou `metadata.supabase_user_id`, plan depuis `metadata.plan`). Pour `customer.subscription.updated` / `deleted`, met à jour le profil via `stripe_customer_id`.
- **Customer Portal** (`POST /api/stripe/customer-portal`) : renvoie l’URL du portail Stripe pour gérer l’abonnement (changer de plan, moyen de paiement, annuler).

---

## 4. Mapping plan → stockage

| Plan   | storage_limit_bytes |
|--------|----------------------|
| free   | 100 Mo (104 857 600) |
| pro    | 10 Go                |
| studio | 50 Go                |

Ces valeurs sont définies dans le webhook et dans les RPC Supabase (`get_storage_limit_for_plan`).
