/**
 * Appel côté client après une action (version, assets, message, reference).
 * Envoie un email à l'interlocuteur du projet pour l’inviter à consulter l’app.
 */
export async function notifyProjectUpdate(
  projectId: string,
  type: "version" | "assets" | "message" | "reference"
): Promise<void> {
  try {
    const res = await fetch("/api/notify-project-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, type }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.info) {
      if (data.sent === 0 && data.skipped) {
        console.info("[notify] Aucun email envoyé:", data.skipped, data.details ?? "");
      } else if (data.sent) {
        console.info("[notify] Email(s) envoyé(s):", data.sent);
      }
    }
  } catch (e) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("notifyProjectUpdate failed", e);
    }
    // Ne pas bloquer l’UX si la notification échoue
  }
}
