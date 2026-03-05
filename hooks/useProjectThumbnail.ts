"use client";

import { useEffect, useState } from "react";

const PREFIX = "/object/public/assets/";

function toStoragePath(url: string): string {
  const idx = url.indexOf(PREFIX);
  if (idx !== -1) return url.slice(idx + PREFIX.length).split("?")[0] ?? url;
  return url;
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
