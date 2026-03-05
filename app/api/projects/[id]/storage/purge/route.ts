import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeProjectStorage } from "@/lib/project-storage";

/**
 * POST body: { confirm: true }
 * Supprime tout le stockage du projet (assets, versions, références, chat) en DB et dans le bucket.
 * Réservé au graphiste du projet (designer_id = user).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, designer_id")
    .eq("id", projectId)
    .single();
  if (!project || project.designer_id !== user.id) {
    return NextResponse.json({ error: "Seul le graphiste du projet peut purger le stockage." }, { status: 403 });
  }

  let body: { confirm?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  if (body?.confirm !== true) {
    return NextResponse.json({ error: "Confirmation requise (confirm: true)" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const removed = await purgeProjectStorage(admin, projectId);

  await admin.from("assets").delete().eq("project_id", projectId);
  await admin.from("versions").delete().eq("project_id", projectId);
  await admin.from("project_references").delete().eq("project_id", projectId);

  return NextResponse.json({ ok: true, removed });
}
