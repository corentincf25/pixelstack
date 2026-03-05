"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Palette, Video, Sparkles } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"designer" | "youtuber" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(() => setCheckingAuth(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu n'es pas connecté.");
      setLoading(false);
      return;
    }
    const { error: err } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    fireConfetti();
    router.refresh();
    router.push("/dashboard");
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-card/80 p-8 shadow-xl">
        <div className="absolute right-0 top-0 opacity-20">
          <Sparkles className="h-24 w-24 text-primary" />
        </div>

        <div className="relative space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Bienvenue sur Pixelstack
            </h1>
            <p className="text-base text-muted-foreground">
              Tu crées des miniatures ou tu en commandes ? Choisis ton camp pour commencer.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <p>{error}</p>
              <p className="mt-1 text-xs opacity-90">
                Inscrit par email ? Vérifie ta boîte mail et{" "}
                <Link href="/login" className="font-medium underline">
                  connecte-toi ici
                </Link>{" "}
                puis reviens.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole("designer")}
                className={`group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center transition-all duration-200 ${
                  role === "designer"
                    ? "border-primary bg-primary/15 shadow-lg shadow-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
                    role === "designer" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }`}
                >
                  <Palette className="h-8 w-8" />
                </div>
                <span className="text-lg font-semibold text-foreground">Graphiste</span>
                <span className="text-sm text-muted-foreground">
                  Je crée des miniatures pour mes clients
                </span>
                {role === "designer" && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    ✓
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRole("youtuber")}
                className={`group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-center transition-all duration-200 ${
                  role === "youtuber"
                    ? "border-red-500 bg-red-500/15 shadow-lg shadow-red-500/10"
                    : "border-border bg-muted/30 hover:border-red-500/50 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
                    role === "youtuber" ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground group-hover:bg-red-500/10 group-hover:text-red-400"
                  }`}
                >
                  <Video className="h-8 w-8" />
                </div>
                <span className="text-lg font-semibold text-foreground">YouTuber</span>
                <span className="text-sm text-muted-foreground">
                  Je commande des miniatures pour ma chaîne
                </span>
                {role === "youtuber" && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    ✓
                  </span>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={!role || loading}
              className="w-full rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? "Enregistrement…" : "C'est parti !"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
