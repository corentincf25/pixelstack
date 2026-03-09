import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest, ANON_LIMITS } from "@/lib/anon-utils";

const COOKIE_NAME = "ps_anon_sid";

/**
 * POST /api/anon/message
 * Body: { token: string, content: string, image_url?: string, image_size_bytes?: number }
 * Cookie: ps_anon_sid (session id)
 * Vérifie le token, que la session appartient au projet du token, respecte la limite de messages, insère avec anonymous_session_id.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const sessionId = getAnonSessionIdFromRequest(request) ?? request.headers.get("x-ps-anon-session");
  if (!sessionId) {
    return NextResponse.json({ error: "Session anonyme requise" }, { status: 401 });
  }

  let body: { token?: string; content?: string; image_url?: string; image_size_bytes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : null;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }
  if (!content && !body?.image_url) {
    return NextResponse.json({ error: "Contenu ou image requis" }, { status: 400 });
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

  const { count } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("anonymous_session_id", sessionId);
  if ((count ?? 0) >= ANON_LIMITS.maxMessages) {
    return NextResponse.json(
      { error: "Limite de messages atteinte. Créez un compte gratuit pour continuer." },
      { status: 429 }
    );
  }

  try {
    await admin.from("anonymous_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", sessionId);
  } catch {
    // colonne last_activity_at peut être absente si migration 027 non appliquée
  }

  const { data: inserted, error } = await admin
    .from("messages")
    .insert({
      project_id: projectId,
      sender_id: null,
      anonymous_session_id: sessionId,
      content: content || " ",
      image_url: body?.image_url ?? null,
      image_size_bytes: body?.image_size_bytes ?? null,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[anon/message] insert error", error);
    return NextResponse.json({ error: "Impossible d'envoyer le message" }, { status: 500 });
  }

  // Notifier les membres du projet (designer, client, relecteurs) — email + push
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const secret = process.env.NOTIFY_INTERNAL_SECRET ?? process.env.CRON_SECRET ?? "anon-internal";
  if (baseUrl) {
    fetch(`${baseUrl}/api/notify-project-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-notify": secret },
      body: JSON.stringify({ projectId, type: "message" }),
    }).catch((e) => console.warn("[anon/message] notify fetch failed", e));
  }

  return NextResponse.json({ id: inserted?.id, created_at: inserted?.created_at });
}
