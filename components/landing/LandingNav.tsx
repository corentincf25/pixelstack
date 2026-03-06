"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Témoignages", href: "#temoignages" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

export function LandingNav() {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
          {user ? (
            <Link
              href="/dashboard"
              className={cn(
                "btn-cta-animate inline-flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white",
                "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
                "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
                "hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
              )}
            >
              {avatarUrl ? (
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
                  {user.email?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              Mon espace
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
                  "btn-cta-animate inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white",
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
  );
}
