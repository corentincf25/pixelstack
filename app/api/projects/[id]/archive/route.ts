import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/projects/[id]/archive
 * Archive le projet (archived_at = now()). Un membre peut archiver sans accord de l'autre.
 * Le projet n'apparaît plus dans le dashboard par défaut ; les données seront purgées après 7 jours (cron).
 */
export async function POST(
  _req: NextRequest,
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

  const { data: role } = await supabase.rpc("get_my_project_role", {
    p_project_id: projectId,
  });
  const roleStr = Array.isArray(role) ? role[0] : role;
  if (roleStr !== "designer" && roleStr !== "client" && roleStr !== "reviewer") {
    return NextResponse.json(
      { error: "Vous n'êtes pas membre de ce projet" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service indisponible" },
      { status: 503 }
    );
  }

  const { error } = await admin
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
