# Dépannage du webhook Stripe

## 1. Cause probable des erreurs 100 %

Stripe affiche une erreur pour chaque tentative de webhook lorsque la **vérification de signature échoue** (réponse 400) ou lorsque le **serveur renvoie 5xx**.

### 1.1 Signature invalide (400)

La signature est calculée par Stripe sur le **body brut** de la requête. Si le body est modifié (par du middleware, un proxy ou un parsing JSON avant vérification), la vérification échoue.

**Corrections appliquées dans le code :**

- **Middleware** : les routes `/api/webhooks/*` sont **exclues** du middleware Supabase. Ainsi, aucune autre couche ne touche à la requête avant le handler du webhook, et le body reste brut.
- **Route webhook** : `runtime = "nodejs"` et `dynamic = "force-dynamic"` pour s’assurer que le handler s’exécute en Node avec le body brut.
- Le body est lu **uniquement** avec `request.text()` et passé tel quel à `stripe.webhooks.constructEvent(payload, signature, webhookSecret)`.

### 1.2 Secret webhook incorrect

Si **STRIPE_WEBHOOK_SECRET** ne correspond pas à l’endpoint configuré dans le Dashboard Stripe, la signature sera toujours invalide.

À vérifier :

1. **Stripe Dashboard** → **Developers** → **Webhooks** → clic sur ton endpoint.
2. **Signing secret** : clé qui commence par `whsec_...`.
3. **Environnement** : en **mode test**, utilise le secret de l’endpoint créé en mode test. En **production**, utilise le secret de l’endpoint en mode live.
4. **Stripe CLI** : si tu utilises `stripe listen --forward-to ...`, la CLI affiche un **secret temporaire** différent du Dashboard ; utilise ce secret **uniquement** pour les tests en local (et non sur Vercel).

Sur **Vercel** (ou ton hébergeur), la variable **STRIPE_WEBHOOK_SECRET** doit être exactement le **Signing secret** de l’endpoint qui pointe vers ton URL de prod (ex. `https://ton-app.vercel.app/api/webhooks/stripe`).

### 1.3 Supabase (503 / 500)

- **503** : **SUPABASE_SERVICE_ROLE_KEY** est absente ou incorrecte → le client admin est `null`, le webhook ne peut pas mettre à jour `profiles`.
- **500** : la mise à jour Supabase échoue (droits, connexion, etc.). Consulter les logs Vercel pour le détail de l’erreur.

---

## 2. Vérifications après déploiement

1. **Variables d’environnement** (Vercel) :
   - `STRIPE_WEBHOOK_SECRET` = Signing secret de l’endpoint (whsec_...)
   - `STRIPE_SECRET_KEY` = clé secrète Stripe (sk_test_... ou sk_live_...)
   - `SUPABASE_SERVICE_ROLE_KEY` = clé service_role du projet Supabase

2. **Endpoint dans Stripe** :
   - URL : `https://ton-domaine.com/api/webhooks/stripe`
   - Événements cochés : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

3. **Test** : déclencher un paiement test puis regarder :
   - **Stripe Dashboard** → Webhooks → ton endpoint → dernière tentative (succès ou erreur)
   - **Vercel** → Logs de la fonction → messages `[Stripe webhook]` (signature invalide, OK, ou erreur Supabase)

4. **Supabase** : après un paiement réussi, vérifier en base que `profiles.plan` et `profiles.storage_limit_bytes` sont bien mis à jour pour l’utilisateur concerné.

---

## 3. Résumé des modifications (code)

| Fichier | Modification |
|--------|---------------|
| `middleware.ts` | Exclusion de `api/webhooks` du matcher pour ne pas exécuter le middleware sur le webhook. |
| `app/api/webhooks/stripe/route.ts` | `runtime = "nodejs"`, `dynamic = "force-dynamic"`, vérification du header `stripe-signature`, logs d’erreur plus explicites (signature vs autre). |

Aucune modification de la logique métier (metadata, plan, storage, Supabase) : uniquement des réglages pour que la requête Stripe arrive intacte au webhook et que les erreurs soient plus faciles à diagnostiquer.
