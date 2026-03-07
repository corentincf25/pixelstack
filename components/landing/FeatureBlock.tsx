"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import { ScrollReveal } from "./ScrollReveal";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { cn } from "@/lib/utils";

type FeatureBlockProps = {
  tag: string;
  title: string;
  description: string;
  listItems?: string[];
  /** Chemin vers la capture d’écran (ex. /landing/dashboard.png). Si fourni, affiche l’image au lieu du placeholder. */
  imageSrc?: string;
  imagePlaceholderLabel: string;
  imagePlaceholderDescription?: string;
  imageRight?: boolean;
  children?: ReactNode;
};

export function FeatureBlock({
  tag,
  title,
  description,
  listItems,
  imageSrc,
  imagePlaceholderLabel,
  imagePlaceholderDescription,
  imageRight = false,
  children,
}: FeatureBlockProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = imageSrc && !imageError;

  const textBlock = (
    <div className="flex flex-col justify-center">
      <ScrollReveal delay={0}>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
          <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
          {tag}
        </span>
      </ScrollReveal>
      <ScrollReveal delay={80}>
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#E5E7EB] sm:text-3xl">
          {title}
        </h3>
      </ScrollReveal>
      <ScrollReveal delay={160}>
        <p className="mt-4 text-[#9CA3AF] leading-relaxed">{description}</p>
      </ScrollReveal>
      {listItems && listItems.length > 0 && (
        <ScrollReveal delay={240}>
          <ul className="mt-6 space-y-3">
            {listItems.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#E5E7EB]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/20 text-[#6366F1]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </ScrollReveal>
      )}
      {children}
    </div>
  );

  const imageBlock = (
    <ScrollReveal delay={120} direction={imageRight ? "left" : "right"}>
      {showImage ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f172a] shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
          <Image
            src={imageSrc!}
            alt={imagePlaceholderLabel}
            fill
            className="object-cover object-center w-full h-full"
            sizes="(max-width: 1024px) 100vw, 50vw"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <ImagePlaceholder
          label={imagePlaceholderLabel}
          description={imagePlaceholderDescription}
          aspectRatio="video"
        />
      )}
    </ScrollReveal>
  );

  return (
    <div
      className={cn(
        "grid gap-10 py-16 sm:gap-16 lg:grid-cols-2 lg:items-center",
        imageRight && "lg:grid-flow-dense"
      )}
    >
      <div className={imageRight ? "lg:col-start-2" : ""}>{textBlock}</div>
      <div className={imageRight ? "lg:col-start-1 lg:row-start-1" : ""}>
        {imageBlock}
      </div>
    </div>
  );
}
