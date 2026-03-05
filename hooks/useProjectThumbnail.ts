"use client";

import { useEffect, useState } from "react";

/** Extrait le chemin Storage (ex. projectId/versions/file.jpg) depuis une URL Supabase ou un chemin brut. */
function toStoragePath(url: string): string {
  const u = (url ?? "").trim().split("?")[0] ?? "";
  // URL Supabase : .../object/public/assets/PATH ou .../storage/.../assets/PATH
  const assetsMarker = "/assets/";
  const idx = u.indexOf(assetsMarker);
  if (idx !== -1) {
    const path = u.slice(idx + assetsMarker.length);
    if (path) return path;
  }
  // Déjà un chemin relatif (projectId/versions/...)
  if (!u.startsWith("http")) return u;
  return u;
}

/**
 * Récupère une URL signée pour la miniature d'une version (affichage dans les cartes projet).
 */
export function useProjectThumbnail(projectId: string | null, imageUrlOrPath: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !imageUrlOrPath?.trim()) {
      setUrl(null);
      return;
    }
    const path = toStoragePath(imageUrlOrPath);
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/projects/${projectId}/storage/signed-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [path] }),
      });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const signed = data?.urls?.[path];
      if (signed && !cancelled) setUrl(signed);
    })();
    return () => { cancelled = true; };
  }, [projectId, imageUrlOrPath]);

  return url;
}
