import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

/**
 * POST /api/anon/convert
 * Body: { token: string } (recommandé après inscription) ou cookie ps_anon_sid
 * Utilisateur doit être connecté (vient de s'inscrire).
 * 1) Rattache messages/assets/feedback de la session anonyme au user_id si une session existe.
 * 2) Lie systématiquement l'utilisateur au projet (client_id, designer_id ou project_collaborators) selon l'invite.
 * Ainsi le projet reste visible après création de compte même si la session anonyme a expiré ou n'existe plus.
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

  if (!projectId) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  let inviteToken: string | null = token;
  if (!inviteToken && targetSessionId) {
    const { data: sess } = await admin.from("anonymous_sessions").select("invite_token").eq("id", targetSessionId).single();
    inviteToken = sess?.invite_token ?? null;
  }

  if (targetSessionId) {
    const { data: session } = await admin
      .from("anonymous_sessions")
      .select("id")
      .eq("id", targetSessionId)
      .single();

    if (session) {
      await admin.from("messages").update({ sender_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
      await admin.from("assets").update({ anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
      await admin.from("version_feedback").update({ user_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
      await admin.from("asset_feedback").update({ user_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
      await admin.from("reference_feedback").update({ user_id: user.id, anonymous_session_id: null }).eq("anonymous_session_id", targetSessionId);
      await admin.from("anonymous_sessions").delete().eq("id", targetSessionId);
    }
  }

  if (inviteToken) {
    const { data: inviteRow } = await admin
      .from("project_invites")
      .select("role")
      .eq("project_id", projectId)
      .eq("token", inviteToken)
      .maybeSingle();
    const role = inviteRow?.role;
    if (role === "client") {
      await admin.from("projects").update({ client_id: user.id }).eq("id", projectId);
    } else if (role === "designer") {
      await admin.from("projects").update({ designer_id: user.id }).eq("id", projectId);
    } else if (role === "reviewer") {
      await admin.from("project_collaborators").upsert({ project_id: projectId, user_id: user.id }, { onConflict: "project_id,user_id" });
    }
  }

  return NextResponse.json({ projectId, converted: true });
}
