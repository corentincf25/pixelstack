import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST body: { confirm: true }
 * Supprime tout le stockage du projet (assets, versions, références) en DB et dans le bucket.
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

  const toRemove: string[] = [];
  const { data: files } = await admin.storage.from("assets").list(projectId, { limit: 1000 });
  if (files?.length) {
    for (const f of files) {
      if (f.name && f.id != null) toRemove.push(`${projectId}/${f.name}`);
    }
  }
  const { data: subVersions } = await admin.storage.from("assets").list(`${projectId}/versions`, { limit: 1000 });
  if (subVersions?.length) {
    for (const f of subVersions) {
      if (f.name && f.id != null) toRemove.push(`${projectId}/versions/${f.name}`);
    }
  }
  const { data: subRefs } = await admin.storage.from("assets").list(`${projectId}/refs`, { limit: 1000 });
  if (subRefs?.length) {
    for (const f of subRefs) {
      if (f.name && f.id != null) toRemove.push(`${projectId}/refs/${f.name}`);
    }
  }

  if (toRemove.length > 0) {
    await admin.storage.from("assets").remove(toRemove);
  }

  await admin.from("assets").delete().eq("project_id", projectId);
  await admin.from("versions").delete().eq("project_id", projectId);
  await admin.from("project_references").delete().eq("project_id", projectId);

  return NextResponse.json({ ok: true, removed: toRemove.length });
}
