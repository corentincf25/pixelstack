# Configurer les notifications email (pas à pas)

Quand ton graphiste ou ton client dépose une version, envoie un message, etc., l’autre personne peut recevoir un **email** pour lui dire d’aller voir l’app. Pour que ça marche, il faut ajouter **2 clés** dans ton fichier `.env.local`.

---

## Étape 1 : La clé Resend (pour envoyer les emails)

**C’est quoi ?** Resend est un service qui envoie les emails à ta place. Sans cette clé, thumb.io ne peut pas envoyer d’emails.

**Ce que tu fais :**

1. Va sur **https://resend.com** et crée un compte (gratuit).
2. Une fois connecté, va dans **API Keys** (menu ou **https://resend.com/api-keys**).
3. Clique sur **Create API Key**.
4. Donne un nom (ex. « thumb.io ») et valide.
5. **Copie la clé** qui s’affiche (elle commence par `re_`). Tu ne pourras plus la revoir après !

**Où la mettre :** dans ton fichier `.env.local` à la racine du projet :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

(Remplace par ta vraie clé.)

---

## Étape 2 : La clé Supabase « service_role » (pour connaître l’email du destinataire)

**C’est quoi ?** Pour envoyer l’email à la bonne personne, l’app doit connaître son adresse email. Elle est dans Supabase (compte utilisateur). La clé **anon** ne permet pas de lire les emails des autres users, donc on utilise la clé **service_role** uniquement côté serveur.

**Ce que tu fais :**

1. Ouvre ton **projet Supabase** sur **https://supabase.com/dashboard**.
2. Dans le menu de gauche, va dans **Project Settings** (icône engrenage en bas).
3. Clique sur **API** dans le sous-menu.
4. Tu vois deux clés :
   - **anon public** : tu l’as déjà dans `.env.local` comme `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - **service_role** : c’est celle-ci qu’il nous faut. Clique sur **Reveal** à côté de **service_role** pour l’afficher, puis **Copy**.

**Où la mettre :** dans le même fichier `.env.local` :

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Remplace par ta vraie clé.)

⚠️ **Important :** cette clé donne un accès fort à ta base. Elle ne doit **jamais** être utilisée dans le navigateur, seulement sur ton serveur Next.js. Ne la mets **pas** dans un fichier qui commence par `NEXT_PUBLIC_`.

---

## À quoi ressemble ton `.env.local` à la fin

Tu dois déjà avoir (pour Supabase et l’app) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Tu **ajoutes** ces deux lignes (avec tes vraies valeurs) :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Donc au total, 4 lignes (ou plus si tu avais déjà d’autres variables).

---

## Tester

1. Sauvegarde `.env.local`.
2. Redémarre le serveur : arrête `npm run dev` (Ctrl+C) puis relance `npm run dev`.
3. Connecte-toi avec un compte (ex. graphiste), ouvre un projet, dépose une version ou envoie un message.
4. L’autre compte (client ou graphiste) doit recevoir un email « [thumb.io] À consulter : … » avec un lien vers le projet.

Si tu n’as pas configuré Resend ou la clé service_role, l’app continue de fonctionner normalement, mais **aucun email ne part**. Aucune erreur ne s’affiche pour l’utilisateur.

---

## En résumé

| Où ? | Quoi ? | À quoi ça sert ? |
|------|--------|-------------------|
| **Resend.com** → API Keys → Create | Tu copies la clé `re_...` | Envoyer les emails aux utilisateurs |
| **Supabase** → Project Settings → API → service_role → Reveal | Tu copies la clé `eyJ...` | Lire l’email du destinataire pour lui envoyer la notification |
| **Ton projet** → `.env.local` | Tu ajoutes `RESEND_API_KEY=...` et `SUPABASE_SERVICE_ROLE_KEY=...` | L’app peut envoyer les mails avec la bonne adresse |

Une fois ces 2 clés dans `.env.local` et le serveur redémarré, les notifications email sont actives.
