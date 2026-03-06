"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const plans = [
  {
    name: "Gratuit",
    id: "free" as const,
    priceMonth: "0 €",
    priceYear: "0 €",
    period: "pour toujours",
    periodMonth: "pour toujours",
    periodYear: "pour toujours",
    features: [
      "Suivi de base des projets",
      "Alertes stock limité",
      "Jusqu’à 3 projets",
      "100 Mo de stockage",
    ],
    cta: "Commencer",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    id: "pro" as const,
    priceMonth: "10 €",
    priceYear: "100 €",
    period: "par mois",
    periodMonth: "par mois",
    periodYear: "par an",
    features: [
      "Tout du plan Gratuit",
      "Projets illimités",
      "10 Go de stockage",
      "Support prioritaire",
    ],
    cta: "Souscrire",
    highlighted: true,
  },
  {
    name: "Studio",
    id: "studio" as const,
    priceMonth: "25 €",
    priceYear: "250 €",
    period: "par mois",
    periodMonth: "par mois",
    periodYear: "par an",
    features: [
      "Tout du plan Pro",
      "50 Go de stockage",
      "Support 24/7",
      "Intégrations sur mesure",
    ],
    cta: "Souscrire",
    highlighted: false,
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubscribe = async (planId: "pro" | "studio") => {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent("/dashboard/billing")}`;
      return;
    }
    setSubscribingPlan(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval: yearly ? "yearly" : "monthly" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      window.location.href = `/dashboard/billing?error=1`;
    } catch {
      window.location.href = `/dashboard/billing?error=1`;
    } finally {
      setSubscribingPlan(null);
    }
  };

  return (
    <section id="tarifs" className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Tarifs
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Des tarifs simples et transparents
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
              Des offres pensées pour les équipes de toutes tailles, sans frais cachés.
            </p>
          </ScrollReveal>

          {/* Toggle Mensuel / Annuel */}
          <ScrollReveal delay={200}>
            <div className="mt-8 flex items-center justify-center gap-4">
              <span
                className={cn(
                  "text-sm font-medium",
                  !yearly ? "text-[#E5E7EB]" : "text-[#9CA3AF]"
                )}
              >
                Mensuel
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={yearly}
                onClick={() => setYearly((y) => !y)}
                className={cn(
                  "relative h-8 w-14 rounded-full border border-white/[0.12] transition-colors",
                  yearly ? "bg-[#6366F1]" : "bg-white/[0.08]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    yearly ? "left-7" : "left-1"
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium",
                  yearly ? "text-[#E5E7EB]" : "text-[#9CA3AF]"
                )}
              >
                Annuel
              </span>
            </div>
          </ScrollReveal>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={280 + i * 80}>
              <div
                className={cn(
                  "flex flex-col rounded-2xl border p-6 sm:p-8 transition-all duration-300",
                  plan.highlighted
                    ? "border-[#6366F1]/40 bg-[#6366F1]/10 ring-1 ring-[#6366F1]/30 shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]"
                )}
              >
                {plan.highlighted && (
                  <span className="mb-4 inline-block w-fit rounded-full border border-[#6366F1]/40 bg-[#6366F1]/20 px-3 py-1 text-xs font-medium text-[#A5B4FC]">
                    Recommandé
                  </span>
                )}
                <h3 className="text-lg font-semibold text-[#E5E7EB]">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#E5E7EB]">
                    {yearly ? plan.priceYear : plan.priceMonth}
                  </span>
                  <span className="text-sm text-[#9CA3AF]">
                    {"periodYear" in plan && "periodMonth" in plan ? (yearly ? plan.periodYear : plan.periodMonth) : plan.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-3 text-sm text-[#E5E7EB]"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#6366F1]" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Link
                    href={user ? "/dashboard" : plan.href}
                    className={cn(
                      "btn-cta-animate mt-8 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      plan.highlighted
                        ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
                        : "border border-white/[0.12] bg-white/[0.05] text-[#E5E7EB] hover:bg-white/[0.08]"
                    )}
                  >
                    {user ? "Accéder au dashboard" : plan.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={!!subscribingPlan}
                    className={cn(
                      "btn-cta-animate mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-70",
                      plan.highlighted
                        ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
                        : "border border-white/[0.12] bg-white/[0.05] text-[#E5E7EB] hover:bg-white/[0.08]"
                    )}
                  >
                    {subscribingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {user ? plan.cta : "Se connecter pour souscrire"}
                  </button>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={400}>
          <p className="mt-8 text-center text-sm text-[#9CA3AF]">
            Les clients (YouTubers) rejoignent les projets gratuitement. Seuls les graphistes paient l’abonnement.
          </p>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
