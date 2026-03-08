# Notifications email (Resend) — dépannage

Si les emails de notification (nouveau message, nouvelle version, nouvel asset) ne sont pas reçus, vérifier les points suivants.

## 0. Vérifier que la clé Resend est bien prise en compte

Une fois connecté à l’app, ouvre (ou appelle en GET) :

**`https://ton-domaine.com/api/notify-project-update/check`**

(ex. `https://pixelstack.fr/api/notify-project-update/check`)

La réponse indique :
- **`resendConfigured: true`** → la variable `RESEND_API_KEY` est bien lue en production. Si les emails ne partent toujours pas, voir les logs Vercel et la section « Domaine d’envoi » ci‑dessous.
- **`resendConfigured: false`** → la clé n’est pas disponible côté serveur : ajoute `RESEND_API_KEY` dans **Vercel → projet → Settings → Environment Variables**, pour l’environnement **Production**, puis redéploie.

## 1. Variables d’environnement (Vercel)

- **`RESEND_API_KEY`** : obligatoire. Clé API Resend (créée sur [resend.com](https://resend.com) → API Keys). **Nom exact** : `RESEND_API_KEY`. Sans cette variable, l’API renvoie `{ ok: true, sent: 0, skipped: "no_resend_key" }` et aucun email n’est envoyé.
- **`RESEND_FROM`** (optionnel) : expéditeur, ex. `Pixelstack <noreply@pixelstack.fr>`. Si absent, l’app utilise `Pixelstack <onboarding@resend.dev>` (domaine de test Resend).
- **`NEXT_PUBLIC_APP_URL`** : utilisé pour le lien « Voir la conversation » dans l’email (ex. `https://pixelstack.fr`).

Après modification des variables, **redéployer** le projet sur Vercel.

## 2. Domaine d’envoi (Resend)

- Si vous utilisez **`onboarding@resend.dev`** : pas de configuration domaine, mais Resend peut limiter l’envoi (quota, réputation).
- Si vous utilisez **votre domaine** (ex. `noreply@pixelstack.fr`) : dans Resend Dashboard → Domains, **vérifier le domaine** (enregistrements DNS). Tant que le domaine n’est pas vérifié, les envois depuis ce domaine peuvent échouer.

## 3. Où sont déclenchées les notifications ?

Les appels à `notifyProjectUpdate(projectId, type)` sont faits côté **client** après une action réussie :

- **Message** : `ProjectChat.tsx` (envoi d’un message).
- **Version** : `ProjectVersions.tsx` (dépôt d’une version).
- **Assets** : `UploadZone.tsx` (upload d’assets).
- **Référence** : `ProjectReferences.tsx` (ajout d’une référence).

L’API **POST /api/notify-project-update** envoie l’email à **tous les autres membres du projet** (client, graphiste, relecteurs), pas à l’auteur de l’action.

## 4. Logs serveur (Vercel)

Dans **Vercel → projet → Logs** (ou Runtime Logs), filtrer sur `notify-project-update` ou consulter les logs après avoir déclenché une action (message, version, asset) :

- **`Appel reçu`** : l’API est bien appelée (projectId, type).
- **`RESEND_API_KEY manquant`** : la variable n’est pas définie en prod → ajouter `RESEND_API_KEY` pour **Production** et redéployer.
- **`Aucun destinataire`** : seul l’acteur est membre du projet (ex. pas encore de client ou de graphiste assigné).
- **`Email introuvable pour l'utilisateur`** : l’email du destinataire n’a pas été trouvé (Auth, `profiles.email`, RPC `get_user_email`). Vérifier que le compte destinataire a bien un email (connexion email ou Google).
- **`Resend error:`** : erreur renvoyée par Resend (domaine non vérifié, quota, adresse refusée, etc.). Vérifier le domaine d’envoi dans Resend (section 2).
- **`Email envoyé à ... id: ...`** : envoi réussi. Dans Resend Dashboard → Logs, l’email doit apparaître.

## 5. Réponse de l’API (débogage)

L’API **POST /api/notify-project-update** renvoie toujours un JSON avec `ok: true` et :
- **`sent: 0`** : aucun email envoyé. Regarder **`skipped`** et **`details`** :
  - `no_resend_key` : clé Resend absente → voir section 0 et 1.
  - `no_recipients` : pas d’autre membre sur le projet.
  - `no_email_for_recipient` : email du destinataire introuvable (Auth/profiles).
  - `resend_error` : Resend a refusé l’envoi (voir `details` et les logs Vercel).
- **`sent: 1`** (ou plus) : au moins un email envoyé. S’il n’arrive pas, vérifier spam et domaine d’envoi (section 2).

En production, la console navigateur (F12) affiche un avertissement si aucun email n’a été envoyé : `[notify] Aucun email envoyé: <skipped> <details>`.

## 6. Récapitulatif

1. Appeler **/api/notify-project-update/check** (connecté) pour confirmer que **RESEND_API_KEY** est lue.
2. Vérifier **RESEND_API_KEY** et **RESEND_FROM** sur Vercel (Environment Variables, **Production**).
3. Redéployer après toute modification de variables.
4. Si domaine personnalisé : vérifier le domaine dans Resend.
5. Consulter les **logs Vercel** pour voir si l’API est appelée et si Resend renvoie une erreur.
6. S’assurer que le **destinataire** a un autre compte que l’acteur et que son email est connu (connexion par email ou Google).
