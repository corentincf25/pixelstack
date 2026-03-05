# Notifications par email (mises à jour projet)

Quand une mise à jour a lieu sur un projet, l’**interlocuteur** (l’autre membre du projet) reçoit un email pour l’inviter à consulter l’app.

## Déclencheurs

Un email est envoyé lorsque :

- **Une nouvelle version** est déposée (graphiste) → le client (YouTuber) est notifié.
- **Des assets** sont ajoutés (client ou graphiste) → l’autre est notifié.
- **Un message** est envoyé dans le chat du projet → l’autre est notifié.
- **Une référence** est ajoutée (image ou lien YouTube) → l’autre est notifié.

## Contenu de l’email

- Sujet : `[thumb.io] À consulter : <titre du projet>`
- Corps : « Viens consulter l’application car [motif] » avec un lien vers la page d'accueil (dashboard) de l'app — plus fiable et moins bloqué par les antivirus.

Motifs utilisés :

- « Une nouvelle version de miniature a été déposée. »
- « Des assets ont été ajoutés au projet. »
- « Tu as reçu un nouveau message dans le projet. »
- « Une nouvelle référence ou inspiration a été ajoutée. »

## Configuration

### 1. Clé Resend

1. Crée un compte sur [resend.com](https://resend.com).
2. Crée une clé API (API Keys).
3. Dans ton `.env.local` :

   ```env
   RESEND_API_KEY=re_xxxxx
   ```

Sans `RESEND_API_KEY`, l’app ne plante pas : l’API renvoie simplement `ok` sans envoyer d’email.

### 2. Clé Supabase Service Role (pour récupérer l’email du destinataire)

L’API a besoin de l’email de l’interlocuteur. Elle utilise pour cela le **Service Role** Supabase (accès admin).

1. Dans le dashboard Supabase : **Settings** → **API**.
2. Copie la clé **service_role** (secret, à ne jamais exposer côté navigateur).
3. Dans `.env.local` :

   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

Sans cette clé, la notification email est ignorée (l’app continue de fonctionner).

### 3. Optionnel : expéditeur et URL de l’app

- **Expéditeur** : par défaut `thumb.io <onboarding@resend.dev>`. Pour utiliser ton domaine, vérifie-le dans Resend et définis :
  ```env
  RESEND_FROM=thumb.io <notifications@tondomaine.com>
  ```
- **URL des liens** : en production, définis `NEXT_PUBLIC_APP_URL=https://ton-app.com` pour que le lien « Ouvrir thumb.io (dashboard) » pointe vers ta prod.

## Technique

- Route API : `POST /api/notify-project-update` (body : `{ projectId, type }`).
- Côté serveur : récupération du projet, de l’interlocuteur, puis de son email via `auth.admin.getUserById()` (Service Role), envoi via Resend.
