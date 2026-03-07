import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import archiver from "archiver";
import {
  extractStoragePathFromUrlOrPath,
  projectSlug,
} from "@/lib/export-storage-path";

const ASSETS_MARKER = "/assets/";
const PREFIX_PUBLIC = "/object/public/assets/";

function extractPath(url: string): string | null {
  if (!url?.trim()) return null;
  const u = url.trim().split("?")[0] ?? "";
  const idx = u.indexOf(ASSETS_MARKER);
  if (idx !== -1) {
    const path = u.slice(idx + ASSETS_MARKER.length);
    if (path) return path;
  }
  const idx2 = u.indexOf(PREFIX_PUBLIC);
  if (idx2 !== -1) {
    const path = u.slice(idx2 + PREFIX_PUBLIC.length);
    if (path) return path;
  }
  if (!u.startsWith("http")) return u || null;
  return null;
}

async function downloadFromStorage(
  admin: ReturnType<typeof createAdminClient>,
  path: string
): Promise<Buffer | null> {
  if (!admin) return null;
  const { data, error } = await admin.storage.from("assets").download(path);
  if (error || !data) return null;
  const buf = await data.arrayBuffer();
  return Buffer.from(buf);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, plan, storage_limit_bytes, created_at")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "designer") {
    return NextResponse.json(
      { error: "Export réservé aux graphistes" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service d'export indisponible" },
      { status: 503 }
    );
  }

  const chunks: Buffer[] = [];
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  const rootDir = "pixelstack-export";

  // 1) Profile
  const profileJson = {
    id: profile.id,
    full_name: profile.full_name ?? null,
    avatar_url: profile.avatar_url ?? null,
    role: profile.role,
    plan: profile.plan ?? "free",
    storage_limit_bytes: profile.storage_limit_bytes ?? null,
    created_at: profile.created_at ?? null,
    exported_at: new Date().toISOString(),
  };
  archive.append(JSON.stringify(profileJson, null, 2), {
    name: `${rootDir}/profile/profile.json`,
  });

  // 2) Projects (designer only)
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, status, due_date, created_at")
    .eq("designer_id", user.id)
    .order("created_at", { ascending: true });

  if (!projects?.length) {
    archive.finalize();
    const zipBuffer = await done;
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="pixelstack-export-${user.id.slice(0, 8)}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  }

  for (const project of projects) {
    const slug = projectSlug(project.title, project.id);
    const projectDir = `${rootDir}/projects/${slug}`;
    const assetsDir = `${projectDir}/assets`;
    const versionsDir = `${projectDir}/versions`;
    const refsDir = `${projectDir}/references`;
    const convDir = `${projectDir}/conversations`;
    const convFilesDir = `${convDir}/files`;

    // Brief
    const { data: brief } = await supabase
      .from("briefs")
      .select("concept, hook, notes")
      .eq("project_id", project.id)
      .maybeSingle();
    if (brief) {
      archive.append(JSON.stringify({ ...brief, project_id: project.id }, null, 2), {
        name: `${projectDir}/brief.json`,
      });
    }

    // Assets
    const { data: assets } = await supabase
      .from("assets")
      .select("id, file_url, file_name, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });
    if (assets?.length) {
      for (const a of assets) {
        const path = extractPath(a.file_url);
        const buf = path ? await downloadFromStorage(admin, path) : null;
        if (buf) {
          const name = a.file_name || `asset-${a.id}`;
          archive.append(buf, { name: `${assetsDir}/${name}` });
        }
      }
    }

    // Versions
    const { data: versions } = await supabase
      .from("versions")
      .select("id, image_url, version_number, created_at")
      .eq("project_id", project.id)
      .order("version_number", { ascending: true });
    if (versions?.length) {
      for (const v of versions) {
        const path = extractPath(v.image_url);
        const buf = path ? await downloadFromStorage(admin, path) : null;
        if (buf) {
          const ext = path?.includes(".png") ? "png" : "jpg";
          archive.append(buf, {
            name: `${versionsDir}/v${v.version_number}.${ext}`,
          });
        }
      }
    }

    // References (images only; YouTube = just metadata in a refs.json if we want)
    const { data: refs } = await supabase
      .from("project_references")
      .select("id, kind, url, comment, created_at")
      .eq("project_id", project.id);
    if (refs?.length) {
      const refsMeta: Array<{ id: string; kind: string; url: string; comment: string | null }> = [];
      for (const r of refs) {
        refsMeta.push({
          id: r.id,
          kind: r.kind,
          url: r.url,
          comment: r.comment ?? null,
        });
        if (r.kind === "image") {
          const path = extractStoragePathFromUrlOrPath(r.url);
          const buf = path ? await downloadFromStorage(admin, path) : null;
          if (buf) {
            const base = path?.split("/").pop() || `ref-${r.id}`;
            archive.append(buf, { name: `${refsDir}/${base}` });
          }
        }
      }
      archive.append(JSON.stringify(refsMeta, null, 2), {
        name: `${projectDir}/references/references.json`,
      });
    }

    // Messages + chat files
    const { data: messages } = await supabase
      .from("messages")
      .select("id, sender_id, content, image_url, image_size_bytes, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true });

    const messagesForExport = messages?.map((m) => ({
      id: m.id,
      sender_id: m.sender_id,
      content: m.content,
      attachment: m.image_url
        ? { path: m.image_url, size_bytes: m.image_size_bytes ?? null }
        : null,
      created_at: m.created_at,
    }));

    archive.append(JSON.stringify(messagesForExport ?? [], null, 2), {
      name: `${convDir}/messages.json`,
    });

    if (messages?.length) {
      for (const m of messages) {
        if (!m.image_url) continue;
        const path = extractPath(m.image_url);
        const buf = path ? await downloadFromStorage(admin, path) : null;
        if (buf) {
          const base = path?.split("/").pop() || `file-${m.id}`;
          archive.append(buf, { name: `${convFilesDir}/${base}` });
        }
      }
    }
  }

  archive.finalize();
  const zipBuffer = await done;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="pixelstack-export-${user.id.slice(0, 8)}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
