import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
};

const sizeClasses = {
  default: "max-w-6xl",
  narrow: "max-w-4xl",
  wide: "max-w-7xl",
};

export function LandingContainer({
  children,
  className,
  size = "default",
}: LandingContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8 lg:px-12",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
