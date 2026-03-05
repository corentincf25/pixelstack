"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { notifyProjectUpdate } from "@/lib/notify";
import { Upload } from "lucide-react";
import { UploadProgress } from "@/components/UploadProgress";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_ZIP = "application/zip";
const ALLOWED = [...ALLOWED_IMAGE_TYPES, ALLOWED_ZIP];

function getKind(mime: string, name: string): "image" | "zip" {
  if (mime === ALLOWED_ZIP || name.toLowerCase().endsWith(".zip")) return "zip";
  return "image";
}

type UploadZoneProps = {
  projectId?: string;
  onUploaded?: () => void;
};

export function UploadZone({ projectId, onUploaded }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !projectId) return;

      const toUpload: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > MAX_FILE_SIZE) {
          setError(`« ${file.name } » dépasse 10 Mo.`);
          return;
        }
        const mime = file.type || "";
        const ok = ALLOWED.includes(mime) || file.name.toLowerCase().endsWith(".zip");
        if (!ok) {
          setError(`Type non accepté : ${file.name}. Utilise PNG, JPG, WEBP ou ZIP.`);
          return;
        }
        toUpload.push(file);
      }

      const totalSize = toUpload.reduce((acc, f) => acc + f.size, 0);
      const quotaRes = await fetch("/api/storage/check-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, fileSize: totalSize }),
      });
      const quotaData = await quotaRes.json().catch(() => ({}));
      if (!quotaData.allowed) {
        setError("Quota de stockage dépassé. Passez au plan supérieur.");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        for (const file of toUpload) {
          const path = `${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("assets")
            .upload(path, file, { upsert: false });

          if (uploadError) {
            setError(uploadError.message);
            setUploading(false);
            setDragOver(false);
            return;
          }

          const { data: urlData } = supabase.storage.from("assets").getPublicUrl(uploadData.path);
          const kind = getKind(file.type, file.name);

          const { error: insertError } = await supabase.from("assets").insert({
            project_id: projectId,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || null,
            kind,
          });

          if (insertError) {
            setError(insertError.message);
            break;
          }
        }
        onUploaded?.();
        if (projectId) notifyProjectUpdate(projectId, "assets");
      } catch {
        setError("Échec de l'envoi. Réessaie.");
      } finally {
        setUploading(false);
        setDragOver(false);
      }
    },
    [projectId, onUploaded]
  );

  return (
    <div className="space-y-2">
      <div
        className={`flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-6 text-center transition-colors sm:min-h-0 sm:p-8 ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
        } ${uploading ? "pointer-events-none opacity-80" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Dépose des fichiers ici</p>
        <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, WEBP ou ZIP. Max 10 Mo par fichier.</p>
        <label className="mt-4 flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,.zip"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          Choisir des fichiers
        </label>
        {uploading && (
          <div className="mt-4 w-full max-w-xs">
            <UploadProgress label="Envoi des fichiers…" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
