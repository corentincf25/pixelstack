"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = { href: string; label?: string };

export function BackLink({ href, label = "Retour" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="btn-interactive inline-flex items-center gap-2 rounded-lg border border-border bg-card/80 px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
