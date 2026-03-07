import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { ProjectsList } from "@/components/ProjectsList";
import { BackLink } from "@/components/BackLink";
import { redirect } from "next/navigation";

export const revalidate = 0;

async function getProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, created_at, due_date, archived_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as { id: string; title: string; status: string; created_at: string | null; due_date: string | null; archived_at: string | null }[];
}

export default async function ProjectsIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const projects = await getProjects();
  const isDesigner = profile?.role === "designer";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div className="flex flex-col gap-5">
        <BackLink href="/dashboard" label="Retour à l'accueil" />
        <DashboardHeader
          title="Projets"
          description={
            isDesigner
              ? "Tous tes projets en cours. Trie par date de rendu ou par état."
              : "Tous tes projets de miniatures. Crée un projet depuis le dashboard et envoie le lien d'invitation à ton graphiste."
          }
        />
      </div>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <span className="h-1 w-8 rounded-full bg-primary" aria-hidden />
            Mes projets
          </h2>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium tabular-nums text-primary-foreground/90">
            {projects.length} projet{projects.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/50 shadow-sm">
          {projects.length === 0 ? (
            <div className="p-8 sm:p-12">
              <EmptyState
                title="Aucun projet"
                description="Crée un projet depuis le dashboard pour le voir ici."
              />
            </div>
          ) : (
            <ProjectsList projects={projects} showSortAndFilter={isDesigner} />
          )}
        </div>
      </section>
    </div>
  );
}
