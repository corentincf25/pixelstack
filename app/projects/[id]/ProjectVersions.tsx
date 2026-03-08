"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSignedUrls, extractStoragePath } from "./useSignedUrls";
import { notifyProjectUpdate } from "@/lib/notify";
import { useProjectActivity } from "@/components/ProjectActivityProvider";
import { markProjectVersionsRead, markProjectFeedbackRead } from "@/lib/project-read";
import { Download, Upload, MessageSquare, Send, Reply } from "lucide-react";
import { UploadProgress } from "@/components/UploadProgress";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Version = {
  id: string;
  image_url: string;
  version_number: number;
  version_name: string | null;
  created_at: string;
};

type Feedback = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  parent_id: string | null;
};

type ProjectVersionsProps = {
  projectId: string;
  isDesigner: boolean;
  isClient: boolean;
  isReviewer?: boolean;
  currentUserId: string;
  designerId?: string;
  clientId?: string;
};

function buildTree(items: (Feedback & { version_id: string })[]) {
  const byId = new Map<string, (Feedback & { version_id: string })[]>();
  items.forEach((f) => {
    const key = f.parent_id ?? "root";
    if (!byId.has(key)) byId.set(key, []);
    byId.get(key)!.push(f);
  });
  const roots = byId.get("root") ?? [];
  return { roots, byId };
}

const canComment = (isD: boolean, isC: boolean, isR: boolean) => isD || isC || isR;

export function ProjectVersions({ projectId, isDesigner, isClient, isReviewer = false, currentUserId, designerId, clientId }: ProjectVersionsProps) {
  const canSendFeedback = canComment(isDesigner, isClient, isReviewer);
  const { recordOwnAction } = useProjectActivity() ?? {};
  const [versions, setVersions] = useState<Version[]>([]);
  const [feedbackByVersion, setFeedbackByVersion] = useState<Record<string, { roots: (Feedback & { version_id: string })[]; byId: Map<string, (Feedback & { version_id: string })[]> }>>({});
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [commentByVersion, setCommentByVersion] = useState<Record<string, string>>({});
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);
  const [lightboxVersion, setLightboxVersion] = useState<Version | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const versionPaths = useMemo(
    () => versions.map((v) => extractStoragePath(v.image_url)).filter(Boolean) as string[],
    [versions]
  );
  const signedUrls = useSignedUrls(projectId, versionPaths);

  const getVersionUrl = (v: Version) =>
    signedUrls[extractStoragePath(v.image_url) ?? ""] ?? v.image_url;

  const getVersionDownloadUrl = (v: Version): string | null => {
    const path = extractStoragePath(v.image_url);
    if (!path) return null;
    return `/api/projects/${projectId}/storage/download?path=${encodeURIComponent(path)}&disposition=attachment`;
  };
  const getVersionDownloadFilename = (v: Version): string => {
    const path = extractStoragePath(v.image_url);
    const base = path?.split("/").pop();
    return base || `version-${v.version_number}.png`;
  };

  useEffect(() => {
    const load = async () => {
      const { data, error: e } = await supabase
        .from("versions")
        .select("id, image_url, version_number, version_name, created_at")
        .eq("project_id", projectId)
        .order("version_number", { ascending: false });
      if (!e) setVersions((data as Version[]) ?? []);
      setLoading(false);
      markProjectVersionsRead(projectId);
      markProjectFeedbackRead(projectId);
    };
    load();
  }, [projectId, refresh]);

  useEffect(() => {
    if (versions.length === 0) return;
    const ids = versions.map((v) => v.id);
    supabase
      .from("version_feedback")
      .select("id, version_id, parent_id, content, user_id, created_at")
      .in("version_id", ids)
      .order("created_at")
      .then(({ data }) => {
        const raw = (data ?? []) as (Feedback & { version_id: string; parent_id: string | null })[];
        const byVersion: Record<string, { roots: (Feedback & { version_id: string })[]; byId: Map<string, (Feedback & { version_id: string })[]> }> = {};
        ids.forEach((vid) => {
          const forVersion = raw.filter((f) => f.version_id === vid);
          byVersion[vid] = buildTree(forVersion);
        });
        setFeedbackByVersion(byVersion);
      });
  }, [versions, refresh]);

  const uploadFile = async (file: File) => {
    if (!/^image\//.test(file.type)) {
      setError("Choisis une image (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Max 10 Mo par image.");
      return;
    }
    setError(null);
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
    setUploading(true);
    const path = `${projectId}/versions/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("assets")
      .upload(path, file, { upsert: false });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("assets").getPublicUrl(uploadData.path);
    const nextNum = versions.length ? Math.max(...versions.map((v) => v.version_number)) + 1 : 1;
    const name = versionName.trim() || `V${nextNum}`;
    const { error: insertErr } = await supabase.from("versions").insert({
      project_id: projectId,
      image_url: urlData.publicUrl,
      version_number: nextNum,
      version_name: name,
      file_size: file.size,
    });
    if (insertErr) setError(insertErr.message);
    else {
      setVersionName("");
      setRefresh((r) => r + 1);
      recordOwnAction?.();
      notifyProjectUpdate(projectId, "version");
    }
    setUploading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !isDesigner) return;
    setDragOver(false);
    const file = files[0];
    await uploadFile(file);
  };

  const sendComment = async (versionId: string, parentId?: string | null) => {
    const content = parentId != null
      ? (replyContent[parentId] ?? "").trim()
      : (commentByVersion[versionId] ?? "").trim();
    if (!content) return;
    setSendingComment(parentId ?? versionId);
    const { error: err } = await supabase.from("version_feedback").insert({
      version_id: versionId,
      user_id: currentUserId,
      content,
      ...(parentId ? { parent_id: parentId } : {}),
    });
    setSendingComment(null);
    if (!err) {
      if (parentId) {
        setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
        setReplyToId(null);
      } else {
        setCommentByVersion((prev) => ({ ...prev, [versionId]: "" }));
      }
      setRefresh((r) => r + 1);
      notifyProjectUpdate(projectId, "feedback");
    }
  };

  const tree = (versionId: string) => feedbackByVersion[versionId] ?? { roots: [], byId: new Map() };

  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (versions.length === 0 && !isDesigner)
    return <p className="text-sm text-muted-foreground">Ton graphiste déposera les versions ici.</p>;

  return (
    <div className="space-y-6">
      {isDesigner && (
        <div
          className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
            dragOver ? "border-primary bg-primary/10" : "border-border bg-muted/20"
          } ${uploading ? "pointer-events-none opacity-80" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            {dragOver ? "Dépose l’image ici" : "Déposer une version (glisser-déposer ou cliquer)"}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[120px] flex-1">
              <label className="text-xs text-muted-foreground">Nom (ex. V1, V2)</label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="V1"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <label className="btn-interactive cursor-pointer rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Envoi…" : "Choisir une image"}
              </span>
            </label>
          </div>
          {uploading && (
            <div className="mt-3">
              <UploadProgress label="Envoi de la version…" />
            </div>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      )}

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune version. Dépose une image ci-dessus.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {versions.map((v) => {
            const { roots, byId } = tree(v.id);
            return (
              <div
                key={v.id}
                className="glass-card flex max-h-[380px] flex-col overflow-hidden rounded-xl"
              >
                {/* Miniature 16:9 + bouton Télécharger sur l'image */}
                <div className="relative aspect-video max-h-[200px] w-full shrink-0 overflow-hidden bg-black/20">
                  <button
                    type="button"
                    onClick={() => setLightboxVersion(v)}
                    className="absolute inset-0 h-full w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                  >
                    <img
                      src={getVersionUrl(v)}
                      alt={v.version_name || `Version ${v.version_number}`}
                      className="h-full w-full object-cover transition hover:opacity-90"
                    />
                  </button>
                  <a
                    href={getVersionDownloadUrl(v) ?? getVersionUrl(v)}
                    download={getVersionDownloadFilename(v)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1.5 text-xs font-medium text-white hover:bg-black/80"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </a>
                </div>
                <div className="glass-card-header flex items-center justify-between gap-2 px-3 py-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {v.version_name || `V${v.version_number}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(v.created_at), "d MMM HH:mm", { locale: fr })}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col border-t border-white/10 px-3 py-2">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Avis
                  </div>
                  {roots.map((f) => (
                    <CommentBlock
                      key={f.id}
                      feedback={f}
                      versionId={v.id}
                      byId={byId}
                      isClient={isClient}
                      isDesigner={isDesigner}
                      canReply={canSendFeedback}
                      replyToId={replyToId}
                      setReplyToId={setReplyToId}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      sendComment={sendComment}
                      sendingComment={sendingComment}
                      large={false}
                      designerId={designerId}
                      clientId={clientId}
                    />
                  ))}
                  {canSendFeedback && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={commentByVersion[v.id] ?? ""}
                        onChange={(e) => setCommentByVersion((prev) => ({ ...prev, [v.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendComment(v.id); } }}
                        placeholder="Ce que tu aimes, tes retours…"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-background/80 px-2 py-1.5 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => sendComment(v.id)}
                        disabled={sendingComment === v.id || !(commentByVersion[v.id] ?? "").trim()}
                        className="btn-primary-glow shrink-0 p-1.5 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImagePreviewModal
        open={!!lightboxVersion}
        onClose={() => setLightboxVersion(null)}
        type="image"
        url={lightboxVersion ? getVersionUrl(lightboxVersion) : ""}
        title={lightboxVersion ? (lightboxVersion.version_name || `Version ${lightboxVersion.version_number}`) : undefined}
        showComments
      >
        {lightboxVersion && (() => {
          const { roots, byId } = tree(lightboxVersion.id);
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">Avis et retours</h4>
                <a
                  href={getVersionDownloadUrl(lightboxVersion) ?? getVersionUrl(lightboxVersion)}
                  download={getVersionDownloadFilename(lightboxVersion)}
                  className="btn-primary-glow inline-flex items-center gap-1.5 px-3 py-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
              </div>
              <div className="max-h-48 space-y-3 overflow-y-auto">
                {roots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun avis pour l’instant.</p>
                ) : (
                  roots.map((f) => (
                    <CommentBlock
                      key={f.id}
                      feedback={f}
                      versionId={lightboxVersion.id}
                      byId={byId}
                      isClient={isClient}
                      isDesigner={isDesigner}
                      canReply={canSendFeedback}
                      replyToId={replyToId}
                      setReplyToId={setReplyToId}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      sendComment={sendComment}
                      sendingComment={sendingComment}
                      large
                      designerId={designerId}
                      clientId={clientId}
                    />
                  ))
                )}
              </div>
                  {canSendFeedback && (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={commentByVersion[lightboxVersion.id] ?? ""}
                    onChange={(e) => setCommentByVersion((prev) => ({ ...prev, [lightboxVersion.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendComment(lightboxVersion.id); } }}
                    placeholder="Ce que tu aimes, tes retours…"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-background/80 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => sendComment(lightboxVersion.id)}
                    disabled={sendingComment === lightboxVersion.id || !(commentByVersion[lightboxVersion.id] ?? "").trim()}
                    className="btn-primary-glow shrink-0 px-4 py-2.5 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </ImagePreviewModal>
    </div>
  );
}

function CommentBlock({
  feedback,
  versionId,
  byId,
  isClient,
  isDesigner,
  canReply = false,
  replyToId,
  setReplyToId,
  replyContent,
  setReplyContent,
  sendComment,
  sendingComment,
  large = false,
  designerId,
  clientId,
}: {
  feedback: Feedback & { version_id: string };
  versionId: string;
  byId: Map<string, (Feedback & { version_id: string })[]>;
  isClient: boolean;
  isDesigner: boolean;
  canReply?: boolean;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  replyContent: Record<string, string>;
  setReplyContent: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendComment: (versionId: string, parentId?: string | null) => void;
  sendingComment: string | null;
  large?: boolean;
  designerId?: string;
  clientId?: string;
}) {
  const replies = byId.get(feedback.id) ?? [];
  const isReplying = replyToId === feedback.id;
  const textCls = large ? "text-sm" : "text-xs";
  const padCls = large ? "px-3 py-2" : "px-2 py-1.5";
  const inputCls = large ? "px-3 py-2 text-sm" : "px-2 py-1.5 text-xs";
  const isFromDesigner = designerId && feedback.user_id === designerId;
  const isFromClient = clientId && feedback.user_id === clientId;
  const bubbleColorCls =
    isFromDesigner
      ? "border-l-4 border-blue-500 bg-blue-500/10"
      : isFromClient
        ? "border-l-4 border-red-500 bg-red-500/10"
        : "bg-background/50";

  return (
    <div className={large ? "mb-3" : "mb-2"}>
      <div className={`rounded-lg ${padCls} ${textCls} text-foreground ${bubbleColorCls}`}>
        {feedback.content}
      </div>
      {canReply && (
        <button
          type="button"
          onClick={() => setReplyToId(replyToId === feedback.id ? null : feedback.id)}
          className={`mt-0.5 flex items-center gap-1 ${textCls} text-muted-foreground hover:text-foreground`}
        >
          <Reply className={large ? "h-4 w-4" : "h-3 w-3"} />
          Répondre
        </button>
      )}
      {isReplying && (
        <div className={large ? "ml-4 mt-2 flex gap-2" : "ml-3 mt-1 flex gap-2"}>
          <input
            type="text"
            value={replyContent[feedback.id] ?? ""}
            onChange={(e) => setReplyContent((prev) => ({ ...prev, [feedback.id]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendComment(versionId, feedback.id); } }}
            placeholder="Répondre…"
            className={`min-w-0 flex-1 rounded-lg border border-white/10 bg-background/80 ${inputCls} placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary`}
          />
          <button
            type="button"
            onClick={() => sendComment(versionId, feedback.id)}
            disabled={sendingComment === feedback.id || !(replyContent[feedback.id] ?? "").trim()}
            className="btn-primary-glow shrink-0 p-1.5 disabled:opacity-50"
          >
            <Send className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
          </button>
        </div>
      )}
      {replies.length > 0 && (
        <div className={large ? "ml-4 mt-2 space-y-2 border-l-2 border-white/20 pl-3" : "ml-3 mt-1 space-y-1 border-l-2 border-border pl-2"}>
          {replies.map((r) => (
            <CommentBlock
              key={r.id}
              feedback={r}
              versionId={versionId}
              byId={byId}
              isClient={isClient}
              isDesigner={isDesigner}
              canReply={canReply}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              sendComment={sendComment}
              sendingComment={sendingComment}
              large={large}
              designerId={designerId}
              clientId={clientId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
