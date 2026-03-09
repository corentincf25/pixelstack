"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserPlus, Home } from "lucide-react";
import { cn } from "@/lib/utils";

type GuestSidebarProps = {
  embedded?: boolean;
};

export function GuestSidebar({ embedded }: GuestSidebarProps) {
  const pathname = usePathname() ?? "";
  const isProjectGuest = pathname.startsWith("/p/");
  const token = isProjectGuest ? pathname.replace(/^\/p\//, "").split("/")[0] ?? "" : "";
  const signupHref = token ? `/signup?convert=1&next=${encodeURIComponent(`/p/${token}`)}` : "/signup";
  const handleSignupClick = () => {
    if (token) try { sessionStorage.setItem("pendingAnonConvert", token); } catch {}
  };

  return (
    <aside
      className={cn(
        "flex h-full w-[240px] flex-col rounded-none border-r border-white/[0.06] bg-[#121212]/95 backdrop-blur-[20px]",
        embedded ? "" : "fixed left-0 top-0 z-30 hidden xl:flex"
      )}
    >
      <Link
        href="/"
        className="flex h-14 items-center gap-3 px-5 transition-opacity hover:opacity-90"
        aria-label="Retour à l'accueil"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0a0a0a]">
          <img src="/logo.png" alt="" role="presentation" className="h-full w-full object-contain p-0.5" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[#E5E7EB]">Pixelstack</span>
      </Link>

      <div className="border-b border-border px-3 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium tracking-tight text-red-200">
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          Vous participez en tant qu&apos;invité
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Navigation invité">
        <Link
          href="/"
          className="btn-interactive flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9CA3AF] transition-colors hover:bg-white/[0.06] hover:text-[#E5E7EB]"
        >
          <Home className="h-4 w-4" />
          <span className="truncate">Retour à l&apos;accueil</span>
        </Link>
        <Link
          href={signupHref}
          onClick={handleSignupClick}
          className="btn-interactive flex items-center gap-2.5 rounded-lg bg-red-500 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
        >
          <UserPlus className="h-4 w-4" />
          <span className="truncate">Créer un compte</span>
        </Link>
      </nav>
    </aside>
  );
}
