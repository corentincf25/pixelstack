"use client";

import { cn } from "@/lib/utils";
import { useSidebarState } from "@/components/SidebarProvider";
import { SidebarContent } from "@/components/SidebarContent";

export function Sidebar() {
  const state = useSidebarState();
  const contentProps = {
    ...state,
    compact: false,
  };

  return (
    <aside
      className={cn(
        "glass-card fixed left-0 top-0 z-30 flex h-full w-[240px] flex-col rounded-none border-r border-white/[0.06] bg-[#121212]/95 backdrop-blur-[20px]",
        "hidden xl:flex"
      )}
    >
      <SidebarContent {...contentProps} />
    </aside>
  );
}

export type { Role } from "@/components/SidebarContent";
