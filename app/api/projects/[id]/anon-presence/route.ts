import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVE_WINDOW_MINUTES = 2;

/**
 * GET /api/projects/[id]/anon-presence
 * Retourne le nombre d'invités anonymes "actifs" (last_activity_at dans les 2 dernières minutes).
 * Réservé aux membres du projet (designer, client, relecteur).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié", count: 0 }, { status: 401 });
  }

  const { data: isMember } = await supabase.rpc("is_project_member", { p_project_id: projectId });
  if (!isMember) {
    return NextResponse.json({ error: "Accès refusé", count: 0 }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const since = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await admin
      .from("anonymous_sessions")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .gte("last_activity_at", since);
    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
