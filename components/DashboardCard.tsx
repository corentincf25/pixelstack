"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Carte projet dashboard — glass flottante avec hover scale et ombre.
 */
export function DashboardCard({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px]",
        "transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.12] hover:shadow-[0_16px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(99,102,241,0.15)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
        className
      )}
    >
      {children}
    </Link>
  );
}
