"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "designer" | "youtuber" | null;

export function RoleThemeProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role === "designer" || profile?.role === "youtuber") setRole(profile.role);
    };
    load();
  }, []);

  return (
    <div data-role={role ?? undefined} className="relative">
      {/* Boules en blur selon le rôle (comme sur l'onboarding) */}
      {role === "designer" && (
        <div
          className="pointer-events-none fixed right-0 top-1/4 z-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[#6366F1]/10 blur-[100px]"
          aria-hidden
        />
      )}
      {role === "youtuber" && (
        <div
          className="pointer-events-none fixed right-0 top-1/4 z-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-red-500/10 blur-[100px]"
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}
