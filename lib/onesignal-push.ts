/**
 * Envoi de notifications push OneSignal côté serveur (API REST).
 * Utilisé par /api/notifications/send et par notify-project-update.
 */

const ONESIGNAL_API = "https://api.onesignal.com/notifications";

export type SendPushOptions = {
  /** ID Supabase (external_id OneSignal) */
  userId: string;
  /** Titre de la notification */
  title: string;
  /** Corps du message */
  message: string;
  /** URL au clic (ex: projet) */
  url?: string;
};

/**
 * Envoie une notification push à un utilisateur via son external_id (Supabase user id).
 * Ne lève pas d’exception : log et retourne false en cas d’erreur.
 */
export async function sendPushToUser(options: SendPushOptions): Promise<boolean> {
  const { userId, title, message, url } = options;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId?.trim() || !apiKey?.trim()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[onesignal-push] NEXT_PUBLIC_ONESIGNAL_APP_ID ou ONESIGNAL_REST_API_KEY manquant.");
    }
    return false;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const launchUrl = url ? (url.startsWith("http") ? url : `${baseUrl}${url}`) : baseUrl || undefined;

  try {
    const res = await fetch(ONESIGNAL_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        app_id: appId.trim(),
        target_channel: "push",
        include_aliases: {
          external_id: [userId],
        },
        headings: { en: title },
        contents: { en: message },
        ...(launchUrl && { url: launchUrl }),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("[onesignal-push] OneSignal API error:", res.status, text);
      return false;
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    if (data?.id) {
      return true;
    }
    return false;
  } catch (e) {
    console.warn("[onesignal-push] send error:", e);
    return false;
  }
}
