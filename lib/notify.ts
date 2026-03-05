/**
 * Appel côté client après une action (version, assets, message, reference).
 * Envoie un email à l'interlocuteur du projet pour l’inviter à consulter l’app.
 */
export async function notifyProjectUpdate(
  projectId: string,
  type: "version" | "assets" | "message" | "reference"
): Promise<void> {
  try {
    await fetch("/api/notify-project-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, type }),
    });
  } catch {
    // Ne pas bloquer l’UX si la notification échoue
  }
}
