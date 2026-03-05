import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPIRES_IN = 3600; // 1 heure

/**
 * POST body: { paths: string[] } — chemins Storage (ex. "projectId/file.png").
 * Vérifie que l'utilisateur est membre du projet (client_id ou designer_id).
 * Retourne { urls: Record<path, signedUrl> }.
 */
export async function POST(
  req: Request,
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

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_id, designer_id")
    .eq("id", projectId)
    .single();
  if (!project || (project.client_id !== user.id && project.designer_id !== user.id)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: { paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  const paths = Array.isArray(body?.paths) ? body.paths : [];
  if (paths.length === 0) {
    return NextResponse.json({ urls: {} });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const urls: Record<string, string> = {};
  for (const path of paths) {
    if (!path || typeof path !== "string") continue;
    if (!path.startsWith(projectId + "/") && path !== projectId) {
      continue;
    }
    const { data: signed } = await admin.storage
      .from("assets")
      .createSignedUrl(path, EXPIRES_IN);
    if (signed?.signedUrl) {
      urls[path] = signed.signedUrl;
    }
  }

  return NextResponse.json({ urls });
}
