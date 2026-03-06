"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const REDIRECT_DELAY_MS = 5000;

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  studio: "Studio",
};

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const planLabel = planParam && PLAN_LABELS[planParam] ? PLAN_LABELS[planParam] : null;
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_MS / 1000);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.refreshSession();
      } catch {
        // ignore
      }
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          window.location.href = "/dashboard";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const title = planLabel
    ? `Merci pour votre abonnement à Pixelstack ${planLabel}.`
    : "Merci pour votre paiement";

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-12 pt-8">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,0.4)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#E5E7EB] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-[#9CA3AF]">
          Votre abonnement est actif. Votre compte a été mis à jour (plan et stockage).
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Vous allez être redirigé vers votre dashboard dans{" "}
          <span className="font-semibold tabular-nums text-[#E5E7EB]">{countdown}</span>{" "}
          seconde{countdown !== 1 ? "s" : ""}…
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-[#5558e3]"
          >
            Accéder au dashboard
          </Link>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#E5E7EB] hover:bg-white/10"
          >
            Voir ma facturation
          </Link>
        </div>
      </div>
      {countdown > 0 && (
        <p className="flex items-center justify-center gap-2 text-sm text-[#6B7280]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirection en cours…
        </p>
      )}
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg pb-12 pt-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  );
}
