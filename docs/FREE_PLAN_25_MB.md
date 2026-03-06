# Plan Free : 25 Mo de stockage

Le plan gratuit est passé de **100 Mo** à **25 Mo** partout dans l’application.

---

## 1. Fichiers modifiés

| Fichier | Modification |
|--------|---------------|
| **`app/api/webhooks/stripe/route.ts`** | `PLAN_TO_BYTES.free` = `25 * 1024 * 1024`. Commentaires mis à jour (25 Mo). |
| **`app/api/stripe/sync-plan/route.ts`** | `PLAN_TO_BYTES.free` = `25 * 1024 * 1024`. |
| **`lib/storage-limits.ts`** | `DEFAULT_STORAGE_LIMIT_BYTES` = `25 * 1024 * 1024` (25 Mo). |
| **`app/dashboard/billing/page.tsx`** | `PLAN_DESC.free` = "25 Mo de stockage, jusqu'à 3 projets.". |
| **`components/landing/Pricing.tsx`** | Feature plan Gratuit : "25 Mo de stockage". |
| **`components/landing/FAQ.tsx`** | Réponse FAQ : "25 Mo de stockage". |
| **`app/legal/terms/page.tsx`** | Mentions "25 Mo" pour le plan Gratuit. |
| **`docs/FACTURATION_ET_ABONNEMENT.md`** | free = 25 Mo. |
| **`supabase/migrations/023_free_plan_25_mb.sql`** | Nouvelle migration : `get_storage_limit_for_plan('free')` → 25 Mo, `check_project_storage_quota` utilise cette limite quand pas de designer, UPDATE des profils free/NULL. |

---

## 2. Base de données (Supabase)

### Exécuter la migration

Dans le **SQL Editor** Supabase, exécuter le contenu de :

**`supabase/migrations/023_free_plan_25_mb.sql`**

Cela :

1. Met à jour la fonction **`get_storage_limit_for_plan`** : `'free'` retourne **25 Mo** (26 214 400 octets).
2. Met à jour **`check_project_storage_quota`** : quand le projet n’a pas encore de designer, la limite renvoyée est `get_storage_limit_for_plan('free')` (25 Mo) au lieu de 100 Mo en dur.
3. Met à jour **tous les profils** avec `plan = 'free'` ou `plan IS NULL` : `storage_limit_bytes = get_storage_limit_for_plan('free')` (25 Mo).

### Mise à jour manuelle des utilisateurs existants (si la migration a déjà été jouée partiellement)

Si tu as déjà appliqué une partie de la migration et que tu veux seulement aligner les profils free :

```sql
UPDATE public.profiles
SET storage_limit_bytes = public.get_storage_limit_for_plan('free')
WHERE plan = 'free' OR plan IS NULL;
```

---

## 3. Nouveaux utilisateurs

Le trigger **`handle_new_user`** (défini dans les migrations précédentes) appelle `get_storage_limit_for_plan('free')` pour définir `storage_limit_bytes` à la création du profil. Après application de la migration 023, les **nouveaux comptes** reçoivent donc **25 Mo** automatiquement.

---

## 4. Quota et affichage

- **Vérification de quota** : l’API `/api/storage/check-quota` et la RPC **`check_project_storage_quota`** utilisent la limite du profil (ou `get_storage_limit_for_plan('free')`). Après migration, la limite free est 25 Mo partout.
- **Page Facturation** : affiche "25 Mo de stockage" pour le plan Gratuit et la valeur réelle (utilisé / limite) depuis `profiles.storage_limit_bytes`.
- **Dashboard / widget stockage / barre de stockage** : lisent la limite depuis la base ou `DEFAULT_STORAGE_LIMIT_BYTES` (25 Mo). Aucun changement de code supplémentaire : l’affichage suit la nouvelle limite.

---

## 5. Plans Pro et Studio

**Aucune modification** : Pro = 10 Go, Studio = 50 Go (code et migration inchangés pour ces plans).
