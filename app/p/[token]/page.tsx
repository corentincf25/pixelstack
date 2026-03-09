"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, UserPlus, MessageSquare, FileImage, ImageIcon, Link2, Download, RefreshCw } from "lucide-react";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { ANON_LIMITS } from "@/lib/anon-utils";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  sender_id: string | null;
  anonymous_session_id: string | null;
};

type VersionFeedbackItem = { id: string; content: string; created_at: string; anonymous_session_id: string | null };

type ProjectData = {
  project: { id: string; title: string; status: string; created_at: string; due_date: string | null };
  messages: Message[];
  versions: { id: string; image_url: string; version_number: number; created_at: string }[];
  assets: { id: string; file_url: string; file_name: string | null; kind: string }[];
  brief: { concept: string | null; hook: string | null; notes: string | null } | null;
  references: { id: string; kind: string; url: string }[];
  sessionId: string;
  anonUploadCount?: number;
  versionFeedback?: Record<string, VersionFeedbackItem[]>;
  versionSignedUrls?: Record<string, string>;
};

export default function AnonProjectPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";
  const [sessionReady, setSessionReady] = useState(false);
  const [convertChecked, setConvertChecked] = useState(false);
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [uploadCount, setUploadCount] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxVersion, setLightboxVersion] = useState<{ id: string; version_number: number } | null>(null);
  const [versionComment, setVersionComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [newActivityBanner, setNewActivityBanner] = useState(false);
  const prevSnapshotRef = useRef<string>("");
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setConvertChecked(true);
        try {
          const res = await fetch("/api/anon/convert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
            credentials: "include",
          });
          const j = await res.json().catch(() => ({}));
          if (j.projectId) {
            router.replace(`/projects/${j.projectId}`);
            return;
          }
        } catch {
          // continue as anonymous
        }
      }
      try {
        const res = await fetch("/api/anon/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j.error || "Session invalide");
          setLoading(false);
          return;
        }
        setSessionReady(true);
        setConvertChecked(true);
      } catch {
        setError("Erreur réseau");
        setLoading(false);
      }
    })();
  }, [token, router]);

  const loadProject = useCallback(async (silent = false) => {
    if (!token || !sessionReady) return;
    try {
      const res = await fetch(`/api/anon/project?token=${encodeURIComponent(token)}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Projet introuvable");
        setLoading(false);
        return;
      }
      const d = await res.json();
      const snapshot = `${(d.messages?.length ?? 0)}-${(d.versions?.length ?? 0)}-${(d.assets?.length ?? 0)}-${(d.references?.length ?? 0)}`;
      if (prevSnapshotRef.current && prevSnapshotRef.current !== snapshot) setNewActivityBanner(true);
      prevSnapshotRef.current = snapshot;
      setData(d);
      setMessageCount(d.messages?.length ?? 0);
      setUploadCount(d.anonUploadCount ?? d.assets?.length ?? 0);
      if (!silent) setNewActivityBanner(false);
    } catch {
      setError("Erreur chargement");
    } finally {
      setLoading(false);
    }
  }, [token, sessionReady]);

  useEffect(() => {
    if (sessionReady) loadProject();
  }, [sessionReady, loadProject]);

  useEffect(() => {
    if (!data || !sessionReady || !token) return;
    const interval = setInterval(() => loadProject(true), 4000);
    return () => clearInterval(interval);
  }, [data, sessionReady, token, loadProject]);

  const sendMessage = async () => {
    if (!token || !data || sending) return;
    const text = content.trim();
    if (!text) return;
    if (messageCount >= ANON_LIMITS.maxMessages) {
      setError("Limite de messages atteinte. Créez un compte gratuit pour continuer.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/anon/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, content: text }),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Envoi impossible");
        setSending(false);
        return;
      }
      setContent("");
      setMessageCount((c) => c + 1);
      loadProject();
    } catch {
      setError("Erreur envoi");
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (data?.messages?.length) scrollToBottom();
  }, [data?.messages?.length, scrollToBottom]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[#9CA3AF]">Chargement du projet…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-medium text-white">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { project, messages, versions, assets, brief, references, versionFeedback = {}, versionSignedUrls = {} } = data;
  const canSendMore = messageCount < ANON_LIMITS.maxMessages;
  const canUploadMore = uploadCount < ANON_LIMITS.maxUploads;

  const hasBrief = brief && (brief.concept || brief.notes);
  const hasVersions = versions.length > 0;
  const hasAssets = assets.length > 0 || canUploadMore;
  const hasReferences = references.length > 0;

  const submitVersionComment = async (versionId: string) => {
    const text = versionComment.trim();
    if (!text || sendingComment || !token) return;
    setSendingComment(true);
    try {
      const res = await fetch("/api/anon/version-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, version_id: versionId, content: text }),
        credentials: "include",
      });
      if (res.ok) {
        setVersionComment("");
        loadProject();
      }
    } finally {
      setSendingComment(false);
    }
  };

  const lightboxUrl = lightboxVersion ? versionSignedUrls[lightboxVersion.id] ?? null : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {newActivityBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-200">Nouvelle activité sur le projet.</p>
          <button
            type="button"
            onClick={() => loadProject()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/30"
          >
            <RefreshCw className="h-4 w-4" />
            Mettre à jour
          </button>
        </div>
      )}

      {showBanner && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#6366F1]/30 bg-[#6366F1]/10 px-4 py-3">
          <p className="text-sm text-[#E5E7EB]">
            Créer un compte pour sauvegarder vos projets et retrouver vos graphistes.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`}
              onClick={() => { try { sessionStorage.setItem("pendingAnonConvert", token); } catch {} }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white"
            >
              <UserPlus className="h-4 w-4" />
              Créer un compte
            </Link>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="rounded-lg border border-white/20 px-2 py-1 text-xs text-[#9CA3AF] hover:bg-white/5"
            >
              Masquer
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#E5E7EB]">{project.title}</h1>
          <p className="text-sm text-[#9CA3AF]">Vous participez en tant qu&apos;invité</p>
        </div>
        <Link href="/" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[#E5E7EB] hover:bg-white/5">
          Retour à l&apos;accueil
        </Link>
      </div>

      {hasBrief && (
        <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-2 text-sm font-medium text-[#9CA3AF]">Brief</h2>
          <p className="whitespace-pre-wrap text-sm text-[#E5E7EB]">{brief!.concept || brief!.notes || "—"}</p>
        </section>
      )}

      <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#9CA3AF]">
          <MessageSquare className="h-4 w-4" />
          Conversation
        </h2>
        <div ref={scrollRef} className="mb-3 max-h-[320px] space-y-3 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-3">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9CA3AF]">Aucun message. Envoyez le premier.</p>
          ) : (
            messages.map((msg) => {
              const isGuest = !!msg.anonymous_session_id;
              const name = isGuest ? "Invité" : "Membre";
              return (
                <div key={msg.id} className={`flex flex-col ${isGuest ? "items-end" : "items-start"}`}>
                  <div className={`flex max-w-[85%] gap-2 ${isGuest ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isGuest ? "bg-amber-500/90 text-white" : "bg-[#6366F1]/90 text-white"
                      }`}
                    >
                      {isGuest ? "I" : "M"}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isGuest ? "bg-amber-500/20 border border-amber-500/30" : "bg-[#6366F1]/20 border border-[#6366F1]/30"
                      }`}
                    >
                      <p className="text-xs font-medium text-[#9CA3AF]">{name}</p>
                      {msg.content?.trim() ? <p className="mt-0.5 whitespace-pre-wrap text-sm text-[#E5E7EB]">{msg.content}</p> : null}
                      <p className="mt-1 text-xs text-[#6B7280]">{format(new Date(msg.created_at), "HH:mm", { locale: fr })}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={listEndRef} />
        </div>
        {canSendMore ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Votre message…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !content.trim()}
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {sending ? "…" : <Send className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Limite de messages atteinte.{" "}
            <Link href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`} onClick={() => { try { sessionStorage.setItem("pendingAnonConvert", token); } catch {} }} className="underline">
              Créer un compte gratuit pour continuer.
            </Link>
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </section>

      {hasAssets && (
        <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#9CA3AF]">
            <FileImage className="h-4 w-4" />
            Fichiers ({assets.length})
          </h2>
          {canUploadMore ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.zip"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !token) return;
                  setUploading(true);
                  setError(null);
                  const fd = new FormData();
                  fd.set("token", token);
                  fd.set("file", file);
                  try {
                    const res = await fetch("/api/anon/upload", { method: "POST", body: fd, credentials: "include" });
                    const j = await res.json().catch(() => ({}));
                    if (res.ok) {
                      setUploadCount((c) => c + 1);
                      loadProject();
                    } else setError(j.error || "Échec upload");
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-[#E5E7EB] hover:bg-white/10 disabled:opacity-50"
              >
                {uploading ? "Envoi…" : "Ajouter un fichier (image ou zip)"}
              </button>
            </>
          ) : (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Vous avez atteint la limite d&apos;envoi pour les invités.{" "}
              <Link href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`} onClick={() => { try { sessionStorage.setItem("pendingAnonConvert", token); } catch {} }} className="font-medium underline">
                Créez un compte gratuit pour continuer.
              </Link>
            </p>
          )}
        {assets.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-[#E5E7EB]">
              {assets.map((a) => (
                <li key={a.id}>{a.file_name || a.file_url}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {hasVersions && (
        <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#9CA3AF]">
            <ImageIcon className="h-4 w-4" />
            Versions ({versions.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {versions.map((v) => {
              const thumbUrl = versionSignedUrls[v.id];
              return (
                <div key={v.id} className="group/v flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  <div className="relative aspect-video max-h-[200px] w-full shrink-0 overflow-hidden bg-black/40">
                    <button
                      type="button"
                      onClick={() => setLightboxVersion({ id: v.id, version_number: v.version_number })}
                      className="absolute inset-0 z-[1] h-full w-full text-left focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-inset"
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`Version ${v.version_number}`}
                          className="h-full w-full object-cover transition group-hover/v:opacity-90"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#6B7280]">V{v.version_number}</div>
                      )}
                    </button>
                    <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black/0 opacity-0 transition group-hover/v:bg-black/50 group-hover/v:opacity-100" aria-hidden>
                      <span className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-medium text-white">Cliquer pour ouvrir et commenter</span>
                    </div>
                    {thumbUrl && (
                      <a
                        href={thumbUrl}
                        download={`version-${v.version_number}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1.5 text-xs font-medium text-white hover:bg-black/80"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Télécharger
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium text-[#E5E7EB]">V{v.version_number}</span>
                    <span className="text-xs text-[#6B7280]">{format(new Date(v.created_at), "d MMM HH:mm", { locale: fr })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasReferences && (
        <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#9CA3AF]">
            <Link2 className="h-4 w-4" />
            Références ({references.length})
          </h2>
          <ul className="space-y-1 text-sm text-[#E5E7EB]">
            {references.map((ref) => (
              <li key={ref.id}>
                {ref.kind === "youtube" ? (
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-[#A5B4FC] hover:underline">
                    {ref.url}
                  </a>
                ) : (
                  ref.url
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {lightboxVersion && (
        <ImagePreviewModal
          open={!!lightboxVersion}
          onClose={() => { setLightboxVersion(null); setVersionComment(""); }}
          type="image"
          url={lightboxUrl || ""}
          title={`Version ${lightboxVersion.version_number}`}
          showComments
          children={
            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-[#9CA3AF]">Commentaires</p>
                {lightboxUrl && (
                  <a
                    href={lightboxUrl}
                    download={`version-${lightboxVersion.version_number}.png`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#6366F1]/20 px-2 py-1.5 text-xs font-medium text-[#A5B4FC] hover:bg-[#6366F1]/30"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </a>
                )}
              </div>
              {(versionFeedback[lightboxVersion.id] ?? []).map((f) => (
                <div key={f.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280]">{f.anonymous_session_id ? "Invité" : "Membre"} · {format(new Date(f.created_at), "dd/MM HH:mm", { locale: fr })}</p>
                  <p className="mt-0.5">{f.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  placeholder="Votre commentaire…"
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#E5E7EB] placeholder:text-[#6B7280]"
                />
                <button
                  type="button"
                  onClick={() => submitVersionComment(lightboxVersion.id)}
                  disabled={sendingComment || !versionComment.trim()}
                  className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {sendingComment ? "…" : "Envoyer"}
                </button>
              </div>
            </div>
          }
        />
      )}

      {(messageCount >= 3 || !canSendMore) && (
        <div className="mt-6 rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/5 p-4 text-center text-sm text-[#9CA3AF]">
          Les comptes YouTubeurs sont gratuits. Créer un compte permet de garder l&apos;historique et de retrouver les graphistes avec qui vous travaillez.
          <br />
          <Link href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`} onClick={() => { try { sessionStorage.setItem("pendingAnonConvert", token); } catch {} }} className="mt-2 inline-block font-medium text-[#A5B4FC] underline">
            Créer un compte
          </Link>
        </div>
      )}
    </div>
  );
}
