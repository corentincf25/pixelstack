import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LandingContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
};

const sizeClasses = {
  default: "max-w-7xl",
  narrow: "max-w-5xl",
  wide: "max-w-[90rem]",
};

export function LandingContainer({
  children,
  className,
  size = "default",
}: LandingContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
