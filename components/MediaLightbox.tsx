"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const YOUTUBE_REG = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;

function getYoutubeEmbedUrl(url: string) {
  const m = url.match(YOUTUBE_REG);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

type MediaLightboxProps = {
  open: boolean;
  onClose: () => void;
  type: "image" | "youtube";
  url: string;
  title?: string;
  /** Contenu affiché sous le média (commentaires, avis, etc.) */
  children?: React.ReactNode;
};

export function MediaLightbox({
  open,
  onClose,
  type,
  url,
  title,
  children,
}: MediaLightboxProps) {
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

  if (!open) return null;

  return (
    <div
      className="glass-lightbox fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="my-8 flex min-h-0 max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#1a1a1a] px-4 py-3">
          {title && (
            <h3 className="truncate text-sm font-semibold text-foreground">
              {title}
            </h3>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-interactive ml-auto rounded-lg p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu scrollable : image + commentaires (fond opaque) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#141414]">
          <div className="flex shrink-0 items-center justify-center bg-[#0d0d0d] p-4">
            {type === "image" ? (
              <img
                src={url}
                alt={title ?? "Vue agrandie"}
                className="max-h-[50vh] max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : getYoutubeEmbedUrl(url) ? (
              <div className="aspect-video w-full max-w-3xl">
                <iframe
                  src={getYoutubeEmbedUrl(url)!}
                  title="YouTube"
                  className="h-full w-full rounded-lg"
                  allowFullScreen
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
                onClick={(e) => e.stopPropagation()}
              >
                Ouvrir le lien
              </a>
            )}
          </div>

          {children && (
            <div className="shrink-0 border-t border-white/10 bg-[#1a1a1a] p-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
