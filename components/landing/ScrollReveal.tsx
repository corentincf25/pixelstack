"use client";

import { type ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Délai en ms pour stagger */
  delay?: number;
  /** Direction d'entrée */
  direction?: "up" | "down" | "left" | "right";
};

const directionClasses = {
  up: "translate-y-8 opacity-0 data-[visible]:translate-y-0 data-[visible]:opacity-100",
  down: "translate-y-[-8px] opacity-0 data-[visible]:translate-y-0 data-[visible]:opacity-100",
  left: "translate-x-8 opacity-0 data-[visible]:translate-x-0 data-[visible]:opacity-100",
  right: "translate-x-[-8px] opacity-0 data-[visible]:translate-x-0 data-[visible]:opacity-100",
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const { ref, inView } = useInView({ rootMargin: "0px 0px -60px 0px", threshold: 0.1 });

  return (
    <div
      ref={ref}
      data-visible={inView ? "" : undefined}
      className={cn(
        "transition-all duration-700 ease-out",
        directionClasses[direction],
        className
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
