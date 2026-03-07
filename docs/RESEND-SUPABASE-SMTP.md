# Configurer Supabase pour envoyer les mails (confirmation, etc.) via Resend

Par défaut, Supabase envoie les emails d’authentification (confirmation d’email, magic link, reset mot de passe) avec son propre SMTP, ce qui limite fortement le volume. Pour envoyer en quantité et depuis ton domaine (`pixelstack.fr`), configure Supabase pour utiliser **Resend** en SMTP.

---

## 1. Vérifier le domaine sur Resend

1. Va sur [Resend → Domains](https://resend.com/domains) et ajoute **pixelstack.fr** si ce n’est pas déjà fait.
2. Resend affiche les enregistrements DNS à créer (DKIM, SPF, MX pour le sous-domaine `send`).
3. Chez ton registrar (OVH, Cloudflare, etc.), ajoute **exactement** ces enregistrements :
   - **TXT** `resend._domainkey` (contenu fourni par Resend)
   - **MX** `send` → valeur indiquée par Resend (priorité 10)
   - **TXT** `send` → `v=spf1 include:amazonses.com ~all` (ou la valeur exacte Resend)
4. Attends la propagation DNS (quelques minutes à 1 h), puis dans Resend clique sur **« I've added the records »** pour lancer la vérification.
5. Une fois le domaine vérifié (coche verte), tu peux envoyer depuis des adresses du type `noreply@pixelstack.fr` ou `onboarding@pixelstack.fr`.

---

## 2. Récupérer la clé API Resend

1. [Resend → API Keys](https://resend.com/api-keys).
2. Crée une clé (ou utilise celle que tu as déjà pour l’app).
3. Copie la clé : elle servira à la fois pour l’app (variable `RESEND_API_KEY`) et comme **mot de passe SMTP** dans Supabase.

---

## 3. Configurer le SMTP personnalisé dans Supabase

1. Ouvre ton projet sur [Supabase Dashboard](https://supabase.com/dashboard).
2. **Project Settings** (icône engrenage) → **Authentication** → onglet **SMTP Settings**.
3. Active **Enable Custom SMTP**.
4. Renseigne :

   | Champ | Valeur |
   |-------|--------|
   | **Sender email** | `noreply@pixelstack.fr` (ou `onboarding@pixelstack.fr` — doit être une adresse sur ton domaine vérifié Resend) |
   | **Sender name** | `Pixelstack` |
   | **Host** | `smtp.resend.com` |
   | **Port** | `465` |
   | **Username** | `resend` |
   | **Password** | Ta **clé API Resend** (celle utilisée dans `RESEND_API_KEY`) |

5. Laisse **Secure Email Change** activé si tu veux que les changements d’email soient confirmés.
6. Clique sur **Save**.

Référence Resend : [Send with SMTP](https://resend.com/docs/send-with-smtp).

---

## 4. Résultat

- Tous les emails d’auth Supabase (confirmation d’inscription, magic link, reset mot de passe, etc.) passent par Resend.
- Les limites d’envoi sont celles de ton plan Resend, plus élevées que le SMTP par défaut de Supabase.
- Les emails partent depuis `noreply@pixelstack.fr` (ou l’adresse choisie), avec un meilleur taux de délivrabilité si les DNS (DKIM/SPF) sont bien configurés.

---

## 5. Variables d’environnement (app)

Dans Vercel / `.env.local`, garde :

- `RESEND_API_KEY` : pour l’envoi des **notifications projet** depuis l’app (route `/api/notify-project-update`).
- `RESEND_FROM` : tu peux passer à `Pixelstack <noreply@pixelstack.fr>` une fois le domaine vérifié, pour que les mails “À consulter” utilisent aussi ton domaine.

La même clé API Resend est utilisée :  
- par **Supabase** (SMTP) pour les mails d’auth ;  
- par **l’app** (API Resend) pour les notifications projet.
