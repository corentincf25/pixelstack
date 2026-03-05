# Déploiement Vercel + Supabase (production)

## Erreur « Bucket not found » (404)

Si après mise en ligne sur Vercel vous voyez :
- **Impossible d’importer / visualiser / télécharger des images**
- **Messages ou chat ne fonctionnent plus**
- **`{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`** lors du téléchargement d’un asset

c’est en général que **le projet Supabase utilisé en production** (celui dont les clés sont dans les variables d’environnement Vercel) **n’a pas les mêmes buckets Storage** que votre environnement local.

### À faire côté Supabase (projet de production)

1. **Ouvrir le projet Supabase** correspondant aux variables d’environnement définies sur Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, et si vous utilisez des API routes avec le service role : `SUPABASE_SERVICE_ROLE_KEY`).

2. **Storage → créer les buckets** (s’ils n’existent pas) :
   - **`assets`** : pour les fichiers de projet (versions, références, images du chat).  
     - Règles d’accès : privé, avec policies RLS basées sur `is_project_member(project_id)` (comme en local).
   - **`avatars`** : pour les photos de profil.  
     - Peut rester public si votre schéma RLS le permet.

3. **Exécuter les migrations SQL** sur la base de production (même schéma qu’en local), pour que les tables, RPC (`is_project_member`, etc.) et policies Storage soient à jour.

4. **Vérifier les policies Storage** du bucket `assets` : elles doivent autoriser lecture/écriture pour les utilisateurs qui sont membres du projet (via une policy qui utilise `auth.uid()` et la fonction `is_project_member` sur le chemin du fichier).

### Variables d’environnement sur Vercel

Dans **Vercel → Project → Settings → Environment Variables**, définir pour la production (et preview si besoin) :

- `NEXT_PUBLIC_SUPABASE_URL` = URL du projet Supabase (production)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé anon de ce projet
- `SUPABASE_SERVICE_ROLE_KEY` = clé service role (pour les API routes qui génèrent des signed URLs ou accèdent au storage côté serveur)

**Important :** si vous utilisez un **autre** projet Supabase en local (dev) et un **autre** en production, les buckets et la base doivent être configurés **dans les deux**. Le code attend des buckets nommés exactement **`assets`** et **`avatars`**.

### Résumé

| Problème | Cause probable | Action |
|----------|----------------|--------|
| Bucket not found 404 | Bucket `assets` (ou `avatars`) absent dans le projet Supabase lié à Vercel | Créer les buckets dans Supabase (production) et appliquer les policies |
| Images / miniatures ne s’affichent pas | Signed URLs générées vers un projet qui n’a pas le bucket ou les policies | Idem + vérifier que les migrations et RLS sont appliqués |
| Messages ne marchent plus | Tables ou RLS différents en prod | Exécuter les migrations sur la base de production |

Une fois les buckets créés et les migrations appliquées sur le bon projet Supabase, redéployer l’app sur Vercel (ou laisser le déploiement automatique après push).
