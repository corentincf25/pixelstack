"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUnreadCounts } from "@/hooks/use-unread-counts";
import type { Role } from "@/components/SidebarContent";

type SidebarState = {
  role: Role;
  plan: string;
  avatarUrl: string | null;
  logoError: boolean;
  unreadBadge: number;
  pathname: string;
  onLogout: () => void;
  onLogoError: () => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebarState(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarState must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [plan, setPlan] = useState<string>("free");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const { totalNew } = useUnreadCounts();
  const unreadBadge = (totalNew.messages || 0) + (totalNew.versions || 0) + (totalNew.feedback || 0);

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, plan, avatar_url")
      .eq("id", user.id)
      .single();
    if (profile?.role === "designer" || profile?.role === "youtuber") {
      setRole(profile.role);
    }
    setPlan(String(profile?.plan ?? "free"));
    setAvatarUrl(profile?.avatar_url ?? null);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [pathname, fetchProfile]);

  useEffect(() => {
    const onAvatarUpdated = () => fetchProfile();
    const onFocus = () => fetchProfile();
    window.addEventListener("avatar-updated", onAvatarUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("avatar-updated", onAvatarUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchProfile]);

  const onLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }, [router]);

  const value: SidebarState = {
    role,
    plan,
    avatarUrl,
    logoError,
    unreadBadge,
    pathname: pathname ?? "",
    onLogout,
    onLogoError: () => setLogoError(true),
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
