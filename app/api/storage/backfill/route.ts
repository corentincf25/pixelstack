import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "assets";
const PREFIX_PUBLIC = "/object/public/assets/";

function extractPath(url: string): string | null {
  const idx = url.indexOf(PREFIX_PUBLIC);
  if (idx === -1) return null;
  return url.slice(idx + PREFIX_PUBLIC.length).split("?")[0] ?? null;
}

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

function addSizesFromList(
  out: Map<string, number>,
  items: { name: string; size?: number; metadata?: { size?: number } }[],
  prefix: string
) {
  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    const size = item.size ?? item.metadata?.size;
    if (typeof size === "number") out.set(fullPath, size);
  }
}

/** Récupère path -> size pour un préfixe et un niveau de sous-dossier (versions, refs). */
async function listFilesWithSizes(admin: AdminClient, projectId: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const { data: root } = await admin.storage.from(BUCKET).list(projectId, { limit: 1000 });
  if (root?.length) addSizesFromList(out, root, projectId);
  const { data: versions } = await admin.storage.from(BUCKET).list(`${projectId}/versions`, { limit: 1000 });
  if (versions?.length) addSizesFromList(out, versions, `${projectId}/versions`);
  const { data: refs } = await admin.storage.from(BUCKET).list(`${projectId}/refs`, { limit: 1000 });
  if (refs?.length) addSizesFromList(out, refs, `${projectId}/refs`);
  return out;
}

/**
 * Recalcule file_size pour les assets/versions/références où file_size est NULL
 * en récupérant la taille depuis le Storage (client admin pour détection fiable).
 * Réservé aux graphistes.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "designer") {
    return NextResponse.json({ error: "Réservé aux graphistes" }, { status: 403 });
  }

  const { data: designerProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("designer_id", user.id);
  const projectIds = (designerProjects ?? []).map((p) => p.id);
  if (projectIds.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible (admin)" }, { status: 503 });
  }

  const pathToSize = new Map<string, number>();
  for (const pid of projectIds) {
    const map = await listFilesWithSizes(admin, pid);
    map.forEach((v, k) => pathToSize.set(k, v));
  }

  let updated = 0;

  // 1) Assets sans file_size
  const { data: assets } = await supabase
    .from("assets")
    .select("id, project_id, file_url")
    .in("project_id", projectIds)
    .is("file_size", null);

  if (assets?.length) {
    for (const a of assets) {
      const path = extractPath(a.file_url);
      if (!path) continue;
      const size = pathToSize.get(path);
      if (typeof size !== "number") continue;
      const { error } = await admin.from("assets").update({ file_size: size }).eq("id", a.id);
      if (!error) updated++;
    }
  }

  // 2) Versions sans file_size
  const { data: versions } = await supabase
    .from("versions")
    .select("id, project_id, image_url")
    .in("project_id", projectIds)
    .is("file_size", null);

  if (versions?.length) {
    for (const v of versions) {
      const path = extractPath(v.image_url);
      if (!path) continue;
      const size = pathToSize.get(path);
      if (typeof size !== "number") continue;
      const { error } = await admin.from("versions").update({ file_size: size }).eq("id", v.id);
      if (!error) updated++;
    }
  }

  // 3) Références images sans file_size
  const { data: refs } = await supabase
    .from("project_references")
    .select("id, project_id, url")
    .eq("kind", "image")
    .in("project_id", projectIds)
    .is("file_size", null);

  if (refs?.length) {
    for (const r of refs) {
      const url = (r as { url?: string }).url;
      if (!url) continue;
      const path = extractPath(url);
      if (!path) continue;
      const size = pathToSize.get(path);
      if (typeof size !== "number") continue;
      const { error } = await admin.from("project_references").update({ file_size: size }).eq("id", r.id);
      if (!error) updated++;
    }
  }

  return NextResponse.json({ ok: true, updated });
}
