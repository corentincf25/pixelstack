"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Carte type glass flottante — charte Pixelstack.
 * background: rgba(255,255,255,0.05), blur 20px, border rgba(255,255,255,0.08), radius 16px, shadow.
 */
export function GlassCard({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px] transition-shadow duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.65)]",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-b border-white/[0.08] pb-4 mb-4",
        className
      )}
    >
      {children}
    </div>
  );
}
