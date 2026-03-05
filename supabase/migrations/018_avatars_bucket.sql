-- Bucket "avatars" pour les photos de profil (public, max 500 Ko par fichier).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 524288)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Lecture : tout le monde peut voir les avatars (bucket public).
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Écriture : chaque utilisateur peut uploader/remplacer uniquement son fichier (avatars/{user_id}.jpg).
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (name = (auth.uid()::text || '.jpg') OR name = (auth.uid()::text || '.jpeg') OR name = (auth.uid()::text || '.webp'))
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = split_part(name, '.', 1)
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = split_part(name, '.', 1)
  );
