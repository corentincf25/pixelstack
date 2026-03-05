"use client";

import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";

type Collaborator = { id: string; full_name: string | null };

type Props = {
  projectId: string;
  collaborators: Collaborator[];
  canInvite: boolean;
  accentRed?: boolean;
};

export function ProjectIntervenants({ projectId, collaborators, canInvite, accentRed = false }: Props) {
  const [reviewerLink, setReviewerLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReviewerInvite = async () => {
    setLoading(true);
    setError(null);
    setReviewerLink(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reviewer" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Impossible de créer le lien.");
        return;
      }
      setReviewerLink(data.url ?? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${data.token}`);
    } finally {
      setLoading(false);
    }
  };

  const copyReviewerLink = () => {
    if (!reviewerLink) return;
    navigator.clipboard.writeText(reviewerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Intervenants sur le projet</span>
        {collaborators.length > 0 && (
          <span>({collaborators.length} relecteur{collaborators.length > 1 ? "s" : ""})</span>
        )}
      </div>

      {collaborators.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {collaborators.map((c) => (
            <li
              key={c.id}
              className="inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-1.5 text-sm text-foreground"
            >
              {c.full_name || "Relecteur"}
            </li>
          ))}
        </ul>
      )}

      {canInvite && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Tu peux inviter d&apos;autres personnes (équipe post-prod, relecteurs) à consulter les miniatures et demander des modifs.
          </p>
          {!reviewerLink ? (
            <button
              type="button"
              onClick={createReviewerInvite}
              disabled={loading}
              className={
                accentRed
                  ? "btn-interactive inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  : "btn-interactive inline-flex items-center gap-2 rounded-lg border border-[#6366F1]/50 bg-[#6366F1]/10 px-4 py-2.5 text-sm font-medium text-[#A5B4FC] hover:bg-[#6366F1]/20 disabled:opacity-50"
              }
            >
              <UserPlus className="h-4 w-4" />
              {loading ? "Génération…" : "Générer un lien pour inviter un intervenant"}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 font-mono text-xs text-foreground break-all">
                {reviewerLink}
              </p>
              <button
                type="button"
                onClick={copyReviewerLink}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier le lien"}
              </button>
              <p className="text-xs text-muted-foreground">
                Ce lien expire sous 7 jours. Une fois utilisé, la personne aura le même accès que le client (voir, commenter, demander des modifs).
              </p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>
      )}

      {!canInvite && collaborators.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Seul le client ou le graphiste peut inviter des intervenants supplémentaires.
        </p>
      )}
    </div>
  );
}
