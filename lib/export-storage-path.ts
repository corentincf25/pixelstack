/**
 * Extrait le chemin Storage (bucket "assets") depuis une URL Supabase ou un chemin brut.
 * Utilisé côté serveur pour l'export des données (download depuis Storage).
 */
export function extractStoragePathFromUrlOrPath(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim().split("?")[0] ?? "";
  const assetsMarker = "/assets/";
  const idx = u.indexOf(assetsMarker);
  if (idx !== -1) {
    const path = u.slice(idx + assetsMarker.length);
    if (path) return path;
  }
  const prefixPublic = "/object/public/assets/";
  const idx2 = u.indexOf(prefixPublic);
  if (idx2 !== -1) {
    const path = u.slice(idx2 + prefixPublic.length);
    if (path) return path;
  }
  if (!u.startsWith("http")) return u || null;
  return null;
}

/** Génère un slug de dossier à partir du titre du projet (sans caractères problématiques). */
export function projectSlug(title: string | null, projectId: string): string {
  if (!title?.trim()) return `projet-${projectId.slice(0, 8)}`;
  const slug = title
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return slug || `projet-${projectId.slice(0, 8)}`;
}
