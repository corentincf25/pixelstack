"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { MessageSquare, ImagePlus, Link2, CheckCircle } from "lucide-react";

const clientBenefits = [
  { icon: MessageSquare, text: "Commenter les versions" },
  { icon: ImagePlus, text: "Envoyer des assets" },
  { icon: MessageSquare, text: "Discuter avec le graphiste" },
  { icon: CheckCircle, text: "Valider la miniature" },
];

export function ClientNoAccount() {
  return (
    <section className="py-20 sm:py-28 transition-opacity duration-500">
      <LandingContainer>
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#6366F1]/10 to-transparent p-8 sm:p-10 lg:p-12">
          <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:gap-12 lg:text-left">
            <div className="flex-1">
              <ScrollReveal>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
                  <Link2 className="h-4 w-4" />
                  Pour le client (YouTuber)
                </span>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#E5E7EB] sm:text-3xl">
                  Le client n’a pas besoin de créer de compte
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <p className="mt-4 text-[#9CA3AF] leading-relaxed">
                  Le YouTuber rejoint le projet via le lien d’invitation. Il peut immédiatement commenter les versions, envoyer des assets, discuter avec le graphiste et valider la miniature. Tout cela sans inscription.
                </p>
              </ScrollReveal>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-3 lg:mt-0 lg:justify-end">
              {clientBenefits.map(({ icon: Icon, text }, i) => (
                <ScrollReveal key={text} delay={200 + i * 60}>
                  <li className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-[#E5E7EB]">
                    <Icon className="h-4 w-4 text-[#6366F1]" />
                    {text}
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
          <ScrollReveal delay={280}>
            <p className="mt-6 text-center text-sm text-[#9CA3AF]">
              Un simple lien. Aucun compte requis. Le client participe en un clic.
            </p>
          </ScrollReveal>
        </div>
      </LandingContainer>
    </section>
  );
}
