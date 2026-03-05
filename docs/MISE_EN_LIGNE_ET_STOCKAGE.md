# Mise en ligne (gratuit) et gestion du stockage

## Projet lancé en local

Le serveur de développement est démarré. Ouvre **http://localhost:3000** dans ton navigateur.

Pour relancer plus tard :
```bash
cd mini-maker-app
npm run dev
```

---

## Mettre l’app en ligne gratuitement (pour tester avec de vrais clients)

### 1. Hébergement de l’app : Vercel (gratuit)

- **Vercel** héberge ton app Next.js gratuitement (plan Hobby).
- Pas de carte bancaire pour le plan gratuit.
- Chaque push sur GitHub peut déclencher un déploiement automatique.

**Étapes :**

1. **Pousser le code sur GitHub**
   - Crée un dépôt sur [github.com](https://github.com) (ex. `thumb-io` ou `mini-maker`).
   - Dans le dossier du projet :
   ```bash
   cd mini-maker-app
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/TON_USERNAME/TON_REPO.git
   git push -u origin main
   ```

2. **Déployer sur Vercel**
   - Va sur [vercel.com](https://vercel.com) et connecte-toi avec GitHub.
   - **Add New Project** → importe ton dépôt.
   - Vercel détecte Next.js ; laisse les options par défaut.
   - **Environment Variables** : ajoute les mêmes variables que dans ton `.env.local` :
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY` (pour les APIs admin / backfill / purge)
     - Si tu utilises Resend pour les mails : `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` (ex. `https://ton-projet.vercel.app`)
   - Déploie. Tu obtiendras une URL du type `https://ton-projet.vercel.app`.

3. **Configurer Supabase pour la prod**
   - Dans [Supabase Dashboard](https://supabase.com/dashboard) → ton projet → **Authentication** → **URL Configuration** :
     - **Site URL** : `https://ton-projet.vercel.app` (ou ta future URL perso).
     - **Redirect URLs** : ajoute `https://ton-projet.vercel.app/**` (et ton domaine custom si tu en as un).
   - Ainsi, connexion Google et redirections après login fonctionneront en production.

Résultat : ton app est en ligne, utilisable par de vrais clients pour des tests.

---

## Stockage Supabase : combien de Go ? Où le voir ?

### Limite du plan gratuit

- **Plan Free Supabase** : **1 Go** de stockage total pour tous tes buckets (Storage).
- C’est une limite **par projet Supabase**, pas par utilisateur de ton app.
- Ton app utilise déjà cette limite de 1 Go par défaut dans les RPC (`get_designer_storage`, etc.) : si `profiles.storage_limit_bytes` est vide, on considère 1 Go.

### Où voir l’usage stockage dans Supabase

Supabase n’affiche pas “X Go / 1 Go” sur la page Storage. Il faut passer par :

1. **Usage du projet (recommandé)**  
   - Dashboard Supabase → **Organization** (menu gauche ou sélecteur en haut) → **Usage** ([supabase.com/dashboard/org/_/usage](https://supabase.com/dashboard/org/_/usage)).
   - Choisis ton **projet** dans le menu déroulant.
   - Section **Storage size** : tu vois l’usage (en GB-Hrs sur la période). Pour avoir une idée en “Go utilisés”, regarde la courbe / les chiffres sur la période (ex. mois en cours).  
   - Free tier = 1 Go donc ~744 GB-Hrs/mois ; si tu restes sous 744 GB-Hrs, tu es dans la limite.

2. **Taille par bucket (SQL)**  
   Dans **SQL Editor** du projet, tu peux exécuter :

   ```sql
   SELECT
     bucket_id,
     (SUM((metadata->>'size')::bigint) / 1048576.0)::numeric(10, 2) AS total_mb
   FROM storage.objects
   GROUP BY bucket_id
   ORDER BY total_mb DESC;
   ```
   Tu obtiens la taille en Mo par bucket (ex. `assets`). 1024 Mo = 1 Go.

3. **Ce que fait ton app**  
   - La page **Mon stockage** (côté graphiste) affiche **utilisé / limite** en s’appuyant sur les tables `assets`, `versions`, `project_references` (et la RPC `get_designer_storage_breakdown`).
   - La “limite” affichée = `profiles.storage_limit_bytes` ou **1 Go** par défaut.
   - Donc côté app, tu vois déjà une estimation cohérente avec la limite Supabase Free ; côté Supabase, c’est la page Usage (et éventuellement la requête SQL ci-dessus) qui te donne le détail réel.

### En résumé

| Où | Quoi |
|----|------|
| **Supabase → Organization → Usage → (ton projet)** | Usage stockage du projet (aligné avec la limite 1 Go Free). |
| **SQL Editor** (requête ci-dessus) | Taille par bucket en Mo. |
| **Ton app → Mon stockage** | Utilisé / 1 Go par graphiste (logique métier), avec tri et purge par projet. |

Pour rester sous 1 Go : utilise la page **Mon stockage** pour voir qui consomme et la **purge par projet** pour libérer de l’espace si besoin.
