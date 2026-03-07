"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Comment ça marche", href: "#comment-ca-marche" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function LandingNav() {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (mobileMenuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <div ref={menuRef}>
      <nav
        className="fixed left-1/2 top-5 z-[60] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 px-2 sm:top-6 sm:px-4"
        aria-label="Navigation principale"
      >
        <div
          className={cn(
            "flex h-14 items-center justify-between gap-4 rounded-2xl border border-white/[0.08] px-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            "bg-[#0B0F19]/90 backdrop-blur-[20px] sm:h-14 sm:px-6"
          )}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 text-[#E5E7EB] transition-opacity hover:opacity-90"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="/logo.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight">Pixelstack</span>
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
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#E5E7EB] transition-colors hover:bg-white/[0.08] md:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {user ? (
              <Link
                href="/dashboard"
                className={cn(
                  "btn-cta-animate inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white",
                  "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
                  "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
                  "hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]",
                  "max-md:px-3 max-md:py-2 max-md:text-xs"
                )}
              >
                {avatarUrl ? (
                  <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 max-md:h-6 max-md:w-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-medium max-md:h-6 max-md:w-6">
                    {user.email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <span className="max-md:sr-only">Mon espace</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-[#9CA3AF] transition-colors hover:text-[#E5E7EB] sm:inline-block"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className={cn(
                    "btn-cta-animate hidden items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white sm:inline-flex",
                    "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
                    "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
                    "hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
                  )}
                >
                  Commencer gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay + menu mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed left-4 right-4 top-20 z-[60] rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 shadow-xl backdrop-blur-xl transition-all duration-200 md:hidden",
          mobileMenuOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        )}
        role="dialog"
        aria-label="Menu de navigation"
      >
        <div className="flex flex-col py-2">
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-5 py-3.5 text-base font-medium text-[#E5E7EB] transition-colors hover:bg-white/[0.08]"
            >
              {label}
            </a>
          ))}
          {!user && (
            <>
              <div className="my-1 border-t border-white/[0.06]" />
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-5 py-3.5 text-base font-medium text-[#9CA3AF] transition-colors hover:bg-white/[0.08] hover:text-[#E5E7EB]"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-3 mt-2 inline-flex justify-center rounded-xl bg-gradient-to-r from-[#6366F1] to-[#3B82F6] px-4 py-3 text-sm font-medium text-white"
              >
                Commencer gratuitement
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
