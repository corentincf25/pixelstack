import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/projects/[id]/activity-counts
 * Retourne les compteurs messages, versions, assets, references pour détecter une nouvelle activité.
 * Réservé aux membres du projet.
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
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: isMember } = await supabase.rpc("is_project_member", { p_project_id: projectId });
  if (!isMember) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [
    { count: messagesCount },
    { count: versionsCount },
    { count: assetsCount },
    { count: referencesCount },
  ] = await Promise.all([
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("versions").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("project_references").select("id", { count: "exact", head: true }).eq("project_id", projectId),
  ]);

  return NextResponse.json({
    messagesCount: messagesCount ?? 0,
    versionsCount: versionsCount ?? 0,
    assetsCount: assetsCount ?? 0,
    referencesCount: referencesCount ?? 0,
  });
}
