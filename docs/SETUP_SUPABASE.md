# thumb.io — Supabase setup

## 1. Run the migration

In the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the contents of:

- `supabase/migrations/001_schema_and_rls.sql`

This creates/updates:

- `profiles` (id, full_name, avatar_url, role, …) with RLS
- `projects` columns (client_id, designer_id, due_date, …) and RLS
- `briefs`, `assets`, `versions`, `messages`, `project_invites` with RLS
- Trigger to create a profile on signup (role = NULL until onboarding)

## 2. Enable Google OAuth

1. In Supabase: **Authentication** → **Providers** → **Google** → Enable.
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - Authorized redirect URIs:  
     `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret into the Supabase Google provider.

## 3. Redirect URLs

In Supabase **Authentication** → **URL Configuration**:

- **Site URL**: your app URL (e.g. `http://localhost:3000` or production).
- **Redirect URLs**: add  
  `http://localhost:3000/auth/callback`  
  and your production URL, e.g.  
  `https://yourdomain.com/auth/callback`.

## 4. Environment variables

Already in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No extra env vars needed for Google (configured in Supabase).
