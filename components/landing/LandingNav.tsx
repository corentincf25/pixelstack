"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function LandingNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#0b0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#E5E7EB] transition-opacity hover:opacity-90"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            P
          </span>
          Pixelstack
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[#9CA3AF] transition-colors hover:text-[#E5E7EB]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition-all",
              "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
              "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
              "hover:shadow-[0_0_28px_rgba(99,102,241,0.45)] hover:opacity-95"
            )}
          >
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
