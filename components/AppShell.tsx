import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { RoleThemeProvider } from "@/components/RoleThemeProvider";
import { SyncProfileEmail } from "@/components/SyncProfileEmail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleThemeProvider>
      <SyncProfileEmail />
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pl-[240px]">
          <header className="flex h-14 shrink-0 items-center justify-end border-b border-white/[0.06] bg-[#0a0a0a]/90 px-8 backdrop-blur-xl">
            <div className="flex items-center gap-2" />
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </RoleThemeProvider>
  );
}
