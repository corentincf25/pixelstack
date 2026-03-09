import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

/**
 * POST /api/anon/asset-feedback
 * Body: { token: string, asset_id: string, content: string }
 * Cookie: ps_anon_sid
 * Ajoute un commentaire sur un asset (asset_feedback avec anonymous_session_id).
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const sessionId = getAnonSessionIdFromRequest(request);
  if (!sessionId) {
    return NextResponse.json({ error: "Session anonyme requise" }, { status: 401 });
  }

  let body: { token?: string; asset_id?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : null;
  const assetId = typeof body?.asset_id === "string" ? body.asset_id.trim() : null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!token || !assetId || !content) {
    return NextResponse.json({ error: "token, asset_id et content requis" }, { status: 400 });
  }

  const { data: projectIdFromToken } = await admin.rpc("get_project_id_by_invite_token", { p_token: token });
  const projectId = typeof projectIdFromToken === "string" ? projectIdFromToken : null;
  if (!projectId) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  const { data: session } = await admin
    .from("anonymous_sessions")
    .select("id, project_id")
    .eq("id", sessionId)
    .single();
  if (!session || session.project_id !== projectId) {
    return NextResponse.json({ error: "Session invalide pour ce projet" }, { status: 403 });
  }

  const { data: asset } = await admin
    .from("assets")
    .select("id, project_id")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .single();
  if (!asset) {
    return NextResponse.json({ error: "Asset introuvable" }, { status: 404 });
  }

  const { data: inserted, error } = await admin
    .from("asset_feedback")
    .insert({
      asset_id: assetId,
      user_id: null,
      anonymous_session_id: sessionId,
      content,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[anon/asset-feedback] insert error", error);
    return NextResponse.json({ error: "Impossible d'ajouter le commentaire" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const secret = process.env.NOTIFY_INTERNAL_SECRET ?? process.env.CRON_SECRET ?? "anon-internal";
  if (baseUrl) {
    fetch(`${baseUrl}/api/notify-project-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-notify": secret },
      body: JSON.stringify({ projectId, type: "feedback" }),
    }).catch((e) => console.warn("[anon/asset-feedback] notify fetch failed", e));
  }

  return NextResponse.json({ id: inserted?.id, created_at: inserted?.created_at });
}
