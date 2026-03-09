"use client";

import { ReactNode, useState } from "react";
import { GuestSidebar } from "@/components/GuestSidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function GuestShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <GuestSidebar />
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="w-[240px] max-w-[85vw] border-r border-white/[0.06] bg-[#121212]/98 p-0 backdrop-blur-xl xl:hidden"
        >
          <div className="flex h-full flex-col pt-14">
            <GuestSidebar embedded />
          </div>
        </SheetContent>
      </Sheet>
      <div className={cn("flex min-w-0 flex-1 flex-col", "pl-0 xl:pl-[240px]")}>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a]/90 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground xl:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 xl:flex-none" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
