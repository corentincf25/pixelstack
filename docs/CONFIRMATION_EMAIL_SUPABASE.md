# Email de confirmation à l'inscription (Supabase)

Lors d’une inscription par **email + mot de passe**, Supabase envoie un email de confirmation par défaut. Si tu ne le reçois jamais, voici quoi vérifier.

---

## 1. Activer la confirmation email

1. **Supabase** → ton projet → **Authentication** → **Providers** → **Email**.
2. Vérifie que **Confirm email** est activé (c’est en général le cas).
3. Si tu désactives "Confirm email", les comptes sont créés sans confirmation (pratique en dev, déconseillé en prod).

---

## 2. Adresse de redirection après clic

Quand l’utilisateur clique sur le lien dans l’email, il doit revenir sur ton app. Dans le code, on utilise `emailRedirectTo: ${origin}/auth/callback`. Assure-toi que dans Supabase :

- **Authentication** → **URL Configuration** → **Redirect URLs** contient l’URL de ton site, par ex. :
  - `https://ton-app.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (en local)

Sans ça, le lien de confirmation peut être refusé par Supabase.

---

## 3. Si les emails ne partent pas (SMTP par défaut)

Par défaut, Supabase envoie les emails avec son propre serveur. Parfois les messages partent en spam ou sont bloqués.

- Vérifie les **spams**.
- Pour être plus fiable en production, configure un **SMTP personnalisé** :
  - **Project Settings** → **Auth** → **SMTP Settings**.
  - Active "Enable Custom SMTP" et renseigne ton fournisseur (Resend, SendGrid, etc.). Tu peux utiliser les mêmes identifiants que pour les notifications (ex. Resend).

---

## 4. Vérifier les emails envoyés

- **Authentication** → **Users** : les comptes "non confirmés" ont un indicateur.
- Si tu as activé des **logs** Supabase, tu peux voir les envois d’emails.

Une fois la redirection et, si besoin, le SMTP configurés, l’email de confirmation doit arriver et le lien doit ramener l’utilisateur sur ton app (puis onboarding ou dashboard).
