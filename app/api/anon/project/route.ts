import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

const SIGNED_URL_EXPIRES = 3600;

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

  try {
    await admin.from("anonymous_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", sessionId);
  } catch {
    // colonne last_activity_at peut être absente si migration 027 non appliquée
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
    admin.from("project_references").select("id, kind, url, comment").eq("project_id", projectId),
    admin.from("assets").select("id", { count: "exact", head: true }).eq("anonymous_session_id", sessionId),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const versionIds = (versions ?? []).map((v) => v.id);
  let versionFeedback: Record<string, { id: string; content: string; created_at: string; anonymous_session_id: string | null }[]> = {};
  let versionSignedUrls: Record<string, string> = {};

  if (versionIds.length > 0) {
    const [fbRes, paths] = await Promise.all([
      admin.from("version_feedback").select("id, version_id, content, created_at, anonymous_session_id").in("version_id", versionIds).order("created_at", { ascending: true }),
      Promise.resolve((versions ?? []).map((v) => ({ id: v.id, path: extractStoragePath(v.image_url, projectId) }))),
    ]);
    const fbList = (fbRes.data ?? []) as { id: string; version_id: string; content: string; created_at: string; anonymous_session_id: string | null }[];
    fbList.forEach((f) => {
      if (!versionFeedback[f.version_id]) versionFeedback[f.version_id] = [];
      versionFeedback[f.version_id].push({ id: f.id, content: f.content, created_at: f.created_at, anonymous_session_id: f.anonymous_session_id });
    });
    for (const { id, path } of paths) {
      const pathForProject = toProjectPath(path, projectId);
      if (!pathForProject) continue;
      try {
        const { data: signed } = await admin.storage.from("assets").createSignedUrl(pathForProject, SIGNED_URL_EXPIRES);
        if (signed?.signedUrl) versionSignedUrls[id] = signed.signedUrl;
      } catch {
        // ignore single version URL failure
      }
    }
  }

  const refsList = (refs ?? []) as { id: string; kind: string; url: string; comment?: string | null }[];
  const referenceSignedUrls: Record<string, string> = {};
  for (const r of refsList) {
    if (r.kind !== "image") continue;
    const path = extractStoragePath(r.url, projectId);
    const pathForProject = toProjectPath(path, projectId);
    if (!pathForProject) continue;
    try {
      const { data: signed } = await admin.storage.from("assets").createSignedUrl(pathForProject, SIGNED_URL_EXPIRES);
      if (signed?.signedUrl) referenceSignedUrls[r.id] = signed.signedUrl;
    } catch {
      // ignore
    }
  }

  const assetsList = (assets ?? []) as { id: string; file_url: string }[];
  const assetSignedUrls: Record<string, string> = {};
  for (const a of assetsList) {
    const path = extractStoragePath(a.file_url, projectId);
    const pathForProject = toProjectPath(path, projectId);
    if (!pathForProject) continue;
    try {
      const { data: signed } = await admin.storage.from("assets").createSignedUrl(pathForProject, SIGNED_URL_EXPIRES);
      if (signed?.signedUrl) assetSignedUrls[a.id] = signed.signedUrl;
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    project,
    messages: messages ?? [],
    versions: versions ?? [],
    assets: assets ?? [],
    brief: brief ?? null,
    references: refsList,
    sessionId,
    anonUploadCount: anonUploadCount ?? 0,
    versionFeedback,
    versionSignedUrls,
    referenceSignedUrls,
    assetSignedUrls,
  });
}
