"use client";

import { useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebarState } from "@/components/SidebarProvider";
import { SidebarContent } from "@/components/SidebarContent";
import { cn } from "@/lib/utils";

type SidebarDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SidebarDrawer({ open, onOpenChange }: SidebarDrawerProps) {
  const state = useSidebarState();

  // Close drawer when route changes (e.g. user taps a nav link). Do NOT depend on `open`
  // or the effect would run when opening and immediately close the drawer.
  useEffect(() => {
    onOpenChange(false);
  }, [state.pathname, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={true}
        className={cn(
          "w-[240px] max-w-[85vw] border-r border-white/[0.06] bg-[#121212]/98 p-0 backdrop-blur-xl",
          "flex flex-col"
        )}
      >
        <div className="flex h-full w-full flex-col overflow-hidden">
          <SidebarContent {...state} compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
