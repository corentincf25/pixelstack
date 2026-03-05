-- Bucket "assets" pour les fichiers des projets (images, zip). 10 Mo max par fichier.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('assets', 'assets', true, 10485760)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Lecture : les membres du projet peuvent voir les fichiers du projet (path = project_id/...)
DROP POLICY IF EXISTS "Project members can read assets storage" ON storage.objects;
CREATE POLICY "Project members can read assets storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 1)
      AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- Écriture : les membres du projet peuvent uploader dans le dossier de leur projet
DROP POLICY IF EXISTS "Project members can upload assets storage" ON storage.objects;
CREATE POLICY "Project members can upload assets storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = split_part(name, '/', 1)
      AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );
