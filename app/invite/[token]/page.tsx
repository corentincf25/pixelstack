import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserPlus, LogIn, User } from "lucide-react";

type Props = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inviteRow } = await supabase
    .from("project_invites")
    .select("project_id")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  const isValidToken = !!inviteRow?.project_id;

  if (user) {
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
    if (!rpcError && projectId) redirect(`/projects/${projectId}`);
    const msg = rpcError?.message ?? "";
    const isInvalid = msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid");
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
          <Link href="/dashboard" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Aller au dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">Lien invalide ou expiré</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce lien n'est plus valable. Demande un nouveau lien d'invitation au créateur du projet.
          </p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111]/90 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <h1 className="text-center text-xl font-semibold text-[#E5E7EB] sm:text-2xl">
          Rejoindre ce projet
        </h1>
        <p className="mt-3 text-center text-sm text-[#9CA3AF]">
          Les YouTubeurs peuvent participer gratuitement aux projets. Créer un compte vous permet de
          sauvegarder vos conversations et retrouver vos collaborations.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`/p/${token}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#6366F1]/50 bg-[#6366F1]/15 px-4 py-3 text-sm font-medium text-[#A5B4FC] transition-colors hover:bg-[#6366F1]/25"
          >
            <User className="h-4 w-4" />
            Continuer sans compte
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-sm font-medium text-[#E5E7EB] transition-colors hover:bg-white/[0.08]"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Link>
          <Link
            href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#3B82F6] px-4 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-opacity hover:opacity-95"
          >
            <UserPlus className="h-4 w-4" />
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
