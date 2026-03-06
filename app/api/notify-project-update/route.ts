import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const MOTIFS: Record<string, string> = {
  version: "Une nouvelle version de miniature a été déposée.",
  assets: "Des assets ont été ajoutés au projet.",
  message: "Tu as reçu un nouveau message dans le projet.",
  reference: "Une nouvelle référence ou inspiration a été ajoutée.",
};

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Récupère l'email d'un utilisateur avec priorité à l'API Auth (fiable pour OAuth/Google).
 * Puis fallback RPC get_user_email, puis profiles.email.
 */
async function getEmailForUserId(admin: AdminClient, userId: string): Promise<string | null> {
  // 1) Auth API — le plus fiable pour Google/OAuth (email + identities)
  const {
    data: { user: authUser },
  } = await admin.auth.admin.getUserById(userId);
  if (authUser) {
    const u = authUser as unknown as Record<string, unknown>;
    const top = u.email;
    if (top && typeof top === "string" && top.length > 0) return top.trim();
    const meta = u.user_metadata as Record<string, unknown> | undefined;
    if (meta?.email && typeof meta.email === "string") return String(meta.email).trim();
    const identities = u.identities as Array<{ identity_data?: Record<string, unknown> }> | undefined;
    if (identities?.length) {
      for (const id of identities) {
        const d = id.identity_data;
        const em = d && (d.email ?? d.provider_email ?? (d as Record<string, unknown>).user_email);
        if (em && typeof em === "string") return String(em).trim();
      }
    }
  }

  // 2) RPC get_user_email (auth.users en SQL)
  try {
    const { data: rpcData, error: rpcErr } = await admin.rpc("get_user_email", { target_id: userId });
    if (!rpcErr && rpcData != null) {
      const raw = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      const str = typeof raw === "string" ? raw : (raw && typeof raw === "object" && "get_user_email" in raw ? String((raw as { get_user_email: unknown }).get_user_email) : null);
      if (str && str.trim()) return str.trim();
    }
  } catch (_) {}

  // 3) profiles.email
  const { data: row } = await admin.from("profiles").select("email").eq("id", userId).single();
  if (row?.email && typeof row.email === "string" && row.email.trim()) return row.email.trim();

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, type } = body as { projectId?: string; type?: string };

    if (!projectId || !type || !MOTIFS[type]) {
      return NextResponse.json(
        { error: "projectId et type requis (version, assets, message, reference)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user: actor },
    } = await supabase.auth.getUser();
    if (!actor) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: isMember } = await supabase.rpc("is_project_member", { p_project_id: projectId });
    if (!isMember) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, title, client_id, designer_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const admin = createAdminClient();
    if (!admin) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY manquant : notification email non envoyée.");
      return NextResponse.json({ ok: true, skipped: "no_service_role" });
    }

    // Tous les membres à notifier = client + designer + relecteurs, SAUF l'acteur
    const recipientIds = new Set<string>();
    if (project.client_id && project.client_id !== actor.id) recipientIds.add(project.client_id);
    if (project.designer_id && project.designer_id !== actor.id) recipientIds.add(project.designer_id);

    const { data: collaborators } = await admin
      .from("project_collaborators")
      .select("user_id")
      .eq("project_id", projectId);
    if (collaborators?.length) {
      for (const c of collaborators) {
        if (c.user_id && c.user_id !== actor.id) recipientIds.add(c.user_id);
      }
    }

    if (recipientIds.size === 0) {
      return NextResponse.json({ ok: true, skipped: "no_recipients" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY manquant : notification email non envoyée.");
      return NextResponse.json({ ok: true, skipped: "no_resend_key" });
    }

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM ?? "Pixelstack <onboarding@resend.dev>";
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pixelstack.app");
    const appUrl = `${baseUrl}/dashboard`;
    const motif = MOTIFS[type];

    const emailsSent = new Set<string>();
    for (const recipientId of recipientIds) {
      const email = await getEmailForUserId(admin, recipientId);
      if (!email || emailsSent.has(email.toLowerCase())) continue;
      emailsSent.add(email.toLowerCase());

      const { error: sendError } = await resend.emails.send({
        from,
        to: [email],
        subject: `[Pixelstack] À consulter : ${project.title}`,
        html: `
          <p>Bonjour,</p>
          <p><strong>${motif}</strong></p>
          <p>Projet concerné : « ${project.title } ». Connecte-toi à l'application pour voir les mises à jour.</p>
          <p><a href="${appUrl}" style="color: #3b82f6; text-decoration: underline;">Ouvrir Pixelstack</a></p>
          <p>— L'équipe Pixelstack</p>
        `,
      });

      if (sendError) {
        console.error("Resend error:", sendError, "to:", email);
      }
    }

    return NextResponse.json({ ok: true, sent: emailsSent.size });
  } catch (e) {
    console.error("notify-project-update:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
