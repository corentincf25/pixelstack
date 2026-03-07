"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [role, setRole] = useState<"designer" | "youtuber" | null>(null);

  useEffect(() => {
    const next = nextParam ?? "";
    if (next.startsWith("/p/")) {
      const token = next.replace(/^\/p\//, "").split("?")[0]?.trim() || "";
      if (token) {
        try {
          sessionStorage.setItem("pendingAnonConvert", token);
        } catch {
          // ignore
        }
      }
    }
  }, [nextParam]);

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
          "Trop de tentatives d'inscription par email. Réessaie dans 1 heure ou utilise « Continuer avec Google » pour créer ton compte tout de suite."
        );
      } else if (
        err.message.toLowerCase().includes("already registered") ||
        err.message.toLowerCase().includes("user already exists") ||
        err.message.toLowerCase().includes("already exists")
      ) {
        setError("Un compte existe déjà avec cette adresse. Veuillez vous connecter.");
      } else {
        setError(err.message);
      }
      return;
    }
    const alreadyHasAccount =
      data.user && (!data.user.identities || data.user.identities.length === 0);
    if (alreadyHasAccount) {
      setError("Un compte existe déjà avec cette adresse. Veuillez vous connecter.");
      return;
    }
    router.refresh();
    if (data.session) {
      const q = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
      router.push(`/onboarding${q}`);
    } else {
      router.push("/signup/confirm-email");
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    const next = nextParam || "/dashboard";
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (err) setError(err.message);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#111]/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#E5E7EB]">Pixelstack</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#E5E7EB]">Créer un compte</h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">Choisis ton rôle ci-dessous. Tu pourras compléter ton profil à l’étape suivante.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p>{error}</p>
            {error === "Un compte existe déjà avec cette adresse. Veuillez vous connecter." && (
              <Link
                href={nextParam ? `/login?next=${encodeURIComponent(nextParam)}` : "/login"}
                className="mt-2 inline-block font-medium text-red-100 underline hover:text-white"
              >
                Se connecter
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#E5E7EB]">Nom</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a]/80 px-4 py-3 text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#E5E7EB]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-[#0a0a0a]/80 px-4 py-3 text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              placeholder="toi@exemple.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#E5E7EB]">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-[#0a0a0a]/80 px-4 py-3 pr-11 text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#9CA3AF] transition-colors hover:bg-white/10 hover:text-[#E5E7EB]"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#E5E7EB]">Tu es</label>
            <div className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors has-[:checked]:border-[#6366F1] has-[:checked]:bg-[#6366F1]/10">
                <input
                  type="radio"
                  name="role"
                  value="designer"
                  checked={role === "designer"}
                  onChange={() => setRole("designer")}
                  className="h-4 w-4 border-white/20 text-[#6366F1] focus:ring-[#6366F1]"
                />
                <span className="text-sm font-medium text-[#E5E7EB]">Graphiste</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10">
                <input
                  type="radio"
                  name="role"
                  value="youtuber"
                  checked={role === "youtuber"}
                  onChange={() => setRole("youtuber")}
                  className="h-4 w-4 border-white/20 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-[#E5E7EB]">YouTuber</span>
              </label>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0a0a0a] text-[#6366F1] focus:ring-[#6366F1]"
            />
            <label htmlFor="terms" className="text-sm text-[#9CA3AF] cursor-pointer">
              J&apos;accepte les{" "}
              <Link href="/legal/terms" className="font-medium text-[#A5B4FC] hover:underline" target="_blank" rel="noopener noreferrer">
                Conditions d&apos;utilisation
              </Link>
              {" "}et la{" "}
              <Link href="/legal/privacy" className="font-medium text-[#A5B4FC] hover:underline" target="_blank" rel="noopener noreferrer">
                Politique de confidentialité
              </Link>
              .
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#6366F1] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#5558e3] disabled:opacity-50"
          >
            {loading ? "Création…" : "S'inscrire"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs text-[#6B7280]">
            <span className="bg-[#111] px-2">ou</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-[#E5E7EB] transition-colors hover:bg-white/10"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuer avec Google
        </button>

        <p className="text-center text-sm text-[#9CA3AF]">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-[#A5B4FC] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-[#9CA3AF]">Chargement…</div>}>
      <SignupContent />
    </Suspense>
  );
}
