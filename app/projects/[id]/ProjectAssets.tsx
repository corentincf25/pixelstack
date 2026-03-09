"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UploadZone } from "@/components/UploadZone";
import { Download, FileImage, FileArchive, DownloadCloud, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSignedUrls, extractStoragePath } from "./useSignedUrls";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { useProjectActivity } from "@/components/ProjectActivityProvider";
import { notifyProjectUpdate } from "@/lib/notify";

type Asset = {
  id: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  kind: string;
  created_at: string;
};

type AssetFeedback = {
  id: string;
  asset_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
};

type ProjectAssetsProps = {
  projectId: string;
};

export function ProjectAssets({ projectId }: ProjectAssetsProps) {
  const { refreshTrigger, recordOwnAction } = useProjectActivity() ?? {};
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null);
  const [feedbackByAsset, setFeedbackByAsset] = useState<Record<string, AssetFeedback[]>>({});
  const [commentByAsset, setCommentByAsset] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

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
  }, [projectId, refresh, refreshTrigger]);

  useEffect(() => {
    if (assets.length === 0) return;
    const ids = assets.map((a) => a.id);
    supabase
      .from("asset_feedback")
      .select("id, asset_id, user_id, content, parent_id, created_at")
      .in("asset_id", ids)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as AssetFeedback[];
        const byAsset: Record<string, AssetFeedback[]> = {};
        ids.forEach((id) => { byAsset[id] = list.filter((f) => f.asset_id === id); });
        setFeedbackByAsset(byAsset);
      });
  }, [assets, refresh, refreshTrigger]);

  const formatSize = (bytes: number | null) => {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const paths = useMemo(() => assets.map((a) => extractStoragePath(a.file_url)).filter(Boolean) as string[], [assets]);
  const signedUrls = useSignedUrls(projectId, paths);

  const getAssetUrl = (asset: Asset) =>
    signedUrls[extractStoragePath(asset.file_url) ?? ""] ?? asset.file_url;

  const getAssetDownloadUrl = (asset: Asset): string | null => {
    const path = extractStoragePath(asset.file_url);
    if (!path) return null;
    return `/api/projects/${projectId}/storage/download?path=${encodeURIComponent(path)}&disposition=attachment`;
  };
  const getAssetDownloadFilename = (asset: Asset) => asset.file_name || "asset";

  const sendComment = async (assetId: string) => {
    const content = (commentByAsset[assetId] ?? "").trim();
    if (!content || !currentUserId) return;
    setSendingComment(assetId);
    const { error } = await supabase.from("asset_feedback").insert({
      asset_id: assetId,
      user_id: currentUserId,
      content,
    });
    setSendingComment(null);
    if (!error) {
      setCommentByAsset((prev) => ({ ...prev, [assetId]: "" }));
      setRefresh((r) => r + 1);
      recordOwnAction?.();
      notifyProjectUpdate(projectId, "feedback");
    }
  };

  const isImage = (a: Asset) => a.kind === "image" || (a.mime_type?.startsWith("image/") ?? false);

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
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const url = getAssetUrl(asset);
            const image = isImage(asset);
            return (
              <li
                key={asset.id}
                className="group/row flex flex-col overflow-hidden rounded-xl border border-border bg-muted/20"
              >
                <div className="relative aspect-video max-h-[140px] w-full shrink-0 overflow-hidden bg-black/20">
                  {image && url ? (
                    <button
                      type="button"
                      onClick={() => setLightboxAsset(asset)}
                      className="block h-full w-full text-left"
                    >
                      <img
                        src={url}
                        alt={asset.file_name || "Asset"}
                        className="h-full w-full object-cover transition group-hover/row:opacity-90"
                      />
                    </button>
                  ) : (
                    <a
                      href={getAssetDownloadUrl(asset) ?? url}
                      download={getAssetDownloadFilename(asset)}
                      className="flex h-full w-full items-center justify-center"
                    >
                      {asset.kind === "zip" ? (
                        <FileArchive className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <FileImage className="h-10 w-10 text-muted-foreground" />
                      )}
                    </a>
                  )}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover/row:bg-black/50 group-hover/row:opacity-100" aria-hidden>
                    <span className="rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white">
                      {image ? "Cliquer pour ouvrir et commenter" : "Cliquer pour télécharger"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {asset.file_name || "Sans nom"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(asset.file_size)} · {format(new Date(asset.created_at), "d MMM à HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {image && (
                      <button
                        type="button"
                        onClick={() => setLightboxAsset(asset)}
                        className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                      >
                        Voir
                      </button>
                    )}
                    <a
                      href={getAssetDownloadUrl(asset) ?? url}
                      download={getAssetDownloadFilename(asset)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </a>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col border-t border-border/50 px-3 py-2">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Avis
                  </div>
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {(feedbackByAsset[asset.id] ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun commentaire.</p>
                    ) : (
                      (feedbackByAsset[asset.id] ?? []).map((f) => (
                        <div key={f.id} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-foreground">
                          {f.content}
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{format(new Date(f.created_at), "d MMM HH:mm", { locale: fr })}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {currentUserId && (
                    <div className="mt-2 flex gap-2">
                      <AutoResizeTextarea
                        maxRows={4}
                        minRows={1}
                        value={commentByAsset[asset.id] ?? ""}
                        onChange={(e) => setCommentByAsset((prev) => ({ ...prev, [asset.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendComment(asset.id);
                          }
                        }}
                        placeholder="Ajouter un commentaire…"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-background/80 px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => sendComment(asset.id)}
                        disabled={sendingComment === asset.id || !(commentByAsset[asset.id] ?? "").trim()}
                        className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucun fichier déposé. Dépose des images ou un ZIP ci-dessus.
        </p>
      )}

      {lightboxAsset && isImage(lightboxAsset) && (
        <ImagePreviewModal
          open={!!lightboxAsset}
          onClose={() => setLightboxAsset(null)}
          type="image"
          url={getAssetUrl(lightboxAsset)}
          title={lightboxAsset.file_name || "Asset"}
          showComments
        >
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquare className="h-4 w-4" />
              Commentaires
            </h4>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {(feedbackByAsset[lightboxAsset.id] ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun commentaire.</p>
              ) : (
                (feedbackByAsset[lightboxAsset.id] ?? []).map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground"
                  >
                    {f.content}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(f.created_at), "d MMM HH:mm", { locale: fr })}
                    </p>
                  </div>
                ))
              )}
            </div>
            {currentUserId && (
              <div className="flex gap-2 pt-2">
                <AutoResizeTextarea
                  maxRows={6}
                  minRows={1}
                  value={commentByAsset[lightboxAsset.id] ?? ""}
                  onChange={(e) => setCommentByAsset((prev) => ({ ...prev, [lightboxAsset.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendComment(lightboxAsset.id);
                    }
                  }}
                  placeholder="Ajouter un commentaire…"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => sendComment(lightboxAsset.id)}
                  disabled={sendingComment === lightboxAsset.id || !(commentByAsset[lightboxAsset.id] ?? "").trim()}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </ImagePreviewModal>
      )}
    </div>
  );
}
