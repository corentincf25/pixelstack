"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const YOUTUBE_REG = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function getYoutubeEmbedUrl(url: string) {
  const m = url.match(YOUTUBE_REG);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export type ImagePreviewModalType = "version" | "asset" | "reference";

export type ImagePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  type: "image" | "youtube";
  url: string;
  title?: string;
  /** Afficher la section commentaires (même layout pour version/asset/ref, contenu passé en children) */
  showComments?: boolean;
  /** Contenu de la section commentaires (avis, formulaire, etc.) — même zone pour tous les types */
  children?: React.ReactNode;
};

/**
 * Modal unique pour la prévisualisation d’une image / vidéo (version, asset, référence).
 * Rendu via portal dans document.body pour un z-index toujours au-dessus de l’UI.
 * Même layout partout : header, container image centré fond opaque, section commentaires optionnelle.
 */
export function ImagePreviewModal({
  open,
  onClose,
  type,
  url,
  title,
  showComments = true,
  children,
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted || typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: "rgba(5,5,5,0.98)",
        zIndex: 9999,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
    >
      <div
        className="my-8 flex min-h-0 max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header identique pour tous */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#151515] px-4 py-3">
          {title && (
            <h3 id="image-preview-title" className="truncate text-sm font-semibold text-[#E5E7EB]">
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto cursor-pointer rounded-lg p-2 text-[#9CA3AF] transition hover:bg-white/10 hover:text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Container image : fond opaque, centré, ratio stable */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#111111]">
          <div className="flex shrink-0 items-center justify-center bg-[#0d0d0d] p-6 min-h-[280px]">
            {type === "image" ? (
              <img
                src={url}
                alt={title ?? "Aperçu"}
                className="max-h-[50vh] max-w-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : getYoutubeEmbedUrl(url) ? (
              <div className="aspect-video w-full max-w-3xl rounded-xl overflow-hidden">
                <iframe
                  src={getYoutubeEmbedUrl(url)!}
                  title="YouTube"
                  className="h-full w-full"
                  allowFullScreen
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6366F1] underline"
                onClick={(e) => e.stopPropagation()}
              >
                Ouvrir le lien
              </a>
            )}
          </div>

          {/* Section commentaires : même layout pour version / asset / référence (cachée si showComments false) */}
          {showComments && (
            <div className="shrink-0 border-t border-white/10 bg-[#151515] p-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
