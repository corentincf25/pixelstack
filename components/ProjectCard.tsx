"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useProjectThumbnail } from "@/hooks/useProjectThumbnail";
import { cn } from "@/lib/utils";

const TILT_MAX = 6;
const TILT_PERSPECTIVE = 1200;
const TILT_SMOOTH_MS = 120;

type ProjectStatus = "draft" | "in_progress" | "review" | "approved";

export type ProjectCardProps = {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt?: string | null;
  dueDate?: string | null;
  clientName?: string | null;
  designerName?: string | null;
  clientAvatarUrl?: string | null;
  designerAvatarUrl?: string | null;
  newMessagesCount?: number;
  newVersionsCount?: number;
  newFeedbackCount?: number;
  latestVersionImageUrl?: string | null;
  accentRed?: boolean;
};

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  review: "En revue",
  approved: "Approuvé",
};

const statusCardStyles: Record<ProjectStatus, string> = {
  draft: "border-l-4 border-l-[#6B7280] border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:from-white/[0.08] hover:to-white/[0.04]",
  in_progress: "border-l-4 border-l-[#3B82F6] border-white/[0.08] bg-gradient-to-br from-[#3B82F6]/10 to-white/[0.02] hover:from-[#3B82F6]/15",
  review: "border-l-4 border-l-[#6366F1] border-white/[0.08] bg-gradient-to-br from-[#6366F1]/10 to-white/[0.02] hover:from-[#6366F1]/15",
  approved: "border-l-4 border-l-[#10B981] border-white/[0.08] bg-gradient-to-br from-[#10B981]/10 to-white/[0.02] hover:from-[#10B981]/15",
};

const statusBadgeStyles: Record<ProjectStatus, string> = {
  draft: "bg-[#6B7280]/20 text-[#9CA3AF] border-[#6B7280]/40",
  in_progress: "bg-[#3B82F6]/20 text-[#93C5FD] border-[#3B82F6]/40",
  review: "bg-[#6366F1]/20 text-[#A5B4FC] border-[#6366F1]/40",
  approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

/** Hauteur totale de la card (pour alignement grid) : mobile 280px, desktop 280px */
export const PROJECT_CARD_HEIGHT = 280;
export const PROJECT_CARD_HEIGHT_MOBILE = 280;

export function ProjectCard({
  id,
  title,
  status,
  createdAt,
  dueDate,
  clientName,
  designerName,
  clientAvatarUrl,
  designerAvatarUrl,
  newMessagesCount = 0,
  newVersionsCount = 0,
  newFeedbackCount = 0,
  latestVersionImageUrl,
  accentRed = false,
}: ProjectCardProps) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const thumbnailUrl = useProjectThumbnail(id, latestVersionImageUrl ?? null);

  useEffect(() => {
    if (!thumbnailUrl) setThumbLoaded(false);
  }, [thumbnailUrl]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;
      const x = (e.clientX - rect.left) / w - 0.5;
      const y = (e.clientY - rect.top) / h - 0.5;
      setTilt({ x: -y * TILT_MAX, y: x * TILT_MAX });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const createdLabel = createdAt
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: fr })
    : "—";
  const dueLabel = dueDate
    ? format(new Date(dueDate), "d MMM yyyy", { locale: fr })
    : null;
  const hasNew = newMessagesCount > 0 || newVersionsCount > 0 || newFeedbackCount > 0;
  const highlightParts: string[] = [];
  if (newMessagesCount > 0) highlightParts.push("messages");
  if (newVersionsCount > 0 || newFeedbackCount > 0) highlightParts.push("versions");
  const highlightQuery = highlightParts.length > 0 ? `?highlight=${highlightParts.join(",")}` : "";

  const safeStatus = status in statusCardStyles ? status : "draft";
  const cardStyle = statusCardStyles[safeStatus as ProjectStatus];
  const badgeStyle = statusBadgeStyles[safeStatus as ProjectStatus];

  return (
    <Link
      href={`/projects/${id}${highlightQuery}`}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] block h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px] transition-transform ease-out",
          cardStyle
        )}
        style={{
          transform: `perspective(${TILT_PERSPECTIVE}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transitionDuration: tilt.x === 0 && tilt.y === 0 ? `${TILT_SMOOTH_MS}ms` : "0ms",
        }}
      >
      {/* Zone image : hauteur fixe, plus basse sur mobile */}
      <div className="relative h-[72px] w-full shrink-0 overflow-hidden border-b border-white/[0.08] bg-black/20 sm:h-[100px]">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt=""
              className={cn(
                "h-full w-full object-cover object-center transition-opacity duration-300",
                thumbLoaded ? "opacity-100" : "opacity-0"
              )}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 400px) 100vw, 320px"
              onLoad={() => setThumbLoaded(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-white/[0.04] to-transparent" />
        )}
        {hasNew && (
          <div className="absolute right-2 top-2 flex gap-1.5">
            {newMessagesCount > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                  accentRed ? "bg-red-500" : "bg-[#3B82F6]"
                )}
              >
                {newMessagesCount > 99 ? "99+" : newMessagesCount}
              </span>
            )}
            {newVersionsCount > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                  accentRed ? "bg-red-600" : "bg-[#6366F1]"
                )}
              >
                {newVersionsCount > 99 ? "99+" : newVersionsCount}
              </span>
            )}
            {newFeedbackCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">
                {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contenu : sur mobile titre en premier, padding renforcé, noms sur une ligne distincte sans chevauchement */}
      <div className="relative flex min-h-0 flex-1 flex-col p-4 sm:p-4 min-h-[140px] md:min-h-0">
        {/* Titre : visible en premier sur mobile (order-1), après les noms sur desktop (md:order-2) */}
        <h3 className="order-1 md:order-2 truncate text-sm font-semibold tracking-tight text-[#E5E7EB] mb-1 md:mb-0 md:mt-0">
          {title}
        </h3>
        {/* Client / graphiste : ligne dédiée, pas de chevauchement (empilé sur mobile si besoin) */}
        {(clientName || designerName || clientAvatarUrl || designerAvatarUrl) && (
          <div className="order-2 md:order-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 text-[#9CA3AF] mb-2 md:mb-2">
            {clientName != null && (
              <span className="flex items-center gap-1.5 text-xs min-w-0">
                {clientAvatarUrl ? (
                  <img src={clientAvatarUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-[#E5E7EB]">Y</span>
                )}
                <span className="truncate">{clientName}</span>
              </span>
            )}
            {designerName != null && clientName != null && <span className="hidden sm:inline text-white/30">·</span>}
            {designerName != null && (
              <span className="flex items-center gap-1.5 text-xs min-w-0">
                {designerAvatarUrl ? (
                  <img src={designerAvatarUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-[#E5E7EB]">G</span>
                )}
                <span className="truncate">{designerName}</span>
              </span>
            )}
          </div>
        )}
        {/* Statut et infos secondaires */}
        <div className="order-3 mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <span className={cn("rounded-lg border px-2 py-0.5 text-xs font-medium shrink-0", badgeStyle)}>
            {statusLabels[status]}
          </span>
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] min-w-0">
            {dueLabel && <span className="truncate">Rendu: {dueLabel}</span>}
            <span className="truncate">{createdLabel}</span>
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
}
