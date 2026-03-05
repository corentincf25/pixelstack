# Nettoyer la base pour retester avec le même email

Pour retester le parcours d’inscription / connexion avec **le même email** (ou supprimer toutes les données de test), suis ces étapes.

---

## Étape 1 — Nettoyer les données de l’app (SQL)

Dans Supabase : **SQL Editor** → **New query**.

Copie-colle le script ci-dessous puis exécute-le (**Run**). Cela supprime toutes les données des tables publiques (invitations, messages, versions, assets, briefs, projets, profils) **sans** toucher aux comptes dans Authentication.

```sql
-- Ordre important à cause des clés étrangères
DELETE FROM public.project_invites;
DELETE FROM public.messages;
DELETE FROM public.versions;
DELETE FROM public.assets;
DELETE FROM public.briefs;
DELETE FROM public.projects;
DELETE FROM public.profiles;
```

Tu peux aussi utiliser le fichier `supabase/scripts/clean_test_data.sql` s’il existe (même contenu).

---

## Étape 2 — Supprimer les utilisateurs (pour réutiliser le même email)

Pour pouvoir **réinscrire** avec le même email, il faut supprimer le compte dans Supabase :

1. Dans Supabase : **Authentication** → **Users**.
2. Repère l’utilisateur à supprimer (par email).
3. Clique sur les **trois points** (⋮) à droite de la ligne → **Delete user**.
4. Confirme.

Après ça, tu peux :
- T’inscrire à nouveau avec ce même email.
- Refaire le parcours : signup → onboarding (rôle) → dashboard → création de projet → invitation.

---

## Récap

| Objectif | Action |
|----------|--------|
| Vider les projets / messages / invites | Exécuter le SQL de l’étape 1 |
| Réutiliser le même email pour s’inscrire | Étape 1 + Étape 2 (supprimer l’utilisateur dans Auth > Users) |

**Attention** : supprimer un utilisateur dans Authentication supprime aussi sa ligne dans `profiles` (à cause de la clé étrangère `ON DELETE CASCADE`). Si tu as déjà exécuté le SQL de l’étape 1, les profils sont déjà vides ; sinon, la suppression du user nettoiera aussi son profil.

---

## Limite « email rate limit exceeded »

Si tu vois **email rate limit exceeded** à l’inscription ou à la connexion par email, c’est la **limite anti-spam de Supabase** : trop de tentatives (inscription / connexion) en peu de temps.

- **À faire** : attendre environ 1 heure, ou utiliser **Continuer avec Google** pour te connecter sans attendre.
- L’app affiche maintenant un message en français qui explique ça et propose Google en alternative.
