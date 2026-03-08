"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { MessageSquare, ImagePlus, Link2, CheckCircle } from "lucide-react";

const clientBenefits = [
  { icon: MessageSquare, text: "Commenter les versions" },
  { icon: ImagePlus, text: "Envoyer des assets" },
  { icon: MessageSquare, text: "Discuter avec le graphiste" },
  { icon: CheckCircle, text: "Valider le design" },
];

export function ClientNoAccount() {
  return (
    <section className="py-20 sm:py-28 transition-opacity duration-500">
      <LandingContainer>
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px] sm:p-10 lg:p-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
                  <Link2 className="h-4 w-4" />
                  Pour le client
                </span>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#E5E7EB] sm:text-3xl">
                  Le client n’a pas besoin de créer de compte
                </h2>
                <p className="mt-4 max-w-xl text-[#9CA3AF] leading-relaxed">
                  Le client rejoint le projet via le lien d’invitation. Il peut immédiatement commenter les versions, envoyer des assets, discuter avec le graphiste et valider le design. Tout cela sans inscription.
                </p>
                <p className="mt-5 text-sm font-medium text-[#A5B4FC]">
                  Un simple lien. Aucun compte requis. Le client participe en un clic.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:min-w-[240px]">
                {clientBenefits.map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-[#E5E7EB] backdrop-blur-sm"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/20 text-[#6366F1]">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
