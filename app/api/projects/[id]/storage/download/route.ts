import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET ?path=...&disposition=attachment|inline
 * Télécharge ou ouvre un fichier du projet (ex. pièce jointe chat).
 * Réservé aux membres du projet. Utilisé pour les PDF et images afin d’éviter les soucis CORS/ouverture.
 */
export async function GET(
  req: Request,
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

  const { data: isMember } = await supabase.rpc("is_project_member", {
    p_project_id: projectId,
  });
  if (!isMember) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path || typeof path !== "string" || path.includes("..") || path.startsWith("/")) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }
  if (!path.startsWith(projectId + "/")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: file, error } = await admin.storage.from("assets").download(path);
  if (error || !file) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const disposition = searchParams.get("disposition") === "attachment" ? "attachment" : "inline";
  const basename = path.split("/").pop() || "file";
  const contentType = path.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : file.type || "application/octet-stream";

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${basename}"`,
    },
  });
}
