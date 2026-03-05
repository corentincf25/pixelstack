"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function GlassCard({
  children,
  className,
  hover = true,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.05] shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl",
        "transition-all duration-300",
        hover &&
          "hover:border-white/[0.12] hover:bg-white/[0.07] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {children}
    </div>
  );
}
