"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";

type FeatureCardProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
};

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <GlassCard
      className={cn(
        "flex flex-col gap-3 p-5 sm:p-6 text-left",
        className
      )}
    >
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-[#6366F1]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold tracking-tight text-[#E5E7EB]">
        {title}
      </h3>
      {description && (
        <p className="text-sm leading-relaxed text-[#9CA3AF]">
          {description}
        </p>
      )}
    </GlassCard>
  );
}
