import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeProjectStorage } from "@/lib/project-storage";

/**
 * POST /api/projects/[id]/delete
 * Supprime définitivement le projet après accord des deux parties.
 * Vérifie que delete_requested_by est set (l'autre partie a demandé la suppression)
 * et que l'utilisateur courant confirme → purge tout le storage du projet puis supprime le projet.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, client_id, designer_id, delete_requested_by")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const { data: isMember } = await supabase.rpc("is_project_member", { p_project_id: projectId });
  if (!isMember) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!project.delete_requested_by) {
    return NextResponse.json(
      { error: "Aucune demande de suppression en attente. Demandez d'abord la suppression du projet." },
      { status: 400 }
    );
  }

  if (project.delete_requested_by === user.id) {
    return NextResponse.json(
      { error: "C'est à l'autre partie de confirmer la suppression." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const removedCount = await purgeProjectStorage(admin, projectId);

  const { error: deleteError } = await admin.from("projects").delete().eq("id", projectId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, removedFiles: removedCount });
}
