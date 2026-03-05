"use client";

import { useState } from "react";
import { Minimize2, Maximize2, Shrink } from "lucide-react";
import { cn } from "@/lib/utils";

export type BentoCardLayout = "full" | "minimized" | "reduced" | "fit";

type BentoCardProps = {
  title: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  contentNoScroll?: boolean;
  compact?: boolean;
  /** Affiche les boutons Réduire / Minimiser / Fit */
  controls?: boolean;
  /** Mode initial (fit pour brief, full pour le reste) */
  defaultLayout?: BentoCardLayout;
};

export function BentoCard({
  title,
  icon,
  hint,
  children,
  className = "",
  contentNoScroll = false,
  compact = false,
  controls = false,
  defaultLayout = "full",
}: BentoCardProps) {
  const [layout, setLayout] = useState<BentoCardLayout>(compact ? "fit" : defaultLayout);

  const isMinimized = layout === "minimized";
  const isReduced = layout === "reduced";
  const isFit = layout === "fit";

  const contentClass = cn(
    "flex-1 min-h-0 p-4 sm:p-5",
    contentNoScroll && "flex flex-col overflow-hidden",
    !contentNoScroll && "overflow-auto",
    isReduced && "max-h-[220px] overflow-y-auto",
    isFit && "!flex-none"
  );

  return (
    <div
      className={cn(
        "card-shine glass-card flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-200",
        (compact || isFit) && "h-auto",
        !compact && !isFit && "h-full",
        isMinimized && "max-h-[52px]",
        className
      )}
    >
      <div className="glass-card-header flex shrink-0 items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        {controls && (
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/10 bg-black/20 p-0.5">
            <button
              type="button"
              onClick={() => setLayout((l) => (l === "fit" ? "full" : "fit"))}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                isFit ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
              title="Ajuster au contenu"
            >
              <Shrink className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayout((l) => (l === "reduced" ? "full" : "reduced"))}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                isReduced ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
              title="Réduire"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayout((l) => (l === "minimized" ? "full" : "minimized"))}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                isMinimized ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
              )}
              title="Réduire au minimum"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {!isMinimized && (
        <div className={contentClass}>
          {children}
          {hint && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{hint}</p>
          )}
        </div>
      )}
    </div>
  );
}
