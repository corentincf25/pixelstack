# Changement de nom de l’application (thumb.io → nouveau nom)

Quand tu auras donné le nouveau nom, toutes les occurrences dans le **code source** seront remplacées (fichiers listés ci-dessous). Le dossier `.next` n’est pas modifié : il sera régénéré au prochain `npm run dev` ou `npm run build`.

---

## Fichiers modifiés dans le projet (après remplacement)

| Fichier | Contenu concerné |
|--------|-------------------|
| `app/layout.tsx` | `metadata.title` (onglet navigateur) |
| `components/Sidebar.tsx` | Nom affiché dans la sidebar |
| `components/AppShell.tsx` | Nom dans l’en-tête |
| `app/(auth)/login/page.tsx` | Sous-titre "thumb.io — miniatures YouTube" |
| `app/(auth)/signup/page.tsx` | Sous-titre "thumb.io — Choisis ton rôle…" |
| `app/(auth)/onboarding/page.tsx` | "Bienvenue sur thumb.io" |
| `app/settings/page.tsx` | Description "Ton compte… sur thumb.io." |
| `app/api/notify-project-update/route.ts` | Expéditeur email, sujet `[thumb.io]`, lien "Ouvrir thumb.io", signature "L'équipe thumb.io", URL de secours |
| `docs/*.md` | Tous les docs qui citent thumb.io |

---

## Où modifier sur Supabase pour que tout continue à marcher

### 1. Authentication → URL Configuration

**Chemin :** Dashboard Supabase → **Authentication** → **URL Configuration**

- **Site URL**  
  Remplace par l’URL réelle de ton app, par ex. :
  - En prod : `https://ton-nouveau-domaine.com`
  - En local : `http://localhost:3000`

- **Redirect URLs**  
  Ajoute (ou remplace les anciennes) les URLs autorisées après login, par ex. :
  - `https://ton-nouveau-domaine.com/**`
  - `http://localhost:3000/**`

Sans ça, après connexion (email ou Google), Supabase ne saura pas où renvoyer l’utilisateur et tu peux avoir des erreurs de redirection.

### 2. (Optionnel) Email templates

**Chemin :** Dashboard Supabase → **Authentication** → **Email Templates**

Si tu as personnalisé les modèles (confirmation d’email, reset password, etc.) et y as mis "thumb.io", change le texte pour le nouveau nom. Les templates par défaut n’utilisent en général pas le nom de l’app.

### 3. Pas de changement nécessaire

- **Tables, RLS, Storage, migrations** : rien à changer pour le nom.
- **Variables d’environnement Supabase** (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) : inchangées.

---

## Ailleurs (hors Supabase)

- **Resend** (emails) : dans ton app, l’expéditeur par défaut est défini dans le code (et éventuellement `RESEND_FROM`). Après remplacement du nom dans le code, si tu utilises `RESEND_FROM` dans `.env`, mets-y le nouveau nom, ex. `Nouveau Nom <notifications@tondomaine.com>`.
- **Google Cloud Console** (connexion Google) : **APIs & Services** → **OAuth consent screen** → **Nom de l’application**. Remplace "thumb.io" par le nouveau nom pour que l’écran de connexion Google affiche le bon nom.
- **Vercel (ou hébergeur)** : si tu as un domaine personnalisé, configure-le pour pointer vers ton app ; pas de lien avec le nom "thumb.io" dans Supabase.

---

En résumé : dès que tu donnes le **nouveau nom** (et si tu as un **nouveau domaine**, ex. `https://minia.io`), on remplace tout dans le code, et tu adaptes **Supabase** (URL Configuration + éventuellement emails / Google) comme ci-dessus.
