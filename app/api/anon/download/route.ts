import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

function extractStoragePath(url: string, projectId: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim().split("?")[0] ?? "";
  const idx = u.indexOf("/assets/");
  if (idx !== -1) return u.slice(idx + "/assets/".length) || null;
  if (!u.startsWith("http") && u.includes("/")) return u || null;
  if (!u.startsWith("http") && u.length > 0) return `${projectId}/versions/${u}`;
  return null;
}

function toProjectPath(path: string | null, projectId: string): string | null {
  if (!path?.trim()) return null;
  const p = path.trim();
  return p.startsWith(projectId + "/") ? p : `${projectId}/${p.replace(/^\/+/, "")}`;
}

/**
 * GET /api/anon/download?token=xxx&type=asset|version&id=yyy
 * Cookie: ps_anon_sid
 * Retourne le fichier avec Content-Disposition: attachment pour forcer le téléchargement.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!token?.trim() || (type !== "asset" && type !== "version") || !id?.trim()) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { data: projectId } = await admin.rpc("get_project_id_by_invite_token", { p_token: token.trim() });
  const projectIdStr = typeof projectId === "string" ? projectId : null;
  if (!projectIdStr) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  const sessionId = getAnonSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session requise" }, { status: 401 });
  }

  const { data: session } = await admin
    .from("anonymous_sessions")
    .select("id, project_id")
    .eq("id", sessionId)
    .eq("project_id", projectIdStr)
    .single();
  if (!session) {
    return NextResponse.json({ error: "Session invalide pour ce projet" }, { status: 403 });
  }

  let path: string | null = null;
  let filename = "file";

  if (type === "asset") {
    const { data: row } = await admin
      .from("assets")
      .select("file_url, file_name")
      .eq("id", id.trim())
      .eq("project_id", projectIdStr)
      .single();
    if (!row) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
    path = extractStoragePath((row as { file_url: string }).file_url, projectIdStr);
    filename = (row as { file_name: string | null }).file_name || "asset";
  } else {
    const { data: row } = await admin
      .from("versions")
      .select("image_url, version_number")
      .eq("id", id.trim())
      .eq("project_id", projectIdStr)
      .single();
    if (!row) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });
    path = extractStoragePath((row as { image_url: string }).image_url, projectIdStr);
    const num = (row as { version_number: number }).version_number;
    filename = `version-${num}.png`;
  }

  const pathForProject = toProjectPath(path, projectIdStr);
  if (!pathForProject || !pathForProject.startsWith(projectIdStr + "/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  const { data: file, error } = await admin.storage.from("assets").download(pathForProject);
  if (error || !file) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const contentType = pathForProject.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : file.type || "application/octet-stream";

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeName}"`,
    },
  });
}
