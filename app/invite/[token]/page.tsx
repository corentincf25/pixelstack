import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const { data: inviteRow } = await supabase
    .from("project_invites")
    .select("project_id")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (inviteRow?.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id, designer_id")
      .eq("id", inviteRow.project_id)
      .single();
    if (project && (project.client_id === user.id || project.designer_id === user.id)) {
      redirect(`/projects/${inviteRow.project_id}?already=1`);
    }
  }

  const { data: projectId, error: rpcError } = await supabase.rpc("accept_project_invite", {
    invite_token: token,
  });

  if (rpcError || !projectId) {
    const msg = rpcError?.message ?? "";
    const isInvalid = msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("invalid or expired");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            {isInvalid ? "Lien invalide ou expiré" : "Impossible de rejoindre le projet"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isInvalid
              ? "Ce lien n'est plus valable. Demande un nouveau lien d'invitation au créateur du projet."
              : msg || "Une erreur est survenue."}
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Aller au dashboard
          </a>
        </div>
      </div>
    );
  }

  redirect(`/projects/${projectId}`);
}
