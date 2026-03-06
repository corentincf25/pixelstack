-- Garantit que tout utilisateur authentifié peut créer un projet dont il est client ou graphiste.
-- Corrige l'erreur "new row violates row-level security policy for table projects".
DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
CREATE POLICY "Users can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id OR auth.uid() = designer_id
  );

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = designer_id)
  WITH CHECK (auth.uid() = client_id OR auth.uid() = designer_id);
