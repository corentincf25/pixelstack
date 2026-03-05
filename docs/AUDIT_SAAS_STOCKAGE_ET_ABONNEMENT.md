# Audit Pixelstack — Prêt pour SaaS (stockage et abonnement)

Ce document répond point par point à l’analyse du projet pour le transformer en SaaS avec abonnement et stockage limité.

---

## 1. Stockage utilisateur

### Ce qui existe déjà

| Élément | Statut | Détail |
|--------|--------|--------|
| **Limite taille max par fichier** | ✅ Partiel | Uniquement au niveau **bucket** Supabase : `file_size_limit = 10485760` (10 Mo) dans `004_storage_assets_bucket.sql`. Aucune limite côté app par plan. |
| **Enregistrement de la taille en base** | ✅ Oui | `assets.file_size`, `versions.file_size`, `project_references.file_size`, `messages.image_size_bytes` sont renseignés à l’upload (dans les composants). |
| **Suivi du stockage par utilisateur** | ✅ Oui (designer) | RPC `get_designer_storage()` et `get_designer_storage_breakdown()` : somme des `file_size` pour tous les projets où `designer_id = auth.uid()` (assets + versions + refs). Limite lue depuis `profiles.storage_limit_bytes`. |

### Ce qui manque ou est incomplet

1. **Quota non appliqué avant upload**  
   Aucun endroit ne fait :  
   `storage_used + file_size <= storage_limit`  
   avant d’autoriser l’upload. Les composants (ProjectVersions, ProjectReferences, ProjectAssets, ProjectChat, UploadZone) envoient directement vers Storage sans vérifier le quota.

2. **Images du chat exclues du quota**  
   Les messages ont `image_url` et `image_size_bytes`, mais `get_designer_storage()` et `get_designer_storage_breakdown()` ne somment **pas** `messages.image_size_bytes` pour les projets du designer. Le stockage affiché est donc sous-estimé et le quota contournable via le chat.

3. **Pas de limite “par fichier” selon le plan**  
   La limite 10 Mo est globale au bucket. Pour un SaaS, on peut vouloir une limite par fichier dépendant du plan (ex. Free 5 Mo, Pro 10 Mo).

**À ajouter :**

- Inclure la somme des `messages.image_size_bytes` (où le projet a pour designer `auth.uid()`) dans `get_designer_storage` et `get_designer_storage_breakdown`.
- Avant chaque upload (côté client ou de préférence côté API) : appeler une logique qui vérifie `(storage_used + file_size) <= storage_limit` et **bloque** l’upload si dépassement.
- Optionnel : stocker une limite max par fichier par plan et l’appliquer avant upload.

---

## 2. Structure de base de données

### Table `profiles`

| Champ souhaité | Existant | Remarque |
|----------------|----------|-----------|
| id | ✅ | Clé primaire, `auth.users(id)` |
| email | ✅ | Ajouté dans `016_plans_and_notify_email.sql` |
| role | ✅ | `designer` \| `youtuber` |
| plan | ❌ | N’existe pas. À ajouter pour Free / Pro / Studio. |
| storage_limit | ✅ | Présent sous le nom `storage_limit_bytes` (migration 008) |
| storage_used | ❌ | N’existe pas. Actuellement le “used” est **calculé** par les RPC (SUM des file_size). Pas de colonne dédiée. |

**Recommandation :**  
- Ajouter `plan TEXT` (ex. `'free' | 'pro' | 'studio'`) pour Stripe.  
- Garder le stockage utilisé **calculé** (RPC) plutôt qu’une colonne `storage_used` à synchroniser, sauf si tu veux des perfs très agressives sur un écran “compte”.

### Table `assets`

| Champ souhaité | Existant | Remarque |
|----------------|----------|-----------|
| id | ✅ | |
| user_id | ❌ | Pas de `user_id`. L’ownership est porté par le **projet** : le stockage est attribué au **designer** du projet (`projects.designer_id`), pas à l’uploader. C’est cohérent avec la règle métier “le graphiste héberge”. |
| project_id | ✅ | |
| file_url | ✅ | (chemin ou URL) |
| file_size | ✅ | Renseigné à l’upload |
| created_at | ✅ | |

**Conclusion :** Pas besoin de `user_id` sur `assets` si tu conserves la règle “quota = designer du projet”. Si demain tu veux un quota par utilisateur (client vs designer), il faudrait soit un `uploaded_by`, soit continuer à déduire via `projects.designer_id`.

### Tables `versions`, `project_references`, `messages`

- `versions` : `project_id`, `image_url`, `file_size`, etc. — cohérent avec un quota par designer (via projet).
- `project_references` : idem, `file_size` présent.
- `messages` : `image_size_bytes` présent mais **non inclus** dans les RPC de quota (voir §1).

### Synthèse schéma

- **À ajouter :** `profiles.plan` (ex. `TEXT CHECK (plan IN ('free','pro','studio'))` ou une table `plans` + clé étrangère).
- **Optionnel :** garder `storage_used` calculé ; sinon ajouter `profiles.storage_used_bytes` et un mécanisme de mise à jour (triggers ou job).

---

## 3. Upload workflow

### Workflow actuel

- **ProjectVersions** : vérification client-side uniquement (type image, max 10 Mo) → upload Storage → insert `versions` avec `file_size: file.size`. Aucune vérification de quota.
- **ProjectReferences** : upload → insert `project_references` avec `file_size`. Aucune vérification de quota.
- **ProjectAssets** (UploadZone) : upload → insert `assets` avec `file_size`. Aucune vérification de quota.
- **ProjectChat** : upload image compressée → Storage → insert `messages` avec `image_size_bytes`. Aucune vérification de quota.

Aucun flux ne :

1. Récupère la taille du fichier avant upload (elle est bien disponible côté client).
2. Vérifie `storage_used + file_size <= storage_limit`.
3. Bloque l’upload si dépassement.
4. Met à jour un “storage_used” (actuellement inutile car tout est calculé par RPC).

### Ce qu’il faut implémenter

1. **Avant tout upload qui compte dans le quota designer :**  
   - Déterminer le `designer_id` du projet (déjà connu dans la page).  
   - Appeler une API ou une RPC qui retourne `{ used, limit }` pour ce designer (ou pour l’utilisateur connecté si c’est toujours le designer qui “porte” le quota).  
   - Côté client : si `used + file.size > limit`, afficher une erreur et **ne pas** lancer l’upload.

2. **Côté serveur (recommandé pour la sécurité) :**  
   - Exposer un endpoint du type `POST /api/projects/[id]/storage/check-quota` avec `{ size: number }`.  
   - L’API vérifie que l’utilisateur est bien membre du projet, récupère le `designer_id`, calcule le `used` actuel (ou appelle une RPC), et répond `{ allowed: boolean, used, limit }`.  
   - Pour encore plus de robustesse : faire passer les uploads “sensibles” par une API Next.js qui vérifie le quota puis uploade vers Supabase (Storage) avec le client admin ou un signed upload. Ainsi le quota ne peut pas être contourné depuis le client.

3. **Cohérence :**  
   - Inclure les images du chat (`messages.image_size_bytes`) dans le calcul du `used` (voir §1).

---

## 4. Organisation du storage Supabase

### Structure actuelle

Dans le bucket **assets**, les chemins sont de la forme :

- `{project_id}/{filename}` (assets directs, UploadZone)
- `{project_id}/versions/{filename}` (versions)
- `{project_id}/refs/{filename}` (références)
- `{project_id}/chat/{uuid}.jpg` (images du chat)

Donc : **assets / `project_id` / [fichiers ou sous-dossiers]** — pas de `user_id` dans le chemin.

### Structure recommandée (dans ta spec)

Tu suggères :  
`assets / user_id / project_id / version1.png ...`

- **Avantage** : regroupement par utilisateur, potentiellement utile pour facturation ou purge par compte.
- **Inconvénient** : aujourd’hui le “propriétaire” du stockage est le **designer du projet**, pas l’uploader. Donc `user_id` dans le chemin devrait être le `designer_id` du projet, pas l’auteur de l’upload. Une structure `designer_id/project_id/...` serait cohérente avec `get_designer_storage()`.

### Recommandation

- **Option A (minimal)** : garder la structure actuelle `project_id/...`. Elle est simple et les RLS sont déjà basées sur `project_id` (premier segment du path). Aucune migration de fichiers nécessaire.
- **Option B** : migrer vers `designer_id/project_id/...` pour aligner le stockage avec la notion “quota = par designer”. Nécessite une migration des objets existants et une mise à jour des chemins dans les tables (`assets.file_url`, `versions.image_url`, `messages.image_url`, etc.) ainsi que des politiques Storage.

Pour un premier lancement SaaS, **Option A** suffit ; tu peux introduire Option B plus tard si besoin.

---

## 5. Préparation pour abonnement Stripe

### Plans visés

- **Free** : 100 Mo  
- **Pro** : 10 Go  
- **Studio** : 50 Go  

### Ce qui est prêt

- `profiles.storage_limit_bytes` : déjà utilisé par `get_designer_storage()`. En mettant à jour cette colonne (par défaut ou après paiement), la limite affichée et le calcul du “used” sont déjà pris en compte.
- `lib/storage-limits.ts` : `DEFAULT_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024` (100 Mo) — cohérent avec Free.

### Ce qui manque

1. **Colonne `plan` (ou équivalent)**  
   - Soit `profiles.plan` : `'free' | 'pro' | 'studio'`.  
   - Soit une table `subscriptions` (ou `user_plans`) avec `user_id`, `plan`, `stripe_subscription_id`, `current_period_end`, etc., et une vue ou une fonction qui dérive `storage_limit_bytes` du plan.

2. **Définition des limites par plan**  
   - Constante ou table `plans` du type :  
     - free → 100 Mo  
     - pro → 10 Go  
     - studio → 50 Go  
   - Au signup ou à la rétrograde Stripe : `UPDATE profiles SET plan = 'free', storage_limit_bytes = 100*1024**2 WHERE id = ...`.

3. **Vérification du quota avant upload**  
   - Comme en §3 : vérifier `used + file_size <= storage_limit` (et que `storage_limit` reflète bien le plan).

4. **Endpoints utiles pour Stripe**  
   - `GET /api/me` ou `GET /api/user/profile` : retourner `plan`, `storage_limit_bytes`, `storage_used` (via RPC) pour l’UI et Stripe Customer Portal.  
   - Webhook Stripe : `customer.subscription.updated` / `deleted` → mettre à jour `profiles.plan` et `profiles.storage_limit_bytes`.  
   - Optionnel : `POST /api/storage/check-quota` (ou par projet) pour le front avant upload.

### Proposition concrète

- **Migration SQL**  
  - `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free','pro','studio'));`  
  - S’assurer que `storage_limit_bytes` est renseigné (ex. 100 Mo pour `plan = 'free'` par défaut).  
  - Créer une fonction `get_storage_limit_for_plan(plan TEXT)` ou une table `plans(name, storage_limit_bytes)` et l’utiliser à la création/mise à jour de profil et dans le webhook Stripe.

- **Backend**  
  - Webhook Stripe qui, sur souscription/renouvellement/annulation, fait `UPDATE profiles SET plan = ..., storage_limit_bytes = ... WHERE id = ...`.  
  - Endpoint ou RPC “check quota” avant upload (et idéalement un upload côté serveur qui vérifie le quota avant d’écrire dans Storage).

- **Front**  
  - Avant chaque upload : appeler l’API de vérification du quota ; si `used + size > limit`, afficher un message clair (“Quota dépassé”, “Passez au plan Pro”, etc.) et ne pas uploader.

---

## 6. Sécurité

### RLS Supabase

- **projects** : lecture/mise à jour restreintes à `is_project_member(id)` (migration 019), donc client, designer et relecteurs. Pas de fuite entre projets.
- **briefs, assets, versions, messages, version_feedback, project_references** : politiques basées sur `is_project_member(project_id)`. Les relecteurs ont bien accès.
- **project_collaborators** : lecture pour les membres du projet ; ajout/suppression réservés au client ou au designer.
- **profiles** : lecture de son propre profil + profils des membres d’un projet commun (client, designer, relecteurs).
- **project_invites** : gestion (création/suppression) par le client ou le designer du projet ; lecture par token pour accepter l’invitation.

### Storage (bucket `assets`)

- **SELECT** : autorisé si `is_project_member(project_id)` où `project_id` est le premier segment du chemin. Donc seuls les membres du projet voient les fichiers.
- **INSERT** : même condition. Les relecteurs peuvent donc uploader (assets, versions, refs, chat) — à garder en tête pour le quota (toujours côté designer).

Aucune politique **UPDATE** ou **DELETE** sur `storage.objects` pour `assets` ; la suppression (purge) passe par l’API Next.js avec `createAdminClient()`, réservée au designer du projet.

### Synthèse sécurité

- Les utilisateurs ne voient que leurs projets (et ceux où ils sont relecteurs).  
- Les fichiers du bucket `assets` ne sont accessibles qu’aux membres du projet (client, designer, relecteurs).  
- Le quota et la logique “qui paie le stockage” (designer) sont bien côté métier ; il ne reste plus qu’à **appliquer** le quota avant upload (côté API) pour que la sécurité soit complète.

---

## 7. Conclusion et étapes pour commercialiser

### Déjà prêt pour un SaaS

- Enregistrement des tailles de fichiers en base (`assets`, `versions`, `project_references`, `messages.image_size_bytes`).
- Quota par designer via `profiles.storage_limit_bytes` et RPC `get_designer_storage` / `get_designer_storage_breakdown`.
- Limite par fichier au niveau bucket (10 Mo).
- RLS et Storage cohérents : accès par projet, pas de fuite entre projets.
- Affichage du stockage (barre, page “Mon stockage”) pour le designer.
- Purge du stockage par projet (designer uniquement) via l’API.

### À faire avant commercialisation

1. **Quota réellement bloquant**  
   - Inclure les images du chat dans `get_designer_storage` et `get_designer_storage_breakdown`.  
   - Avant chaque upload (côté client) : appeler une API ou RPC qui vérifie `used + file_size <= storage_limit` et refuser l’upload si dépassement.  
   - Idéal : vérification côté API d’upload (ou endpoint dédié “check-quota” + upload via API) pour éviter le contournement côté client.

2. **Schéma prêt Stripe**  
   - Ajouter `profiles.plan` (ou table abonnements) et une source de vérité pour les limites (constantes ou table `plans`).  
   - Définir les valeurs Free 100 Mo, Pro 10 Go, Studio 50 Go et les appliquer à `storage_limit_bytes` (onboarding + webhook Stripe).

3. **Webhook Stripe**  
   - Sur événements d’abonnement : mettre à jour `profiles.plan` et `profiles.storage_limit_bytes`.

4. **UX**  
   - Messages clairs quand le quota est dépassé (“Espace insuffisant”, “Passez au plan Pro”) et lien vers la page d’abonnement.

5. **Optionnel**  
   - Structure Storage `designer_id/project_id/...` si tu veux une organisation par compte designer.  
   - Colonne `storage_used` en cache sur `profiles` + trigger si tu veux éviter d’appeler la RPC à chaque affichage.

### Ordre recommandé des étapes

1. Migration : ajouter `profiles.plan`, et inclure `messages.image_size_bytes` dans les RPC de stockage.  
2. Créer une API `POST /api/projects/[id]/storage/check-quota` (body `{ size }`) utilisée par le front avant tout upload.  
3. Dans chaque composant d’upload (ProjectVersions, ProjectReferences, ProjectAssets, ProjectChat, UploadZone) : appeler cette API avant l’upload ; si quota dépassé, afficher un message et ne pas envoyer le fichier.  
4. (Optionnel) Créer une API d’upload serveur qui vérifie le quota puis uploade vers Supabase Storage.  
5. Intégrer Stripe : produits/prix Free, Pro, Studio ; webhook pour mettre à jour `plan` et `storage_limit_bytes`.  
6. Au signup ou à la première connexion, définir `plan = 'free'` et `storage_limit_bytes = 100 * 1024**2`.  
7. Page “Abonnement” ou “Paramètres” listant le plan actuel et le lien vers le Customer Portal Stripe.

Une fois ces points en place, le projet est prêt à être commercialisé avec des abonnements et un stockage limité par plan.
