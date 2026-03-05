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

    const { data: project } = await supabase
      .from("projects")
      .select("id, title, client_id, designer_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const recipientId =
      project.client_id === actor.id ? project.designer_id : project.client_id;
    if (!recipientId) {
      return NextResponse.json({ error: "Aucun interlocuteur à notifier" }, { status: 400 });
    }
    if (recipientId === actor.id) {
      return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY manquant : notification email non envoyée.");
      return NextResponse.json({ ok: true, skipped: "no_service_role" });
    }

    // 1) RPC get_user_email (lecture directe auth.users) — le plus fiable
    let recipientEmail: string | null = null;
    try {
      const { data: rpcData, error: rpcErr } = await admin.rpc("get_user_email", { target_id: recipientId });
      if (!rpcErr && rpcData !== null && rpcData !== undefined) {
        if (typeof rpcData === "string" && rpcData.length > 0) recipientEmail = rpcData;
        else if (Array.isArray(rpcData) && rpcData[0] != null) {
          const first = rpcData[0];
          if (typeof first === "string") recipientEmail = first;
          else if (typeof first === "object" && first !== null && "get_user_email" in first)
            recipientEmail = String((first as { get_user_email: unknown }).get_user_email || "").trim() || null;
        } else if (typeof rpcData === "object" && rpcData !== null && "get_user_email" in rpcData)
          recipientEmail = String((rpcData as { get_user_email: unknown }).get_user_email || "").trim() || null;
      }
    } catch (_) {}

    // 2) Table profiles.email (synchronisée à la connexion)
    if (!recipientEmail) {
      const { data: row } = await admin.from("profiles").select("email").eq("id", recipientId).single();
      if (row?.email && typeof row.email === "string") recipientEmail = row.email.trim();
    }

    // 3) Auth API getUserById + extraction
    if (!recipientEmail) {
      const {
        data: { user: recipientUser },
        error: userError,
      } = await admin.auth.admin.getUserById(recipientId);
      function extractEmail(u: typeof recipientUser): string | null {
        if (!u) return null;
        const uu = u as unknown as Record<string, unknown>;
        const fromTop = uu.email;
        if (fromTop && typeof fromTop === "string") return fromTop;
        const fromMeta = uu.user_metadata && typeof uu.user_metadata === "object" && (uu.user_metadata as Record<string, unknown>).email;
        if (fromMeta && typeof fromMeta === "string") return fromMeta;
        const identities = uu.identities as Array<{ identity_data?: Record<string, unknown> }> | undefined;
        if (identities?.length) {
          for (const id of identities) {
            const idData = id.identity_data as Record<string, unknown> | undefined;
            const em = idData?.email ?? idData?.provider_email ?? idData?.user_email;
            if (em && typeof em === "string") return em;
          }
        }
        return null;
      }
      recipientEmail = extractEmail(recipientUser);
      if (!recipientEmail && userError) {
        console.warn("Notification email: getUserById error", { recipientId, message: userError.message });
      }
    }

    if (!recipientEmail) {
      console.error("Notification email: aucun email trouvé pour destinataire", { recipientId });
      return NextResponse.json(
        { error: "Impossible de récupérer l'email du destinataire" },
        { status: 500 }
      );
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

    const { error: sendError } = await resend.emails.send({
      from,
      to: [recipientEmail],
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
      console.error("Resend error:", sendError);
      return NextResponse.json({ error: "Échec envoi email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notify-project-update:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
