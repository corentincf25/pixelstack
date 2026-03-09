import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonSessionIdFromRequest, ANON_LIMITS } from "@/lib/anon-utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/zip"];

/**
 * POST /api/anon/upload
 * FormData: token (string), file (File)
 * Cookie: ps_anon_sid
 * Vérifie token + session, limite 3 uploads par session, envoie le fichier dans le bucket assets et insère une ligne assets avec anonymous_session_id.
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData invalide" }, { status: 400 });
  }

  const token = formData.get("token");
  const file = formData.get("file");
  const t = typeof token === "string" ? token.trim() : null;
  if (!t) return NextResponse.json({ error: "Token requis" }, { status: 400 });
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "Type de fichier non autorisé (images ou zip)" }, { status: 400 });
  }

  const { data: projectIdFromToken } = await admin.rpc("get_project_id_by_invite_token", { p_token: t });
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
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("anonymous_session_id", sessionId);
  if ((count ?? 0) >= ANON_LIMITS.maxUploads) {
    return NextResponse.json(
      { error: "Limite d'uploads atteinte. Créez un compte gratuit pour continuer." },
      { status: 429 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${projectId}/anon/${sessionId}/${Date.now()}-${safeName}`;

  try {
    await admin.from("anonymous_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", sessionId);
  } catch {
    // colonne last_activity_at peut être absente si migration 027 non appliquée
  }

  const { error: uploadErr } = await admin.storage.from("assets").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadErr) {
    console.error("[anon/upload] storage error", uploadErr);
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("assets").getPublicUrl(path);
  const { data: inserted, error: insertErr } = await admin
    .from("assets")
    .insert({
      project_id: projectId,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      kind: file.type.startsWith("image/") ? "image" : "zip",
      anonymous_session_id: sessionId,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[anon/upload] insert error", insertErr);
    return NextResponse.json({ error: "Échec d'enregistrement" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const secret = process.env.NOTIFY_INTERNAL_SECRET ?? process.env.CRON_SECRET ?? "anon-internal";
  if (baseUrl) {
    fetch(`${baseUrl}/api/notify-project-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-notify": secret },
      body: JSON.stringify({ projectId, type: "assets" }),
    }).catch((e) => console.warn("[anon/upload] notify fetch failed", e));
  }

  return NextResponse.json({ id: inserted.id });
}
