import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Video, User } from "lucide-react";
import { LogoutButton } from "./LogoutButton";
import { BackLink } from "@/components/BackLink";
import { AvatarUpload } from "./AvatarUpload";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  const roleLabel = profile?.role === "designer" ? "Graphiste" : "YouTuber";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <BackLink href="/dashboard" label="Retour à l'accueil" />
        <DashboardHeader
        title="Paramètres"
        description="Ton compte et ton rôle sur Pixelstack."
        />
      </div>

      <section className="space-y-4">
        <Card className="overflow-hidden rounded-xl border border-border bg-card">
          <CardHeader className="border-b border-border bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              Profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            <AvatarUpload userId={user.id} currentAvatarUrl={profile?.avatar_url ?? null} />
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="text-sm text-muted-foreground">Nom</span>
              <span className="text-sm font-medium text-foreground">
                {profile?.full_name || user.user_metadata?.full_name || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-muted-foreground">Rôle</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                  profile?.role === "designer"
                    ? "bg-primary/10 text-primary"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {profile?.role === "designer" ? (
                  <Palette className="h-3.5 w-3.5" />
                ) : (
                  <Video className="h-3.5 w-3.5" />
                )}
                {roleLabel}
              </span>
            </div>
          </CardContent>
          <div className="border-t border-border px-6 py-4">
            <LogoutButton />
          </div>
        </Card>
      </section>
    </div>
  );
}
