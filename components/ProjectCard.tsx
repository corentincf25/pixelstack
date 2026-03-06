"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useProjectThumbnail } from "@/hooks/useProjectThumbnail";
import { CardTilt } from "@/components/CardTilt";
import { cn } from "@/lib/utils";

type ProjectStatus = "draft" | "in_progress" | "review" | "approved";

export type ProjectCardProps = {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt?: string | null;
  dueDate?: string | null;
  clientName?: string | null;
  designerName?: string | null;
  /** Avatar URL du client (YouTuber) */
  clientAvatarUrl?: string | null;
  /** Avatar URL du graphiste */
  designerAvatarUrl?: string | null;
  unreadCount?: number;
  /** Nombre de nouveaux messages (pastille) */
  newMessagesCount?: number;
  /** Nombre de nouvelles versions (pastille) */
  newVersionsCount?: number;
  /** Nombre de retours demandés par le client (pastille, graphiste) */
  newFeedbackCount?: number;
  /** Image URL ou chemin de la dernière version (miniature) */
  latestVersionImageUrl?: string | null;
  /** Pastilles de notif en rouge (profil YouTuber) */
  accentRed?: boolean;
};

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  review: "En revue",
  approved: "Approuvé",
};

const statusCardStyles: Record<ProjectStatus, string> = {
  draft: "border-l-4 border-l-[#6B7280] border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] hover:from-white/[0.08] hover:to-white/[0.04] hover:shadow-[0_12px_48px_rgba(0,0,0,0.55)]",
  in_progress: "border-l-4 border-l-[#3B82F6] border-white/[0.08] bg-gradient-to-br from-[#3B82F6]/10 to-white/[0.02] hover:from-[#3B82F6]/15 hover:shadow-[0_12px_48px_rgba(0,0,0,0.55),0_0_24px_rgba(59,130,246,0.15)]",
  review: "border-l-4 border-l-[#6366F1] border-white/[0.08] bg-gradient-to-br from-[#6366F1]/10 to-white/[0.02] hover:from-[#6366F1]/15 hover:shadow-[0_12px_48px_rgba(0,0,0,0.55),0_0_24px_rgba(99,102,241,0.15)]",
  approved: "border-l-4 border-l-[#10B981] border-white/[0.08] bg-gradient-to-br from-[#10B981]/10 to-white/[0.02] hover:from-[#10B981]/15 hover:shadow-[0_12px_48px_rgba(0,0,0,0.55)]",
};

const statusBadgeStyles: Record<ProjectStatus, string> = {
  draft: "bg-[#6B7280]/20 text-[#9CA3AF] border-[#6B7280]/40",
  in_progress: "bg-[#3B82F6]/20 text-[#93C5FD] border-[#3B82F6]/40",
  review: "bg-[#6366F1]/20 text-[#A5B4FC] border-[#6366F1]/40",
  approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

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
  const thumbnailUrl = useProjectThumbnail(id, latestVersionImageUrl ?? null);
  useEffect(() => {
    if (!thumbnailUrl) setThumbLoaded(false);
  }, [thumbnailUrl]);
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
    <CardTilt className="h-full min-h-0">
      <Link
        href={`/projects/${id}${highlightQuery}`}
        className={`card-hover-lift relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border p-0 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${cardStyle}`}
      >
      {/* Miniature dernière version */}
      {thumbnailUrl ? (
        <div className="relative h-24 w-full shrink-0 overflow-hidden border-b border-white/[0.08] bg-black/20">
          <img
            src={thumbnailUrl}
            alt=""
            className={cn("h-full w-full object-cover object-center transition-opacity duration-300", thumbLoaded ? "opacity-100" : "opacity-0")}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 400px) 100vw, 320px"
            onLoad={() => setThumbLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      ) : (
        <div className="h-16 shrink-0 border-b border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-transparent" />
      )}
      <div className="relative p-4">
      {/* Noms / avatars client (YouTuber) et graphiste */}
      {(clientName || designerName || clientAvatarUrl || designerAvatarUrl) && (
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[#9CA3AF]">
          {clientName != null && (
            <span className="flex items-center gap-1.5 text-xs">
              {clientAvatarUrl ? (
                <img src={clientAvatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-[#E5E7EB]">Y</span>
              )}
              <span className="truncate">{clientName}</span>
            </span>
          )}
          {designerName != null && clientName != null && <span className="text-white/30">·</span>}
          {designerName != null && (
            <span className="flex items-center gap-1.5 text-xs">
              {designerAvatarUrl ? (
                <img src={designerAvatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-[#E5E7EB]">G</span>
              )}
              <span className="truncate">{designerName}</span>
            </span>
          )}
        </div>
      )}
      {hasNew && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          {newMessagesCount > 0 && (
            <span
              className={cn(
                "animate-badge-pulse flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                accentRed ? "bg-red-500 shadow-[0_0_12px_rgba(220,38,38,0.5)]" : "bg-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.5)]"
              )}
              title="Nouveaux messages"
            >
              {newMessagesCount > 99 ? "99+" : newMessagesCount}
            </span>
          )}
          {newVersionsCount > 0 && (
            <span
              className={cn(
                "animate-badge-pulse flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                accentRed ? "bg-red-600 shadow-[0_0_12px_rgba(185,28,28,0.5)]" : "bg-[#6366F1] shadow-[0_0_12px_rgba(99,102,241,0.5)]"
              )}
              title="Nouvelles versions"
            >
              {newVersionsCount > 99 ? "99+" : newVersionsCount}
            </span>
          )}
          {newFeedbackCount > 0 && (
            <span className="animate-badge-pulse flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white" title="Retours demandés">
              {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col gap-2 pr-20">
        <h3 className="truncate text-sm font-semibold tracking-tight text-[#E5E7EB]">
          {title}
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
            {statusLabels[status]}
          </span>
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            {dueLabel && <span className="text-xs">Rendu: {dueLabel}</span>}
            <span className="text-xs">{createdLabel}</span>
          </div>
        </div>
      </div>
      </div>
    </Link>
    </CardTilt>
  );
}
