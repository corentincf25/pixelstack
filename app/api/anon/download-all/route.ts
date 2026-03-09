import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";
import archiver from "archiver";

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
 * GET /api/anon/download-all?token=xxx
 * Cookie: ps_anon_sid
 * Retourne un ZIP de tous les assets du projet pour l'invité.
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

  const { data: assets } = await admin
    .from("assets")
    .select("id, file_url, file_name")
    .eq("project_id", projectIdStr)
    .order("created_at", { ascending: true });

  if (!assets || assets.length === 0) {
    return NextResponse.json({ error: "Aucun asset à télécharger" }, { status: 400 });
  }

  const chunks: Buffer[] = [];
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const asset of assets) {
    try {
      const path = extractStoragePath((asset as { file_url: string }).file_url, projectIdStr);
      const pathForProject = toProjectPath(path, projectIdStr);
      if (!pathForProject || !pathForProject.startsWith(projectIdStr + "/")) continue;
      const { data: file, error } = await admin.storage.from("assets").download(pathForProject);
      if (error || !file) continue;
      const name = (asset as { file_name: string | null }).file_name || `asset-${asset.id}`;
      archive.append(Buffer.from(await file.arrayBuffer()), { name });
    } catch {
      // skip failed file
    }
  }
  archive.finalize();

  const zipBuffer = await done;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="assets-projet-${projectIdStr.slice(0, 8)}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
