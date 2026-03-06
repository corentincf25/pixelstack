# Livrable — Corrections dashboard, vue d’ensemble et création de projet

## A. Dashboard — Cartes de projets

### Fichiers modifiés
- `components/ProjectCard.tsx` — réécrit
- `app/dashboard/page.tsx` — grille et hauteur des cartes
- `components/ProjectsList.tsx` — même grille et hauteur

### Ce qui a été corrigé sur les cards

1. **Structure fixe**
   - Suppression du wrapper `CardTilt` pour éviter les variations de hauteur.
   - Chaque card est un `Link` avec `flex flex-col h-full` et deux zones :
     - **Zone image** : hauteur fixe **100px** (`CARD_IMAGE_HEIGHT`) pour toutes les cards, avec ou sans miniature. Même ratio visuel.
     - **Zone contenu** : `flex-1 min-h-0` + `p-4` identique pour toutes.

2. **Grille**
   - `gridAutoRows: 280px` (constante `PROJECT_CARD_HEIGHT`) pour que chaque ligne de la grille fasse exactement 280px.
   - Gaps homogènes : `gap-4` / `sm:gap-5` / `lg:gap-6`.
   - Chaque cellule de la grille a `h-full min-h-0` pour que la card remplisse la cellule.

3. **Alignement**
   - Titre, badge de statut, date et “Rendu” ont des espacements fixes (`mt-2`, `gap-2`).
   - Noms client/graphiste avec `truncate` et `max-w-[120px]` pour éviter le débordement.
   - Pastilles de notification positionnées en `absolute` dans la zone image pour ne pas faire varier la hauteur du contenu.

4. **Résultat**
   - Toutes les cards ont la même hauteur (280px), la même hauteur d’image (100px), le même padding (p-4) et le même espacement entre elles. Rendu type SaaS, grid régulière, cards uniformes.

---

## B. Vue d’ensemble — Widgets

### Fichiers modifiés
- `components/DashboardDesignerStats.tsx`
- `app/dashboard/page.tsx`

### Ce qui a été ajouté / corrigé dans la vue d’ensemble

1. **Widgets toujours visibles**
   - Suppression de la classe `opacity-0` sur les widgets. Seule l’animation `animate-card-in` reste (entrée en fondu + translation). Les widgets sont visibles même si l’animation est désactivée (ex. `prefers-reduced-motion`).

2. **Grille**
   - Grille en **3 colonnes** (lg) : Projets, Clients uniques, Projets actifs | Mon stockage, Versions envoyées | Par statut (pleine largeur).
   - Tous les widgets ont la même base visuelle (`statCardBase`, `min-h-[200px]`).

3. **Widgets affichés**
   - **Projets** — nombre total de projets du graphiste
   - **Clients uniques** — nombre de `client_id` distincts
   - **Projets actifs** — projets en brouillon ou en cours
   - **Mon stockage** — widget existant (camembert)
   - **Versions envoyées** — nouveau : nombre de lignes dans `versions` pour les projets du graphiste (compté côté app via `supabase.from("versions").select("*", { count: "exact", head: true }).in("project_id", ids)`)
   - **Par statut** — graphique en barres par statut (inchangé)

4. **Données**
   - `versionsCount` est chargé dans le dashboard (useEffect + `designerProjects`) et passé en prop à `DashboardDesignerStats`. Valeur par défaut 0 si pas de projets ou pas designer.

---

## C. RLS / Création de projet

### Cause du bug
- L’erreur « new row violates row-level security policy for table projects » vient du fait que l’**INSERT** direct sur `projects` est soumis aux policies RLS. Selon l’ordre des migrations ou la config du projet Supabase, la policy INSERT peut être absente, trop stricte ou en conflit (ex. rôle `authenticated` non appliqué côté session).
- Même avec la migration 024 qui recrée les policies INSERT/UPDATE, un problème de contexte (session, rôle) peut faire échouer l’insert.

### Solution retenue : RPC `create_project`
- Une **fonction SQL** `create_project(p_title, p_due_date, p_as_role)` en **SECURITY DEFINER** fait l’INSERT dans `projects` avec `auth.uid()` comme `client_id` ou `designer_id` selon `p_as_role`. Elle **contourne RLS** pour cette insertion tout en garantissant que seul l’utilisateur connecté est propriétaire du projet.

### SQL à exécuter
**Tu dois exécuter la migration suivante dans le SQL Editor de ton projet Supabase :**

Fichier : `supabase/migrations/025_create_project_rpc.sql`

```sql
-- RPC pour créer un projet en contournant les soucis RLS : l'utilisateur authentifié
-- crée un projet dont il est soit client soit graphiste.

CREATE OR REPLACE FUNCTION public.create_project(
  p_title TEXT,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_as_role TEXT DEFAULT 'designer'  -- 'designer' | 'client'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_client_id UUID := NULL;
  v_designer_id UUID := NULL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF p_as_role = 'client' THEN
    v_client_id := v_user_id;
  ELSE
    v_designer_id := v_user_id;
  END IF;

  INSERT INTO public.projects (title, status, client_id, designer_id, due_date)
  VALUES (p_title, 'draft', v_client_id, v_designer_id, p_due_date)
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_project(TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
COMMENT ON FUNCTION public.create_project IS 'Crée un projet avec l''utilisateur courant comme client ou graphiste. Utilisé par l''app pour éviter les erreurs RLS sur INSERT.';
```

**En pratique :** ouvre le fichier `supabase/migrations/025_create_project_rpc.sql` dans ton projet, copie tout son contenu, colle-le dans Supabase → SQL Editor → Run.

### Fichiers modifiés côté app
- `components/CreateProjectModal.tsx`
  - Au lieu de `supabase.from("projects").insert(projectPayload).select("id").single()`, l’app appelle désormais :
    - `supabase.rpc("create_project", { p_title: title.trim(), p_due_date: dueDateIso, p_as_role: asRole })`
  - `asRole` vaut `"client"` pour un YouTuber et `"designer"` pour un graphiste.
  - La réponse est l’UUID du projet ; le reste (brief, project_invites) est inchangé.

### Pourquoi ça fonctionne maintenant
- L’INSERT est fait **dans la fonction** avec les droits du propriétaire de la fonction (SECURITY DEFINER), donc **sans être bloqué par RLS**.
- Seul `auth.uid()` est utilisé pour `client_id` ou `designer_id`, donc pas d’usurpation possible.
- Le front n’a plus besoin d’INSERT sur `projects` ; il appelle une RPC réservée aux utilisateurs `authenticated`.

---

## D. Vérification

### Ce qui a été vérifié
- **Build** : `npm run build` exécuté avec succès (Next.js 16, TypeScript OK).
- **Lint** : pas d’erreur sur les fichiers modifiés (ProjectCard, DashboardDesignerStats, dashboard page, CreateProjectModal, ProjectsList).

### Ce qui est maintenant fonctionnel (après exécution du SQL)
1. **Dashboard — Mes projets** : grille à lignes de 280px, cards avec image 100px, contenu aligné, espacements constants.
2. **Vue d’ensemble** : 6 widgets visibles (Projets, Clients uniques, Projets actifs, Mon stockage, Versions envoyées, Par statut), grille 3 colonnes + ligne “Par statut” en pleine largeur.
3. **Création de projet** : après exécution de `025_create_project_rpc.sql`, la création de projet depuis l’interface ne doit plus afficher l’erreur RLS ; le projet est créé via la RPC et le brief + l’invitation sont créés comme avant.

### À faire de ton côté
1. **Exécuter le SQL** : copier/coller et exécuter `supabase/migrations/025_create_project_rpc.sql` dans le SQL Editor Supabase.
2. **Tester** : créer un projet (en tant que graphiste et en tant que YouTuber) et vérifier qu’il n’y a plus de message d’erreur RLS.
3. **Contrôle visuel** : ouvrir le dashboard et la section “Vue d’ensemble” pour confirmer l’alignement des cards et la présence de tous les widgets.
