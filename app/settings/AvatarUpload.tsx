"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { compressImageForAvatar } from "@/lib/compress-image";
import { Camera, Loader2 } from "lucide-react";

type AvatarUploadProps = {
  userId: string;
  currentAvatarUrl: string | null;
};

export function AvatarUpload({ userId, currentAvatarUrl }: AvatarUploadProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      e.target.value = "";
      setError("Choisis une image (JPG, PNG, WEBP).");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const blob = await compressImageForAvatar(file);
      const path = `${userId}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadErr) {
        setError(uploadErr.message || "Erreur lors de l’upload.");
        e.target.value = "";
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      // URL avec paramètre de cache pour forcer le rechargement partout (sidebar, autres onglets)
      const separator = urlData.publicUrl.includes("?") ? "&" : "?";
      const urlToStore = `${urlData.publicUrl}${separator}v=${Date.now()}`;
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: urlToStore, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (updateErr) {
        setError(updateErr.message || "Erreur lors de l’enregistrement du profil.");
        e.target.value = "";
        setUploading(false);
        return;
      }
      setAvatarVersion((v) => v + 1);
      e.target.value = "";
      router.refresh();
      // Notifier la sidebar (et toute autre UI) de recharger l’avatar
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("avatar-updated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la compression.");
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-4">
      <span className="text-sm text-muted-foreground">Photo de profil</span>
      <div className="flex items-center gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
          {currentAvatarUrl ? (
            <img
              src={`${currentAvatarUrl}${currentAvatarUrl.includes("?") ? "&" : "?"}v=${avatarVersion}`}
              alt=""
              className="h-full w-full object-cover"
              key={avatarVersion}
            />
          ) : (
            <span className="text-xl font-semibold text-muted-foreground">?</span>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
            key="avatar-input"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            aria-label={currentAvatarUrl ? "Changer la photo de profil" : "Ajouter une photo de profil"}
          >
            <Camera className="h-4 w-4" />
            {currentAvatarUrl ? "Changer la photo" : "Ajouter une photo"}
          </button>
          <p className="text-xs text-muted-foreground">Toute image acceptée, compressée automatiquement (max 500 Ko).</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
