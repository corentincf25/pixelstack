"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { Check } from "lucide-react";

const benefits = [
  "Finis les retours dans Discord ou WhatsApp",
  "Toutes les versions au même endroit",
  "Historique complet des modifications",
  "Les clients peuvent envoyer leurs assets directement",
  "Validation finale claire",
];

export function WhyPixelstack() {
  return (
    <section className="py-20 sm:py-28 transition-opacity duration-500">
      <LandingContainer>
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Bénéfices
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Pourquoi les graphistes YouTube utilisent Pixelstack
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
              Un seul outil pour gérer la collaboration de bout en bout.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={240}>
          <ul className="mx-auto mt-12 max-w-2xl space-y-4">
            {benefits.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-4 transition-colors hover:border-white/[0.1] hover:bg-white/[0.05]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/20 text-[#6366F1]">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-[#E5E7EB]">{item}</span>
              </li>
            ))}
          </ul>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
