"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Palette, Video, Camera, Loader2 } from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { compressImageForAvatar } from "@/lib/compress-image";

type Step = "role" | "profile";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<"designer" | "youtuber" | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setCheckingAuth(false);
        return;
      }
      setUserId(session.user.id);
      const meta = session.user.user_metadata as { role?: string; full_name?: string } | undefined;
      if (meta?.full_name) setFullName(String(meta.full_name));

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role === "designer" || profile?.role === "youtuber") {
        setRole(profile.role as "designer" | "youtuber");
        setStep("profile");
      } else if (meta?.role === "designer" || meta?.role === "youtuber") {
        setRole(meta.role as "designer" | "youtuber");
      }
      setCheckingAuth(false);
    })();
  }, []);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !userId) return;
    setError(null);
    setLoading(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep("profile");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expirée. Reconnecte-toi.");
      setLoading(false);
      return;
    }

    let avatarUrl: string | null = null;
    if (avatarFile) {
      try {
        const blob = await compressImageForAvatar(avatarFile);
        const path = `${user.id}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        }
      } catch {
        // continue without avatar
      }
    }

    const { error: err } = await supabase
      .from("profiles")
      .update({
        role: role!,
        full_name: fullName.trim() || null,
        ...(avatarUrl && { avatar_url: avatarUrl }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("avatar-updated"));
    fireConfetti();
    router.refresh();
    router.push("/dashboard");
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#9CA3AF]">
          <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111]/90 p-8 shadow-xl backdrop-blur-sm sm:p-10">
        <div className="relative space-y-8">
          {step === "role" && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
                  Bienvenue sur Pixelstack
                </h1>
                <p className="text-base text-[#9CA3AF]">
                  Tu crées des miniatures ou tu en commandes ? Choisis ton profil pour commencer.
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

              <form onSubmit={handleRoleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                  <button
                    type="button"
                    onClick={() => setRole("designer")}
                    className={`group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-left transition-all duration-200 ${
                      role === "designer"
                        ? "border-[#6366F1] bg-[#6366F1]/15 shadow-lg shadow-[#6366F1]/10"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5"
                    }`}
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                        role === "designer" ? "bg-[#6366F1]/20 text-[#A5B4FC]" : "bg-white/5 text-[#9CA3AF] group-hover:bg-[#6366F1]/10 group-hover:text-[#A5B4FC]"
                      }`}
                    >
                      <Palette className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-semibold text-[#E5E7EB]">Graphiste</span>
                    <p className="text-sm leading-relaxed text-[#9CA3AF]">
                      Je crée des miniatures pour mes clients. Briefs, versions et retours au même endroit.
                    </p>
                    {role === "designer" && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("youtuber")}
                    className={`group relative flex flex-col items-center gap-4 rounded-2xl border-2 p-8 text-left transition-all duration-200 ${
                      role === "youtuber"
                        ? "border-red-500/80 bg-red-500/15 shadow-lg shadow-red-500/10"
                        : "border-white/[0.08] bg-white/[0.03] hover:border-red-500/50 hover:bg-red-500/5"
                    }`}
                  >
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                        role === "youtuber" ? "bg-red-500/20 text-red-400" : "bg-white/5 text-[#9CA3AF] group-hover:bg-red-500/10 group-hover:text-red-400"
                      }`}
                    >
                      <Video className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-semibold text-[#E5E7EB]">YouTuber & équipe</span>
                    <p className="text-sm leading-relaxed text-[#9CA3AF]">
                      Créateurs, agents, managers, assistants, équipes éditoriales, relecteurs — toute personne qui travaille avec un créateur et commande ou suit des miniatures.
                    </p>
                    <p className="text-xs font-medium text-emerald-400/90">100% gratuit pour votre rôle.</p>
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
                  className={`w-full rounded-xl py-3.5 text-base font-semibold text-white shadow-lg transition disabled:opacity-50 disabled:shadow-none ${
                    role === "youtuber"
                      ? "bg-red-500 shadow-red-500/25 hover:bg-red-600"
                      : "bg-[#6366F1] shadow-[#6366F1]/25 hover:bg-[#5558e3]"
                  }`}
                >
                  {loading ? "Enregistrement…" : "Continuer"}
                </button>
              </form>
            </>
          )}

          {step === "profile" && (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
                  Complète ton profil
                </h1>
                <p className="text-base text-[#9CA3AF]">
                  Un nom et une photo pour que ton équipe te reconnaisse.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#E5E7EB]">Nom ou pseudo</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Comment on t’appelle ?"
                    className="w-full rounded-xl border border-white/10 bg-[#0a0a0a]/80 px-4 py-3 text-[#E5E7EB] placeholder:text-[#6B7280] focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#E5E7EB]">Photo de profil</label>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-white/5">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-semibold text-[#6B7280]">?</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#E5E7EB] transition-colors hover:bg-white/10"
                      >
                        <Camera className="h-4 w-4" />
                        {avatarPreview ? "Changer la photo" : "Ajouter une photo"}
                      </button>
                      <p className="text-xs text-[#6B7280]">Optionnel. Max 500 Ko, compressé automatiquement.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("role")}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#E5E7EB] hover:bg-white/10"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-[#6366F1] py-3.5 text-base font-semibold text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#5558e3] disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement…
                      </span>
                    ) : (
                      "Accéder à Pixelstack"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
