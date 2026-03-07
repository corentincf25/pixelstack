import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeProjectStorage } from "@/lib/project-storage";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  if (authHeader === `Bearer ${secret}` || querySecret === secret) return true;
  // Vercel Cron envoie un GET avec User-Agent "vercel-cron/1.0" sans possibilité d’en-tête personnalisé
  const ua = req.headers.get("user-agent") ?? "";
  if (ua.includes("vercel-cron") && req.method === "GET") return true;
  return false;
}

async function runCleanup() {
  const admin = createAdminClient();
  if (!admin) return { error: "Service indisponible", status: 503 as const };

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const iso = sevenDaysAgo.toISOString();

  const { data: projects, error: listError } = await admin
    .from("projects")
    .select("id")
    .is("designer_id", null)
    .lt("created_at", iso);

  if (listError) return { error: listError.message, status: 500 as const };
  if (!projects?.length) return { ok: true, deleted: 0, total: 0 };

  let deleted = 0;
  for (const p of projects) {
    try {
      await purgeProjectStorage(admin, p.id);
      const { error: delErr } = await admin.from("projects").delete().eq("id", p.id);
      if (!delErr) deleted += 1;
    } catch {
      // continue with next project
    }
  }
  return { ok: true, deleted, total: projects.length };
}

/**
 * GET ou POST /api/cron/cleanup-orphan-projects
 * Supprime les projets sans graphiste (designer_id NULL) créés il y a plus de 7 jours.
 * Protégé par CRON_SECRET : Authorization: Bearer <secret> ou ?secret=<secret>
 * Vercel Cron envoie un GET ; les crons externes peuvent utiliser POST.
 */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.warn("[cron/cleanup-orphan-projects] CRON_SECRET non configuré");
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    console.warn("[cron/cleanup-orphan-projects] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[cron/cleanup-orphan-projects] Exécution démarrée");
  const result = await runCleanup();
  if ("status" in result) {
    console.error("[cron/cleanup-orphan-projects]", result.error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  console.log("[cron/cleanup-orphan-projects] OK", result);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.warn("[cron/cleanup-orphan-projects] CRON_SECRET non configuré");
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  if (!isAuthorized(req)) {
    console.warn("[cron/cleanup-orphan-projects] Unauthorized (POST)");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[cron/cleanup-orphan-projects] POST exécution démarrée");
  const result = await runCleanup();
  if ("status" in result) {
    console.error("[cron/cleanup-orphan-projects]", result.error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  console.log("[cron/cleanup-orphan-projects] POST OK", result);
  return NextResponse.json(result);
}
