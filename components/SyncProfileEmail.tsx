"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Synchronise l'email de l'utilisateur connecté vers profiles.email à chaque chargement.
 * Permet à l'API de notification de trouver l'email du destinataire (YouTuber ou graphiste) même si Auth ne le renvoie pas bien.
 */
export function SyncProfileEmail() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted || !user?.id || !user.email) return;
      await supabase
        .from("profiles")
        .update({ email: user.email.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return null;
}
