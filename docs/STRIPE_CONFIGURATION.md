# Configuration Stripe (Pixelstack)

## 1. STRIPE_SECRET_KEY

**Où la trouver :** [Dashboard Stripe](https://dashboard.stripe.com) → **Developers** → **API keys**.

- En test : utilise la clé **Secret key** (commence par `sk_test_...`).
- En production : utilise la clé **Secret key** en mode Live (`sk_live_...`).

**À faire :** ne jamais commiter cette clé. Elle doit rester dans `.env.local` (déjà ignoré par git).

---

## 2. STRIPE_WEBHOOK_SECRET

Le webhook secret sert à **vérifier** que les requêtes reçues viennent bien de Stripe.

### Étapes

1. **Créer un endpoint webhook dans Stripe**  
   - [Dashboard Stripe](https://dashboard.stripe.com) → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL de l’endpoint**  
   - En local : utilise [Stripe CLI](https://stripe.com/docs/stripe-cli) pour exposer ton serveur (ex. `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).  
   - En prod : `https://ton-domaine.com/api/webhooks/stripe`.
3. **Événements à écouter**  
   Coche au minimum :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Récupérer le secret**  
   Après création, ouvre l’endpoint → **Reveal** dans “Signing secret”. La valeur commence par `whsec_...`. C’est **STRIPE_WEBHOOK_SECRET**.

**En local avec Stripe CLI :** la commande `stripe listen` affiche un secret temporaire (ex. `whsec_...`) à mettre dans `.env.local` pendant le dev.

---

## 3. Fichier .env.local

Ajoute (sans commiter le fichier) :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

Redémarre le serveur Next.js après modification.

---

## 4. Renseigner profiles.stripe_customer_id

Le webhook met à jour le profil dont `stripe_customer_id` = `subscription.customer`. Il faut donc **enregistrer l’id client Stripe** au moment où tu crées ce client (checkout ou création explicite).

Deux approches possibles :

### Option A : Créer le client Stripe au premier checkout

Quand l’utilisateur clique sur « Passer au plan Pro » (ou équivalent) :

1. **Côté serveur** : créer un client Stripe avec `stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })`.
2. **Sauvegarder l’id** : `UPDATE profiles SET stripe_customer_id = customer.id WHERE id = user.id` (avec le client Supabase admin ou une RPC).
3. **Créer la session Checkout** (ou le lien d’abonnement) avec `customer: customer.id`.

Ainsi, à la première souscription, le client existe déjà et son id est lié au profil ; le webhook pourra mettre à jour `plan` et `storage_limit_bytes`.

### Option B : Créer le client Stripe à la connexion / à l’onboarding

Lors de la première connexion (ou une page “Abonnement”), appeler une API qui :

1. Vérifie si `profiles.stripe_customer_id` est déjà renseigné.
2. Sinon, crée un client Stripe et met à jour `profiles.stripe_customer_id`.

Ensuite, au checkout, tu réutilises ce `stripe_customer_id`.

---

## 5. API « Créer le client Stripe » (déjà implémentée)

L’API **`POST /api/stripe/create-customer`** :

- Vérifie que l’utilisateur est connecté.
- Si `profiles.stripe_customer_id` est déjà renseigné → retourne cet id.
- Sinon : crée un client Stripe avec l’email (et le nom) du profil, enregistre l’id dans `profiles.stripe_customer_id`, puis retourne l’id.

**Quand l’appeler :** avant de créer une session Stripe Checkout (bouton « Passer au plan Pro », page Abonnement, etc.).

Exemple côté front (page abonnement ou paramètres) :

```ts
// Avant de rediriger vers Stripe Checkout
const res = await fetch("/api/stripe/create-customer", { method: "POST" });
const { customerId } = await res.json();
if (customerId) {
  // Utiliser customerId pour créer la session Checkout Stripe (côté serveur)
  // ou le passer à ton API qui crée la session
}
```

Ton API qui crée la **session Checkout** (à faire de ton côté) recevra ainsi un `customerId` à fournir à Stripe ; après le paiement, le webhook mettra à jour `plan` et `storage_limit_bytes` grâce à ce `stripe_customer_id`.

---

## 6. Production (Vercel)

Sur [Vercel](https://vercel.com) → ton projet → **Settings** → **Environment Variables** :

- `STRIPE_SECRET_KEY` (et en prod, utilise la clé **Live** `sk_live_...`).
- `STRIPE_WEBHOOK_SECRET` : pour l’endpoint **production** (URL `https://ton-domaine.com/api/webhooks/stripe`), crée un nouvel endpoint dans le Dashboard Stripe en mode Live et récupère le signing secret associé.

Redeploy après avoir ajouté les variables.
