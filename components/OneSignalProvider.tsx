"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const ONESIGNAL_SDK_URL = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: unknown) => void | Promise<void>>;
    /** Instance OneSignal exposée pour que le clic "Activer" déclenche la demande de permission dans le même geste utilisateur (requis par le navigateur). */
    __OneSignalInstance?: unknown;
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const initRef = useRef(false);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
    if (!appId) return;
    const appIdStr: string = appId;

    function runOneSignal(OneSignal: unknown) {
      if (initRef.current) return;
      window.__OneSignalInstance = OneSignal;
      const OS = OneSignal as {
        init: (opts: {
          appId: string;
          allowLocalhostAsSecureOrigin?: boolean;
          promptOptions?: { slidedown?: { prompts?: Array<{ type?: string; autoPrompt?: boolean }> } };
        }) => Promise<void>;
        login: (externalId: string) => Promise<void>;
        logout: () => Promise<void>;
      };
      if (!OS?.init) return;

      initRef.current = true;
      OS.init({
        appId: appIdStr,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
        // Désactive le pop-up automatique OneSignal ; seul notre bandeau dashboard invite à activer les notifs
        promptOptions: {
          slidedown: {
            prompts: [{ type: "push", autoPrompt: false }],
          },
        },
      }).catch(() => {
        initRef.current = false;
      });
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(runOneSignal);

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id;
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal: unknown) {
        const OS = OneSignal as { login: (id: string) => Promise<void>; logout: () => Promise<void> };
        if (!OS) return;
        try {
          if (uid) await OS.login(uid);
          else await OS.logout();
        } catch (_) {
          // 409 Conflict si external_id existe déjà : attendu, ignorer
        }
      });
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function (OneSignal: unknown) {
          const OS = OneSignal as { login: (id: string) => Promise<void> };
          if (OS?.login) {
            try {
              await OS.login(user.id);
            } catch (_) {}
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
        <Script
          src={ONESIGNAL_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => {
            window.OneSignalDeferred = window.OneSignalDeferred || [];
          }}
        />
      )}
      {children}
    </>
  );
}
