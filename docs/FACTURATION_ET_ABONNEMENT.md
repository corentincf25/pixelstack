# Facturation et abonnement — ce qui est en place

## 1. Comportement après souscription (confirmation)

Quand un client (graphiste) souscrit à un abonnement (Pro ou Studio) via Stripe Checkout :

1. **Paiement Stripe** : l’utilisateur paie sur la page Stripe.
2. **Webhook Stripe** : Stripe envoie l’événement `checkout.session.completed` (et éventuellement `customer.subscription.created` / `updated`) à notre API `/api/webhooks/stripe`.
3. **Mise à jour du profil** : le webhook met à jour la table `profiles` :
   - `plan` → `"pro"` ou `"studio"`
   - `storage_limit_bytes` → 10 Go (pro) ou 50 Go (studio)
   - `stripe_customer_id` → identifiant client Stripe (si créé)
4. **Effet immédiat** : après redirection vers `/dashboard/billing?success=1`, la page recharge les données (ou l’utilisateur peut rafraîchir) et voit :
   - le **nom de l’abonnement** (Pro ou Studio),
   - le **stockage** mis à jour (barre / chiffres),
   - les **promesses du plan** (stockage, projets, support) appliquées côté app (limites basées sur `profiles.plan` et `profiles.storage_limit_bytes`).

L’utilisateur peut **annuler** ou **modifier** son abonnement depuis le **portail Stripe** (bouton « Ouvrir le portail Stripe »). En cas d’annulation, Stripe envoie `customer.subscription.deleted` et le webhook repasse le profil en `plan: "free"` et `storage_limit_bytes: 100 Mo`.

**En résumé : oui, si le client souscrit à un abonnement, son compte est bien mis à jour (plan, stockage), il voit le nom de son abonnement, peut l’annuler via Stripe, et les limites (stockage, etc.) sont celles du plan souscrit.**

---

## 2. Ce qui va bien

- **Page Facturation** : forfait actuel (Gratuit / Pro / Studio) clairement affiché, avec description des avantages. Deux abonnements proposés (Pro et Studio) avec boutons « Souscrire » (mensuel / annuel). Texte explicatif pour changer de plan (Pro ↔ Studio) via le portail Stripe ou en souscrivant à l’autre plan.
- **Page de remerciement** : après paiement réussi, redirection vers `/dashboard/billing/success` (message de remerciement + redirection automatique vers le dashboard après 5 s, avec liens « Aller au dashboard » et « Voir ma facturation »).
- **Stripe Checkout** : création de session, redirection vers Stripe, `success_url` vers `/dashboard/billing/success`, `cancel_url` vers `/dashboard/billing?canceled=1`.
- **Webhook** : mise à jour de `profiles` (plan, stockage, `stripe_customer_id`) sur `checkout.session.completed`, `customer.subscription.updated` / `created`, et `customer.subscription.deleted` (retour au gratuit).
- **Monitoring webhook** : en cas d’échec (ex. Supabase down), logs structurés avec le préfixe `[Stripe webhook] ALERT:` et les champs `context`, `event_type`, `event_id`, `customerId` / `userId` / `plan`, `error`. À consulter dans les logs Vercel (ou Sentry si configuré) pour réconciliation manuelle.
- **Portail Stripe** : bouton pour gérer moyen de paiement, factures et annulation.
- **Retour depuis Stripe** : gestion du retour (bouton « retour » navigateur / bfcache) pour éviter un crash : rechargement des données au `pageshow`, `try/catch` et `finally` dans le chargement du profil.

---

## 3. Ce qu’il faut encore améliorer (idées)

- **Rafraîchissement après succès** : après retour de Stripe avec `?success=1`, recharger automatiquement le profil (déjà partiel via `loadProfile` ; on peut en plus invalider le cache ou refetch côté client pour que le plan affiché soit à jour sans F5).
- **Factures** : les utilisateurs téléchargent les factures depuis le portail Stripe ; pas de miroir dans l’app pour l’instant (optionnel).

---

## 4. Variables et configuration

- **Stripe** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_STUDIO_YEARLY`.
- **Webhook Stripe** : URL à configurer dans le tableau de bord Stripe (ex. `https://votredomaine.com/api/webhooks/stripe`) avec les événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
