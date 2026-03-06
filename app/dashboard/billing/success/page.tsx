"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function RedirectContent() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const plan = searchParams.get("plan");
    const params = plan ? `?plan=${plan}` : "";
    window.location.replace(`/billing/success${params}`);
  }, [searchParams]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-[#9CA3AF]">Redirection…</p>
    </div>
  );
}

/**
 * Redirige vers la page de succès billing standalone pour garder une seule source de vérité
 * et éviter le layout dashboard quand la session est perdue après retour Stripe.
 */
export default function DashboardBillingSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><p className="text-[#9CA3AF]">Chargement…</p></div>}>
      <RedirectContent />
    </Suspense>
  );
}
