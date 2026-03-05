"use client";

import { useEffect, useState } from "react";

const PREFIX = "/object/public/assets/";

export function extractStoragePath(url: string): string | null {
  const idx = url.indexOf(PREFIX);
  if (idx === -1) return null;
  return url.slice(idx + PREFIX.length).split("?")[0] ?? null;
}

/**
 * Récupère des URLs signées pour des chemins Storage (bucket privé ou public).
 * Retourne un map path -> signedUrl ; utilise fallbackUrl si pas de signed URL.
 */
export function useSignedUrls(projectId: string, paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!projectId || paths.length === 0) {
      setUrls({});
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/projects/${projectId}/storage/signed-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (data?.urls && !cancelled) setUrls(data.urls);
    })();
    return () => { cancelled = true; };
  }, [projectId, paths.join(",")]);

  return urls;
}
