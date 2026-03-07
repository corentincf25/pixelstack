"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";

export function TrustSection() {
  return (
    <section className="py-12 sm:py-16">
      <LandingContainer>
        <ScrollReveal>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm font-medium text-[#9CA3AF]">
              Utilisé par des créateurs et graphistes du monde entier
            </p>
            <p className="text-xs text-[#6B7280]">
              Rejoignez les équipes qui gèrent leurs miniatures sur Pixelstack.
            </p>
            {/* Placeholder logos : à remplacer par de vrais logos */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex h-10 w-24 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-xs text-[#6B7280] backdrop-blur-[20px]"
                >
                  Logo {i}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
