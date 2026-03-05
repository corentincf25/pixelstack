-- Suppression projet avec accord des deux parties + Realtime pour messages

-- Colonnes pour la demande de suppression (un des deux demande, l'autre confirme)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS delete_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delete_requested_at TIMESTAMPTZ;

-- Les membres du projet peuvent supprimer le projet (après accord)
DROP POLICY IF EXISTS "Project members can delete project" ON public.projects;
CREATE POLICY "Project members can delete project"
  ON public.projects FOR DELETE
  USING (auth.uid() = client_id OR auth.uid() = designer_id);

-- Activer la publication Realtime pour la table messages (synchro chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
