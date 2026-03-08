# Limite de fréquence des emails de notification (anti-spam / quota Resend)

Pour éviter de spammer les utilisateurs et de consommer trop vite le quota Resend (offre free), l’API **notify-project-update** applique un **rate limit** par projet et par destinataire.

## Comportement

- **Au plus 1 email** de notification est envoyé **par destinataire et par projet** sur une fenêtre de **15 minutes** (par défaut).
- Exemple : 5 messages envoyés en 2 min sur le même projet → le destinataire reçoit **1 email** (le premier), les 4 autres ne déclenchent pas d’envoi.
- Après 15 min sans envoi pour ce couple (projet, destinataire), la prochaine activité enverra à nouveau un email.

Cela réduit fortement le nombre d’emails envoyés tout en gardant une alerte régulière.

## Configuration

- **Valeur par défaut** : 15 minutes.
- **Variable d’environnement** (optionnel) : **`NOTIFY_EMAIL_THROTTLE_MINUTES`**  
  Exemple : `NOTIFY_EMAIL_THROTTLE_MINUTES=30` sur Vercel pour une fenêtre de 30 min.  
  (Min 1, max 1440 = 24 h.)

## Migration Supabase

La limite s’appuie sur la table **`notification_email_throttle`**. Il faut exécuter la migration **030** dans le SQL Editor Supabase :

**Fichier** : `supabase/migrations/030_notification_email_throttle.sql`

Sans cette migration, l’API envoie sans limite (comportement inchangé par rapport à avant).

## Réponse API

Quand un envoi est ignoré à cause du rate limit, la réponse contient par exemple :

- `sent: 0`
- `skipped: "rate_limited"`
- `details: "Au plus 1 email par 15 min par destinataire (1 ignoré(s))."`

En console navigateur : `[notify] Aucun email envoyé: rate_limited ...`
