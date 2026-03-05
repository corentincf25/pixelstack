"use client";

import { useRef, useState, useCallback, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TILT_MAX = 8;
const PERSPECTIVE = 1000;

type CardTiltProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Désactiver l'effet (ex. mobile) */
  disabled?: boolean;
};

export function CardTilt({ children, className, style, disabled }: CardTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTransform({
        rotateY: x * TILT_MAX,
        rotateX: -y * TILT_MAX,
      });
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ rotateX: 0, rotateY: 0 });
  }, []);

  const tiltStyle: CSSProperties = !disabled
    ? {
        transformStyle: "preserve-3d",
        perspective: PERSPECTIVE,
        transform: `perspective(${PERSPECTIVE}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
      }
    : {};

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("card-tilt-wrap transition-transform duration-200 ease-out", className)}
      style={{ ...style, ...tiltStyle }}
    >
      <div className="card-shine relative h-full w-full overflow-hidden rounded-2xl">
        {children}
      </div>
    </div>
  );
}
