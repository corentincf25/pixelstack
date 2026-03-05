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

  return <div data-role={role ?? undefined}>{children}</div>;
}
