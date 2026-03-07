import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeProjectStorage } from "@/lib/project-storage";
import { ARCHIVE_PURGE_DAYS } from "@/lib/archive-constants";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  if (authHeader === `Bearer ${secret}` || querySecret === secret) return true;
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.includes("vercel-cron") && req.method === "GET") return true;
  return false;
}

/**
 * Purge les données (storage + lignes assets/versions/refs) des projets archivés
 * depuis plus de ARCHIVE_PURGE_DAYS jours. Le projet reste archivé (archived_at inchangé).
 */
async function runCleanup() {
  const admin = createAdminClient();
  if (!admin) return { error: "Service indisponible", status: 503 as const };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ARCHIVE_PURGE_DAYS);
  const iso = cutoff.toISOString();

  const { data: projects, error: listError } = await admin
    .from("projects")
    .select("id")
    .not("archived_at", "is", null)
    .lt("archived_at", iso);

  if (listError) return { error: listError.message, status: 500 as const };
  if (!projects?.length) return { ok: true, purged: 0, total: 0 };

  let purged = 0;
  for (const p of projects) {
    try {
      await purgeProjectStorage(admin, p.id);
      await admin.from("assets").delete().eq("project_id", p.id);
      await admin.from("versions").delete().eq("project_id", p.id);
      await admin.from("project_references").delete().eq("project_id", p.id);
      purged += 1;
    } catch (err) {
      console.error("[cron/cleanup-archived-projects] purge failed", p.id, err);
    }
  }
  return { ok: true, purged, total: projects.length };
}

/**
 * GET ou POST /api/cron/cleanup-archived-projects
 * Purge le stockage et les données des projets archivés depuis plus de 7 jours.
 * Protégé par CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.warn("[cron/cleanup-archived-projects] CRON_SECRET non configuré");
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[cron/cleanup-archived-projects] Exécution démarrée");
  const result = await runCleanup();
  if ("status" in result) {
    console.error("[cron/cleanup-archived-projects]", result.error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  console.log("[cron/cleanup-archived-projects] OK", result);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runCleanup();
  if ("status" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
