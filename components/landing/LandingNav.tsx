"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Témoignages", href: "#temoignages" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function LandingNav() {
  return (
    <nav
      className="fixed left-1/2 top-5 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 px-2 sm:top-6 sm:px-4"
      aria-label="Navigation principale"
    >
      <div
        className={cn(
          "flex h-14 items-center justify-between gap-4 rounded-2xl border border-white/[0.08] px-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "bg-[#0a0a0a]/85 backdrop-blur-xl sm:h-14 sm:px-6"
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[#E5E7EB] transition-opacity hover:opacity-90"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#3B82F6] text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            P
          </span>
          <span className="font-semibold tracking-tight">Pixelstack</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#9CA3AF] transition-colors hover:bg-white/[0.06] hover:text-[#E5E7EB]"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#9CA3AF] transition-colors hover:text-[#E5E7EB] sm:inline-block"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className={cn(
              "btn-cta-animate inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white",
              "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
              "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
              "hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
            )}
          >
            Commencer gratuitement
          </Link>
        </div>
      </div>
    </nav>
  );
}
