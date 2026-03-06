"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [role, setRole] = useState<"designer" | "youtuber" | null>(null);

  const requireAgreement = () => {
    if (!agreedToTerms) {
      setError("Tu dois accepter les Conditions d'utilisation et la Politique de confidentialité pour créer un compte.");
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!requireAgreement()) return;
    if (!role) {
      setError("Choisis ton rôle : Graphiste ou YouTuber.");
      return;
    }
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || undefined, role },
        emailRedirectTo: redirectTo,
      },
    });
    setLoading(false);
    if (err) {
      if (err.message.toLowerCase().includes("rate limit")) {
        setError(
          "Trop de tentatives d’inscription par email. Réessaie dans 1 heure ou utilise « Continuer avec Google » pour créer ton compte tout de suite."
        );
      } else {
        setError(err.message);
      }
      return;
    }
    router.refresh();
    if (data.session) {
      router.push("/onboarding");
    } else {
      router.push("/signup/confirm-email");
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    if (!requireAgreement()) return;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) setError(err.message);
  };

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">Pixelstack — Inscris-toi puis confirme ton email. Choisis ton rôle ci-dessous. ton rôle à l’étape suivante.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nom</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="toi@exemple.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Tu es</label>
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 has-[:checked]:border-[#6366F1] has-[:checked]:bg-[#6366F1]/10">
              <input
                type="radio"
                name="role"
                value="designer"
                checked={role === "designer"}
                onChange={() => setRole("designer")}
                className="h-4 w-4 border-border text-[#6366F1] focus:ring-[#6366F1]"
              />
              <span className="text-sm font-medium text-foreground">Graphiste</span>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10">
              <input
                type="radio"
                name="role"
                value="youtuber"
                checked={role === "youtuber"}
                onChange={() => setRole("youtuber")}
                className="h-4 w-4 border-border text-red-500 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-foreground">YouTuber</span>
            </label>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            J&apos;accepte les{" "}
            <Link href="/legal/terms" className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Conditions d&apos;utilisation
            </Link>
            {" "}et la{" "}
            <Link href="/legal/privacy" className="font-medium text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Politique de confidentialité
            </Link>
            .
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Création…" : "S’inscrire"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-card px-2">ou</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignup}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2 text-sm font-medium text-foreground hover:bg-accent"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continuer avec Google
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

