"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSignedUrls, extractStoragePath } from "./useSignedUrls";
import { notifyProjectUpdate } from "@/lib/notify";
import { useProjectActivity } from "@/components/ProjectActivityProvider";
import { ImagePlus, Link as LinkIcon, Trash2, ExternalLink, MessageSquare, Send } from "lucide-react";
import { UploadProgress } from "@/components/UploadProgress";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Ref = { id: string; kind: "image" | "youtube"; url: string; comment: string | null };

type RefFeedback = {
  id: string;
  reference_id: string;
  user_id: string | null;
  content: string;
  parent_id: string | null;
  created_at: string;
};

const YOUTUBE_REG = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function getYoutubeEmbedUrl(url: string) {
  const m = url.match(YOUTUBE_REG);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

type ProjectReferencesProps = { projectId: string };

export function ProjectReferences({ projectId }: ProjectReferencesProps) {
  const { recordOwnAction, refreshTrigger } = useProjectActivity() ?? {};
  const [refs, setRefs] = useState<Ref[]>([]);
  const [loading, setLoading] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [feedbackByRef, setFeedbackByRef] = useState<Record<string, RefFeedback[]>>({});
  const [newCommentByRef, setNewCommentByRef] = useState<Record<string, string>>({});
  const [sendingRefComment, setSendingRefComment] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refFeedbackRefresh, setRefFeedbackRefresh] = useState(0);
  const [lightboxRef, setLightboxRef] = useState<Ref | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

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
  }, [projectId, refreshTrigger]);

  useEffect(() => {
    if (lightboxRef && refs.length) {
      const updated = refs.find((r) => r.id === lightboxRef.id);
      if (updated) setLightboxRef(updated);
    }
  }, [refs]);

  useEffect(() => {
    if (refs.length === 0) return;
    const ids = refs.map((r) => r.id);
    supabase
      .from("reference_feedback")
      .select("id, reference_id, user_id, content, parent_id, created_at")
      .in("reference_id", ids)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as RefFeedback[];
        const byRef: Record<string, RefFeedback[]> = {};
        ids.forEach((id) => { byRef[id] = list.filter((f) => f.reference_id === id); });
        setFeedbackByRef(byRef);
      });
  }, [refs, refreshTrigger, refFeedbackRefresh]);

  const sendRefComment = async (referenceId: string) => {
    const content = (newCommentByRef[referenceId] ?? "").trim();
    if (!content || !currentUserId) return;
    setSendingRefComment(referenceId);
    const { error: err } = await supabase.from("reference_feedback").insert({
      reference_id: referenceId,
      user_id: currentUserId,
      content,
    });
    setSendingRefComment(null);
    if (!err) {
      setNewCommentByRef((prev) => ({ ...prev, [referenceId]: "" }));
      setRefFeedbackRefresh((r) => r + 1);
      recordOwnAction?.();
      notifyProjectUpdate(projectId, "reference");
    }
  };

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
              <div className="relative aspect-video max-h-[200px] w-full shrink-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLightboxRef(r)}
                  className="absolute inset-0 z-[1] h-full w-full cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
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
                <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/50 group-hover:opacity-100" aria-hidden>
                  <span className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white">Cliquer pour ouvrir et commenter</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(r.id); }}
                className="absolute right-2 top-2 z-10 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="glass-card-header relative flex min-h-0 flex-1 flex-col gap-2 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Avis
                </div>
                  <div className="max-h-24 space-y-1.5 overflow-y-auto">
                    {(feedbackByRef[r.id] ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucun avis.</p>
                    ) : (
                      (feedbackByRef[r.id] ?? []).map((f) => (
                        <div key={f.id} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground">
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
                        value={newCommentByRef[r.id] ?? ""}
                        onChange={(e) => setNewCommentByRef((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendRefComment(r.id); } }}
                        placeholder="Ajouter un avis…"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-background/80 px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => sendRefComment(r.id)}
                        disabled={sendingRefComment === r.id || !(newCommentByRef[r.id] ?? "").trim()}
                        className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
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
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#E5E7EB]">
              <MessageSquare className="h-4 w-4" />
              Avis
            </h4>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {(feedbackByRef[lightboxRef.id] ?? []).length === 0 ? (
                  <p className="text-sm text-[#6B7280]">Aucun avis pour l'instant.</p>
                ) : (
                  (feedbackByRef[lightboxRef.id] ?? []).map((f) => (
                    <div key={f.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#E5E7EB]">
                      {f.content}
                      <p className="mt-1 text-xs text-[#6B7280]">{format(new Date(f.created_at), "d MMM HH:mm", { locale: fr })}</p>
                    </div>
                  ))
                )}
              </div>
              {currentUserId && (
                <div className="mt-3 flex gap-2">
                  <AutoResizeTextarea
                    maxRows={4}
                    minRows={1}
                    value={newCommentByRef[lightboxRef.id] ?? ""}
                    onChange={(e) => setNewCommentByRef((prev) => ({ ...prev, [lightboxRef.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendRefComment(lightboxRef.id); } }}
                    placeholder="Ajouter un avis…"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111111] px-3 py-2.5 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                  />
                  <button
                    type="button"
                    onClick={() => sendRefComment(lightboxRef.id)}
                    disabled={sendingRefComment === lightboxRef.id || !(newCommentByRef[lightboxRef.id] ?? "").trim()}
                    className="shrink-0 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6366F1]/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </ImagePreviewModal>
    </div>
  );
}
