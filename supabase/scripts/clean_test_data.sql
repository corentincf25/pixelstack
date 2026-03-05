-- Nettoyage des données de test (thumb.io)
-- À exécuter dans Supabase → SQL Editor.
-- Ensuite, supprime les utilisateurs dans Authentication → Users pour réutiliser le même email.

DELETE FROM public.project_invites;
DELETE FROM public.messages;
DELETE FROM public.versions;
DELETE FROM public.assets;
DELETE FROM public.briefs;
DELETE FROM public.projects;
DELETE FROM public.profiles;
