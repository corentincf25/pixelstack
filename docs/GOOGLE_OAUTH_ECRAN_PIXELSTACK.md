# Afficher « Pixelstack » sur l’écran de connexion Google

Quand tu te connectes avec Google, l’écran peut afficher l’URL technique Supabase (`bvjwdwtmuieplgxrpeip.supabase.co`), ce qui fait peu professionnel. Pour afficher **Pixelstack** à la place, configure l’**écran de consentement OAuth** dans Google Cloud.

---

## 1. Où configurer

1. Va sur [Google Cloud Console](https://console.cloud.google.com/).
2. Sélectionne le projet dans lequel tu as créé les identifiants OAuth (celui lié à Supabase → Authentication → Providers → Google).
3. Menu **APIs et services** → **Écran de consentement OAuth** (OAuth consent screen).

---

## 2. Modifier l’application

- Clique sur **Modifier l’application** (ou équivalent selon l’interface).
- Renseigne au minimum :

| Champ | Valeur |
|--------|--------|
| **Nom de l’application** | `Pixelstack` |
| **Adresse e-mail d’assistance utilisateur** | ton email (ex. blend.psd@gmail.com ou support@pixelstack.fr) |
| **Logo de l’application** | (optionnel) logo Pixelstack 120×120 px |

- Enregistre (Sauvegarder).

---

## 3. Résultat

- Au prochain « Se connecter avec Google », le **nom affiché** pour l’application sera **Pixelstack** (ou ce que tu as mis dans « Nom de l’application »).
- Google peut encore afficher le domaine de redirection (`...supabase.co`) pour des raisons de sécurité ; l’essentiel est que « Pixelstack » soit bien visible et rassurant.

---

## 4. Si le domaine Supabase s’affiche encore

Pour que seul « Pixelstack » (ou ton domaine) apparaisse partout, il faudrait utiliser un **domaine personnalisé** pour l’auth Supabase (option payante selon l’offre). Pour la plupart des cas, un **Nom de l’application** = **Pixelstack** et un logo sur l’écran de consentement suffisent.

---

En résumé : **Google Cloud Console** → **APIs et services** → **Écran de consentement OAuth** → **Nom de l’application** = **Pixelstack**, email d’assistance renseigné, optionnellement un logo. Sauvegarde, puis refais un test de connexion Google.
