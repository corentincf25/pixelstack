"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Send,
  UserPlus,
  MessageSquare,
  FileImage,
  ImageIcon,
  Link2,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
  Pencil,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { ANON_LIMITS } from "@/lib/anon-utils";
import { supabase } from "@/lib/supabase";
import { BentoCard } from "@/components/BentoCard";
import { BackLink } from "@/components/BackLink";
import { ProjectPageNav } from "@/app/projects/[id]/ProjectPageNav";
import { AutoResizeTextarea } from "@/components/AutoResizeTextarea";
import { ChatMessageContent } from "@/components/ChatMessageContent";

type Message = {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  sender_id: string | null;
  anonymous_session_id: string | null;
};

type VersionFeedbackItem = { id: string; content: string; created_at: string; anonymous_session_id: string | null };

type Ref = { id: string; kind: string; url: string; comment?: string | null };

type ProjectData = {
  project: { id: string; title: string; status: string; created_at: string; due_date: string | null };
  messages: Message[];
  versions: { id: string; image_url: string; version_number: number; created_at: string }[];
  assets: { id: string; file_url: string; file_name: string | null; kind: string }[];
  brief: { concept: string | null; hook: string | null; notes: string | null } | null;
  references: Ref[];
  sessionId: string;
  anonUploadCount?: number;
  versionFeedback?: Record<string, VersionFeedbackItem[]>;
  versionSignedUrls?: Record<string, string>;
  referenceSignedUrls?: Record<string, string>;
  assetSignedUrls?: Record<string, string>;
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  review: "En revue",
  approved: "Approuvé",
};

const statusBadgeClass: Record<string, string> = {
  draft: "border-slate-500/50 bg-slate-500/15 text-slate-300",
  in_progress: "border-blue-500/50 bg-blue-500/15 text-blue-300",
  review: "border-amber-500/50 bg-amber-500/15 text-amber-200",
  approved: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
};

const GUEST_BANNER_STORAGE_KEY = "pixelstack_guest_banner_dismissed";

export default function AnonProjectPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";
  const [sessionReady, setSessionReady] = useState(false);
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxVersion, setLightboxVersion] = useState<{ id: string; version_number: number } | null>(null);
  const [versionComment, setVersionComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [newActivityBanner, setNewActivityBanner] = useState(false);
  const [briefEditing, setBriefEditing] = useState(false);
  const [briefConcept, setBriefConcept] = useState("");
  const [briefHook, setBriefHook] = useState("");
  const [briefNotes, setBriefNotes] = useState("");
  const [briefSaving, setBriefSaving] = useState(false);
  const [dueDateEditing, setDueDateEditing] = useState(false);
  const [dueDateValue, setDueDateValue] = useState("");
  const [dueDateSaving, setDueDateSaving] = useState(false);
  const prevSnapshotRef = useRef<string>("");
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const YOUTUBE_REG = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

  useEffect(() => {
    try {
      if (sessionStorage.getItem(GUEST_BANNER_STORAGE_KEY) === "1") setGuestBannerDismissed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
        } catch {}
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
      } catch {
        setError("Erreur réseau");
        setLoading(false);
      }
    })();
  }, [token, router]);

  const loadProject = useCallback(
    async (silent = false) => {
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
        setUploadCount(d.anonUploadCount ?? d.assets?.length ?? 0);
        if (!silent) setNewActivityBanner(false);
      } catch {
        setError("Erreur chargement");
      } finally {
        setLoading(false);
      }
    },
    [token, sessionReady]
  );

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

  const dismissGuestBanner = () => {
    setGuestBannerDismissed(true);
    try {
      sessionStorage.setItem(GUEST_BANNER_STORAGE_KEY, "1");
    } catch {}
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement du projet…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { project, messages, versions, assets, brief, references, versionFeedback = {}, versionSignedUrls = {}, referenceSignedUrls = {}, assetSignedUrls = {} } = data;
  const canUploadMore = uploadCount < ANON_LIMITS.maxUploads;

  const saveBrief = async () => {
    setBriefSaving(true);
    try {
      const res = await fetch("/api/anon/brief", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, concept: briefConcept, hook: briefHook, notes: briefNotes }),
        credentials: "include",
      });
      if (res.ok) {
        setBriefEditing(false);
        loadProject();
      }
    } finally {
      setBriefSaving(false);
    }
  };

  const saveDueDate = async () => {
    setDueDateSaving(true);
    try {
      const res = await fetch("/api/anon/due-date", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, due_date: dueDateValue.trim() || null }),
        credentials: "include",
      });
      if (res.ok) {
        setDueDateEditing(false);
        loadProject();
      }
    } finally {
      setDueDateSaving(false);
    }
  };

  useEffect(() => {
    if (data?.brief) {
      setBriefConcept(data.brief.concept ?? "");
      setBriefHook(data.brief.hook ?? "");
      setBriefNotes(data.brief.notes ?? "");
    }
    if (data?.project?.due_date) setDueDateValue(data.project.due_date.slice(0, 10));
    else setDueDateValue("");
  }, [data?.brief, data?.project?.due_date]);

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
    <div className="flex w-full max-w-6xl flex-col gap-0 overflow-x-hidden pb-12 pt-4 sm:pt-6 lg:flex-row lg:gap-6">
      <main className="min-w-0 flex-1 space-y-6 pr-0 lg:pr-52">
        {!guestBannerDismissed && (
          <div
            role="banner"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-foreground"
          >
            <p className="min-w-0 flex-1">
              Vous participez en tant qu&apos;invité. Créez un compte gratuit pour sauvegarder vos projets et recevoir les notifications.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`}
                onClick={() => {
                  try { sessionStorage.setItem("pendingAnonConvert", token); } catch {}
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                <UserPlus className="h-4 w-4" />
                Créer un compte
              </Link>
              <button
                type="button"
                onClick={dismissGuestBanner}
                className="rounded-lg border border-white/20 px-2 py-1 text-xs text-muted-foreground hover:bg-white/5"
              >
                Masquer
              </button>
            </div>
          </div>
        )}

        {newActivityBanner && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
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

        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackLink href="/" label="Retour à l'accueil" />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium ${statusBadgeClass[project.status] ?? "border-border bg-background/80 text-foreground"}`}>
                {statusLabels[project.status] ?? project.status}
              </span>
              <span className="inline-flex items-center rounded-lg border border-red-500/50 bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-200">
                Invité
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{project.title}</h1>
            <p className="text-sm text-muted-foreground">Vous participez en tant qu&apos;invité</p>
            {project.due_date && (
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(project.due_date), "d MMM yyyy", { locale: fr })}
              </span>
            )}
          </div>
        </div>

        <section id="brief" className="scroll-mt-24">
          <BentoCard title="Brief & Récap" icon={<FileText className="h-4 w-4 text-muted-foreground" />} compact defaultLayout="fit">
            <div className="space-y-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Date de rendu</span>
                {dueDateEditing ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={dueDateValue}
                      onChange={(e) => setDueDateValue(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button type="button" onClick={saveDueDate} disabled={dueDateSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />
                      {dueDateSaving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button type="button" onClick={() => { setDueDateEditing(false); setDueDateValue(project.due_date ? project.due_date.slice(0, 10) : ""); }} disabled={dueDateSaving} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent">
                      <X className="h-3.5 w-3.5" />
                      Annuler
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-foreground">
                      {project.due_date ? format(new Date(project.due_date), "d MMMM yyyy", { locale: fr }) : "Non définie"}
                    </span>
                    <button type="button" onClick={() => { setDueDateValue(project.due_date ? project.due_date.slice(0, 10) : ""); setDueDateEditing(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                  </>
                )}
              </div>
              {briefEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Concept</label>
                    <AutoResizeTextarea maxRows={4} minRows={2} value={briefConcept} onChange={(e) => setBriefConcept(e.target.value)} placeholder="Concept du projet…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Hook / Inspirations</label>
                    <AutoResizeTextarea maxRows={4} minRows={2} value={briefHook} onChange={(e) => setBriefHook(e.target.value)} placeholder="Hook, inspirations…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
                    <AutoResizeTextarea maxRows={4} minRows={2} value={briefNotes} onChange={(e) => setBriefNotes(e.target.value)} placeholder="Notes…" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={saveBrief} disabled={briefSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />
                      {briefSaving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button type="button" onClick={() => { setBriefEditing(false); setBriefConcept(brief?.concept ?? ""); setBriefHook(brief?.hook ?? ""); setBriefNotes(brief?.notes ?? ""); }} disabled={briefSaving} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
                      <X className="h-3.5 w-3.5" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-foreground">
                  {(brief?.concept || brief?.hook || brief?.notes) ? (
                    <>
                      {brief.concept && <p className="whitespace-pre-wrap">{brief.concept}</p>}
                      {brief.hook && <p className="whitespace-pre-wrap"><span className="font-medium text-muted-foreground">Hook / Inspirations : </span>{brief.hook}</p>}
                      {brief.notes && <p className="whitespace-pre-wrap"><span className="font-medium text-muted-foreground">Notes : </span>{brief.notes}</p>}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Aucun brief pour l&apos;instant.</p>
                  )}
                  <button type="button" onClick={() => setBriefEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier le brief
                  </button>
                </div>
              )}
            </div>
          </BentoCard>
        </section>

        <section id="partage" className="scroll-mt-24">
          <BentoCard title="Partage & Actions" icon={<Link2 className="h-4 w-4 text-muted-foreground" />}>
            <p className="text-sm text-muted-foreground">
              Vous avez rejoint ce projet via un lien d&apos;invitation. Créez un compte pour sauvegarder vos projets et retrouver vos graphistes.
            </p>
            <Link
              href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`}
              onClick={() => { try { sessionStorage.setItem("pendingAnonConvert", token); } catch {} }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              <UserPlus className="h-4 w-4" />
              Créer un compte
            </Link>
          </BentoCard>
        </section>

        <section id="assets" className="scroll-mt-24">
          <BentoCard
            title="Assets"
            icon={<FileImage className="h-4 w-4 text-muted-foreground" />}
            hint="Dépose tes refs et fichiers. PNG, JPG, WEBP ou ZIP, max 10 Mo. Invités : 3 fichiers max."
          >
            <div className="space-y-4">
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
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    {uploading ? "Envoi…" : "Ajouter un fichier (image ou zip)"}
                  </button>
                </>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Vous avez atteint la limite d&apos;envoi pour les invités. Créez un compte gratuit pour continuer à envoyer des fichiers.
                  <Link
                    href={`/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}`}
                    onClick={() => { try { sessionStorage.setItem("pendingAnonConvert", token); } catch {} }}
                    className="ml-1 font-medium underline hover:no-underline"
                  >
                    Créer un compte
                  </Link>
                </div>
              )}
              {assets.length > 0 && (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {assets.map((a) => {
                    const signedUrl = assetSignedUrls[a.id];
                    const isImage = a.kind === "image" || (a.file_name?.match(/\.(png|jpg|jpeg|webp|gif)$/i));
                    return (
                      <li key={a.id} className="group/row flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <div className="relative aspect-video max-h-[140px] w-full shrink-0 overflow-hidden bg-black/40">
                          {isImage && signedUrl ? (
                            <a href={signedUrl} download={a.file_name ?? "asset"} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                              <img src={signedUrl} alt={a.file_name ?? "Asset"} className="h-full w-full object-cover transition group-hover/row:opacity-90" />
                            </a>
                          ) : (
                            <a href={signedUrl ?? "#"} download={a.file_name ?? "asset"} target="_blank" rel="noopener noreferrer" className="flex h-full w-full items-center justify-center">
                              <FileImage className="h-10 w-10 text-muted-foreground" />
                            </a>
                          )}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover/row:bg-black/50 group-hover/row:opacity-100" aria-hidden>
                            <span className="rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white">Cliquer pour ouvrir / télécharger</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                          <span className="truncate text-sm text-foreground">{a.file_name || "Fichier"}</span>
                          {signedUrl && (
                            <a href={signedUrl} download={a.file_name ?? "asset"} className="shrink-0 rounded-lg bg-red-500/20 p-1.5 text-red-400 hover:bg-red-500/30">
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </BentoCard>
        </section>

        <section id="references" className="scroll-mt-24">
          <BentoCard
            title="Inspirations & Références"
            icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
            hint="Images de ref et liens YouTube."
          >
            {references.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {references.map((ref) => {
                  const imgUrl = ref.kind === "image" ? (referenceSignedUrls[ref.id] ?? ref.url) : null;
                  const ytId = ref.kind === "youtube" ? ref.url.match(YOUTUBE_REG)?.[1] : null;
                  return (
                    <div key={ref.id} className="flex max-h-[340px] flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                      <div className="relative aspect-video max-h-[200px] w-full shrink-0 overflow-hidden">
                        {ref.kind === "image" && imgUrl ? (
                          <img src={imgUrl} alt="Référence" className="h-full w-full object-cover" />
                        ) : ytId ? (
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                            <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="YouTube" className="h-full w-full object-cover transition hover:opacity-90" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ExternalLink className="h-10 w-10 text-white drop-shadow-lg" />
                            </div>
                          </a>
                        ) : (
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="flex h-full w-full items-center justify-center bg-black/20">
                            <ExternalLink className="h-10 w-10 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                      <div className="flex min-h-0 flex-1 flex-col gap-1 p-3">
                        <label className="text-xs font-medium text-muted-foreground">Commentaire</label>
                        <p className="text-sm text-foreground">{ref.comment || "—"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune référence pour l&apos;instant.</p>
            )}
          </BentoCard>
        </section>

        <section id="versions" className="scroll-mt-24">
          <BentoCard
            title="Versions"
            icon={<Layers className="h-4 w-4 text-muted-foreground" />}
            hint="Miniatures déposées par le graphiste. Tu peux commenter sous chacune."
            className="flex flex-col min-h-0"
            contentNoScroll
          >
            <div className="min-h-[320px] max-h-[480px] flex-1 overflow-y-auto overflow-x-hidden">
              {versions.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {versions.map((v) => {
                    const thumbUrl = versionSignedUrls[v.id];
                    return (
                      <div key={v.id} className="group/v flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <div className="relative aspect-video max-h-[200px] w-full shrink-0 overflow-hidden bg-black/40">
                          <button
                            type="button"
                            onClick={() => setLightboxVersion({ id: v.id, version_number: v.version_number })}
                            className="absolute inset-0 z-[1] h-full w-full text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset"
                          >
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={`Version ${v.version_number}`} className="h-full w-full object-cover transition group-hover/v:opacity-90" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">V{v.version_number}</div>
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
                          <span className="text-sm font-medium text-foreground">V{v.version_number}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(v.created_at), "d MMM HH:mm", { locale: fr })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Aucune version pour l&apos;instant.</p>
              )}
            </div>
          </BentoCard>
        </section>

        <section id="chat" className="scroll-mt-24">
          <BentoCard title="Chat" icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} className="flex flex-col min-h-0" contentNoScroll>
            <div className="min-h-[320px] max-h-[480px] flex flex-col">
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-1">
                {messages.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Aucun message. Envoyez le premier.</p>
                ) : (
                  messages.map((msg) => {
                    const isGuest = !!msg.anonymous_session_id;
                    const name = isGuest ? "Invité" : "Membre";
                    return (
                      <div key={msg.id} className={`flex flex-col ${isGuest ? "items-end" : "items-start"}`}>
                        <div className={`flex max-w-[85%] gap-2 ${isGuest ? "flex-row-reverse" : ""}`}>
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isGuest ? "bg-red-500/90 text-white" : "bg-slate-500/90 text-white"}`}>
                            {isGuest ? "I" : "M"}
                          </div>
                          <div className={`rounded-lg px-3 py-2 ${isGuest ? "border border-red-500/30 bg-red-500/20" : "border border-slate-500/30 bg-slate-500/20"}`}>
                            <p className="text-xs font-medium text-muted-foreground">{name}</p>
                            {msg.content?.trim() ? <ChatMessageContent content={msg.content} className="mt-0.5 text-sm text-foreground" linkClassName="text-red-400 underline hover:text-red-300" /> : null}
                            <p className="mt-1 text-xs text-muted-foreground">{format(new Date(msg.created_at), "HH:mm", { locale: fr })}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={listEndRef} />
              </div>
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <AutoResizeTextarea
                  maxRows={6}
                  minRows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Écris un message…"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={sending || !content.trim()}
                  className="flex h-10 shrink-0 items-center justify-center rounded-lg bg-red-500 px-4 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {sending ? "…" : <Send className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
          </BentoCard>
        </section>
      </main>

      <ProjectPageNav accentRed />

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
                <p className="text-sm font-medium text-muted-foreground">Commentaires</p>
                {lightboxUrl && (
                  <a href={lightboxUrl} download={`version-${lightboxVersion.version_number}.png`} className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30">
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </a>
                )}
              </div>
              {(versionFeedback[lightboxVersion.id] ?? []).map((f) => (
                <div key={f.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-foreground">
                  <p className="text-xs text-muted-foreground">
                    {f.anonymous_session_id ? "Invité" : "Membre"} · {format(new Date(f.created_at), "dd/MM HH:mm", { locale: fr })}
                  </p>
                  <p className="mt-0.5">{f.content}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <AutoResizeTextarea
                  maxRows={5}
                  minRows={1}
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  placeholder="Votre commentaire…"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => submitVersionComment(lightboxVersion.id)}
                  disabled={sendingComment || !versionComment.trim()}
                  className="shrink-0 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {sendingComment ? "…" : "Envoyer"}
                </button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
