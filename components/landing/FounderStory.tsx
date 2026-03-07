"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";

export function FounderStory() {
  return (
    <section className="py-20 sm:py-28 transition-opacity duration-500">
      <LandingContainer size="narrow">
        <ScrollReveal>
          <div className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px] sm:p-10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              L’histoire derrière le produit
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#E5E7EB] sm:text-3xl">
              Pourquoi j’ai créé Pixelstack
            </h2>
            <div className="mt-6 space-y-4 text-[#9CA3AF] leading-relaxed">
              <p>
                Je suis graphiste et je travaille régulièrement avec des YouTubers sur leurs miniatures.
              </p>
              <p>
                Avec le temps, je me suis rendu compte que tout était dispersé : les retours dans Discord, les fichiers dans Google Drive, les messages sur WhatsApp…
              </p>
              <p>
                C’était difficile de suivre les versions, de retrouver les assets et de centraliser les retours clients.
              </p>
              <p className="text-[#E5E7EB]">
                J’ai donc créé Pixelstack pour résoudre ce problème : un seul endroit pour gérer les versions, discuter avec le client et centraliser tous les assets d’un projet.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
