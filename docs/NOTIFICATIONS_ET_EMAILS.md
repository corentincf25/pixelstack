# Notifications : emails + in-app

## Ce qui a été mis en place

### 1. Emails (Resend)

L’API **POST /api/notify-project-update** envoie un email à **l’autre partie** du projet (YouTuber ou graphiste) quand :
- une nouvelle version est déposée,
- des assets sont ajoutés,
- un message est envoyé dans le chat,
- une référence est ajoutée.

**Récupération de l’email du destinataire (dans l’ordre) :**
1. **RPC `get_user_email`** : lecture directe dans `auth.users` (le plus fiable).
2. **Colonne `profiles.email`** : mise à jour automatiquement à chaque visite (connexion) via `SyncProfileEmail`.
3. **Auth API** `getUserById` + extraction depuis `identities` / `user_metadata`.

Pour que les emails partent bien vers **tous** les comptes (YouTuber et graphiste) :
- La **migration 016** doit être appliquée (RPC `get_user_email` + colonne `profiles.email`).
- Chaque utilisateur doit **se connecter au moins une fois** après la mise à jour : son email est alors enregistré dans `profiles.email`.

### 2. Notifications in-app (toujours visibles)

Sur le **dashboard**, en haut :
- Si tu as des **nouvelles versions**, **nouveaux messages** ou **retours** non lus, un bandeau **« Vous avez des mises à jour »** s’affiche.
- Texte explicite : **« Votre mini est prête »** pour les nouvelles versions, **« X nouveau(x) message(s) »**, **« X retour(s) à consulter »**.
- Un clic ouvre directement le projet concerné.

Même sans email, les clients et graphistes voient donc les mises à jour dès qu’ils ouvrent l’app.

### 3. Pastilles sur les projets

Sur la page **Projets** et sur les **cartes projet** du dashboard, des pastilles indiquent le nombre de nouveaux messages / nouvelles versions / retours par projet.

---

## Si les emails ne partent toujours pas vers l’autre compte

1. **Vérifier la migration 016**  
   Exécuter dans le SQL Editor Supabase le contenu de **`supabase/migrations/016_plans_and_notify_email.sql`** (création de `get_user_email` et colonne `profiles.email`).

2. **Synchroniser les emails des comptes existants**  
   Chaque compte (YouTuber et graphiste) doit **ouvrir l’app au moins une fois** (dashboard, projets ou paramètres) pour que `SyncProfileEmail` enregistre son email dans `profiles.email`.

3. **Resend : domaine et expéditeur**  
   Avec **`onboarding@resend.dev`** (compte de test), certains envois peuvent être limités. Pour envoyer à **n’importe quelle adresse** en production :
   - Vérifier **ton propre domaine** dans [Resend → Domains](https://resend.com/domains).
   - Définir **`RESEND_FROM`** dans `.env` avec ce domaine, ex. : `Mon App <notifications@tondomaine.com>`.

4. **Spam / boîte de réception**  
   Vérifier les dossiers **Spam** et **Courrier indésirable** du compte qui ne reçoit pas.

5. **Logs côté app**  
   En cas d’erreur, les logs serveur (terminal ou logs Vercel) affichent **« Notification email: aucun email trouvé pour destinataire »** ou **« Resend error »** selon le blocage.

---

## En résumé

- **Notifications in-app** : bandeau dashboard + pastilles sur les projets → tout le monde est notifié en ouvrant l’app.
- **Emails** : priorité à la RPC + `profiles.email` (sync à la connexion) pour que l’autre compte reçoive bien le mail ; en prod, vérifier le domaine Resend et `RESEND_FROM`.
