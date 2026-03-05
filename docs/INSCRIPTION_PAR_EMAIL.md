# Inscription par email — activer et tester

Pour que **l’inscription par email** fonctionne bien (sans blocage type "email rate limit exceeded"), configure Supabase comme suit.

---

## 1. Désactiver la confirmation email (recommandé en dev)

Quand la confirmation email est **activée**, Supabase envoie un mail à chaque inscription. Leur limite d’envoi (gratuit) est très basse, ce qui déclenche vite "email rate limit exceeded".

En **désactivant** la confirmation :

- Aucun email n’est envoyé à l’inscription.
- Supabase crée la session tout de suite.
- L’utilisateur arrive directement sur l’onboarding (choix du rôle), puis le dashboard.

**Où faire :**

1. Supabase → **Authentication** → **Providers**.
2. Clique sur **Email**.
3. **Désactive** l’option **Confirm email** (ou "Enable email confirmations").
4. **Save**.

Après ça, tu peux t’inscrire avec email + mot de passe autant de fois que tu veux pour tester, sans limite d’envoi d’emails.

---

## 2. Réactiver la confirmation en production (plus tard)

Quand tu passeras en production, tu pourras :

- Réactiver **Confirm email**.
- Configurer un **SMTP personnalisé** (Resend, SendGrid, etc.) dans Supabase pour avoir plus d’envois et moins de limites.
- Les utilisateurs recevront alors un lien de confirmation avant d’accéder à l’app.

---

## 3. Si tu vois quand même "email rate limit exceeded"

- Attends environ **1 heure** (la limite se réinitialise).
- Ou utilise **Continuer avec Google** pour te connecter sans attendre.
- L’app affiche un message en français qui propose Google en alternative.

En dev, avec la confirmation email **désactivée**, tu ne devrais plus rencontrer ce blocage sur l’inscription par email.
