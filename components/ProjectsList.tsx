"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import { ArrowUpDown, Filter } from "lucide-react";

export type ProjectRow = {
  id: string;
  title: string;
  status: string;
  created_at: string | null;
  due_date: string | null;
  archived_at?: string | null;
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  review: "En revue",
  approved: "Approuvé",
};

const statusOrder = ["draft", "in_progress", "review", "approved"];

type SortKey = "created_at" | "due_date";
type ProjectsListProps = {
  projects: ProjectRow[];
  showSortAndFilter?: boolean;
};

export function ProjectsList({ projects, showSortAndFilter = false }: ProjectsListProps) {
  const [sortBy, setSortBy] = useState<SortKey>("created_at");
  const [sortDesc, setSortDesc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  const { byProject } = useUnreadCounts();

  const sortedAndFiltered = useMemo(() => {
    let list = [...projects];
    list = list.filter((p) => (showArchivedOnly ? !!p.archived_at : !p.archived_at));
    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }
    list.sort((a, b) => {
      const aVal = sortBy === "due_date" ? (a.due_date ? new Date(a.due_date).getTime() : 0) : (a.created_at ? new Date(a.created_at).getTime() : 0);
      const bVal = sortBy === "due_date" ? (b.due_date ? new Date(b.due_date).getTime() : 0) : (b.created_at ? new Date(b.created_at).getTime() : 0);
      if (sortDesc) return bVal - aVal;
      return aVal - bVal;
    });
    return list;
  }, [projects, sortBy, sortDesc, statusFilter, showArchivedOnly]);

  return (
    <div className="p-5 sm:p-6">
      {showSortAndFilter && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 transition-colors sm:px-5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <ArrowUpDown className="h-4 w-4 text-primary/80" />
            Trier par
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {sortDesc ? "Plus récent d'abord" : "Plus ancien d'abord"}
          </button>
          <span className="text-muted-foreground">·</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4 text-primary/80" />
            État
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
          <span className="text-muted-foreground">·</span>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchivedOnly}
              onChange={(e) => setShowArchivedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
            />
            Projets archivés
          </label>
        </div>
      )}

      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 grid-auto-rows-[280px]"
      >
        {sortedAndFiltered.map((project) => {
          const unread = byProject[project.id];
          return (
            <div key={project.id} className="project-card-in opacity-0 h-full min-h-0">
              <ProjectCard
                id={project.id}
                title={project.title}
                status={project.status as "draft" | "in_progress" | "review" | "approved"}
                createdAt={project.created_at}
                dueDate={project.due_date}
                newMessagesCount={unread?.newMessages ?? 0}
                newVersionsCount={unread?.newVersions ?? 0}
                newFeedbackCount={unread?.newFeedback ?? 0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
