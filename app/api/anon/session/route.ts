import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "ps_anon_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

/**
 * POST /api/anon/session
 * Body: { token: string }
 * Valide le token d'invitation, crée ou récupère une session anonyme, pose le cookie et retourne { sessionId, projectId }.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token.trim() : null;
  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const { data: projectId } = await admin.rpc("get_project_id_by_invite_token", { p_token: token });
  const pid = typeof projectId === "string" ? projectId : null;
  if (!pid) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  const existingSession = request.cookies.get(COOKIE_NAME)?.value;
  if (existingSession) {
    const { data: row } = await admin
      .from("anonymous_sessions")
      .select("id, project_id")
      .eq("id", existingSession)
      .eq("project_id", pid)
      .single();
    if (row) {
      return NextResponse.json({ sessionId: row.id, projectId: row.project_id }, {
        headers: {
          "Set-Cookie": `${COOKIE_NAME}=${row.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
    }
  }

  const { data: newRow, error } = await admin
    .from("anonymous_sessions")
    .insert({ project_id: pid, invite_token: token })
    .select("id, project_id")
    .single();

  if (error || !newRow) {
    console.error("[anon/session] insert error", error);
    return NextResponse.json({ error: "Impossible de créer la session" }, { status: 500 });
  }

  const res = NextResponse.json({ sessionId: newRow.id, projectId: newRow.project_id });
  res.cookies.set(COOKIE_NAME, newRow.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
