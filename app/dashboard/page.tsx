"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProjectCard, type ProjectCardProps } from "@/components/ProjectCard";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { JoinProjectModal } from "@/components/JoinProjectModal";
import { DashboardStorageWidget } from "@/components/DashboardStorageWidget";
import { DashboardCalendar } from "@/components/DashboardCalendar";
import { DashboardDesignerStats } from "@/components/DashboardDesignerStats";
import { Plus, Link2, MessageSquare, Layers, ArrowUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { useUnreadCounts } from "@/hooks/use-unread-counts";

type Role = "designer" | "youtuber";

type RawProject = {
  id: string;
  title: string;
  status: ProjectCardProps["status"];
  created_at: string | null;
  due_date: string | null;
  client_id: string | null;
  designer_id: string | null;
};

const statusOrder = ["draft", "in_progress", "review", "approved"];
const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  review: "En revue",
  approved: "Approuvé",
};
type SortKey = "created_at" | "due_date";

export default function DashboardPage() {
  const [projects, setProjects] = useState<RawProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openJoinModal, setOpenJoinModal] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("due_date");
  const [sortDesc, setSortDesc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [latestVersionByProject, setLatestVersionByProject] = useState<Record<string, string>>({});
  const { byProject, rows, totalNew, loading: unreadLoading, refresh: refreshUnread } = useUnreadCounts();

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id ?? "")
        .single();
      if (profile?.role === "designer" || profile?.role === "youtuber") {
        setRole(profile.role);
      }

      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, created_at, due_date, client_id, designer_id")
        .order("created_at", { ascending: false });

      if (!error && data) setProjects(data as RawProject[]);
      setLoading(false);
    };
    init();
  }, []);

  // Dernière version par projet (pour miniature des cartes)
  useEffect(() => {
    if (projects.length === 0) {
      setLatestVersionByProject({});
      return;
    }
    const ids = projects.map((p) => p.id);
    (async () => {
      const { data: versions } = await supabase
        .from("versions")
        .select("project_id, image_url, created_at")
        .in("project_id", ids)
        .order("created_at", { ascending: false });
      const map: Record<string, string> = {};
      (versions ?? []).forEach((v: { project_id: string; image_url: string }) => {
        if (!map[v.project_id]) map[v.project_id] = v.image_url;
      });
      setLatestVersionByProject(map);
    })();
  }, [projects.map((p) => p.id).join(",")]);

  const refreshProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, status, created_at, due_date, client_id, designer_id")
      .order("created_at", { ascending: false });
    if (!error && data) setProjects(data as RawProject[]);
    refreshUnread();
  };

  const isDesigner = role === "designer";
  const title = "Bienvenue sur Pixelstack";
  const description = "Gérez vos miniatures en un seul endroit.";

  const hasActivity = rows.some(
    (r) =>
      (Number(r.new_messages_count) || 0) > 0 ||
      (Number(r.new_versions_count) || 0) > 0 ||
      (Number((r as { new_feedback_count?: number }).new_feedback_count) || 0) > 0
  );

  const designerProjects = useMemo(
    () => (userId && isDesigner ? projects.filter((p) => (p as RawProject).designer_id === userId) : []),
    [projects, userId, isDesigner]
  );

  const sortedAndFiltered = useMemo(() => {
    let list = [...projects];
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    list.sort((a, b) => {
      const aVal = sortBy === "due_date" ? (a.due_date ? new Date(a.due_date).getTime() : 0) : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const bVal = sortBy === "due_date" ? (b.due_date ? new Date(b.due_date).getTime() : 0) : (b.created_at ? new Date(b.created_at).getTime() : 0);
      return sortDesc ? bVal - aVal : aVal - bVal;
    });
    return list;
  }, [projects, sortBy, sortDesc, statusFilter]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px] space-y-8">
        <DashboardHeader
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenJoinModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-[#E5E7EB] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
            >
              <Link2 className={cn("h-4 w-4", role === "youtuber" ? "text-red-400" : "text-[#3B82F6]")} />
              Rejoindre un projet
            </button>
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="btn-primary-glow inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer un projet
            </button>
          </div>
        }
      />

      {/* Notifications in-app : mises à jour à ne pas manquer */}
      {hasActivity && !unreadLoading && (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px]">
          <h2 className="mb-1 flex items-center gap-2 text-[20px] font-medium text-[#E5E7EB]">
            <span
              className={cn(
                "flex h-2 w-2 rounded-full animate-pulse",
                role === "youtuber" ? "bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.6)]" : "bg-[#6366F1] shadow-[0_0_10px_rgba(99,102,241,0.6)]"
              )}
              aria-hidden
            />
            Vous avez des mises à jour
          </h2>
          <p className="mb-3 text-sm text-[#9CA3AF]">
            Nouveaux messages, miniatures prêtes ou retours à consulter — clique pour ouvrir le projet.
          </p>
          <ul className="space-y-2">
            {rows.map((r) => {
              const messages = Number(r.new_messages_count) || 0;
              const versions = Number(r.new_versions_count) || 0;
              const feedback = Number((r as { new_feedback_count?: number }).new_feedback_count) || 0;
              if (messages === 0 && versions === 0 && feedback === 0) return null;
              const isYoutuber = role === "youtuber";
              const notifVersionsCls = isYoutuber
                ? "border-red-500/40 bg-red-500/15 hover:bg-red-500/25 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                : "border-[#6366F1]/40 bg-[#6366F1]/15 hover:bg-[#6366F1]/25 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]";
              const notifMessagesCls = isYoutuber
                ? "border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:shadow-[0_0_16px_rgba(220,38,38,0.2)]"
                : "border-[#3B82F6]/40 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 hover:shadow-[0_0_16px_rgba(59,130,246,0.2)]";
              return (
                <li key={r.project_id} className="flex flex-wrap items-center gap-2 text-sm">
                  {versions > 0 && (
                    <Link
                      href={`/projects/${r.project_id}?highlight=versions`}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 font-medium text-[#E5E7EB] transition-all ${notifVersionsCls}`}
                    >
                      <Layers className={cn("h-4 w-4", isYoutuber ? "text-red-400" : "text-[#6366F1]")} />
                      <span className="font-semibold">Votre mini est prête</span> — {versions} version(s) sur « {r.project_title} »
                    </Link>
                  )}
                  {messages > 0 && (
                    <Link
                      href={`/projects/${r.project_id}?highlight=messages`}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 font-medium text-[#E5E7EB] transition-all ${notifMessagesCls}`}
                    >
                      <MessageSquare className={cn("h-4 w-4", isYoutuber ? "text-red-400" : "text-[#3B82F6]")} />
                      {messages} {messages > 1 ? "nouveaux messages" : "nouveau message"} sur « {r.project_title} »
                    </Link>
                  )}
                  {feedback > 0 && (
                    <Link
                      href={`/projects/${r.project_id}?highlight=versions`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 font-medium text-[#E5E7EB] transition-colors hover:bg-amber-500/25"
                    >
                      <MessageSquare className="h-4 w-4 text-amber-400" />
                      {feedback} retour(s) à consulter sur « {r.project_title} »
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Mes projets */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[20px] font-medium text-[#E5E7EB]">
            <span
              className={cn(
                "h-1 w-8 rounded-full",
                role === "youtuber" ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]"
              )}
              aria-hidden
            />
            Mes projets
          </h2>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium tabular-nums text-[#E5E7EB]",
              role === "youtuber" ? "border-red-500/40 bg-red-500/15" : "border-[#6366F1]/40 bg-[#6366F1]/15"
            )}
          >
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isDesigner && projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 sm:gap-3 sm:px-5 backdrop-blur-[20px]">
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#9CA3AF]">
              <ArrowUpDown className={cn("h-4 w-4 shrink-0", role === "youtuber" ? "text-red-400" : "text-[#6366F1]")} />
              <span className="hidden sm:inline">Trier par</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="dropdown-pixel min-w-[140px]"
            >
              <option value="created_at">Date de création</option>
              <option value="due_date">Date de rendu</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDesc((d) => !d)}
              className={cn(
                "h-9 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]",
                role === "youtuber"
                  ? "bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_16px_rgba(220,38,38,0.3)] hover:shadow-[0_0_24px_rgba(220,38,38,0.4)] focus:ring-red-500"
                  : "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] shadow-[0_0_16px_rgba(99,102,241,0.3)] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] focus:ring-[#6366F1]"
              )}
            >
              {sortDesc ? "Plus récent" : "Plus ancien"}
            </button>
            <span className="text-[#6B7280] hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#9CA3AF]">
              <Filter className={cn("h-4 w-4 shrink-0", role === "youtuber" ? "text-red-400" : "text-[#6366F1]")} />
              <span className="hidden sm:inline">État</span>
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="dropdown-pixel min-w-[100px]"
            >
              <option value="all">Tous</option>
              {statusOrder.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s] ?? s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          {loading ? (
            <EmptyState
              title="Chargement…"
              description="Récupération de tes projets."
            />
          ) : projects.length === 0 ? (
            <EmptyState
              title="Aucun projet"
              description={
                isDesigner
                  ? "Crée un projet et partage le lien d'invitation à ton client (YouTuber)."
                  : "Crée un projet et partage le lien d'invitation à ton graphiste."
              }
              actionLabel="Créer un projet"
              onAction={() => setOpenModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 lg:grid-cols-3 lg:gap-6">
              {sortedAndFiltered.map((project) => {
                const unread = byProject[project.id];
                return (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    title={project.title}
                    status={project.status}
                    createdAt={project.created_at}
                    dueDate={project.due_date}
                    newMessagesCount={unread?.newMessages ?? 0}
                    newVersionsCount={unread?.newVersions ?? 0}
                    newFeedbackCount={unread?.newFeedback ?? 0}
                    latestVersionImageUrl={latestVersionByProject[project.id]}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bloc graphiste : Vue d'ensemble (grille stats) + calendrier réduit */}
      {isDesigner && (
        <>
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 text-[20px] font-medium text-[#E5E7EB]">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-[#6366F1] to-[#3B82F6]" aria-hidden />
              Vue d’ensemble
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DashboardDesignerStats projects={designerProjects} />
              </div>
              <div>
                <DashboardStorageWidget />
              </div>
            </div>
          </section>
          <section className="w-full">
            <DashboardCalendar
              projects={designerProjects}
              currentUserId={userId}
              isDesigner={isDesigner}
              compact={false}
            />
          </section>
        </>
      )}

      </div>

      <CreateProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={refreshProjects}
        role={role}
        userId={userId}
      />
      <JoinProjectModal
        open={openJoinModal}
        onClose={() => setOpenJoinModal(false)}
      />
    </div>
  );
}
