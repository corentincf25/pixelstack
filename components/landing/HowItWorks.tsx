"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { Link2, FolderOpen, MessageCircle } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Link2,
    title: "Créer un projet et envoyer un lien au client",
    description: "Le graphiste crée le projet sur Pixelstack et génère un lien d’invitation. Un simple copier-coller à envoyer au client.",
  },
  {
    number: "2",
    icon: FolderOpen,
    title: "Le client importe ses assets, tout est centralisé",
    description: "Le client dépose ses visuels, références et inspirations dans le projet. Plus de fichiers éparpillés sur Drive ou par email.",
  },
  {
    number: "3",
    icon: MessageCircle,
    title: "Collaborer via commentaires, chat et validation",
    description: "Retours sur chaque version, conversation en temps réel et validation finale. Tout au même endroit.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="py-20 sm:py-28 transition-opacity duration-500">
      <LandingContainer>
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Simple et rapide
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Comment ça marche
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
              Trois étapes pour passer du brief au projet validé, sans prise de tête.
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-16 grid gap-8 sm:gap-12 md:grid-cols-3">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={200 + i * 80} direction="up">
              <div className="relative flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#6366F1] backdrop-blur-[20px]">
                  <step.icon className="h-7 w-7" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[#E5E7EB]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Ligne de connexion entre les étapes (desktop) */}
        <div className="mt-4 hidden md:block" aria-hidden>
          <div className="flex justify-center gap-4">
            <span className="h-px w-24 bg-gradient-to-r from-transparent to-white/10" />
            <span className="h-px w-24 bg-white/10" />
            <span className="h-px w-24 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>
      </LandingContainer>
    </section>
  );
}
