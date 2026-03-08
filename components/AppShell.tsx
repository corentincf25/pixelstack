"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarProvider";
import { SidebarDrawer } from "@/components/SidebarDrawer";
import { RoleThemeProvider } from "@/components/RoleThemeProvider";
import { SyncProfileEmail } from "@/components/SyncProfileEmail";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <RoleThemeProvider>
      <SyncProfileEmail />
      <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar />
          <SidebarDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col",
              "pl-0 xl:pl-[240px]"
            )}
          >
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
            <NotificationPrompt />
          </div>
        </div>
      </SidebarProvider>
    </RoleThemeProvider>
  );
}
