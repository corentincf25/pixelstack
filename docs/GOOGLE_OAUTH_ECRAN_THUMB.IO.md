# Afficher « thumb.io » sur l’écran de connexion Google

Quand tu te connectes avec Google, l’écran peut afficher l’URL technique de Supabase (`bvjwdwtmuieplgxrpeip.supabase.co`), ce qui paraît un peu brut. Tu peux rendre l’écran plus rassurant en configurant bien l’**écran de consentement OAuth** dans Google Cloud pour que le nom **thumb.io** (et éventuellement un logo) s’affiche clairement.

---

## 1. Où configurer

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Sélectionne le projet utilisé pour thumb.io (celui où tu as créé l’ID client OAuth).
3. Menu **APIs et services** → **Écran de consentement OAuth** (OAuth consent screen).

---

## 2. Type d’application

- Si tu es en **test** : garde **Externe** (tu pourras passer en production plus tard).
- Remplis les champs suivants.

---

## 3. Infos affichées à l’utilisateur

Renseigne au minimum :

| Champ | Valeur recommandée |
|--------|----------------------|
| **Nom de l’application** | `thumb.io` |
| **Adresse e-mail d’assistance utilisateur** | ton email (ex. support@thumb.io ou ton email perso) |
| **Logo de l’application** | (optionnel) une image carrée 120×120 px pour ton app |

Enregistre.

---

## 4. Ce que tu obtiens

- Sur l’écran « Se connecter avec Google », le **nom de l’application** affiché sera **thumb.io** au lieu d’un nom technique.
- Google peut toujours afficher le **domaine** vers lequel il envoie l’utilisateur (ici `...supabase.co`), c’est normal et lié au fait que la redirection passe par Supabase. L’important est que le nom « thumb.io » soit bien visible et rassurant.

---

## 5. (Optionnel) Domaine personnalisé Supabase

Pour afficher un domaine du type `thumb.io` ou `auth.thumb.io` au lieu de `bvjwdwtmuieplgxrpeip.supabase.co`, il faudrait configurer un **domaine personnalisé** pour ton projet Supabase (fonctionnalité Supabase, payante selon l’offre). Ce n’est pas nécessaire pour que l’écran soit déjà plus clair : le nom **thumb.io** sur l’écran de consentement suffit en général.

---

En résumé : **APIs et services** → **Écran de consentement OAuth** → Nom de l’application = **thumb.io**, email d’assistance renseigné, et optionnellement un logo. Après sauvegarde, la prochaine connexion avec Google montrera « thumb.io » de façon lisible.
