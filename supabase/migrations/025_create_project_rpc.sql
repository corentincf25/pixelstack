-- RPC pour créer un projet en contournant les soucis RLS : l'utilisateur authentifié
-- crée un projet dont il est soit client soit graphiste.
-- À utiliser depuis le front à la place de l'insert direct sur projects.

CREATE OR REPLACE FUNCTION public.create_project(
  p_title TEXT,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_as_role TEXT DEFAULT 'designer'  -- 'designer' | 'client'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_client_id UUID := NULL;
  v_designer_id UUID := NULL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF p_as_role = 'client' THEN
    v_client_id := v_user_id;
  ELSE
    v_designer_id := v_user_id;
  END IF;

  INSERT INTO public.projects (title, status, client_id, designer_id, due_date)
  VALUES (p_title, 'draft', v_client_id, v_designer_id, p_due_date)
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_project(TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
COMMENT ON FUNCTION public.create_project IS 'Crée un projet avec l''utilisateur courant comme client ou graphiste. Utilisé par l''app pour éviter les erreurs RLS sur INSERT.';
