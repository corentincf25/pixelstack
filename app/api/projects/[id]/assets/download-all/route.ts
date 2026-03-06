import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import archiver from "archiver";

const PREFIX = "/object/public/assets/";
function extractPath(url: string): string | null {
  const idx = url.indexOf(PREFIX);
  if (idx === -1) return null;
  return url.slice(idx + PREFIX.length).split("?")[0] ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: isMember } = await supabase.rpc("is_project_member", { p_project_id: projectId });
  if (!isMember) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .single();
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const { data: assets } = await supabase
    .from("assets")
    .select("id, file_url, file_name")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (!assets || assets.length === 0) {
    return NextResponse.json({ error: "Aucun asset à télécharger" }, { status: 400 });
  }

  const chunks: Buffer[] = [];
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  const admin = createAdminClient();
  for (const asset of assets) {
    try {
      const path = extractPath(asset.file_url);
      let buf: ArrayBuffer;
      if (admin && path) {
        const { data, error } = await admin.storage.from("assets").download(path);
        if (error || !data) continue;
        buf = await data.arrayBuffer();
      } else {
        const res = await fetch(asset.file_url);
        if (!res.ok) continue;
        buf = await res.arrayBuffer();
      }
      const name = asset.file_name || `asset-${asset.id}`;
      archive.append(Buffer.from(buf), { name });
    } catch {
      // skip failed file
    }
  }
  archive.finalize();

  const zipBuffer = await done;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="assets-projet-${projectId.slice(0, 8)}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
