-- Permet d'accepter une invitation projet sans être encore membre (contourne RLS pour cette action).
CREATE OR REPLACE FUNCTION public.accept_project_invite(invite_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
  v_project_id UUID;
  v_role TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, project_id, role
  INTO v_invite_id, v_project_id, v_role
  FROM public.project_invites
  WHERE token = invite_token
    AND expires_at > now();

  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF v_role = 'client' THEN
    UPDATE public.projects SET client_id = v_user_id WHERE id = v_project_id;
  ELSIF v_role = 'designer' THEN
    UPDATE public.projects SET designer_id = v_user_id WHERE id = v_project_id;
  ELSE
    RAISE EXCEPTION 'Invalid invite role';
  END IF;

  DELETE FROM public.project_invites WHERE id = v_invite_id;

  RETURN v_project_id;
END;
$$;

-- RLS: allow authenticated users to call this function (they pass the token).
-- The function itself runs as SECURITY DEFINER and does the update.
