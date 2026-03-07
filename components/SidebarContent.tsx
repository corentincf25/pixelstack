"use client";

import Link from "next/link";
import { LayoutDashboard, FolderKanban, Settings, LogOut, Palette, Video, HardDrive, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { StorageBar } from "@/components/StorageBar";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const baseNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/projects", label: "Projets", icon: <FolderKanban className="h-4 w-4" /> },
  { href: "/settings", label: "Paramètres", icon: <Settings className="h-4 w-4" /> },
];
const storageNavItem: NavItem = {
  href: "/dashboard/storage",
  label: "Mon stockage",
  icon: <HardDrive className="h-4 w-4" />,
};
const billingNavItem: NavItem = {
  href: "/dashboard/billing",
  label: "Abonnement",
  icon: <CreditCard className="h-4 w-4" />,
};

export type Role = "designer" | "youtuber" | null;

export type SidebarContentProps = {
  pathname: string;
  role: Role;
  plan: string;
  avatarUrl: string | null;
  unreadBadge: number;
  onLogout: () => void;
  logoError: boolean;
  onLogoError: () => void;
  /** When true, nav links use min tap target for mobile */
  compact?: boolean;
};

const PLAN_BADGE: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  studio: "Studio",
};

export function SidebarContent({
  pathname,
  role,
  plan,
  avatarUrl,
  unreadBadge,
  onLogout,
  logoError,
  onLogoError,
  compact,
}: SidebarContentProps) {
  return (
    <>
      <Link
        href="/"
        className="glass-card-header flex h-14 items-center gap-3 px-5 transition-opacity hover:opacity-90"
        aria-label="Retour à l'accueil"
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0a0a0a]">
          <img
            src="/logo.png"
            alt=""
            role="presentation"
            className={cn("h-full w-full object-contain p-0.5", logoError && "hidden")}
            onError={onLogoError}
          />
          {logoError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#3B82F6] shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              <span className="absolute left-0.5 top-1 h-2 w-4 rounded bg-white/30" style={{ transform: "translateY(1px)" }} />
              <span className="absolute left-1 top-0.5 h-3 w-3 rounded bg-white/50" />
              <span className="absolute right-0.5 bottom-0.5 h-2.5 w-2.5 rounded bg-[#3B82F6]" />
            </div>
          )}
        </div>
        <span className="text-sm font-semibold tracking-tight text-[#E5E7EB]">Pixelstack</span>
      </Link>

      {role && (
        <div className="border-b border-border px-3 py-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium tracking-tight",
              role === "designer"
                ? "bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30"
                : "bg-red-500/15 text-red-300 border border-red-500/30"
            )}
          >
            {role === "designer" ? (
              <Palette className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Video className="h-3.5 w-3.5 shrink-0" />
            )}
            {role === "designer" ? "Espace Graphiste" : "Espace YouTuber"}
          </div>
          {role === "designer" && <StorageBar />}
        </div>
      )}

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Navigation principale">
        {[
          baseNavItems[0],
          baseNavItems[1],
          ...(role === "designer" ? [storageNavItem, billingNavItem] : []),
          baseNavItems[2],
        ].map((item) => {
          // Dashboard: actif uniquement sur /dashboard exact (pas sur /dashboard/storage, etc.)
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          const showBadge = item.href === "/projects" && unreadBadge > 0;
          const isYoutuber = role === "youtuber";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "btn-interactive flex items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                compact ? "min-h-[44px] py-3" : "py-2.5",
                active
                  ? isYoutuber
                    ? "bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    : "bg-[#6366F1] text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  : "text-[#9CA3AF] hover:bg-white/[0.06] hover:text-[#E5E7EB]"
              )}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
              {showBadge && (
                <span
                  className={cn(
                    "ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                    isYoutuber
                      ? "bg-red-500 shadow-[0_0_12px_rgba(220,38,38,0.5)]"
                      : "bg-[#6366F1] shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  )}
                >
                  {unreadBadge > 99 ? "99+" : unreadBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-border px-3 py-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          )}
          <span>Connecté</span>
          {role && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                plan === "pro" && "bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/40",
                plan === "studio" && "bg-[#6366F1]/25 text-[#C7D2FE] border border-[#6366F1]/50",
                (plan === "free" || !plan) && "bg-white/10 text-[#9CA3AF] border border-white/20"
              )}
            >
              {PLAN_BADGE[plan] ?? "Gratuit"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "btn-interactive flex w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            compact ? "min-h-[44px] py-3" : "py-2.5"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Se déconnecter
        </button>
      </div>
    </>
  );
}
