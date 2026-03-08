import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProjectAssets } from "./ProjectAssets";
import { ProjectActions } from "./ProjectActions";
import { ProjectInviteLink } from "./ProjectInviteLink";
import { ProjectChat } from "./ProjectChat";
import { ProjectDeleteSection } from "./ProjectDeleteSection";
import { ProjectBrief } from "./ProjectBrief";
import { ProjectDueDateEdit } from "./ProjectDueDateEdit";
import { ProjectVersions } from "./ProjectVersions";
import { ProjectReferences } from "./ProjectReferences";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, FileImage, Layers, MessageSquare, ImageIcon, Link2, FileText } from "lucide-react";
import { BackLink } from "@/components/BackLink";
import { BentoCard } from "@/components/BentoCard";
import { ProjectHighlightZone } from "./ProjectHighlightZone";
import { ProjectPageNav } from "./ProjectPageNav";
import { ProjectIntervenants } from "./ProjectIntervenants";
import { AnonPresenceBanner } from "@/components/AnonPresenceBanner";
import { ProjectActivityProvider } from "@/components/ProjectActivityProvider";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
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

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params;
  const search = searchParams ? await searchParams : undefined;
  const highlightParam = typeof search?.highlight === "string" ? search.highlight : "";
  const highlightMessages = highlightParam.includes("messages");
  const highlightVersions = highlightParam.includes("versions");
  const alreadyMember = search?.already === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, title, status, created_at, due_date, client_id, designer_id, delete_requested_by")
    .eq("id", id)
    .single();

  const { data: invite } = await supabase
    .from("project_invites")
    .select("token, role")
    .eq("project_id", id)
    .in("role", ["client", "designer"])
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  const { data: projectRole } = await supabase.rpc("get_my_project_role", { p_project_id: id });
  const roleStr = Array.isArray(projectRole) ? projectRole[0] : projectRole;
  if (roleStr !== "designer" && roleStr !== "client" && roleStr !== "reviewer") redirect("/dashboard");

  const isDesigner = roleStr === "designer";
  const isClient = roleStr === "client";
  const isReviewer = roleStr === "reviewer";

  const { data: brief } = await supabase
    .from("briefs")
    .select("concept, hook, notes")
    .eq("project_id", id)
    .maybeSingle();

  if (error || !project) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pt-6 sm:pt-8">
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 sm:p-5">
          <BackLink href="/projects" label="Retour aux projets" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
          <EmptyState
            title="Projet introuvable"
            description="Ce projet n'existe pas ou tu n'as pas accès."
          />
        </div>
      </div>
    );
  }

  const role = isDesigner ? "designer" : "youtuber";
  const otherLabel = role === "youtuber" ? "le graphiste" : "le client";
  const otherId = isDesigner ? project.client_id : project.designer_id;

  const { data: collaboratorsRows } = await supabase
    .from("project_collaborators")
    .select("user_id")
    .eq("project_id", id);
  const collaboratorIds = (collaboratorsRows ?? []).map((r) => r.user_id);
  let collaboratorsProfiles: { id: string; full_name: string | null }[] = [];
  if (collaboratorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", collaboratorIds);
    collaboratorsProfiles = profiles ?? [];
  }
  let otherMember: { name: string | null; email: string | null } = { name: null, email: null };
  if (otherId) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", otherId).single();
    otherMember.name = profile?.full_name ?? null;
    const admin = createAdminClient();
    if (admin) {
      const { data: { user: authUser } } = await admin.auth.admin.getUserById(otherId);
      const u = authUser as { email?: string } | undefined;
      otherMember.email = u?.email ?? null;
    }
  }

  const [
    { count: messagesCount },
    { count: versionsCount },
    { count: assetsCount },
    { count: referencesCount },
  ] = await Promise.all([
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("versions").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("project_references").select("id", { count: "exact", head: true }).eq("project_id", id),
  ]);

  const activityCounts = {
    messagesCount: messagesCount ?? 0,
    versionsCount: versionsCount ?? 0,
    assetsCount: assetsCount ?? 0,
    referencesCount: referencesCount ?? 0,
  };

  return (
    <ProjectActivityProvider projectId={id} initialCounts={activityCounts}>
      <div className="flex w-full max-w-6xl flex-col gap-0 overflow-x-hidden pb-12 pt-4 sm:pt-6 lg:flex-row lg:gap-6">
        {/* Contenu principal : une colonne, sections empilées avec ancres */}
        <main className="min-w-0 flex-1 space-y-6 pr-0 lg:pr-52">
          {alreadyMember && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Tu es déjà membre de ce projet.
            </div>
          )}
          <AnonPresenceBanner projectId={id} />
          {/* En-tête */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackLink href="/projects" label="Retour aux projets" />
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium ${statusBadgeClass[project.status] ?? "border-border bg-background/80 text-foreground"}`}>
                {statusLabels[project.status] ?? project.status}
              </span>
              {isReviewer && (
                <span className="inline-flex items-center rounded-lg border border-[#6366F1]/50 bg-[#6366F1]/15 px-3 py-1.5 text-sm font-medium text-[#A5B4FC]">
                  Relecteur
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {project.due_date && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/50 px-2.5 py-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(project.due_date), "d MMM yyyy", { locale: fr })}
                </span>
              )}
            </div>
          </div>
          {otherMember.name != null && (
            <p className="text-sm text-muted-foreground">
              En conversation avec <span className="font-medium text-foreground">{otherMember.name}</span>
              {otherMember.email && (
                <span className="ml-1.5 text-muted-foreground">({otherMember.email})</span>
              )}
            </p>
          )}
        </div>

        <section id="brief" className="scroll-mt-24">
          <BentoCard
            title="Brief & Récap"
            icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            compact
            controls
            defaultLayout="fit"
          >
            <ProjectDueDateEdit
              projectId={id}
              initialDueDate={project.due_date}
              canEdit={isClient || isDesigner}
            />
            <ProjectBrief
              projectId={id}
              initialBrief={brief ? { concept: brief.concept, hook: brief.hook, notes: brief.notes } : null}
              embedded
            />
          </BentoCard>
        </section>

        <section id="partage" className="scroll-mt-24">
          <BentoCard title="Partage & Actions" icon={<Link2 className="h-4 w-4 text-muted-foreground" />}>
            <div className="space-y-4">
              <ProjectInviteLink
                role={role}
                otherLabel={otherLabel}
                existingInviteToken={(invite as { token?: string } | null)?.token ?? null}
              />
              <ProjectIntervenants
                projectId={id}
                collaborators={collaboratorsProfiles}
                canInvite={isClient || isDesigner}
                accentRed={role === "youtuber"}
              />
              <ProjectActions projectId={id} status={project.status} role={role} />
              {!isReviewer && (
                <ProjectDeleteSection
                  projectId={id}
                  currentUserId={user.id}
                  deleteRequestedBy={project.delete_requested_by ?? null}
                  isDesigner={isDesigner}
                />
              )}
            </div>
          </BentoCard>
        </section>

        <section id="assets" className="scroll-mt-24">
          <BentoCard
            title="Assets"
            icon={<FileImage className="h-4 w-4 text-muted-foreground" />}
            hint={role === "youtuber" ? "Dépose tes refs et fichiers. PNG, JPG, WEBP ou ZIP, max 10 Mo." : "Fichiers déposés par le client."}
            controls
          >
            <ProjectAssets projectId={id} />
          </BentoCard>
        </section>

        <section id="references" className="scroll-mt-24">
          <BentoCard
            title="Inspirations & Références"
            icon={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
            hint="Images de ref et liens YouTube."
            controls
          >
            <ProjectReferences projectId={id} />
          </BentoCard>
        </section>

        <section id="versions" className="scroll-mt-24">
          <ProjectHighlightZone highlight={highlightVersions}>
            <BentoCard
              title="Versions"
              icon={<Layers className="h-4 w-4 text-muted-foreground" />}
              hint="Miniatures déposées par le graphiste. Tu peux commenter sous chacune."
              className="flex flex-col min-h-0"
              contentNoScroll
            >
              <div className="min-h-[320px] max-h-[480px] flex-1 overflow-y-auto overflow-x-hidden">
                <ProjectVersions
                  projectId={id}
                  isDesigner={isDesigner}
                  isClient={isClient}
                  currentUserId={user.id}
                  designerId={project.designer_id ?? undefined}
                  clientId={project.client_id ?? undefined}
                />
              </div>
            </BentoCard>
          </ProjectHighlightZone>
        </section>

        <section id="chat" className="scroll-mt-24">
          <ProjectHighlightZone highlight={highlightMessages}>
            <BentoCard
              title="Chat"
              icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
              className="flex flex-col min-h-0"
              contentNoScroll
            >
              <div className="min-h-[320px] max-h-[480px] flex flex-col">
                <ProjectChat
                  projectId={id}
                  currentUserId={user.id}
                  designerId={project.designer_id ?? undefined}
                  clientId={project.client_id ?? undefined}
                />
              </div>
            </BentoCard>
          </ProjectHighlightZone>
        </section>
      </main>

      <ProjectPageNav accentRed={role === "youtuber"} />
      </div>
    </ProjectActivityProvider>
  );
}
