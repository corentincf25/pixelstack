# Parrainage / Affiliation et coupons de réduction

Guide pour ajouter un **système de parrainage** (ou d’affiliation) et/ou des **coupons de réduction** (lancement, early adopters).

---

## 1. Coupons de réduction (Stripe) — idéal pour le lancement

Stripe gère nativement les **codes promo** et **coupons**. Pas besoin de table dédiée côté app pour le cas simple.

### 1.1 Créer un coupon / code promo dans Stripe

1. **Stripe Dashboard** → **Produits** → **Coupons** (ou **Promotion codes**).
2. **Créer un coupon** :
   - **Type** : pourcentage (ex. 20 %) ou montant fixe (ex. 10 €).
   - **Durée** : une fois, répété X mois, ou pour toujours.
   - Exemple lancement : « LANCEMENT20 » = 20 % de réduction le premier mois (ou les 3 premiers mois).
3. **Créer un code promotionnel** lié au coupon :
   - Code affiché à l’utilisateur : `LANCEMENT20`, `EARLY50`, etc.
   - Optionnel : date d’expiration, limite d’utilisation.

### 1.2 Utiliser le code dans ton app (Checkout Stripe)

Lors de la création de la **Checkout Session** (`/api/stripe/create-checkout-session`), tu peux passer un **promotion code** ou laisser l’utilisateur le saisir sur la page Stripe.

**Option A — Saisie côté Stripe (le plus simple)**  
Stripe Checkout permet par défaut de saisir un code promo. Aucun changement côté app si tu n’as pas désactivé cette option.

**Option B — Champ “code promo” sur ta page Facturation**  
Tu ajoutes un champ “Code promo” sur la page `/dashboard/billing` (ou sur la landing avant de cliquer sur Souscrire). Tu envoies ce code à l’API qui crée la session :

- **Stripe API** : `allow_promotion_codes: true` sur la Checkout Session (déjà possible), ou
- **Stripe API** : `discounts: [{ coupon: "id_du_coupon_stripe" }]` si tu veux pré-appliquer un coupon côté serveur à partir du code saisi.

Exemple côté API (si tu veux pré-appliquer un coupon à partir d’un code saisi) :

```ts
// Dans create-checkout-session, si le body contient promotionCodeId ou couponId
const session = await stripe.checkout.sessions.create({
  // ... existing config
  allow_promotion_codes: true,  // permet à l'utilisateur de saisir un code sur la page Stripe
  // OU pour pré-appliquer un coupon connu :
  // discounts: body.couponId ? [{ coupon: body.couponId }] : undefined,
});
```

**Recommandation lancement** : laisser `allow_promotion_codes: true` (si ce n’est pas déjà le cas) et communiquer les codes (ex. LANCEMENT20) par email / réseaux. L’utilisateur les saisit sur la page de paiement Stripe.

### 1.3 Vérifier que les codes sont bien pris en compte

- Dans Stripe Dashboard → **Paiements** : les montants doivent refléter la réduction.
- Les webhooks `checkout.session.completed` et `customer.subscription.updated` reçoivent bien le montant après remise ; ton app n’a en général rien à faire de plus (plan et stockage restent les mêmes).

---

## 2. Parrainage / Affiliation

Deux approches possibles : **simple** (liens de parrainage + suivi manuel ou basique) ou **avancée** (récompenses automatiques, crédits, commission).

### 2.1 Principe simple (liens de parrainage)

1. **Lien de parrainage** : `https://ton-app.com/signup?ref=CODE_PARRAIN`  
   - `CODE_PARRAIN` = identifiant unique du parrain (ex. `user_abc123` ou un slug).

2. **Au signup** :
   - Si l’utilisateur arrive avec `?ref=...`, tu stockes en base : “ce compte a été parrainé par CODE_PARRAIN” (table `referrals` ou colonne `referred_by` sur `profiles`).

3. **Récompense** (à définir) :
   - **Option manuelle** : tableau de bord ou export des parrainages ; tu offres un mois gratuit ou une réduction à la main.
   - **Option semi-auto** : quand un parrainé souscrit à un plan payant (webhook Stripe), tu crédites le parrain (ex. 1 mois gratuit) via une logique métier ou un coupon Stripe généré pour lui.

### 2.2 Ce qu’il faut ajouter dans ton projet (version minimale)

**Base de données (Supabase)**  
- Table `referrals` (ou colonnes sur `profiles`) :
  - `referrer_id` (UUID, celui qui parraine)
  - `referred_id` (UUID, celui qui s’est inscrit via le lien)
  - `created_at`
  - Optionnel : `rewarded_at` (date à laquelle tu as “récompensé” le parrain).

**Flux**  
1. **Page Signup** : lire `ref` dans l’URL (`?ref=xxx`). Si présent, le stocker en cookie ou en session (ou en BDD après création du compte).
2. **Après création du compte** (dans `auth/callback` ou juste après le signup) : si `ref` est présent et que le compte vient d’être créé, insérer une ligne dans `referrals` (referred_id = nouvel user, referrer_id = résolu à partir de `ref`).
3. **Résolution de `ref`** : si `ref` = `user_abc123`, tu fais un `select id from profiles where id = 'abc123'` ou où un champ dédié (ex. `referral_code`) = `ref`.

**Génération du lien parrain**  
- Dans l’app (ex. page Paramètres ou Dashboard) : “Mon lien de parrainage : `https://ton-app.com/signup?ref=MON_CODE`”.  
- `MON_CODE` peut être `user.id` (UUID) ou un code court généré (ex. `profiles.referral_code`).

### 2.3 Récompense automatique (optionnel)

- **Quand un parrainé souscrit** (webhook Stripe `checkout.session.completed`) : tu vérifies si le `client_reference_id` ou un metadata contient un `referred_id` ; tu regardes dans `referrals` qui est le parrain ; tu peux alors :
  - Créer un coupon Stripe “1 mois gratuit” et l’envoyer au parrain par email, ou
  - Mettre à jour son abonnement (avancé) ou lui attribuer un crédit dans ta BDD.
- Pour rester simple au lancement : récompense manuelle (export des parrainages + envoi de codes promo aux parrains).

### 2.4 Affiliation (commission)

Si tu veux un vrai programme d’affiliation (commission par vente) :
- Soit utiliser un service dédié (ex. **PartnerStack**, **FirstPromoter**, **Rewardful**) qui s’intègre à Stripe et gère liens, suivi et paiement des commissions.
- Soit construire toi-même : suivi des conversions (parrain souscrit → événement dans Stripe), calcul de commission, tableau de bord “affiliés” et virements manuels ou via Stripe Connect.

---

## 3. Résumé des étapes concrètes

### Coupons (lancement) — à faire en premier

1. Stripe Dashboard → **Coupons** → créer un coupon (ex. 20 % ou 10 €).
2. **Promotion codes** → créer un code (ex. `LANCEMENT20`) lié au coupon.
3. Dans ton API de création de Checkout Session : activer `allow_promotion_codes: true` si ce n’est pas déjà fait.
4. Communiquer le code à tes early adopters (email, réseaux).

### Parrainage (version minimale)

1. Ajouter une table `referrals` (ou colonnes) et éventuellement `profiles.referral_code`.
2. Sur la page signup, lire `?ref=...` et le conserver (cookie/session ou state).
3. Après création du compte (callback ou post-signup), enregistrer le parrainage en BDD.
4. Page “Mon lien de parrainage” dans l’app avec copie du lien.
5. Récompense : manuelle au début (export + codes promo), puis automatisation si besoin.

Si tu veux, on peut détailler la modification exacte de `create-checkout-session` (allow_promotion_codes) et le schéma SQL minimal pour `referrals` + le flux signup avec `ref`.
