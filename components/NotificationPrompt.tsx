"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

const STORAGE_KEY = "pixelstack_notification_prompt_dismissed";

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      setVisible(true);
    } catch (_) {}
  }, [mounted]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {}
    setVisible(false);
  };

  const enable = () => {
    // Le navigateur n’affiche la demande de permission que si elle est déclenchée directement par le clic (même stack). On appelle optIn() tout de suite si l’instance est dispo.
    const OS = typeof window !== "undefined" ? (window as Window & { __OneSignalInstance?: { User?: { PushSubscription?: { optIn?: () => Promise<void> } } } }).__OneSignalInstance : undefined;
    if (OS?.User?.PushSubscription?.optIn) {
      OS.User.PushSubscription.optIn();
    } else {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OneSignal: unknown) {
        const O = OneSignal as { User?: { PushSubscription?: { optIn?: () => Promise<void> } } };
        try {
          await O?.User?.PushSubscription?.optIn?.();
        } catch (_) {}
      });
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Activer les notifications"
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-white/10 bg-[#111827]/95 px-4 py-3 shadow-lg backdrop-blur-xl md:left-auto md:right-6 md:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <Bell className="h-4 w-4 text-white/90" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/95">
            Activer les notifications pour être informé des nouveaux messages et versions.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enable}
              className="rounded-lg bg-[#6366f1] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#4f46e5]"
            >
              Activer
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-white/60 hover:bg-white/10 hover:text-white/90"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
