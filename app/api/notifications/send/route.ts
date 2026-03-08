import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/onesignal-push";

/**
 * POST /api/notifications/send
 * Envoie une notification push à un utilisateur (usage interne ou futur).
 * Body: { userId: string, message: string, title?: string, projectId?: string }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, message, title, projectId } = body as {
      userId?: string;
      message?: string;
      title?: string;
      projectId?: string;
    };

    if (!userId || !message?.trim()) {
      return NextResponse.json(
        { error: "userId et message requis" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    const url = projectId ? `${baseUrl}/projects/${projectId}` : undefined;

    const ok = await sendPushToUser({
      userId,
      title: title?.trim() || "Pixelstack",
      message: message.trim(),
      url,
    });

    return NextResponse.json({ ok });
  } catch (e) {
    console.error("[notifications/send]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
