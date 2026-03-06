# Checklist release V0 — Pixelstack

État des lieux pour lancer la **première version** (V0) en production.

---

## ✅ Déjà en place (prêt pour la V0)

### Produit & UX
- [x] Landing page (FR), navbar, sections, footer avec liens CGU / Confidentialité
- [x] Auth : inscription (email + Google), connexion, onboarding rôle (designer / youtuber)
- [x] Inscription : case obligatoire « J’accepte les CGU et la Politique de confidentialité »
- [x] Dashboard selon le rôle (designer : stats, stockage, calendrier, projets ; youtuber : projets)
- [x] Création de projet, invitation (lien client / designer / relecteur), acceptation
- [x] Page projet : brief, assets, versions, inspirations & références, chat, intervenants, actions, suppression (accord des deux parties)
- [x] Upload assets / versions / refs / images dans le chat, avec vérification du quota
- [x] Notifications email (Resend) : version, assets, message, référence
- [x] Stockage : quota par plan (100 Mo / 10 Go / 50 Go), check-quota avant chaque upload
- [x] Page Facturation : plan actuel, stockage, boutons Pro/Studio (mensuel ou annuel), portail Stripe
- [x] Pages légales : `/legal/terms`, `/legal/privacy` (accessibles sans compte, lien dans le footer)
- [x] Responsive (sidebar → drawer sur mobile, layouts adaptés)
- [x] DA : thème sombre, couleurs par rôle (violet/bleu designer, rouge youtuber)

### Technique & Sécurité
- [x] Supabase : auth, DB, storage (buckets `assets` privé, `avatars` public), RLS + `is_project_member`
- [x] Stripe : Checkout (plan + interval), webhook (checkout.session.completed, subscription.updated/deleted), Customer Portal
- [x] Variables Stripe : 4 prix (Pro/Studio × Monthly/Yearly) + Secret key + Webhook secret
- [x] Service role uniquement côté serveur ; pas d’exposition de secrets côté client
- [x] APIs protégées (auth + membership où il faut)
- [x] Cron nettoyage projets orphelins (sans graphiste depuis 7 jours) — à brancher en prod

### Doc & Config
- [x] `.env.example` avec toutes les variables
- [x] Docs : Vercel, Stripe (guide pas à pas + setup), recap lancement, cron

---

## À faire de ton côté pour la V0

### Obligatoire avant mise en ligne
1. **Supabase** : migrations exécutées sur le projet de prod ; buckets `assets` et `avatars` créés.
2. **Vercel** : toutes les variables d’environnement renseignées (Supabase, Stripe, Resend, `NEXT_PUBLIC_APP_URL`).
3. **Stripe** : webhook avec l’URL de prod ; 4 price IDs + secret key + webhook secret dans Vercel.
4. **Resend** : clé API (et domaine d’envoi si tu quittes `onboarding@resend.dev`).
5. **Supabase Auth** : URL de redirection de prod ajoutée dans les paramètres Auth.

### Recommandé pour la V0
6. **Cron** : configurer l’appel quotidien à `/api/cron/cleanup-orphan-projects` avec `CRON_SECRET`.
7. **Tests manuels** : signup → onboarding → création projet → invitation → upload → upgrade Pro/Studio → portail Stripe → pages legal.

### Optionnel pour la V0
8. Domaine perso (au lieu de xxx.vercel.app).
9. Stripe en mode Live (après validation en test).
10. Personnaliser les textes des pages CGU/Confidentialité (contact, nom de la société, etc.).

---

## Verdict V0

**Oui, en global tout est bon pour une release V0** : le produit est livrable (auth, projets, stockage, facturation, legal, emails).  

Il reste à **configurer et déployer** (Supabase prod, Vercel, Stripe, Resend, éventuellement cron) et à **tester** les parcours critiques. Aucun blocant fonctionnel côté code pour une première mise en ligne.
