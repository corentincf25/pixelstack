import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

/**
 * PATCH /api/anon/brief
 * Body: { token: string, concept?: string, hook?: string, notes?: string }
 * Met à jour le brief du projet pour un invité (session valide).
 */
export async function PATCH(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let body: { token?: string; concept?: string; hook?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const { data: projectIdFromToken } = await admin.rpc("get_project_id_by_invite_token", { p_token: token });
  const projectId = typeof projectIdFromToken === "string" ? projectIdFromToken : null;
  if (!projectId) {
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
    .single();
  if (!session || session.project_id !== projectId) {
    return NextResponse.json({ error: "Session invalide pour ce projet" }, { status: 403 });
  }

  const { data: existing } = await admin.from("briefs").select("concept, hook, notes").eq("project_id", projectId).maybeSingle();
  const concept = body.concept !== undefined ? (typeof body.concept === "string" ? body.concept.trim() || null : null) : (existing?.concept ?? null);
  const hook = body.hook !== undefined ? (typeof body.hook === "string" ? body.hook.trim() || null : null) : (existing?.hook ?? null);
  const notes = body.notes !== undefined ? (typeof body.notes === "string" ? body.notes.trim() || null : null) : (existing?.notes ?? null);

  const { error } = await admin
    .from("briefs")
    .upsert(
      {
        project_id: projectId,
        concept,
        hook,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id" }
    );

  if (error) {
    console.error("[anon/brief]", error);
    return NextResponse.json({ error: "Impossible de sauvegarder le brief" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
