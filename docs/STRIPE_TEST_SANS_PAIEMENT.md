# Tester les abonnements Stripe sans dépenser d’argent

Stripe propose un **mode test** : aucune transaction réelle, aucun prélèvement. Tu utilises des **clés de test** et des **numéros de carte de test**.

---

## 1. Activer le mode test dans Stripe

1. Va sur **https://dashboard.stripe.com**.
2. En haut à droite, bascule le sélecteur **« Mode test »** (toggle **Test mode** / **Mode test**). L’interface passe en orange/gris pour indiquer que tu es en test.
3. Tout ce que tu fais (produits, prix, webhooks, clients) est alors **uniquement en test** — invisible en production et sans argent réel.

---

## 2. Utiliser les clés de test dans ton app

Dans ton **`.env.local`** (ou les variables Vercel pour un déploiement de test) :

- **`STRIPE_SECRET_KEY`** : utilise la clé qui commence par **`sk_test_...`** (pas `sk_live_...`).
  - Où la trouver : Stripe → **Developers** → **API keys** → « Secret key » en mode test.
- **`STRIPE_WEBHOOK_SECRET`** : crée un **endpoint de webhook en mode test** (voir ci‑dessous) et copie le **Signing secret** (`whsec_...`).
- Les **`STRIPE_PRICE_PRO_MONTHLY`**, **`STRIPE_PRICE_PRO_YEARLY`**, etc. : ce sont les **ID de prix créés en mode test** (Stripe → Products → créer/copier les prix en mode test).

En test, tu ne dépenses rien : Stripe simule le paiement.

---

## 3. Cartes de test Stripe (aucun prélèvement réel)

Lors du checkout Stripe, utilise l’une de ces **numéros de carte** (mode test uniquement) :

| Résultat        | Numéro de carte        | Date  | CVC  |
|-----------------|------------------------|-------|------|
| Paiement réussi | `4242 4242 4242 4242`   | Futur (ex. 12/34) | 3 chiffres quelconques (ex. 123) |
| Paiement refusé | `4000 0000 0000 0002`  | idem  | idem |
| Authentification 3D Secure | `4000 0025 0000 3155` | idem  | idem |

- **Date d’expiration** : n’importe quelle date **future** (ex. 12/34).
- **CVC** : 3 chiffres quelconques (ex. 123).
- **Nom / adresse** : ce que tu veux.

Aucune somme n’est prélevée sur un vrai compte.

---

## 4. Webhook en local (optionnel)

Pour que Stripe envoie les événements (ex. `checkout.session.completed`) à ton app en **localhost** :

1. Installe **Stripe CLI** : https://stripe.com/docs/stripe-cli  
   (ex. `brew install stripe/stripe-cli/stripe` sur Mac)
2. Connecte-toi : `stripe login`
3. Lance le tunnel vers ton serveur local (ex. port 3000) :  
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. La CLI affiche un **Signing secret** temporaire (whsec_...). Mets-le dans **`STRIPE_WEBHOOK_SECRET`** dans ton `.env.local` **uniquement pour le test en local**.
5. Lance ton app (`npm run dev`), fais un « paiement » avec la carte `4242 4242 4242 4242` : le webhook sera reçu en local et le profil sera mis à jour.

En **déploiement** (ex. Vercel), utilise l’URL publique de ton app (ex. `https://ton-app.vercel.app/api/webhooks/stripe`) dans un endpoint de webhook Stripe **créé en mode test** et utilise le Signing secret de cet endpoint dans les variables d’environnement de ce déploiement.

---

## 5. Vérifier que tout fonctionne

1. **Mode test** activé dans le dashboard Stripe.
2. **Clés et prix** : `sk_test_...`, prix `price_...` créés en **mode test**, webhook en mode test pointant vers ton URL.
3. **Checkout** : clic sur « Souscrire » (Pro ou Studio) → redirection Stripe → carte **4242 4242 4242 4242** → paiement « accepté ».
4. **Redirection** : page de remerciement puis dashboard.
5. **Profil** : sur la page Facturation, le plan affiché est Pro ou Studio et le stockage est à jour (10 Go / 50 Go).
6. **Portail Stripe** : « Ouvrir le portail Stripe » → tu peux « annuler » l’abonnement de test ; le webhook `customer.subscription.deleted` repasse le compte en Gratuit.

Tant que tu restes en **clés `sk_test_`** et **mode test** dans le dashboard, **aucun argent n’est dépensé**.
