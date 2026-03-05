import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgeProjectStorage } from "@/lib/project-storage";

/**
 * POST /api/cron/cleanup-orphan-projects
 * Supprime les projets sans graphiste (designer_id NULL) créés il y a plus de 7 jours :
 * - purge le storage (assets, versions, refs, chat)
 * - supprime le projet (CASCADE supprime les lignes liées)
 *
 * Protégé par CRON_SECRET : header Authorization: Bearer <CRON_SECRET>
 * À appeler depuis un cron (Vercel Cron, GitHub Actions, etc.) une fois par jour.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const authorized = authHeader === `Bearer ${secret}` || querySecret === secret;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const iso = sevenDaysAgo.toISOString();

  const { data: projects, error: listError } = await admin
    .from("projects")
    .select("id")
    .is("designer_id", null)
    .lt("created_at", iso);

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  if (!projects?.length) {
    return NextResponse.json({ ok: true, deleted: 0, message: "Aucun projet orphelin à supprimer." });
  }

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

  return NextResponse.json({ ok: true, deleted, total: projects.length });
}
