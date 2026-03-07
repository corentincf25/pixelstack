import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

/**
 * GET /api/anon/project?token=xxx
 * Cookie: ps_anon_sid
 * Valide le token et la session, retourne les données du projet (sans infos sensibles) pour l'affichage anonyme.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const token = request.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const { data: projectIdFromToken } = await admin.rpc("get_project_id_by_invite_token", {
    p_token: token.trim(),
  });
  const projectId = typeof projectIdFromToken === "string" ? projectIdFromToken : null;
  if (!projectId) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  const sessionId = getAnonSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session requise", projectId }, { status: 401 });
  }

  const { data: session } = await admin
    .from("anonymous_sessions")
    .select("id, project_id")
    .eq("id", sessionId)
    .single();
  if (!session || session.project_id !== projectId) {
    return NextResponse.json({ error: "Session invalide pour ce projet" }, { status: 403 });
  }

  const [
    { data: project },
    { data: messages },
    { data: versions },
    { data: assets },
    { data: brief },
    { data: refs },
    { count: anonUploadCount },
  ] = await Promise.all([
    admin.from("projects").select("id, title, status, created_at, due_date").eq("id", projectId).single(),
    admin.from("messages").select("id, content, created_at, image_url, sender_id, anonymous_session_id").eq("project_id", projectId).order("created_at", { ascending: true }),
    admin.from("versions").select("id, image_url, version_number, created_at").eq("project_id", projectId).order("version_number", { ascending: true }),
    admin.from("assets").select("id, file_url, file_name, kind, created_at").eq("project_id", projectId).order("created_at", { ascending: false }),
    admin.from("briefs").select("concept, hook, notes").eq("project_id", projectId).maybeSingle(),
    admin.from("project_references").select("id, kind, url").eq("project_id", projectId),
    admin.from("assets").select("id", { count: "exact", head: true }).eq("anonymous_session_id", sessionId),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    project,
    messages: messages ?? [],
    versions: versions ?? [],
    assets: assets ?? [],
    brief: brief ?? null,
    references: refs ?? [],
    sessionId,
    anonUploadCount: anonUploadCount ?? 0,
  });
}
