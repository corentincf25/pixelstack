import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/notify-project-update/check
 * Diagnostic : indique si Resend est configuré (sans exposer la clé).
 * Utile pour vérifier que RESEND_API_KEY est bien prise en compte sur Vercel.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const key = process.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY_SECRET;
    const hasKey = Boolean(key && typeof key === "string" && key.trim());
    const from = process.env.RESEND_FROM ?? "Pixelstack <onboarding@resend.dev>";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;

    return NextResponse.json({
      resendConfigured: hasKey,
      resendFrom: from,
      appUrl: appUrl ? (appUrl.startsWith("http") ? appUrl : `https://${appUrl}`) : null,
      message: hasKey
        ? "Clé Resend présente. Si les emails ne partent pas, vérifier les logs Vercel (notify-project-update) et le domaine d’envoi dans Resend."
        : "RESEND_API_KEY absente. Vercel → Environment Variables (Production) ou intégration Resend, puis redéploie.",
    });
  } catch (e) {
    console.error("notify-project-update/check:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
