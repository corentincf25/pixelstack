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

---

## Dépannage : pas de notifs push reçues

### 1. Côté OneSignal (Dashboard)

- **Settings → Platforms → Web** (ou **Configuration → Web Push**)  
  - **Site URL** : doit être exactement l’origine du site, ex. `https://pixelstack.fr` (sans slash final, sans `www` si tu n’utilises pas www).  
  - Si tu testes en local : `https://localhost:3000` ou `http://localhost:3000` (et dans le code on a déjà `allowLocalhostAsSecureOrigin` en dev).

- **Permission Prompt** (ta capture) : le « Push Slide Prompt » (1 pageview, 10 s) est le prompt OneSignal. Dans notre app on a désactivé l’auto-prompt (`autoPrompt: false`) et on utilise notre bandeau « Activer les notifications » dans le dashboard. Donc soit l’utilisateur clique sur « Activer » dans ce bandeau (puis « Autoriser » dans le navigateur), soit il n’aura jamais accordé la permission → pas de push.

- **Welcome Notification** : peut rester OFF. Ça n’empêche pas les push normales.

### 2. Côté utilisateur (navigateur)

- L’utilisateur doit **une fois** avoir cliqué sur « Activer » dans le bandeau Pixelstack (dashboard), puis **Autoriser** dans la fenêtre du navigateur. Si il a choisi « Bloquer », il ne recevra aucune push ; il faut réinitialiser la permission dans les paramètres du site (icône cadeneau dans la barre d’adresse).
- Les push web ne marchent qu’en **HTTPS** (sauf localhost). Vercel est en HTTPS, donc OK en prod.
- Vérifier que les **notifications** ne sont pas bloquées au niveau du navigateur (paramètres du site ou paramètres globaux).

### 3. Vérifications techniques

- **Variables d’environnement** (Vercel) : `NEXT_PUBLIC_ONESIGNAL_APP_ID` et `ONESIGNAL_REST_API_KEY` bien renseignées pour l’environnement (Production/Preview) utilisé.
- **Ciblage** : les push sont envoyées à l’`external_id` = ID Supabase de l’utilisateur. L’utilisateur doit s’être connecté au moins une fois pour que `OneSignal.login(user.id)` ait été appelé (sinon OneSignal ne sait pas à quel « appareil » envoyer).
- **Console navigateur** (F12) : pas d’erreur OneSignal au chargement de la page. Si le script OneSignal ne charge pas ou échoue, les push ne pourront pas être reçues.

### 4. Résumé checklist OneSignal

| Où | Quoi |
|----|------|
| **Settings → Platforms → Web** | **Site URL** = `https://ton-domaine.com` (ex. `https://pixelstack.fr`) |
| **Keys & IDs** | App ID et REST API Key utilisés dans Vercel |
| **Permission** | Utilisateur a cliqué « Activer » puis « Autoriser » dans le navigateur |
| **HTTPS** | Site servi en HTTPS (OK sur Vercel) |
