-- Mini Maker: schema + RLS (designer / youtuber, invite flow)
-- Run this in Supabase SQL Editor or via Supabase CLI.

-- ========== PROFILES (1:1 with auth.users) ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IS NULL OR role IN ('designer', 'youtuber')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Read other profiles only when in same project (for display name/avatar)
CREATE POLICY "Project members can read each other profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE (p.client_id = auth.uid() OR p.designer_id = auth.uid())
        AND (p.client_id = profiles.id OR p.designer_id = profiles.id)
    )
  );

-- ========== PROJECTS ==========
-- Assumes public.projects exists with at least id, title, status. Add missing columns:
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS designer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure client_id, designer_id exist (they should from your spec)
-- RLS: user sees only projects where they are client or designer
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own projects" ON public.projects;
CREATE POLICY "Users can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = designer_id);

DROP POLICY IF EXISTS "Users can insert projects" ON public.projects;
CREATE POLICY "Users can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() = client_id OR auth.uid() = designer_id
  );

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = designer_id);

-- ========== BRIEFS (1:1 per project) ==========
CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  concept TEXT,
  hook TEXT,
  notes TEXT,
  constraints TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can manage briefs" ON public.briefs;
CREATE POLICY "Project members can manage briefs"
  ON public.briefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = briefs.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = briefs.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- ========== ASSETS ==========
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'image' CHECK (kind IN ('image', 'zip'));

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can read assets" ON public.assets;
CREATE POLICY "Project members can read assets"
  ON public.assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = assets.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Project members can insert assets" ON public.assets;
CREATE POLICY "Project members can insert assets"
  ON public.assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = assets.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- ========== VERSIONS ==========
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can read versions" ON public.versions;
DROP POLICY IF EXISTS "Project members can insert versions" ON public.versions;
DROP POLICY IF EXISTS "Project members can update versions" ON public.versions;
CREATE POLICY "Project members can read versions"
  ON public.versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = versions.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- Only designer can insert/update versions (optional: allow client for "request changes" metadata; here only designer uploads)
CREATE POLICY "Project members can insert versions"
  ON public.versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = versions.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

CREATE POLICY "Project members can update versions"
  ON public.versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = versions.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- ========== MESSAGES ==========
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Project members can insert messages" ON public.messages;
CREATE POLICY "Project members can read messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = messages.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

CREATE POLICY "Project members can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = messages.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- ========== PROJECT INVITES ==========
CREATE TABLE IF NOT EXISTS public.project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('client', 'designer')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_invites_token ON public.project_invites(token);
CREATE INDEX IF NOT EXISTS idx_project_invites_project_id ON public.project_invites(project_id);

ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;

-- Creator of the project (client_id or designer_id) can manage invites for that project
DROP POLICY IF EXISTS "Project creator can manage invites" ON public.project_invites;
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.project_invites;
CREATE POLICY "Project creator can manage invites"
  ON public.project_invites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_invites.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_invites.project_id AND (p.client_id = auth.uid() OR p.designer_id = auth.uid())
    )
  );

-- Anyone with the token can read the invite (to accept)
CREATE POLICY "Anyone can read invite by token"
  ON public.project_invites FOR SELECT
  USING (true);

-- ========== TRIGGER: create profile on signup ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();