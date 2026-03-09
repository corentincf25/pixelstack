import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { sendPushToUser } from "@/lib/onesignal-push";

/** Au plus 1 email de notification par (projet, destinataire) sur cette durée (évite spam + préserve quota Resend). Configurable via NOTIFY_EMAIL_THROTTLE_MINUTES. */
const DEFAULT_THROTTLE_MINUTES = 15;
function getThrottleMinutes(): number {
  const v = process.env.NOTIFY_EMAIL_THROTTLE_MINUTES;
  if (v == null || v === "") return DEFAULT_THROTTLE_MINUTES;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 1440) : DEFAULT_THROTTLE_MINUTES;
}

const MOTIFS: Record<string, string> = {
  version: "Une nouvelle version a été déposée.",
  assets: "Des assets ont été ajoutés au projet.",
  message: "Un nouveau message a été envoyé dans le projet.",
  reference: "Une nouvelle référence ou inspiration a été ajoutée.",
  feedback: "Un commentaire ou retour a été laissé sur le projet.",
};

/** Titres / messages pour les notifications push (OneSignal). */
const PUSH_TITLES: Record<string, (title: string) => string> = {
  message: (title) => `Nouveau message — ${title}`,
  version: (title) => `Nouvelle version — ${title}`,
  assets: (title) => `Nouveaux assets — ${title}`,
  reference: (title) => `Nouvelle référence — ${title}`,
  feedback: (title) => `Nouveau commentaire — ${title}`,
};
const PUSH_MESSAGES: Record<string, string> = {
  message: "Un utilisateur a envoyé un message sur le projet.",
  version: "Une nouvelle version est disponible.",
  assets: "Des assets ont été ajoutés au projet.",
  reference: "Une nouvelle référence a été ajoutée.",
  feedback: "Votre client a laissé un commentaire.",
};

const SUBJECTS: Record<string, (title: string) => string> = {
  message: (title) => `Nouveau message sur votre projet Pixelstack — ${title}`,
  version: (title) => `Nouvelle version déposée — ${title}`,
  assets: (title) => `Nouveaux assets sur le projet — ${title}`,
  reference: (title) => `Nouvelle référence sur le projet — ${title}`,
  feedback: (title) => `Nouveau commentaire sur le projet — ${title}`,
};

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Récupère l'email d'un utilisateur : RPC (auth.users) en priorité, puis Auth API, puis profiles.email.
 */
async function getEmailForUserId(admin: AdminClient, userId: string): Promise<string | null> {
  // 1) RPC get_user_email — lecture directe auth.users, fiable pour tous les providers
  try {
    const { data: rpcData, error: rpcErr } = await admin.rpc("get_user_email", { target_id: userId });
    if (!rpcErr && rpcData != null) {
      const raw = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      const str = typeof raw === "string" ? raw : (raw && typeof raw === "object" && "get_user_email" in raw ? String((raw as { get_user_email: unknown }).get_user_email) : null);
      if (str && typeof str === "string" && str.trim()) return str.trim();
    }
  } catch (_) {}

  // 2) Auth API — fallback (email + user_metadata + identities)
  const {
    data: { user: authUser },
  } = await admin.auth.admin.getUserById(userId);
  if (authUser) {
    const u = authUser as unknown as Record<string, unknown>;
    const top = u.email;
    if (top && typeof top === "string" && top.length > 0) return (top as string).trim();
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

  // 3) profiles.email
  const { data: row } = await admin.from("profiles").select("email").eq("id", userId).single();
  if (row?.email && typeof row.email === "string" && row.email.trim()) return row.email.trim();

  return null;
}

const INTERNAL_NOTIFY_HEADER = "x-internal-notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, type } = body as { projectId?: string; type?: string };

    if (!projectId || !type || !MOTIFS[type]) {
      return NextResponse.json(
        { error: "projectId et type requis (version, assets, message, reference, feedback)" },
        { status: 400 }
      );
    }

    console.info("[notify-project-update] Appel reçu", { projectId, type });

    const admin = createAdminClient();
    if (!admin) {
      console.warn("[notify-project-update] SUPABASE_SERVICE_ROLE_KEY manquant.");
      return NextResponse.json({ ok: true, sent: 0, skipped: "no_service_role" });
    }

    const internalSecret = req.headers.get(INTERNAL_NOTIFY_HEADER);
    const isInternalCall = internalSecret && internalSecret === (process.env.CRON_SECRET ?? process.env.NOTIFY_INTERNAL_SECRET ?? "anon-internal");

    let actorId: string | null = null;
    if (!isInternalCall) {
      const supabase = await createClient();
      const {
        data: { user: actor },
      } = await supabase.auth.getUser();
      if (!actor) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      actorId = actor.id;
      const { data: isMember } = await supabase.rpc("is_project_member", { p_project_id: projectId });
      if (!isMember) {
        return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
      }
    }

    const { data: project } = await admin
      .from("projects")
      .select("id, title, client_id, designer_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    // Tous les membres à notifier = client + designer + relecteurs, SAUF l'acteur (null pour appel interne / invité)
    const recipientIds = new Set<string>();
    if (project.client_id && project.client_id !== actorId) recipientIds.add(project.client_id);
    if (project.designer_id && project.designer_id !== actorId) recipientIds.add(project.designer_id);

    const { data: collaborators } = await admin
      .from("project_collaborators")
      .select("user_id")
      .eq("project_id", projectId);
    if (collaborators?.length) {
      for (const c of collaborators) {
        if (c.user_id && c.user_id !== actorId) recipientIds.add(c.user_id);
      }
    }

    if (recipientIds.size === 0) {
      console.warn("[notify-project-update] Aucun destinataire. Projet:", projectId, "client_id:", project.client_id, "designer_id:", project.designer_id, "actor:", actorId);
      return NextResponse.json({ ok: true, sent: 0, skipped: "no_recipients", details: "Aucun autre membre sur le projet (client ou graphiste non assigné)." });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pixelstack.app");
    const projectUrl = `${baseUrl}/projects/${projectId}`;

    // Notifications push OneSignal (indépendant de Resend)
    const pushTitleFn = PUSH_TITLES[type];
    const pushBody = PUSH_MESSAGES[type];
    if (pushTitleFn && pushBody) {
      for (const recipientId of recipientIds) {
        sendPushToUser({
          userId: recipientId,
          title: pushTitleFn(project.title),
          message: pushBody,
          url: projectUrl,
        }).catch(() => {});
      }
    }

    // Clé Resend : intégration Vercel ou variable manuelle (même nom attendu)
    const apiKey =
      process.env.RESEND_API_KEY ??
      process.env.RESEND_API_KEY_SECRET;
    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      console.warn("[notify-project-update] RESEND_API_KEY manquante. Vercel → Settings → Environment Variables → Production, ou lien Resend dans Vercel.");
      return NextResponse.json({ ok: true, sent: 0, skipped: "no_resend_key", details: "RESEND_API_KEY non définie (vérifier Variables d'environnement Vercel pour Production)." });
    }

    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM ?? "Pixelstack <onboarding@resend.dev>";
    const motif = MOTIFS[type];
    const subjectFn = SUBJECTS[type] ?? ((t: string) => `[Pixelstack] À consulter : ${t}`);
    const subject = subjectFn(project.title);

    const emailsSent = new Set<string>();
    let noEmailCount = 0;
    let resendError: string | null = null;
    let throttledCount = 0;
    const throttleMinutes = getThrottleMinutes();
    const throttleCutoff = new Date(Date.now() - throttleMinutes * 60 * 1000).toISOString();

    for (const recipientId of recipientIds) {
      const email = await getEmailForUserId(admin, recipientId);
      if (!email) {
        noEmailCount++;
        console.warn("[notify-project-update] Email introuvable pour userId", recipientId, "(Auth + RPC get_user_email + profiles.email).");
        continue;
      }
      if (emailsSent.has(email.toLowerCase())) continue;

      let skipByThrottle = false;
      try {
        const { data: throttleRow } = await admin
          .from("notification_email_throttle")
          .select("last_sent_at")
          .eq("project_id", projectId)
          .eq("recipient_id", recipientId)
          .maybeSingle();
        if (throttleRow?.last_sent_at && throttleRow.last_sent_at > throttleCutoff) {
          throttledCount++;
          skipByThrottle = true;
        }
      } catch (_) {
        // Table absente (migration 030 non exécutée) : on envoie sans throttle
      }
      if (skipByThrottle) continue;

      const { data: sendData, error: sendError } = await resend.emails.send({
        from,
        to: [email],
        subject,
        html: `
          <p>Bonjour,</p>
          <p><strong>${motif}</strong></p>
          <p>Projet : « ${project.title } ».</p>
          <p><a href="${projectUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 10px 18px; text-decoration: none; border-radius: 8px; font-weight: 500;">Voir la conversation</a></p>
          <p style="color: #6b7280; font-size: 14px;">— L'équipe Pixelstack</p>
        `,
      });

      if (sendError) {
        const errMsg = String((sendError as { message?: string })?.message ?? sendError);
        resendError = errMsg;
        if (errMsg.includes("only send testing emails to your own") || (sendError as { statusCode?: number }).statusCode === 403) {
          resendError = "Resend en mode test : tu ne peux envoyer qu'à ton propre email. Pour envoyer à tes clients, vérifie un domaine sur resend.com/domains et définis RESEND_FROM avec ce domaine (ex. noreply@pixelstack.fr).";
        }
        console.error("[notify-project-update] Resend error:", JSON.stringify(sendError), "to:", email, "from:", from);
      } else {
        emailsSent.add(email.toLowerCase());
        try {
          await admin
            .from("notification_email_throttle")
            .upsert(
              { project_id: projectId, recipient_id: recipientId, last_sent_at: new Date().toISOString() },
              { onConflict: "project_id,recipient_id" }
            );
        } catch (_) {
          // Table absente : ignorer
        }
        console.info("[notify-project-update] Email envoyé à", email, "id:", sendData?.id ?? "ok");
      }
    }

    const payload: { ok: true; sent: number; skipped?: string; details?: string } = {
      ok: true,
      sent: emailsSent.size,
    };
    if (emailsSent.size === 0 && (noEmailCount > 0 || resendError || throttledCount > 0)) {
      if (throttledCount > 0 && noEmailCount === 0 && !resendError) {
        payload.skipped = "rate_limited";
        payload.details = `Au plus 1 email par ${throttleMinutes} min par destinataire (${throttledCount} ignoré(s)).`;
      } else {
        payload.skipped = noEmailCount > 0 ? "no_email_for_recipient" : "resend_error";
        payload.details = resendError ?? `${noEmailCount} destinataire(s) sans email trouvé (Auth/profiles).`;
      }
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("notify-project-update:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
