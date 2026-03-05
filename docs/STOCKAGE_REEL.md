# Stockage : données réelles (base de données)

La barre de stockage affichée dans l'interface graphiste **reflète la réalité de la base de données**.

- **Utilisé (octets)** : somme des tailles des fichiers enregistrés pour les projets dont tu es le graphiste :
  - tous les **assets** (`assets.file_size`) de ces projets ;
  - toutes les **versions** (`versions.file_size`) de ces projets ;
  - toutes les **références** images (`project_references.file_size`, kind = image) de ces projets.
- **Limite** : lue depuis `profiles.storage_limit_bytes`. Si la valeur est `NULL`, l'application utilise **100 Mo** (100 × 1024² octets) par défaut (plan gratuit).

**Règle importante** : le stockage est toujours comptabilisé sur le **profil du graphiste**, même si le projet a été créé par le YouTuber (client). Tous les fichiers du projet (assets, versions, références), qu’ils aient été déposés par le client ou par le graphiste, entrent dans le quota du graphiste dès que celui-ci est assigné au projet (via le lien d’invitation).

**Côté YouTuber** : aucun stockage, pas d’onglet « Mon stockage » ni de barre de quota. C’est toujours le graphiste qui héberge les fichiers, y compris quand c’est le YouTuber qui a créé le projet et invité le graphiste.

Rien n'est affiché "pour faire joli" : les valeurs viennent de la RPC `get_designer_storage()` qui lit directement les tables `assets`, `versions`, `project_references` et `profiles`. Pour proposer une offre "10 € = 10 Go", il suffit plus tard de mettre à jour `storage_limit_bytes` dans `profiles` (ou via une table d'offres).

---

## Sécurité : bucket privé et URLs signées

Le bucket Storage `assets` est **privé** (migration 015). Les URLs publiques ne permettent plus d’accéder aux fichiers. L’app utilise une API (`POST /api/projects/[id]/storage/signed-urls`) pour générer des **URLs signées** temporaires (1 h) réservées aux membres du projet. Les composants (Assets, Versions, Inspirations) appellent cette API et affichent/téléchargent via ces URLs. Le téléchargement ZIP (download-all) utilise le client admin pour lire les fichiers et zipper.

## Où sont stockées les images ? (uniquement en ligne)

**Aucune image n'est stockée dans le dossier du projet (mini-maker-app).**

- **Assets** (fichiers déposés dans les projets), **versions** (miniatures) et **références** (images d'inspi) sont envoyés directement dans **Supabase Storage**, bucket `assets`.
- Le code utilise uniquement `supabase.storage.from("assets").upload(path, file)` puis enregistre l'URL publique (ou le chemin) en base. Aucun `writeFile` ni dossier local type `public/uploads`.
- Le stockage "utilisé" par le graphiste correspond donc bien à ce qui est **en ligne** (Supabase), pas à ton disque.

**Pourquoi le dossier mini-maker-app est lourd (~1,5 Go) ?**

- **`node_modules`** : dépendances npm (souvent 300 Mo–1 Go). Exclu du git, présent sur ta machine.
- **`.next`** : cache et build Next.js. Exclu du git, peut faire 100–500 Mo.

Pour alléger en dev : supprimer `.next` (sous Windows : `rmdir /s .next`), et éventuellement `node_modules` puis `npm install` si besoin. Les images et fichiers métier restent uniquement sur Supabase.
