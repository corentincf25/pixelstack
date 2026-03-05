# thumb.io — Guide de setup pas à pas

Ce guide te permet de tout configurer from scratch : Supabase, base de données, auth (email + Google), et l’app.

---

## Prérequis

- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte Google (pour la connexion “Google” plus tard)
- Node.js installé sur ta machine
- Le projet thumb.io ouvert dans ton éditeur (Cursor / VS Code)

---

## Partie 1 — Supabase : projet et base de données

### Étape 1.1 — Ouvrir ton projet Supabase

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Connecte-toi.
3. Clique sur ton projet (celui dont l’URL est dans ton `.env.local`, par ex. `bvjwdwtmuieplgxrpeip`).
4. Dans le menu de gauche, clique sur **SQL Editor**.

Tu vas exécuter du SQL ici deux fois : d’abord les tables de base, puis les règles de sécurité (RLS).

---

### Étape 1.2 — Créer les tables de base (si ton projet est neuf)

Si ton projet Supabase est **tout neuf** et que tu n’as jamais créé les tables `projects`, `assets`, `versions`, `messages` :

1. Dans le **SQL Editor**, clique sur **New query**.
2. Ouvre le fichier `supabase/migrations/000_create_base_tables.sql` dans ton projet.
3. **Copie tout son contenu** et colle-le dans l’éditeur SQL Supabase.
4. Clique sur **Run** (ou Ctrl+Entrée).
5. En bas, tu dois voir un message du type “Success. No rows returned”. C’est bon.

Si tu as déjà ces tables (projet existant), **tu peux sauter cette étape**.

---

### Étape 1.3 — Appliquer le schéma et les règles RLS

1. Toujours dans le **SQL Editor**, clique à nouveau sur **New query** (nouvelle requête).
2. Ouvre le fichier `supabase/migrations/001_schema_and_rls.sql` dans ton projet.
3. **Copie tout son contenu** et colle-le dans l’éditeur SQL.
4. Clique sur **Run**.
5. Vérifie qu’il n’y a pas d’erreur en rouge. Si tout est vert / “Success”, c’est bon.

Tu as maintenant : `profiles`, `projects`, `briefs`, `assets`, `versions`, `messages`, `project_invites`, et les politiques RLS qui protègent les données.

### Étape 1.4 — Fonction d’acceptation d’invitation

Pour que le lien d’invitation fonctionne (quand le graphiste ou le YouTuber ouvre le lien avec son compte), il faut une fonction côté base de données :

1. Dans le **SQL Editor**, **New query**.
2. Ouvre le fichier `supabase/migrations/002_accept_invite_function.sql` et copie tout son contenu.
3. Colle dans l’éditeur et clique sur **Run**.

Sans cette étape, l’autre partie ne pourra pas rejoindre le projet en cliquant sur le lien.

### Étape 1.5 — Suppression de projet et Realtime (chat)

Exécute `supabase/migrations/003_delete_request_and_realtime.sql` (New query, copier-coller, Run). Cela ajoute la suppression à l’accord des deux parties et la synchro temps réel du chat. En cas d’erreur « table already in publication », active Realtime sur `messages` dans Database → Replication.

### Étape 1.6 — Bucket Storage pour les assets

Exécute `supabase/migrations/004_storage_assets_bucket.sql` (New query, copier-coller, Run). Cela crée le bucket **assets** et les politiques pour déposer et télécharger les fichiers.

### Étape 1.7 — Nom des versions (optionnel)

Exécute `supabase/migrations/005_versions_name.sql` pour permettre au graphiste de nommer chaque version (ex. V1, V2).

### Étape 1.8 — Commentaires sur les versions et références (inspirations)

Exécute `supabase/migrations/006_version_feedback_and_references.sql`. Cela crée :
- **version_feedback** : le client peut commenter sous chaque version (ce qu’il aime, retours).
- **project_references** : images de ref et liens YouTube dans la section Inspirations & Références.

### Étape 1.9 — Réponses aux commentaires (thread)

Exécute `supabase/migrations/007_version_feedback_parent.sql`. Cela ajoute la colonne **parent_id** à `version_feedback` pour permettre de répondre à un commentaire.

### Étape 1.10 — Stockage (designer)

Exécute `supabase/migrations/008_storage_usage.sql`. Cela ajoute **file_size** aux versions, **storage_limit_bytes** au profil (optionnel), et la fonction **get_designer_storage()** pour afficher la barre de stockage (utilisé / limite, ex. 10 Go) dans l’interface graphiste. **Les valeurs affichées sont réelles** : le « utilisé » vient des tables `assets` et `versions`, la limite vient de `profiles.storage_limit_bytes` ou 10 Go par défaut. Voir `docs/STOCKAGE_REEL.md`.

### Étape 1.11 — Notifications in-app (pastilles)

Exécute `supabase/migrations/009_user_project_read.sql`. Crée la table **user_project_read** et les RPC pour les pastilles « nouveaux messages » / « nouvelles versions » (accueil, page Projets, sidebar).

---

## Partie 2 — Authentification Supabase

### Étape 2.1 — Vérifier l’auth par email

1. Dans le menu de gauche Supabase : **Authentication** → **Providers**.
2. Clique sur **Email**.
3. Vérifie que **Enable Email provider** est activé (oui par défaut).
4. Tu peux laisser “Confirm email” désactivé en dev pour tester sans vérifier l’email.
5. Clique sur **Save** si tu as changé quelque chose.

Tu pourras t’inscrire et te connecter avec **email + mot de passe** dans l’app.

---

### Étape 2.2 — Activer la connexion Google (optionnel mais recommandé)

#### A — Créer des identifiants Google

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. En haut à gauche : **Sélectionner un projet** → **Nouveau projet**.
3. Donne un nom (ex. “Mini Maker”)   → **Créer**.
4. Une fois le projet créé, va dans **APIs et services** → **Identifiants** (menu de gauche).
5. Clique sur **+ Créer des identifiants** → **ID client OAuth**.
6. Si on te demande de configurer l’écran de consentement :
   - Type d’application : **Externe** → **Créer**.
   - **Nom de l’application** : mets **thumb.io** (pour que l’écran “Se connecter avec Google” affiche thumb.io au lieu de l’URL Supabase).
   - **Adresse e-mail d’assistance** : ton email.
   - (Optionnel) **Logo** : image 120×120 px.
   - Enregistre et reviens à “Créer un ID client”.
7. Type d’application : **Application Web**.
8. Donne un nom (ex. “thumb.io Web”).
9. Dans **URI de redirection autorisés**, clique sur **+ Ajouter un URI** et mets exactement (en remplaçant par l’URL de ton projet Supabase) :
   ```text
   https://bvjwdwtmuieplgxrpeip.supabase.co/auth/v1/callback
   ```
   (Tu trouves cette URL dans Supabase : **Project Settings** → **API** → “Project URL”.)
10. Clique sur **Créer**.
11. **Copie** l’**ID client** et le **Secret client** (tu en auras besoin à l’étape suivante).

#### B — Brancher Google dans Supabase

1. Retourne dans Supabase : **Authentication** → **Providers**.
2. Clique sur **Google**.
3. Active **Enable Sign in with Google**.
4. Colle l’**ID client** et le **Secret client** Google.
5. Clique sur **Save**.

Après ça, le bouton “Continuer avec Google” fonctionnera dans ton app. Pour que l’écran Google affiche bien **thumb.io** (et pas seulement l’URL Supabase), vérifie l’écran de consentement OAuth (voir `docs/GOOGLE_OAUTH_ECRAN_THUMB.IO.md`).

---

### Étape 2.3 — URLs de redirection (très important)

1. Dans Supabase : **Authentication** → **URL Configuration**.
2. **Site URL** : mets l’URL de ton app.
   - En local : `http://localhost:3000`
   - En prod plus tard : `https://ton-domaine.com`
3. **Redirect URLs** : ajoute une ligne par URL autorisée, par ex. :
   - `http://localhost:3000/auth/callback`
   - Si tu as déjà un domaine de prod : `https://ton-domaine.com/auth/callback`
4. Clique sur **Save**.

Sans ça, après la connexion Google, Supabase ne pourra pas renvoyer l’utilisateur vers ton app.

---

## Partie 3 — Variables d’environnement (ton app)

Tu as déjà un fichier `.env.local` à la racine du projet avec :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

1. Ouvre `.env.local` et vérifie que les valeurs correspondent bien à ton projet Supabase.
2. Où les trouver : Supabase → **Project Settings** (icône engrenage) → **API** :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** (clé publique) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Sauvegarde le fichier. **Ne commite pas `.env.local`** (il doit rester local).

Aucune autre variable n’est nécessaire pour l’auth (Google est configuré côté Supabase).

---

## Partie 4 — Lancer l’app et tester

### Étape 4.1 — Installer les dépendances et lancer le serveur

1. Ouvre un terminal à la racine du projet (`mini-maker-app`).
2. Installe les dépendances si ce n’est pas déjà fait :
   ```bash
   npm install
   ```
3. Lance l’app :
   ```bash
   npm run dev
   ```
4. Ouvre un navigateur sur [http://localhost:3000](http://localhost:3000).

Tu devrais être redirigé vers **/login** (car tu n’es pas encore connecté).

---

### Étape 4.2 — Tester l’inscription et l’onboarding

1. Clique sur **S’inscrire** (ou va sur [http://localhost:3000/signup](http://localhost:3000/signup)).
2. Remplis :
   - Nom (optionnel)
   - Email
   - Mot de passe (au moins 6 caractères)
3. Clique sur **S’inscrire**.
4. Si la confirmation email est activée : tu seras redirigé vers une page “Vérifie ta boîte mail”, puis après avoir cliqué sur le lien tu pourras te connecter et faire l’onboarding. Sinon tu arrives directement sur **/onboarding** : choisis **Graphiste** ou **YouTuber**.
5. Clique sur **Continuer**.
6. Tu devrais arriver sur le **Dashboard** avec “Mes projets”.

Si tout se passe bien, la base (profiles, rôle) et l’auth email fonctionnent.

---

### Étape 4.3 — Tester la création de projet et l’invitation

1. Sur le Dashboard, clique sur **Créer un projet**.
2. Donne un nom au projet (ex. “Test thumbnail”) → **Create**.
3. Un **lien d’invitation** s’affiche (ex. `http://localhost:3000/invite/xxxx-xxxx-...`).
4. Clique sur **Copy** pour copier le lien.
5. Ouvre une **fenêtre de navigation privée** (ou un autre navigateur).
6. Colle le lien dans la barre d’adresse.
7. Tu seras redirigé vers **/login** (car pas connecté dans cette fenêtre). Connecte-toi avec un **autre compte** (ou crée-en un), puis choisis l’autre rôle à l’onboarding (si tu étais Designer, prends YouTuber, ou l’inverse).
8. Après l’onboarding, **récupère à nouveau le lien d’invitation** depuis le premier compte (Dashboard → le même projet ou recrée un projet et copie le lien).
9. Dans la fenêtre privée (second compte), ouvre ce lien. Tu devrais rejoindre le projet et être redirigé vers la page du projet.

Si ça marche, le flux “création de projet + invitation” est bon.

---

### Étape 4.4 — Tester Google (si tu l’as configuré)

1. Déconnecte-toi (ou ouvre une fenêtre privée).
2. Va sur [http://localhost:3000/login](http://localhost:3000/login).
3. Clique sur **Continue with Google**.
4. Choisis un compte Google. Tu devrais revenir sur l’app (onboarding si nouveau, sinon dashboard).

En cas d’erreur, vérifie :
- Les **Redirect URLs** dans Supabase (étape 2.3).
- L’**URI de redirection** dans Google Cloud (étape 2.2) : `https://<ton-ref>.supabase.co/auth/v1/callback`.

---

## Dépannage rapide

| Problème | À vérifier |
|----------|------------|
| “Invalid or expired invite” | Le lien a peut-être expiré (7 jours) ou a déjà été utilisé. Génère un nouveau lien. |
| Redirection en boucle vers /login | Redirect URLs dans Supabase (Auth → URL Configuration) et que `http://localhost:3000/auth/callback` est bien ajouté. |
| Erreur SQL en exécutant la migration | Si “relation projects does not exist”, exécute d’abord `000_create_base_tables.sql` (étape 1.2). |
| “Missing Supabase environment variables” | `.env.local` présent à la racine avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Redémarre `npm run dev` après modification. |

---

## Notifications par email (optionnel)

Pour envoyer un email à l’interlocuteur quand une version est déposée, des assets ajoutés, un message envoyé ou une référence ajoutée, configure :

- **Resend** : `RESEND_API_KEY` dans `.env.local` (voir [Resend](https://resend.com)).
- **Supabase** : `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` (clé **service_role** dans Supabase → Settings → API).

**Guide pas à pas détaillé :** `docs/CONFIGURER_NOTIFICATIONS_EMAIL.md` — Resend (compte + clé API) puis Supabase (clé service_role dans Settings → API).

---

## Récap ordre des étapes

1. Supabase : SQL Editor → exécuter `000_create_base_tables.sql` (si projet neuf).
2. Supabase : SQL Editor → exécuter `001_schema_and_rls.sql`.
3. Supabase : Authentication → Providers → Email activé.
4. (Optionnel) Google Cloud : créer un projet + identifiants OAuth, puis Supabase → Providers → Google.
5. Supabase : Authentication → URL Configuration → Site URL + Redirect URLs.
6. Vérifier `.env.local` (URL + anon key).
7. `npm install` puis `npm run dev` et tester signup → onboarding → dashboard → create project → invite link.

Une fois tout ça fait, tu as Supabase, la base, l’auth et les invitations opérationnels. Si une étape bloque, dis-moi à quelle partie tu es et le message d’erreur exact, et on la fait ensemble.
