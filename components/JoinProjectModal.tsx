"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Link2 } from "lucide-react";

type JoinProjectModalProps = {
  open: boolean;
  onClose: () => void;
};

function extractToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Lien complet : https://.../invite/TOKEN ou /invite/TOKEN
  const match = trimmed.match(/\/invite\/([a-zA-Z0-9-]+)/);
  if (match) return match[1];
  // Juste le token (UUID)
  if (/^[a-fA-F0-9-]{36}$/.test(trimmed)) return trimmed;
  return null;
}

export function JoinProjectModal({ open, onClose }: JoinProjectModalProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = extractToken(value);
    if (!token) {
      setError("Colle le lien d'invitation complet ou le token du projet.");
      return;
    }
    onClose();
    setValue("");
    router.push(`/invite/${token}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Rejoindre un projet</h2>
              <p className="text-sm text-muted-foreground">
                Colle le lien d&apos;invitation reçu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setError(null); setValue(""); onClose(); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="invite-url" className="sr-only">
              Lien d&apos;invitation
            </label>
            <input
              id="invite-url"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://.../invite/xxx ou colle le lien ici"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Rejoindre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
