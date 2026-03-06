"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BackLink } from "@/components/BackLink";
import { CreditCard, HardDrive, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { DEFAULT_STORAGE_LIMIT_BYTES } from "@/lib/storage-limits";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  pro: "Pro",
  studio: "Studio",
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

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, plan, storage_limit_bytes, stripe_customer_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRole(profile.role as "designer" | "youtuber" | null);
        setPlan(profile.plan ?? "free");
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

      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const success = params.get("success");
    const canceled = params.get("canceled");
    if (success === "1") {
      setMessage({ type: "success", text: "Paiement réussi. Votre abonnement est à jour." });
      if (typeof window !== "undefined") window.history.replaceState({}, "", "/dashboard/billing");
    } else if (canceled === "1") {
      setMessage({ type: "error", text: "Paiement annulé." });
      if (typeof window !== "undefined") window.history.replaceState({}, "", "/dashboard/billing");
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

      <div className="rounded-2xl border border-white/10 bg-card/40 p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366F1]/20">
            <CreditCard className="h-5 w-5 text-[#6366F1]" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Plan actuel</p>
            <p className="text-lg font-semibold text-foreground">
              {PLAN_LABELS[plan] ?? "Gratuit"}
            </p>
          </div>
        </div>

        {role === "designer" && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
              <HardDrive className="h-5 w-5 text-[#9CA3AF]" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stockage</p>
              <p className="text-lg font-semibold text-foreground">
                {storageUsed != null ? formatBytes(storageUsed) : "—"} / {formatBytes(storageLimit)}
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-muted-foreground mb-1">Statut de l&apos;abonnement</p>
          <p className="text-foreground">
            {hasStripeCustomer
              ? "Compte Stripe associé — vous pouvez gérer votre facturation ci-dessous."
              : "Aucun abonnement payant. Passez à Pro ou Studio pour plus de stockage."}
          </p>
        </div>
      </div>

      {role === "designer" && (
        <div className="rounded-2xl border border-white/10 bg-card/40 p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#6366F1]" />
            Passer à un plan supérieur
          </h2>
          <p className="text-sm text-muted-foreground">
            Pro : 10 Go · Studio : 50 Go. Choisis la facturation puis le plan.
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
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={upgradeLoading !== null}
              onClick={() => handleUpgrade("pro", billingInterval)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6366F1] px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:bg-[#5558e3] disabled:opacity-50"
            >
              {upgradeLoading === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Plan Pro (10 Go) {billingInterval === "yearly" ? "— Annuel" : "— Mensuel"}
            </button>
            <button
              type="button"
              disabled={upgradeLoading !== null}
              onClick={() => handleUpgrade("studio", billingInterval)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#6366F1]/50 bg-[#6366F1]/15 px-4 py-2.5 text-sm font-medium text-[#A5B4FC] hover:bg-[#6366F1]/25 disabled:opacity-50"
            >
              {upgradeLoading === "studio" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Plan Studio (50 Go) {billingInterval === "yearly" ? "— Annuel" : "— Mensuel"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-card/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground mb-2">Gérer la facturation</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Mettre à jour votre moyen de paiement, télécharger des factures ou annuler votre abonnement.
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
          {hasStripeCustomer ? "Ouvrir le portail Stripe" : "Disponible après un premier abonnement"}
        </button>
      </div>
    </div>
  );
}
