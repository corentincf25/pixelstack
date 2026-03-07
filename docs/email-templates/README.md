# Templates email Supabase (rebrand Pixelstack)

Ces templates utilisent les couleurs et le style du site (fond sombre #0B0F19, carte #111827, bouton dégradé #6366F1 → #3B82F6, texte #E5E7EB / #9CA3AF).

## Confirmation d’inscription

Fichier : `supabase-confirm-signup.html`

**Où l’appliquer :**

1. Ouvre ton projet sur [Supabase Dashboard](https://supabase.com/dashboard).
2. **Authentication** → **Email Templates**.
3. Sélectionne **Confirm signup**.
4. **Subject** (objet) : tu peux mettre par exemple  
   `Confirmer mon inscription - Pixelstack`
5. **Body** (corps) : copie-colle tout le contenu de `supabase-confirm-signup.html`.
6. Clique sur **Save**.

Le texte du mail parle de « collaborer entre graphiste et client » (sans « miniatures YouTube »).  
Les variables `{{ .ConfirmationURL }}` sont gérées par Supabase ; ne les modifie pas.

## Réinitialisation du mot de passe

Fichier : `supabase-reset-password.html`

**Où l’appliquer :**

1. Supabase Dashboard → **Authentication** → **Email Templates**.
2. Sélectionne **Reset password** (ou **Change password**).
3. **Subject** : par exemple `Réinitialiser mon mot de passe - Pixelstack`.
4. **Body** : copie-colle tout le contenu de `supabase-reset-password.html`.
5. **Save**.

Même style que la confirmation (couleurs, bouton), texte « collaborer entre graphiste et client ». Variable `{{ .ConfirmationURL }}` pour le lien de réinitialisation.

## Autres templates (optionnel)

Tu peux faire la même chose pour **Magic Link** et **Change Email Address** en t’inspirant du même style (couleurs, structure, bouton).
