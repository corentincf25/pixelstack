"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      if (err.message.toLowerCase().includes("rate limit")) {
        setError(
          "Trop de tentatives de connexion. Réessaie dans 1 heure ou utilise « Continuer avec Google »."
        );
      } else {
        setError(err.message);
      }
      return;
    }
    router.refresh();
    router.push(next.startsWith("/") ? next : "/dashboard");
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const callbackUrl = next && next !== "/dashboard"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${window.location.origin}/auth/callback`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (err) setError(err.message);
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="space-y-8 rounded-2xl border border-white/[0.08] bg-[#111]/90 p-8 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#E5E7EB]">Pixelstack</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#E5E7EB]">Connexion</h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">L’espace de collaboration entre graphistes et leurs clients</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#6366F1] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#5558e3] disabled:opacity-50"
          >
            {loading ? "Connexion…" : "Se connecter"}
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
          onClick={handleGoogleLogin}
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
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-[#A5B4FC] hover:underline">
            S’inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-sm rounded-2xl border border-white/[0.08] bg-[#111]/90 p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent mx-auto" />
        <p className="mt-3 text-sm text-[#9CA3AF]">Chargement…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
