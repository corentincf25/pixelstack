"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UploadZone } from "@/components/UploadZone";
import { Download, FileImage, FileArchive, DownloadCloud } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSignedUrls, extractStoragePath } from "./useSignedUrls";

type Asset = {
  id: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  kind: string;
  created_at: string;
};

type ProjectAssetsProps = {
  projectId: string;
};

export function ProjectAssets({ projectId }: ProjectAssetsProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, file_url, file_name, file_size, mime_type, kind, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (!error) setAssets((data as Asset[]) ?? []);
      setLoading(false);
    };
    load();
  }, [projectId, refresh]);

  const formatSize = (bytes: number | null) => {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const paths = useMemo(() => assets.map((a) => extractStoragePath(a.file_url)).filter(Boolean) as string[], [assets]);
  const signedUrls = useSignedUrls(projectId, paths);

  return (
    <div className="space-y-4">
      <UploadZone projectId={projectId} onUploaded={() => setRefresh((r) => r + 1)} />

      {!loading && assets.length > 0 && (
        <div className="flex justify-end">
          <a
            href={`/api/projects/${projectId}/assets/download-all`}
            download="assets-projet.zip"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <DownloadCloud className="h-4 w-4" />
            Télécharger tout en ZIP
          </a>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des assets…</p>
      ) : assets.length > 0 ? (
        <ul className="space-y-2">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              {asset.kind === "zip" ? (
                <FileArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {asset.file_name || "Sans nom"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(asset.file_size)} · {format(new Date(asset.created_at), "d MMM à HH:mm", { locale: fr })}
                </p>
              </div>
              <a
                href={signedUrls[extractStoragePath(asset.file_url) ?? ""] ?? asset.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Download className="h-3.5 w-3.5" />
                Télécharger
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun fichier déposé. Dépose des images ou un ZIP ci-dessus.
        </p>
      )}
    </div>
  );
}
