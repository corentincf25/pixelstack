import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UploadSection } from "./UploadSection";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/BackLink";

export const revalidate = 0;

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .order("title");

  const isDesigner = profile?.role === "designer";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard" label="Retour à l'accueil" />
        <DashboardHeader
        title="Upload"
        description={
          isDesigner
            ? "Dépose des visuels (refs, assets) ou des versions pour tes projets."
            : "Dépose tes refs et assets (images, zip) pour que ton graphiste puisse travailler sur le projet."
        }
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Déposer des fichiers</h2>
        <p className="text-sm text-muted-foreground">
          Images (PNG, JPG, WEBP) ou ZIP. Max 10 Mo par fichier.
        </p>
        <div className="rounded-xl border border-border bg-card p-6">
          <UploadSection projects={projects ?? []} />
        </div>
      </section>
    </div>
  );
}
