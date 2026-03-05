"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { notifyProjectUpdate } from "@/lib/notify";
import { markProjectMessagesRead } from "@/lib/project-read";
import { useSignedUrls, extractStoragePath } from "./useSignedUrls";
import { compressImageForChat } from "@/lib/compress-image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, ArrowDown, ImagePlus, X } from "lucide-react";
import { MediaLightbox } from "@/components/MediaLightbox";

const RECENT_MESSAGES_COUNT = 5; // Barre "Derniers messages" au-dessus des N derniers

type Message = {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  image_url: string | null;
};

type ProjectChatProps = {
  projectId: string;
  currentUserId: string;
  designerId?: string;
  clientId?: string;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

function getMessageImagePath(projectId: string, imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith(projectId + "/") || (!imageUrl.startsWith("http") && imageUrl.includes("/"))) return imageUrl;
  const extracted = extractStoragePath(imageUrl);
  return extracted ?? imageUrl;
}

export function ProjectChat({ projectId, currentUserId, designerId, clientId }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name?: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingImage) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  const imagePaths = useMemo(
    () => messages.map((m) => getMessageImagePath(projectId, m.image_url)).filter(Boolean) as string[],
    [messages, projectId]
  );
  const signedUrls = useSignedUrls(projectId, imagePaths);
  const getImageUrl = useCallback(
    (msg: Message) => {
      const path = getMessageImagePath(projectId, msg.image_url);
      if (!path) return null;
      return signedUrls[path] ?? null;
    },
    [projectId, signedUrls]
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
      setShowScrollToBottom(false);
    } else {
      listEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // Rester en bas après rendu (double rAF pour attendre le DOM à l'envoi d'un message)
  useEffect(() => {
    if (messages.length === 0) return;
    const el = scrollContainerRef.current;
    const scrollToEnd = () => {
      if (el) {
        el.scrollTop = el.scrollHeight;
        setShowScrollToBottom(false);
        const threshold = 120;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
        if (!isNearBottom) setTimeout(() => setShowScrollToBottom(true), 100);
      } else {
        listEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToEnd);
    });
  }, [messages]);

  // Détecter si l'utilisateur a remonté pour afficher le bouton "Revenir en bas"
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || messages.length === 0) return;
    const check = () => {
      const threshold = 120;
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setShowScrollToBottom(!isNearBottom);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [messages.length]);

  // Chargement initial des messages
  useEffect(() => {
    const load = async () => {
      const { data: rows, error } = await supabase
        .from("messages")
        .select("id, project_id, sender_id, content, created_at, image_url")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) {
        setLoading(false);
        return;
      }
      setMessages((rows as Message[]) ?? []);

      const senderIds = [...new Set((rows ?? []).map((r) => r.sender_id))];
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", senderIds);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p) => {
          map[p.id] = p.full_name || "Utilisateur";
        });
        setSenderNames(map);
      }
      setLoading(false);
      markProjectMessagesRead(projectId);
    };
    load();
  }, [projectId]);

  // Abonnement Realtime : nouveaux messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          const newRow = payload.new as Message;
          setMessages((prev) => [...prev, newRow]);
          const { data: p } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("id", newRow.sender_id)
            .single();
          if (p) {
            setSenderNames((prev) => ({ ...prev, [p.id]: p.full_name || "Utilisateur" }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    const hasImage = !!pendingImage;
    if ((!text && !hasImage) || sending) return;

    setSending(true);
    let imagePath: string | null = null;
    let imageSize: number | null = null;

    if (pendingImage) {
      try {
        const blob = await compressImageForChat(pendingImage);
        const quotaRes = await fetch("/api/storage/check-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, fileSize: blob.size }),
        });
        const quotaData = await quotaRes.json().catch(() => ({}));
        if (!quotaData.allowed) {
          setError("Quota de stockage dépassé. Passez au plan supérieur.");
          setSending(false);
          return;
        }
        const ext = "jpg";
        const path = `${projectId}/chat/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("assets").upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
        if (uploadErr) {
          setSending(false);
          return;
        }
        imagePath = path;
        imageSize = blob.size;
      } catch {
        setSending(false);
        return;
      }
    }

    const { error } = await supabase.from("messages").insert({
      project_id: projectId,
      sender_id: currentUserId,
      content: text || "",
      image_url: imagePath,
      image_size_bytes: imageSize,
    });
    setSending(false);
    if (!error) {
      setContent("");
      setPendingImage(null);
      setError(null);
      notifyProjectUpdate(projectId, "message");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        Chargement du chat…
      </div>
    );
  }

  return (
    <div className="relative flex h-full max-h-[420px] min-h-[200px] flex-col sm:min-h-[280px]">
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden rounded-lg border border-border/50 bg-muted/20 p-3 overscroll-contain"
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun message. Envoie le premier pour discuter du projet.
          </p>
        ) : (
          <>
            {messages.slice(0, -RECENT_MESSAGES_COUNT).map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const name = senderNames[msg.sender_id] ?? (isMe ? "Toi" : "…");
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className={`flex max-w-[85%] gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        msg.sender_id === designerId ? "bg-blue-500/90 text-white" : msg.sender_id === clientId ? "bg-red-500/90 text-white" : "bg-muted text-foreground"
                      }`}
                      title={name}
                    >
                      {getInitials(name)}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : msg.sender_id === designerId
                            ? "bg-blue-500/20 text-foreground border border-blue-500/30"
                            : msg.sender_id === clientId
                              ? "bg-red-500/20 text-foreground border border-red-500/30"
                              : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-xs font-medium opacity-90">{name}</p>
                      {msg.image_url && (() => {
                        const url = getImageUrl(msg);
                        return url ? (
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ url, name: name })}
                            className="mt-1 block overflow-hidden rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <img src={url} alt="" className="max-h-40 max-w-full cursor-pointer object-cover transition hover:opacity-90" />
                          </button>
                        ) : (
                          <div className="mt-1 h-20 w-24 animate-pulse rounded-lg bg-white/10" />
                        );
                      })()}
                      {msg.content ? <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{msg.content}</p> : null}
                      <p className={`mt-1 text-xs opacity-75 ${isMe ? "text-right" : ""}`}>
                        {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {messages.length > RECENT_MESSAGES_COUNT && (
              <div className="flex items-center gap-2 py-2">
                <span className="h-px flex-1 bg-primary/40" aria-hidden />
                <span className="text-xs font-medium text-muted-foreground">Derniers messages</span>
                <span className="h-px flex-1 bg-primary/40" aria-hidden />
              </div>
            )}
            {messages.slice(-RECENT_MESSAGES_COUNT).map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const name = senderNames[msg.sender_id] ?? (isMe ? "Toi" : "…");
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                <div className={`flex max-w-[85%] gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      msg.sender_id === designerId
                        ? "bg-blue-500/90 text-white"
                        : msg.sender_id === clientId
                          ? "bg-red-500/90 text-white"
                          : "bg-muted text-foreground"
                    }`}
                    title={name}
                  >
                    {getInitials(name)}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      isMe
                        ? "bg-primary text-primary-foreground"
                        : msg.sender_id === designerId
                          ? "bg-blue-500/20 text-foreground border border-blue-500/30"
                          : msg.sender_id === clientId
                            ? "bg-red-500/20 text-foreground border border-red-500/30"
                            : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-xs font-medium opacity-90">{name}</p>
                    {msg.image_url && (() => {
                      const url = getImageUrl(msg);
                      return url ? (
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url, name: name })}
                          className="mt-1 block overflow-hidden rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <img src={url} alt="" className="max-h-40 max-w-full cursor-pointer object-cover transition hover:opacity-90" />
                        </button>
                      ) : (
                        <div className="mt-1 h-20 w-24 animate-pulse rounded-lg bg-white/10" />
                      );
                    })()}
                    {msg.content ? <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{msg.content}</p> : null}
                    <p className={`mt-1 text-xs opacity-75 ${isMe ? "text-right" : ""}`}>
                      {format(new Date(msg.created_at), "HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </>
        )}
        <div ref={listEndRef} />
      </div>

      {showScrollToBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="btn-interactive absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-card/95 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm hover:bg-card"
          aria-label="Revenir aux derniers messages"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Conversation récente
        </button>
      )}

      <form onSubmit={sendMessage} className="sticky bottom-0 z-10 mt-4 flex shrink-0 flex-col gap-2 rounded-lg bg-background/95 py-1 backdrop-blur sm:static sm:bg-transparent sm:py-0">
        {error && <p className="text-sm text-red-400">{error}</p>}
        {pendingImage && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
            {previewUrl ? <img src={previewUrl} alt="" className="h-14 w-14 rounded object-cover" /> : <div className="h-14 w-14 rounded bg-white/10 animate-pulse" />}
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{pendingImage.name}</span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
              aria-label="Retirer l’image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && /^image\//.test(f.type)) setPendingImage(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-white/5 hover:text-foreground"
            aria-label="Joindre une image"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={pendingImage ? "Légende (optionnel)…" : "Écris un message…"}
            className="min-h-[44px] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || (!content.trim() && !pendingImage)}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      <MediaLightbox
        open={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        type="image"
        url={lightboxImage?.url ?? ""}
        title={lightboxImage?.name}
      />
    </div>
  );
}
