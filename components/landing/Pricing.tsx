"use client";

import Link from "next/link";
import { LandingContainer } from "./LandingContainer";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    storage: "1GB storage",
    projects: "3 projects",
    price: null,
    cta: "Get started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    storage: "10GB storage",
    projects: "Unlimited projects",
    price: "10€/month",
    cta: "Start trial",
    href: "/signup",
    highlighted: true,
  },
  {
    name: "Studio",
    storage: "50GB storage",
    projects: "Unlimited projects",
    price: "25€/month",
    cta: "Contact sales",
    href: "/signup",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
            Start free, upgrade when you need more.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <GlassCard
              key={plan.name}
              className={cn(
                "flex flex-col p-6 sm:p-8",
                plan.highlighted &&
                  "border-[#6366F1]/40 bg-[#6366F1]/5 ring-1 ring-[#6366F1]/30"
              )}
            >
              <h3 className="text-lg font-semibold text-[#E5E7EB]">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-[#9CA3AF]">{plan.storage}</p>
              <p className="text-sm text-[#9CA3AF]">{plan.projects}</p>
              <div className="mt-6 flex items-baseline gap-1">
                {plan.price ? (
                  <span className="text-2xl font-bold text-[#E5E7EB]">
                    {plan.price}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-[#E5E7EB]">Free</span>
                )}
              </div>
              <Link
                href={plan.href}
                className={cn(
                  "mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  plan.highlighted
                    ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]"
                    : "border border-white/[0.12] bg-white/[0.05] text-[#E5E7EB] hover:bg-white/[0.08]"
                )}
              >
                {plan.cta}
              </Link>
            </GlassCard>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[#9CA3AF]">
          Clients join projects for free. Only designers pay.
        </p>
      </LandingContainer>
    </section>
  );
}
