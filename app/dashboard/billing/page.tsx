"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BackLink } from "@/components/BackLink";
import { CreditCard, HardDrive, Loader2, ExternalLink, Sparkles, Check } from "lucide-react";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "@/lib/storage-limits";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  studio: "Studio",
};

const PLAN_DESC: Record<string, string> = {
  free: "25 Mo de stockage, jusqu’à 3 projets.",
  pro: "10 Go de stockage, projets illimités, support prioritaire.",
  studio: "50 Go de stockage, tout du Pro, support 24/7.",
};

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} Go`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} Mo`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} Ko`;
  return `${bytes} o`;
}

export default function BillingPage() {
  const [plan, setPlan] = useState<string>("free");
  const [storageLimit, setStorageLimit] = useState<number>(DEFAULT_STORAGE_LIMIT_BYTES);
  const [storageUsed, setStorageUsed] = useState<number | null>(null);
  const [role, setRole] = useState<"designer" | "youtuber" | null>(null);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, plan, storage_limit_bytes, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRole(profile.role as "designer" | "youtuber" | null);
        setPlan(String(profile.plan ?? "free"));
        setStorageLimit(Number(profile.storage_limit_bytes) || DEFAULT_STORAGE_LIMIT_BYTES);
        setHasStripeCustomer(!!profile.stripe_customer_id);
      }

      if (profile?.role === "designer") {
        const { data: storage } = await supabase.rpc("get_designer_storage");
        const raw = Array.isArray(storage) ? storage[0] : storage;
        if (raw && typeof raw === "object" && "used" in raw) {
          setStorageUsed(Number((raw as { used: number }).used));
        }
      }
    } catch {
      // Éviter tout crash au retour Stripe / bfcache
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Recharger les données au retour (ex. bouton retour depuis Stripe / bfcache)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) loadProfile();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [loadProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const canceled = params.get("canceled");
    const error = params.get("error");
    if (success === "1") {
      setMessage({ type: "success", text: "Paiement réussi. Votre abonnement est à jour." });
      window.history.replaceState({}, "", "/dashboard/billing");
    } else if (canceled === "1") {
      setMessage({ type: "error", text: "Paiement annulé." });
      window.history.replaceState({}, "", "/dashboard/billing");
    } else if (error === "1") {
      setMessage({ type: "error", text: "Impossible de créer la session de paiement. Réessaie ou contacte le support." });
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, []);

  const handleUpgrade = async (selectedPlan: "pro" | "studio", interval: "monthly" | "yearly") => {
    setUpgradeLoading(selectedPlan);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, interval }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Impossible de créer la session de paiement." });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setUpgradeLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/customer-portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Impossible d'ouvrir le portail de facturation." });
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  const currentPlanLabel = PLAN_LABELS[plan] ?? "Gratuit";

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5">
        <BackLink href="/dashboard" label="Retour au dashboard" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Facturation et abonnement
        </h1>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Bloc 1 : Votre forfait actuel — toujours visible */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-5 sm:p-6 space-y-5">
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9CA3AF]">
          Votre forfait actuel
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              plan === "free"
                ? "border-white/15 bg-white/5"
                : "border-[#6366F1]/30 bg-[#6366F1]/10"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366F1]/20">
              <CreditCard className="h-5 w-5 text-[#6366F1]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentPlanLabel}</p>
              <p className="text-sm text-muted-foreground">
                {PLAN_DESC[plan] ?? PLAN_DESC.free}
              </p>
            </div>
          </div>
          {plan === "free" && (
            <p className="text-sm text-muted-foreground">
              Vous pouvez souscrire à <strong className="text-foreground">Pro</strong> ou <strong className="text-foreground">Studio</strong> ci-dessous pour augmenter votre stockage et débloquer plus de projets.
            </p>
          )}
        </div>

        {role === "designer" && (
          <div className="flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
              <HardDrive className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stockage utilisé</p>
              <p className="text-lg font-semibold text-foreground">
                {storageUsed != null ? formatBytes(storageUsed) : "—"} / {formatBytes(storageLimit)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bloc 2 : Choisir un abonnement (Pro ou Studio) — graphistes */}
      {role === "designer" && (
        <div className="rounded-2xl border border-white/10 bg-card/40 p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-medium uppercase tracking-wider text-[#9CA3AF] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#6366F1]" />
            Choisir un abonnement payant
          </h2>
          <p className="text-sm text-muted-foreground">
            Deux offres disponibles : <strong className="text-foreground">Pro</strong> (10 Go) et <strong className="text-foreground">Studio</strong> (50 Go). Après souscription, votre compte sera mis à jour automatiquement (stockage, nom du plan).
          </p>
          <p className="text-sm text-muted-foreground rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            Pour passer de Pro à Studio (ou l’inverse), utilisez le portail Stripe ci-dessous ou souscrivez à l’autre plan dans les cartes ci‑dessous.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Facturation :</span>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  billingInterval === "monthly" ? "bg-[#6366F1] text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  billingInterval === "yearly" ? "bg-[#6366F1] text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuel
              </button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#6366F1]/30 bg-[#6366F1]/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#6366F1]" />
                <span className="font-semibold text-foreground">Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {billingInterval === "yearly" ? (
                  <><span className="font-semibold text-foreground">100 €/an</span> (soit ~8,33 €/mois) · 10 Go, projets illimités, support prioritaire.</>
                ) : (
                  <><span className="font-semibold text-foreground">10 €/mois</span> · 10 Go, projets illimités, support prioritaire.</>
                )}
              </p>
              <button
                type="button"
                disabled={upgradeLoading !== null || plan === "pro"}
                onClick={() => handleUpgrade("pro", billingInterval)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#6366F1] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5558e3] disabled:opacity-50"
              >
                {upgradeLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Souscrire — Pro {billingInterval === "yearly" ? "Annuel" : "Mensuel"}
              </button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#9CA3AF]" />
                <span className="font-semibold text-foreground">Studio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {billingInterval === "yearly" ? (
                  <><span className="font-semibold text-foreground">250 €/an</span> (soit ~20,83 €/mois) · 50 Go, tout du Pro, support 24/7.</>
                ) : (
                  <><span className="font-semibold text-foreground">25 €/mois</span> · 50 Go, tout du Pro, support 24/7.</>
                )}
              </p>
              <button
                type="button"
                disabled={upgradeLoading !== null || plan === "studio"}
                onClick={() => handleUpgrade("studio", billingInterval)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#6366F1]/50 bg-[#6366F1]/15 px-4 py-2.5 text-sm font-medium text-[#A5B4FC] hover:bg-[#6366F1]/25 disabled:opacity-50"
              >
                {upgradeLoading === "studio" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Souscrire — Studio {billingInterval === "yearly" ? "Annuel" : "Mensuel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bloc 3 : Gérer l'abonnement (portail Stripe) */}
      <div className="rounded-2xl border border-white/10 bg-card/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          Gérer mon abonnement
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Mettre à jour votre moyen de paiement, télécharger des factures ou <strong>annuler votre abonnement</strong> (retour au forfait Gratuit).
        </p>
        <button
          type="button"
          disabled={portalLoading || !hasStripeCustomer}
          onClick={handlePortal}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {portalLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {hasStripeCustomer ? "Ouvrir le portail Stripe" : "Disponible après avoir souscrit à Pro ou Studio"}
        </button>
      </div>
    </div>
  );
}
