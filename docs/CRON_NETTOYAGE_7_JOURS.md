# Cron : nettoyage des projets orphelins (7 jours)

Ce cron supprime automatiquement les projets **sans graphiste** créés il y a **plus de 7 jours** (fichiers dans le bucket + projet en base). Voici les étapes pour le mettre en place.

---

## Étape 1 : Choisir un secret (CRON_SECRET)

Le cron appelle une URL protégée. Il doit envoyer un secret pour être accepté.

1. **Génère une chaîne secrète** (une seule fois) :
   - Option A : va sur [https://www.random.org/strings](https://www.random.org/strings) et génère une chaîne d’au moins 32 caractères, ou
   - Option B : en ligne de commande :  
     `openssl rand -hex 32`  
     (sous Windows PowerShell : tu peux utiliser un mot de passe fort inventé, ex. `MaChaineSecreteCron2024!`.)
2. **Note ce secret** quelque part en lieu sûr (tu en auras besoin à l’étape 2 et 4).  
   Exemple (à ne pas utiliser tel quel) : `a1b2c3d4e5f6...`.

---

## Étape 2 : Ajouter CRON_SECRET sur Vercel

1. Va sur **[https://vercel.com](https://vercel.com)** et connecte-toi.
2. Ouvre ton **projet Pixelstack** (ou le nom de ton app).
3. Onglet **Settings** (Paramètres).
4. Menu de gauche : **Environment Variables**.
5. Clique sur **Add New** (ou **Add**).
6. Renseigne :
   - **Name** : `CRON_SECRET`
   - **Value** : colle le secret que tu as généré à l’étape 1.
   - **Environments** : coche au moins **Production** (et **Preview** si tu veux que les previews puissent aussi lancer le cron).
7. Clique sur **Save**.
8. **Redéploie** l’app une fois (Deployments → … sur le dernier déploiement → **Redeploy**) pour que la variable soit bien prise en compte.

---

## Étape 3 : Noter l’URL du cron

L’URL à appeler est :

```text
https://TON-DOMAINE.vercel.app/api/cron/cleanup-orphan-projects
```

Remplace `TON-DOMAINE.vercel.app` par l’URL réelle de ton app (ex. `pixelstack.vercel.app` ou ton domaine personnalisé).

Exemple :  
`https://pixelstack.vercel.app/api/cron/cleanup-orphan-projects`

---

## Étape 4 : Configurer le service de cron (ex. cron-job.org)

On utilise ici **cron-job.org** (gratuit, sans carte bancaire). Tu peux utiliser un autre service (GitHub Actions, EasyCron, etc.) en suivant la même logique.

### 4.1 Créer un compte

1. Va sur **[https://cron-job.org](https://cron-job.org)**.
2. Crée un compte (gratuit).

### 4.2 Créer le cron job

1. Une fois connecté, clique sur **Create cron job** (ou **Cronjobs** → **Create cronjob**).
2. Renseigne :

   | Champ | Valeur |
   |--------|--------|
   | **Title** | `Pixelstack – Nettoyage projets orphelins 7j` (ou un nom de ton choix) |
   | **Address (URL)** | `https://TON-DOMAINE.vercel.app/api/cron/cleanup-orphan-projects` (ton URL de l’étape 3) |

3. **Méthode HTTP** : choisis **POST** (pas GET).

### 4.3 Envoyer le secret

Tu as **deux possibilités**. Une seule suffit.

**Option A – En-tête (recommandé)**  
- Dans la configuration du cron, cherche une option du type **Request headers** / **Headers** / **Custom headers**.
- Ajoute un en-tête :
  - **Name** : `Authorization`
  - **Value** : `Bearer TON_CRON_SECRET`  
  (remplace `TON_CRON_SECRET` par la vraie valeur de `CRON_SECRET` définie sur Vercel.)

**Option B – Paramètre dans l’URL**  
- Si le service ne permet pas d’ajouter des en-têtes, utilise l’URL avec le paramètre `secret` :
  ```text
  https://TON-DOMAINE.vercel.app/api/cron/cleanup-orphan-projects?secret=TON_CRON_SECRET
  ```
  Remplace `TON_CRON_SECRET` par la valeur de `CRON_SECRET`.  
  ⚠️ Ne partage pas cette URL (elle contient le secret).

### 4.4 Fréquence

- **Schedule** : une fois par jour suffit.
- Sur cron-job.org : choisis par exemple **Daily** et une heure calme (ex. 4h00 du matin).

### 4.5 Enregistrer

- Clique sur **Create** (ou **Save**). Le cron est créé et s’exécutera selon la planification.

---

## Étape 5 : Tester une fois à la main

Avant d’attendre le premier run automatique, tu peux vérifier que l’API répond correctement.

1. **Avec en-tête (curl)**  
   Dans un terminal (PowerShell, CMD, ou Git Bash) :
   ```bash
   curl -X POST "https://TON-DOMAINE.vercel.app/api/cron/cleanup-orphan-projects" -H "Authorization: Bearer TON_CRON_SECRET"
   ```
   Remplace `TON-DOMAINE.vercel.app` et `TON_CRON_SECRET`.

2. **Avec paramètre secret (navigateur ou curl)**  
   Tu ne peux pas faire de POST depuis la barre d’adresse. Utilise curl :
   ```bash
   curl -X POST "https://TON-DOMAINE.vercel.app/api/cron/cleanup-orphan-projects?secret=TON_CRON_SECRET"
   ```

3. **Réponse attendue**  
   - Si tout va bien : un JSON du type  
     `{"ok":true,"deleted":0,"message":"Aucun projet orphelin à supprimer."}`  
     (ou `deleted` > 0 si des projets ont été supprimés).
   - Si le secret est faux : `401 Unauthorized`.
   - Si `CRON_SECRET` n’est pas défini sur Vercel : `503 CRON_SECRET non configuré`.

---

## Récap

| Étape | Action |
|-------|--------|
| 1 | Générer un secret et le noter. |
| 2 | Ajouter la variable `CRON_SECRET` sur Vercel (Settings → Environment Variables), puis redéployer. |
| 3 | Noter l’URL : `https://ton-domaine/api/cron/cleanup-orphan-projects`. |
| 4 | Créer un cron (ex. cron-job.org) en POST vers cette URL, avec le secret en header `Authorization: Bearer <secret>` ou en `?secret=<secret>`, une fois par jour. |
| 5 | Tester avec `curl` pour vérifier la réponse. |

Une fois ces étapes faites, les projets sans graphiste de plus de 7 jours seront supprimés automatiquement chaque jour (fichiers + projet en base).
