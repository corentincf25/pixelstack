"use client";

import { useEffect, useState } from "react";

/**
 * Extrait le chemin Storage (ex. projectId/versions/file.jpg) depuis une URL Supabase ou un chemin brut.
 * Compatible avec tous les formats d'URL Supabase (object/public/assets/ ou /assets/).
 */
export function extractStoragePath(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim().split("?")[0] ?? "";
  const assetsMarker = "/assets/";
  const idx = u.indexOf(assetsMarker);
  if (idx !== -1) {
    const path = u.slice(idx + assetsMarker.length);
    if (path) return path;
  }
  if (!u.startsWith("http")) return u || null;
  return null;
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
