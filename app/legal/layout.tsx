import Link from "next/link";
import { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #181818 100%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#9CA3AF] transition-colors hover:text-[#E5E7EB]"
        >
          ← Retour à l&apos;accueil
        </Link>
        {children}
      </div>
    </div>
  );
}
