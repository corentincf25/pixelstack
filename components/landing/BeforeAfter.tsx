"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { X, ArrowRight, Check } from "lucide-react";

const before = [
  "Discord",
  "WhatsApp",
  "Google Drive",
  "Messages dispersés",
];

const after = [
  "Versions",
  "Assets",
  "Chat",
  "Validation",
];

export function BeforeAfter() {
  return (
    <section className="py-20 sm:py-28 transition-opacity duration-500">
      <LandingContainer>
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Avant / Après
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Avant / Après Pixelstack
            </h2>
          </ScrollReveal>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <ScrollReveal delay={160} direction="right">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 backdrop-blur-[20px]">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-red-400/90">
                <X className="h-5 w-5" />
                Avant
              </h3>
              <ul className="mt-4 space-y-3">
                {before.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#9CA3AF]">
                    <span className="h-2 w-2 rounded-full bg-red-400/50" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-red-300/70">
                Perte de temps et charge mentale inutile.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={240} direction="left">
            <div className="rounded-2xl border border-[#6366F1]/30 bg-[#6366F1]/10 p-6 sm:p-8 backdrop-blur-[20px]">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#A5B4FC]">
                <Check className="h-5 w-5" />
                Après
              </h3>
              <ul className="mt-4 space-y-3">
                {after.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[#E5E7EB]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366F1]/30 text-[#6366F1]">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm font-medium text-[#A5B4FC]">
                Tout centralisé dans Pixelstack.
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={320}>
          <div className="mt-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-[#9CA3AF]">
              <ArrowRight className="h-4 w-4 text-[#6366F1]" />
              Un seul outil pour tout gérer
            </span>
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
