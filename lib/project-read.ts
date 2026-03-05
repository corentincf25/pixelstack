import { supabase } from "@/lib/supabase";

/** Marque les messages du projet comme lus pour l'utilisateur connecté. */
export async function markProjectMessagesRead(projectId: string) {
  await supabase.rpc("mark_project_messages_read", { p_project_id: projectId });
}

/** Marque les versions du projet comme vues pour l'utilisateur connecté. */
export async function markProjectVersionsRead(projectId: string) {
  await supabase.rpc("mark_project_versions_read", { p_project_id: projectId });
}

/** Marque les retours (feedback) du projet comme lus (pour le graphiste). */
export async function markProjectFeedbackRead(projectId: string) {
  await supabase.rpc("mark_project_feedback_read", { p_project_id: projectId });
}
