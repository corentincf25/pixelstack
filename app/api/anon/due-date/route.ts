import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest } from "@/lib/anon-utils";

/**
 * PATCH /api/anon/due-date
 * Body: { token: string, due_date: string | null } (ISO date string or null)
 * Met à jour la date de rendu du projet pour un invité (session valide).
 */
export async function PATCH(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  let body: { token?: string; due_date?: string | null };
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

  const dueDate = body.due_date === null || body.due_date === undefined
    ? null
    : typeof body.due_date === "string"
      ? body.due_date.trim()
      : null;
  const iso = dueDate ? new Date(dueDate).toISOString() : null;
  if (dueDate && iso === "Invalid Date") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const { error } = await admin
    .from("projects")
    .update({ due_date: iso })
    .eq("id", projectId);

  if (error) {
    console.error("[anon/due-date]", error);
    return NextResponse.json({ error: "Impossible de mettre à jour la date" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
