# Livrables — SaaS Quota et préparation Stripe

## 1. Migration SQL

**Fichier :** `supabase/migrations/020_saas_plans_and_quota.sql`

- **profiles.plan** : `TEXT DEFAULT 'free'` avec contrainte `CHECK (plan IN ('free', 'pro', 'studio'))`.
- **profiles.storage_limit_bytes** : déjà présent ; la migration met à jour les lignes existantes et le trigger signup.
- **profiles.stripe_customer_id** : `TEXT` pour lier le client Stripe au profil (webhook).
- **get_storage_limit_for_plan(plan)** : retourne 1 Go (free), 10 Go (pro), 50 Go (studio).
- **handle_new_user** : à la création du profil, définit `plan = 'free'` et `storage_limit_bytes = 1 Go`.
- **get_designer_storage** : inclut désormais `messages.image_size_bytes` dans le total utilisé.
- **get_designer_storage_breakdown** : inclut le stockage chat (messages) dans le total et par projet (`chat_bytes`, `chat_size`).
- **check_project_storage_quota(project_id, file_size)** : RPC appelable uniquement par un membre du projet ; retourne `{ allowed, used, limit }` pour le designer du projet.

**À faire :** exécuter la migration dans le SQL Editor Supabase (ou via `supabase db push`).

---

## 2. API de vérification du quota

**Fichier :** `app/api/storage/check-quota/route.ts`

- **Méthode :** `POST`
- **Body :** `{ projectId: string, fileSize: number }`
- **Logique :** vérifie que l’utilisateur est authentifié, appelle la RPC `check_project_storage_quota`, retourne `{ allowed, used, limit }`.
- **Sécurité :** la RPC impose `is_project_member(project_id)` ; seuls les membres du projet peuvent obtenir une réponse valide.

---

## 3. Composants d’upload modifiés

Vérification du quota **avant** tout upload vers Supabase Storage :

| Composant | Fichier | Comportement |
|-----------|---------|--------------|
| Versions | `app/projects/[id]/ProjectVersions.tsx` | Appel à `POST /api/storage/check-quota` avec `projectId` et `file.size` ; si `allowed === false`, message « Quota de stockage dépassé. Passez au plan supérieur. » et pas d’upload. |
| Références | `app/projects/[id]/ProjectReferences.tsx` | Même logique ; état `error` ajouté pour afficher le message. |
| Chat (images) | `app/projects/[id]/ProjectChat.tsx` | Vérification du quota avec la taille du blob compressé avant upload ; message d’erreur si quota dépassé. |
| Assets (zone globale) | `components/UploadZone.tsx` | Vérification avec la **somme** des tailles des fichiers à envoyer ; un seul appel avant la boucle d’upload. |

La vérification est **côté serveur** (route API qui appelle la RPC).

---

## 4. Webhook Stripe

**Fichier :** `app/api/webhooks/stripe/route.ts`

- **Événements :** `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- **Vérification :** signature Stripe via `stripe.webhooks.constructEvent` (SDK `stripe` installé).
- **Env :** `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`.
- **Logique :**
  - **created / updated :** lecture du plan (par défaut via `subscription.metadata.plan`), mise à jour de `profiles.plan` et `profiles.storage_limit_bytes` pour le profil dont `stripe_customer_id = subscription.customer`.
  - **deleted :** passage en `plan = 'free'` et `storage_limit_bytes = 1 Go` pour ce profil.
- **Mapping :** free → 1 Go, pro → 10 Go, studio → 50 Go.

**À faire côté app :** lors de la création d’un client Stripe (checkout ou création manuelle), enregistrer son id dans `profiles.stripe_customer_id` pour que le webhook puisse mettre à jour le bon profil.

---

## 5. Sécurité

- **RPC**  
  - `check_project_storage_quota` : appelle `is_project_member(p_project_id)` ; en cas d’échec, lève « Access denied ».
- **API check-quota**  
  - Utilise le client Supabase de l’utilisateur (session) ; la RPC s’exécute avec ce contexte, donc seuls les membres du projet obtiennent une réponse.
- **Uploads Supabase**  
  - Les politiques RLS sur le bucket `assets` (lecture/écriture selon `is_project_member`) restent inchangées ; la vérification du quota en amont ne les remplace pas.

---

## 6. Récap des fichiers créés ou modifiés

| Fichier | Action |
|---------|--------|
| `supabase/migrations/020_saas_plans_and_quota.sql` | Créé |
| `app/api/storage/check-quota/route.ts` | Créé |
| `app/api/webhooks/stripe/route.ts` | Créé |
| `app/projects/[id]/ProjectVersions.tsx` | Modifié (check-quota avant upload) |
| `app/projects/[id]/ProjectReferences.tsx` | Modifié (check-quota + état error) |
| `app/projects/[id]/ProjectChat.tsx` | Modifié (check-quota pour images + état error) |
| `components/UploadZone.tsx` | Modifié (check-quota sur la somme des tailles) |
| `package.json` | Dépendance `stripe` ajoutée |

Exécuter la migration **020** puis configurer les variables d’environnement Stripe pour le webhook.
