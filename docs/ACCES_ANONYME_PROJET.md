# Accès anonyme au projet (sans compte) + conversion en compte

Ce document décrit l’architecture et les étapes pour permettre à un YouTubeur de participer à un projet **sans créer de compte**, puis de **créer un compte** plus tard pour rattacher l’historique.

---

## 1. Objectifs

- **Rejoindre un projet sans compte** : le YouTubeur ouvre le lien d’invitation → accès direct au projet (voir, commenter, déposer des assets, discuter). Il est identifié comme "Anonyme".
- **Sécurité** : accès limité au projet lié au token d’invitation uniquement ; pas d’accès aux autres projets.
- **Conversion** : à un moment, inciter à "Créer un compte pour garder l’historique". À la création de compte, les messages/activité "anonymes" sont rattachés au nouveau compte (nom remplace "Anonyme", conversations conservées).

---

## 2. Sécurité du lien (point 5)

- Le lien d’invitation existe déjà : `/invite/[token]` avec `project_invites.token`.
- **Règles à respecter** :
  - Token sécurisé (UUID ou long random), stocké en base avec `expires_at`.
  - L’accès au projet en mode anonyme doit être **uniquement** via ce token (cookie ou session liée au token).
  - Ne jamais exposer les autres projets ; les API doivent vérifier "ce token donne accès à ce project_id uniquement".

---

## 3. Modifications base de données

### 3.1 Identifier l’anonyme

Deux options (à trancher) :

**Option A – `sender_id` nullable + `anonymous_id`**  
- Table `messages` : `sender_id UUID NULL`, ajouter `anonymous_id TEXT NULL` (ex. un UUID de session stocké en cookie).
- À la conversion compte : `UPDATE messages SET sender_id = :user_id, anonymous_id = NULL WHERE anonymous_id = :session_id`.

**Option B – Table dédiée "anonymous_sessions"**  
- `anonymous_sessions (id, project_id, invite_token, created_at)`.
- `messages` : `sender_id NULL` et `anonymous_session_id UUID NULL` (FK vers anonymous_sessions).
- À la conversion : créer le compte, puis mettre à jour les messages avec `sender_id = nouveau_user_id`, `anonymous_session_id = NULL`.

### 3.2 Assets / versions

- Les uploads "anonymes" peuvent être liés à `anonymous_session_id` ou à un `anonymous_id` (cookie).
- À la conversion : réattribuer les assets/versions de cette session au `user_id`.

### 3.3 RLS

- Politiques à ajouter pour permettre la **lecture/écriture** sur le projet si :
  - l’utilisateur est membre (client/designer/reviewer), **ou**
  - la requête est faite avec un token d’invitation valide (via une RPC ou un service role qui vérifie le token).

En pratique, les écritures anonymes passent souvent par des **API routes** qui vérifient le token puis utilisent le **service role** pour insérer (ex. message avec `sender_id` NULL et `anonymous_id`).

---

## 4. Workflow "Rejoindre sans compte" (point 3)

1. **Graphiste** crée un projet et copie le lien d’invitation (ex. `https://app.example.com/invite/abc-123-token`).
2. **YouTubeur** ouvre le lien **sans être connecté**.
3. **Comportement actuel** : redirection vers `/login?next=/invite/abc-123-token`.
4. **Comportement souhaité** :
   - Si pas connecté : afficher une page "Accéder au projet sans compte" avec un bouton "Continuer en anonyme".
   - Au clic : enregistrer le token en cookie (httpOnly, sécurisé, même site) ou en session, puis rediriger vers une route dédiée, ex. **`/p/[token]`** (ou garder `/invite/[token]` avec un mode "anonyme").
5. La page projet **`/p/[token]`** (ou équivalent) :
   - lit le token depuis l’URL ou le cookie ;
   - vérifie en serveur que le token est valide et renvoie le `project_id` ;
   - affiche le projet en lecture/écriture (messages, versions, assets, commentaires) sans compte.
   - Les messages envoyés ont `sender_id` NULL et un identifiant anonyme ; l’UI affiche "Anonyme".
   - Les uploads sont liés à la session anonyme (cookie/session id).

### 4.1 Routes à créer/adapter

- **GET `/invite/[token]`** (modifier) : si pas connecté, ne plus rediriger immédiatement vers login ; afficher "Continuer en anonyme" ou "Se connecter / Créer un compte".
- **GET/POST `/p/[token]`** (nouvelle) : page projet en mode anonyme. Toutes les données sont chargées côté serveur en vérifiant le token (ex. via API ou RPC qui vérifie `project_invites`).
- **API** : ex. `POST /api/projects/[id]/messages` avec en-tête ou body contenant le token d’invitation ; si token valide pour ce projet, accepter l’écriture avec `sender_id` NULL et `anonymous_id`.

---

## 5. Conversion vers compte (point 4)

- **Côté UI** : message discret + bouton "Créer un compte pour garder l’historique" (ex. dans la barre du projet ou en bannière).
- **Avantages affichés** : historique des projets, des graphistes, plus d’assets, retrouver les projets facilement.
- **Au clic** : redirection vers `/signup?next=/p/[token]&convert=1` (ou paramètre dédié).
- **Après inscription** :
  - Créer le compte (Supabase Auth).
  - Appeler une **API de conversion** : ex. `POST /api/anon/convert` avec le token (ou le cookie de session anonyme). Cette API :
    - vérifie le token / session anonyme ;
    - met à jour `messages` : `sender_id = nouveau_user_id`, `anonymous_id = NULL` (ou équivalent) pour ce projet ;
    - met à jour `assets` / autres tables si nécessaire ;
    - associe le projet au compte (ex. ajouter l’utilisateur comme `client_id` ou comme collaborateur selon la logique métier).
  - Rediriger vers le projet "normal" `/projects/[id]` avec l’utilisateur connecté.

---

## 6. Résumé des fichiers à toucher

| Zone | Fichiers / actions |
|------|--------------------|
| **DB** | Migration : `messages.anonymous_id` ou `anonymous_session_id`, RLS, RPC de vérification token → project_id |
| **Invite** | `app/invite/[token]/page.tsx` : proposer "Continuer en anonyme" au lieu de rediriger vers login |
| **Page projet anonyme** | Nouvelle route `app/p/[token]/page.tsx` (ou sous `/invite/[token]/project`) + layout |
| **API messages** | Endpoint qui accepte le token et écrit en anonyme (service role) |
| **API uploads** | Idem : vérifier token, associer à anonymous_id |
| **Conversion** | `POST /api/anon/convert` + page signup avec paramètre `convert` et `next` |
| **UI** | Bannière / bouton "Créer un compte pour garder l’historique" sur la page projet anonyme |

---

## 7. Ordre d’implémentation suggéré

1. Migration DB : colonne(s) anonyme + RLS / RPC.
2. Adapter `/invite/[token]` : choix "Sans compte" / "Avec compte".
3. Créer `/p/[token]` et les API qui vérifient le token pour ce projet.
4. Afficher "Anonyme" pour les messages sans `sender_id`.
5. Ajouter la conversion : bouton, signup avec `next`, API `convert`, redirection vers `/projects/[id]`.

Une fois cette base en place, les points 3, 4 et 5 de ta demande sont couverts de façon sécurisée et évolutive.
