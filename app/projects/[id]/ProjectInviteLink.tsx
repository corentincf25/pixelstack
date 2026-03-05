"use client";

import { useState } from "react";
import { Link2, Copy, Check, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectInviteLinkProps = {
  role: "designer" | "youtuber";
  otherLabel: string;
  /** Token d'invitation existant (créé à la création du projet). Lien fixe, pas de régénération. */
  existingInviteToken: string | null;
};

export function ProjectInviteLink({ role, otherLabel, existingInviteToken }: ProjectInviteLinkProps) {
  const [copied, setCopied] = useState(false);
  const existingInviteLink =
    typeof window !== "undefined" && existingInviteToken
      ? `${window.location.origin}/invite/${existingInviteToken}`
      : existingInviteToken
        ? `/invite/${existingInviteToken}`
        : null;

  const copyLink = () => {
    const link = typeof window !== "undefined" && existingInviteToken
      ? `${window.location.origin}/invite/${existingInviteToken}`
      : null;
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Invitation déjà utilisée ou expirée : on affiche un message, pas de bouton
  if (!existingInviteToken) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Projet partagé avec {otherLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              L&apos;invitation a été utilisée ou a expiré. Le projet est lié aux deux comptes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayLink = typeof window !== "undefined" && existingInviteToken
    ? `${window.location.origin}/invite/${existingInviteToken}`
    : existingInviteToken
      ? `/invite/${existingInviteToken}`
      : "";

  const isRed = role === "youtuber";
  const borderCls = isRed ? "border-red-500/25" : "border-primary/25";
  const bgCls = isRed ? "bg-red-500/5" : "bg-primary/5";
  const iconCls = isRed ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary";
  const dividerCls = isRed ? "border-red-500/10" : "border-primary/10";
  const copyBtnCls = isRed
    ? "border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20"
    : "border-border bg-background text-foreground hover:bg-accent";

  return (
    <div className={cn("rounded-xl border px-5 py-5 space-y-5", borderCls, bgCls)}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconCls)}>
          <Link2 className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Lien d&apos;invitation pour {otherLabel}
        </p>
      </div>
      <div className="space-y-3">
        <p className="rounded-lg border border-border/60 bg-background/80 px-4 py-3 font-mono text-sm text-foreground break-all">
          {displayLink}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className={cn("btn-interactive inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium sm:w-auto", copyBtnCls)}
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copié" : "Copier le lien"}
        </button>
      </div>
      <p className={cn("text-xs leading-relaxed text-muted-foreground border-t pt-4", dividerCls)}>
        Ce lien est fixe. Partage-le — il ne peut pas être modifié ni régénéré.
      </p>
    </div>
  );
}
