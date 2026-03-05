# Offres de stockage (Free 100 Mo / Payant 10 Go) et emails Resend

## 1. Offres de stockage : Free 100 Mo vs Payant 10 Go

L’app utilise la colonne **`profiles.storage_limit_bytes`** pour la limite de stockage par graphiste.

| Offre      | Valeur en base                    | Comportement |
|-----------|------------------------------------|--------------|
| **Gratuit** | `NULL` ou `104857600` (100 × 1024²) | 100 Mo (défaut) |
| **Payant (ex. 10 €)** | `10737418240` (10 × 1024³)        | 10 Go        |

Les RPC `get_designer_storage` et `get_designer_storage_breakdown` utilisent déjà cette colonne : si `storage_limit_bytes` est `NULL`, la limite affichée est **100 Mo**.

### Mise à jour en base (après paiement)

Quand un graphiste passe à l’offre payante (ex. 10 € = 10 Go), mettre à jour son profil :

```sql
-- Exemple : passer le graphiste à 10 Go
UPDATE public.profiles
SET storage_limit_bytes = 10 * 1024 * 1024 * 1024
WHERE id = 'uuid-du-graphiste';
```

Plus tard tu pourras :
- ajouter une table `subscriptions` ou `plans` (nom du plan, `storage_limit_bytes`, prix) ;
- ou une table `invoices` et dériver la limite du dernier paiement.

Pour l’instant, un simple `UPDATE profiles SET storage_limit_bytes = ...` suffit pour donner 10 Go à un graphiste.

### Côté interface

La page **Mon stockage** et la barre de stockage lisent déjà la limite via les RPC. Aucun changement nécessaire : dès que `storage_limit_bytes` est mis à jour en base, l’UI affiche la bonne limite (100 Mo ou 10 Go).

---

## 2. Resend : une seule clé API, envoi vers « l’autre » partie

Tu n’as **pas** besoin d’une clé API Resend par utilisateur ni par email.

- **Une seule clé API Resend** (`RESEND_API_KEY`) sert à toute l’app.
- Cette clé permet d’**envoyer des emails à n’importe quelle adresse** (le destinataire est choisi par le code, pas par la clé).

Dans thumb.io, les notifications sont envoyées **à l’interlocuteur du projet** :
- le **graphiste** fait une action (version, message, etc.) → on envoie l’email au **YouTuber** (client) ;
- le **YouTuber** fait une action → on envoie l’email au **graphiste**.

Le destinataire est donc toujours **l’autre partie** du projet, et son adresse est récupérée depuis Supabase Auth (et si besoin depuis la RPC `get_user_email` ou la table `profiles.email`).

### Pourquoi tous les emails partaient vers le graphiste ?

Si dans Resend tu ne vois que des envois vers une seule adresse (ex. le graphiste), c’est en général parce que :

1. **Seules les actions du YouTuber** ont déclenché une notification → le destinataire est le graphiste (comportement normal).
2. **L’email du YouTuber n’était pas trouvé** (Auth ne le renvoyait pas correctement) → l’API renvoyait une erreur et aucun email n’était envoyé au YouTuber.

Pour corriger le cas 2, l’app a été mise à jour pour :
- mieux extraire l’email depuis l’objet Auth (y compris OAuth / Google) ;
- utiliser en secours la colonne `profiles.email` si elle est renseignée ;
- utiliser la RPC **`get_user_email(target_id)`** qui lit l’email dans `auth.users`, pour être sûr d’avoir l’adresse du destinataire.

Après déploiement de la migration **016_plans_and_notify_email.sql** et redémarrage de l’app, les notifications devraient partir vers le bon destinataire (graphiste ou YouTuber selon qui a agi).

### Résumé Resend

| Question | Réponse |
|---------|--------|
| Une clé API par utilisateur ? | **Non.** Une seule clé pour toute l’app. |
| Qui reçoit l’email ? | Toujours **l’autre** partie du projet (celui qui n’a pas fait l’action). |
| Où est définie l’adresse ? | Supabase Auth + secours `profiles.email` + RPC `get_user_email`. |
