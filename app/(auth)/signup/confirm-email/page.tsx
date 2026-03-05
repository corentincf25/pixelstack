"use client";

import Link from "next/link";

export default function ConfirmEmailPage() {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Vérifie ta boîte mail
      </h1>
      <p className="text-sm text-muted-foreground">
        Un email de confirmation t’a été envoyé. Clique sur le lien dans le
        message pour activer ton compte, puis reviens ici pour te connecter et
        choisir ton rôle (Graphiste ou YouTuber).
      </p>
      <Link
        href="/login"
        className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Aller à la connexion
      </Link>
    </div>
  );
}
