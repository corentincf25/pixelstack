-- Archivage de projet : n'apparaît plus dans le dashboard par défaut.
-- Chaque membre peut archiver sans accord de l'autre. Un cron purge les données après 7 jours.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN public.projects.archived_at IS 'Si non NULL, projet archivé : masqué du dashboard par défaut, données purgées après 7 jours par le cron.';
