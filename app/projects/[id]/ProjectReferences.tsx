"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSignedUrls, extractStoragePath } from "./useSignedUrls";
import { notifyProjectUpdate } from "@/lib/notify";
import { useProjectActivity } from "@/components/ProjectActivityProvider";
import { ImagePlus, Link as LinkIcon, Trash2, ExternalLink } from "lucide-react";
import { UploadProgress } from "@/components/UploadProgress";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";

type Ref = { id: string; kind: "image" | "youtube"; url: string; comment: string | null };

const YOUTUBE_REG = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function getYoutubeEmbedUrl(url: string) {
  const m = url.match(YOUTUBE_REG);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

type ProjectReferencesProps = { projectId: string };

export function ProjectReferences({ projectId }: ProjectReferencesProps) {
  const { recordOwnAction } = useProjectActivity() ?? {};
  const [refs, setRefs] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [commentByRef, setCommentByRef] = useState<Record<string, string>>({});
  const [savingComment, setSavingComment] = useState<string | null>(null);
  const [lightboxRef, setLightboxRef] = useState<Ref | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("project_references")
      .select("id, kind, url, comment")
      .eq("project_id", projectId)
      .order("created_at");
    setRefs((data as Ref[]) ?? []);
    setLoading(false);
  };

  const imagePaths = useMemo(
    () =>
      refs
        .filter((r) => r.kind === "image")
        .map((r) => extractStoragePath(r.url))
        .filter(Boolean) as string[],
    [refs]
  );
  const signedUrls = useSignedUrls(projectId, imagePaths);
  const getRefImageUrl = (r: Ref) =>
    r.kind === "image" ? (signedUrls[extractStoragePath(r.url) ?? ""] ?? r.url) : r.url;

  useEffect(() => {
    load();
  }, [projectId]);

  useEffect(() => {
    if (lightboxRef && refs.length) {
      const updated = refs.find((r) => r.id === lightboxRef.id);
      if (updated) setLightboxRef(updated);
    }
  }, [refs]);

  const addYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = youtubeUrl.trim();
    if (!u || !YOUTUBE_REG.test(u)) return;
    await supabase.from("project_references").insert({ project_id: projectId, kind: "youtube", url: u });
    setYoutubeUrl("");
    load();
    recordOwnAction?.();
    notifyProjectUpdate(projectId, "reference");
  };

  const addImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const quotaRes = await fetch("/api/storage/check-quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, fileSize: file.size }),
    });
    const quotaData = await quotaRes.json().catch(() => ({}));
    if (!quotaData.allowed) {
      setError("Quota de stockage dépassé. Passez au plan supérieur.");
      return;
    }
    setError(null);
    setUploading(true);
    const path = `${projectId}/refs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: up, error: upErr } = await supabase.storage.from("assets").upload(path, file, { upsert: false });
    if (upErr) {
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(up.path);
    await supabase.from("project_references").insert({
      project_id: projectId,
      kind: "image",
      url: urlData.publicUrl,
      file_size: file.size,
    });
    setUploading(false);
    load();
    recordOwnAction?.();
    notifyProjectUpdate(projectId, "reference");
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await addImageFile(file);
    e.target.value = "";
  };

  const handleDroppedFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setDragOver(false);
    const file = files[0];
    if (file.type.startsWith("image/")) addImageFile(file);
  };

  const remove = async (id: string) => {
    await supabase.from("project_references").delete().eq("id", id);
    load();
  };

  const saveComment = async (id: string) => {
    const comment = (commentByRef[id] ?? "").trim();
    setSavingComment(id);
    await supabase.from("project_references").update({ comment: comment || null }).eq("id", id);
    setSavingComment(null);
    load();
  };

  if (loading) return null;

  return (
    <div
      className={`space-y-4 rounded-lg transition-colors ${dragOver ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); handleDroppedFiles(e.dataTransfer.files); }}
    >
      {/* Barre d’ajout : image (drop zone) + lien YouTube */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Image de référence</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`btn-interactive inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Envoi…" : "Ajouter une image"}
              <input type="file" accept="image/*" className="hidden" onChange={addImage} disabled={uploading} />
            </label>
            <span className="text-xs text-muted-foreground">ou glisser-déposer une image</span>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {uploading && (
            <div className="w-48">
              <UploadProgress label="Envoi…" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Lien YouTube</p>
          <form onSubmit={addYoutube} className="flex flex-wrap items-center gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Coller un lien YouTube…"
              className="min-w-[180px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!youtubeUrl.trim()}
              className="btn-primary-glow inline-flex items-center gap-2 disabled:opacity-50"
            >
              <LinkIcon className="h-4 w-4" />
              Ajouter
            </button>
          </form>
        </div>
      </div>

      {refs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {refs.map((r) => (
            <div key={r.id} className="glass-card group relative flex max-h-[340px] flex-col overflow-hidden rounded-xl">
              {/* Miniature 16:9 crop, hauteur limitée pour toujours voir les commentaires */}
              <button
                type="button"
                onClick={() => setLightboxRef(r)}
                className="aspect-video max-h-[200px] w-full shrink-0 cursor-pointer overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
              >
                {r.kind === "image" ? (
                  <img src={getRefImageUrl(r)} alt="Ref" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/20">
                    {getYoutubeEmbedUrl(r.url) ? (
                      <img
                        src={`https://img.youtube.com/vi/${r.url.match(YOUTUBE_REG)?.[1]}/mqdefault.jpg`}
                        alt="Miniature YouTube"
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <ExternalLink className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                className="absolute right-2 top-2 z-10 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="glass-card-header relative flex min-h-0 flex-1 flex-col gap-2 p-3">
                <label className="text-xs font-medium text-muted-foreground">Commentaire (ex. j'aime le texte, style à reproduire)</label>
                <input
                  type="text"
                  value={commentByRef[r.id] ?? r.comment ?? ""}
                  onChange={(e) => setCommentByRef((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  onBlur={() => saveComment(r.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveComment(r.id); } }}
                  placeholder="J'aime bien le texte…"
                  className="w-full rounded-lg border border-white/10 bg-background/80 px-2.5 py-1.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune référence. Ajoute une image ou un lien YouTube ci-dessus.
        </p>
      )}

      <ImagePreviewModal
        open={!!lightboxRef}
        onClose={() => setLightboxRef(null)}
        type={lightboxRef?.kind ?? "image"}
        url={lightboxRef ? getRefImageUrl(lightboxRef) : ""}
        title={lightboxRef ? (lightboxRef.kind === "youtube" ? "Référence YouTube" : "Référence") : undefined}
        showComments
      >
        {lightboxRef && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#E5E7EB]">Commentaire</h4>
            <p className="min-h-[2.5rem] text-sm text-[#9CA3AF]">
              {lightboxRef.comment || "Aucun commentaire pour l’instant."}
            </p>
            <input
              type="text"
              value={commentByRef[lightboxRef.id] ?? lightboxRef.comment ?? ""}
              onChange={(e) => setCommentByRef((prev) => ({ ...prev, [lightboxRef.id]: e.target.value }))}
              onBlur={() => saveComment(lightboxRef.id)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveComment(lightboxRef.id); } }}
              placeholder="J'aime bien le texte, style à reproduire…"
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            />
          </div>
        )}
      </ImagePreviewModal>
    </div>
  );
}
