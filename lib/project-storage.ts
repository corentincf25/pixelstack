import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supprime tous les fichiers du projet dans le bucket "assets" :
 * projectId/, projectId/versions/, projectId/refs/, projectId/chat/
 * À utiliser avant suppression du projet ou pour purge manuelle.
 */
export async function purgeProjectStorage(
  admin: SupabaseClient,
  projectId: string
): Promise<number> {
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
  const { data: subChat } = await admin.storage.from("assets").list(`${projectId}/chat`, { limit: 1000 });
  if (subChat?.length) {
    for (const f of subChat) {
      if (f.name && f.id != null) toRemove.push(`${projectId}/chat/${f.name}`);
    }
  }

  if (toRemove.length > 0) {
    await admin.storage.from("assets").remove(toRemove);
  }

  return toRemove.length;
}
