import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/storage/check-quota
 * Body: { projectId: string, fileSize: number }
 * Vérifie si l'upload est autorisé (quota du designer du projet).
 * L'utilisateur doit être membre du projet (client, designer ou relecteur).
 */
export async function POST(request: NextRequest) {
  let body: { projectId?: string; fileSize?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide", allowed: false },
      { status: 400 }
    );
  }

  const projectId = body?.projectId;
  const fileSize = typeof body?.fileSize === "number" ? Math.max(0, body.fileSize) : 0;

  if (!projectId || typeof projectId !== "string") {
    return NextResponse.json(
      { error: "projectId requis", allowed: false },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié", allowed: false },
      { status: 401 }
    );
  }

  const { data, error } = await supabase.rpc("check_project_storage_quota", {
    p_project_id: projectId,
    p_file_size: fileSize,
  });

  if (error) {
    if (error.message?.includes("Access denied") || error.code === "PGRST301") {
      return NextResponse.json(
        { error: "Accès refusé au projet", allowed: false },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Erreur quota", allowed: false },
      { status: 500 }
    );
  }

  const raw = Array.isArray(data) ? data[0] : data;
  const allowed = raw && typeof raw === "object" && (raw as { allowed?: boolean }).allowed === true;
  const used = raw && typeof raw === "object" && "used" in raw ? Number((raw as { used: number }).used) : 0;
  const limit = raw && typeof raw === "object" && "limit" in raw ? Number((raw as { limit: number }).limit) : 0;

  return NextResponse.json({
    allowed: !!allowed,
    used,
    limit,
  });
}
