"use client";

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  label: string;
  description?: string;
  aspectRatio?: "video" | "square" | "auto";
  className?: string;
};

export function ImagePlaceholder({
  label,
  description = "Remplacez par une capture d’écran de l’app",
  aspectRatio = "video",
  className,
}: ImagePlaceholderProps) {
  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
        ? "aspect-square"
        : "";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f172a]",
        aspectClass,
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05]">
          <ImageIcon className="h-7 w-7 text-[#6366F1]/70" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#E5E7EB]">{label}</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">{description}</p>
        </div>
      </div>
    </div>
  );
}
