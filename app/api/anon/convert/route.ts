import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

/**
 * POST /api/anon/convert
 * Body: { token: string } ou cookie ps_anon_sid
 * Utilisateur doit être connecté (vient de s'inscrire).
 * Rattache les messages et assets de la session anonyme au user_id, puis supprime la session.
 * Redirection côté client vers /projects/[id].
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let body: { token?: string };
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const token = typeof body?.token === "string" ? body.token.trim() : null;
  const sessionId = getAnonSessionIdFromRequest(request);

  let targetSessionId: string | null = sessionId;
  let projectId: string | null = null;

  if (token) {
    const { data: pid } = await admin.rpc("get_project_id_by_invite_token", { p_token: token });
    projectId = typeof pid === "string" ? pid : null;
  }

  if (!targetSessionId && token && projectId) {
    const { data: sessionRow } = await admin
      .from("anonymous_sessions")
      .select("id, project_id")
      .eq("invite_token", token)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sessionRow) {
      targetSessionId = sessionRow.id;
      projectId = sessionRow.project_id;
    }
  }

  if (!targetSessionId) {
    return NextResponse.json({ error: "Session anonyme introuvable" }, { status: 400 });
  }

  const { data: session } = await admin
    .from("anonymous_sessions")
    .select("id, project_id, invite_token")
    .eq("id", targetSessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session déjà convertie ou invalide" }, { status: 404 });
  }

  projectId = session.project_id;

  const { data: inviteRow } = await admin
    .from("project_invites")
    .select("role")
    .eq("project_id", projectId)
    .eq("token", session.invite_token)
    .maybeSingle();
  const role = inviteRow?.role;
  if (role === "client") {
    await admin.from("projects").update({ client_id: user.id }).eq("id", projectId);
  } else if (role === "designer") {
    await admin.from("projects").update({ designer_id: user.id }).eq("id", projectId);
  }

  await admin.from("messages").update({ sender_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
  await admin.from("assets").update({ anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
  await admin.from("version_feedback").update({ user_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
  await admin.from("asset_feedback").update({ user_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);

  await admin.from("anonymous_sessions").delete().eq("id", targetSessionId);

  return NextResponse.json({ projectId, converted: true });
}
