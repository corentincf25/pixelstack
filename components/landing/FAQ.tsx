"use client";

import { useState } from "react";
import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "Existe-t-il une version gratuite ?",
    answer:
      "Oui. Le plan Gratuit vous permet de créer jusqu’à 3 projets et d’utiliser 25 Mo de stockage. Idéal pour tester Pixelstack avec vos premiers clients.",
  },
  {
    question: "Puis-je changer de formule plus tard ?",
    answer:
      "Oui. Vous pouvez passer à une formule supérieure à tout moment pour débloquer plus de stockage et de projets. Aucun engagement long terme.",
  },
  {
    question: "Proposez-vous une application mobile ?",
    answer:
      "L’application est responsive et utilisable sur mobile et tablette. Une application native est envisagée pour plus tard.",
  },
  {
    question: "Y a-t-il des réductions pour un engagement annuel ?",
    answer:
      "Oui. En choisissant le paiement annuel, vous bénéficiez d’environ 2 mois offerts par rapport au mensuel (voir le comparateur ci-dessus).",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard) et les paiements via Stripe pour les clients internationaux.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <LandingContainer size="narrow">
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              FAQ
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Foire aux questions
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#9CA3AF]">
              Retrouvez les réponses aux questions fréquentes sur le produit, les tarifs et les politiques.
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.question} delay={200 + i * 50}>
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all duration-300",
                  openIndex === i && "border-white/[0.12] bg-white/[0.05]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                  aria-expanded={openIndex === i}
                >
                  <span className="font-medium text-[#E5E7EB]">
                    {faq.question}
                  </span>
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] text-[#9CA3AF] transition-transform duration-300",
                      openIndex === i && "rotate-180"
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    openIndex === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="border-t border-white/[0.06] px-5 py-4 text-[#9CA3AF] sm:px-6">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
