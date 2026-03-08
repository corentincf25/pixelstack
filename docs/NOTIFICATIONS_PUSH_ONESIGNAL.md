# Notifications push navigateur (OneSignal)

Pixelstack envoie des **notifications push navigateur** en complément des emails (Resend) pour les événements projet : nouveau message, nouvelle version, nouvel asset, nouvelle référence, nouveau commentaire.

## Configuration

1. **Créer une app OneSignal** sur [onesignal.com](https://onesignal.com) (Web Push).
2. **Récupérer les clés** dans OneSignal → Settings → Keys & IDs :
   - **OneSignal App ID** → `NEXT_PUBLIC_ONESIGNAL_APP_ID`
   - **REST API Key** → `ONESIGNAL_REST_API_KEY`
3. **Variables d'environnement** (Vercel ou `.env.local`) :
   - `NEXT_PUBLIC_ONESIGNAL_APP_ID` : ID public de l’app (côté client pour le SDK).
   - `ONESIGNAL_REST_API_KEY` : clé secrète pour envoyer des notifications depuis le serveur.

Sans ces variables, les push sont désactivés (emails et reste de l’app inchangés).

## Comportement

- **Côté client** : le SDK OneSignal (v16) est chargé dans le layout. À la connexion Supabase, l’utilisateur est lié via `login(user.id)` (external_id = Supabase user id). Au déconnexion, `logout()` est appelé.
- **Côté serveur** : à chaque appel à `POST /api/notify-project-update` (message, version, asset, référence, commentaire), un push est envoyé à chaque autre membre du projet via l’API REST OneSignal (ciblage par `external_id`).
- **Prompt** : dans le dashboard, un bandeau propose « Activer les notifications » une fois (dismiss stocké en `localStorage`).

## Événements qui déclenchent un push

| Type        | Titre push (ex.)           | Message (ex.)                          |
|------------|----------------------------|----------------------------------------|
| message    | Nouveau message — [Projet] | Un utilisateur a envoyé un message…     |
| version    | Nouvelle version — [Projet] | Une nouvelle version est disponible.   |
| assets     | Nouveaux assets — [Projet] | Des assets ont été ajoutés au projet.  |
| reference  | Nouvelle référence — [Projet] | Une nouvelle référence a été ajoutée. |
| feedback    | Nouveau commentaire — [Projet] | Votre client a laissé un commentaire.  |

Le clic sur la notification ouvre l’URL du projet (`NEXT_PUBLIC_APP_URL/projects/[id]`).

## API optionnelle

- **POST /api/notifications/send** (authentifié)  
  Body : `{ userId, message, title?, projectId? }`  
  Envoie un push à un utilisateur (usage interne ou futur).

## Fichiers concernés

- `components/OneSignalProvider.tsx` : chargement du SDK, init, login/logout selon auth.
- `components/NotificationPrompt.tsx` : bandeau « Activer les notifications » (dashboard).
- `lib/onesignal-push.ts` : helper serveur `sendPushToUser()`.
- `app/api/notifications/send/route.ts` : route d’envoi manuel.
- `app/api/notify-project-update/route.ts` : envoi push en plus des emails.
