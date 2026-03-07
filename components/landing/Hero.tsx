"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { ArrowRight, Play, ImageIcon } from "lucide-react";

/** Screenshot principal : dépose hero.png ou hero.jpg dans public/landing/ */
const HERO_IMAGE = "/landing/hero.png";

export function Hero() {
  const [heroImageError, setHeroImageError] = useState(false);
  const showPlaceholder = heroImageError;

  return (
    <section id="hero" className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-32">
      {/* Lueur discrète en haut à droite (DA Pixelstack) */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-[400px] w-[500px] rounded-full bg-[#6366F1]/15 blur-[120px]"
        aria-hidden
      />

      <LandingContainer className="flex flex-col items-center gap-12 lg:gap-16">
        {/* Bannière "Nouveau" */}
        <ScrollReveal delay={0}>
          <a
            href="#fonctionnalites"
            className="inline-flex items-center gap-2 rounded-full border border-[#6366F1]/30 bg-[#6366F1]/10 px-4 py-2 text-sm font-medium text-[#E5E7EB] transition-colors hover:border-[#6366F1]/50 hover:bg-[#6366F1]/15"
          >
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
            Nouveau — Découvrez les dernières fonctionnalités
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </ScrollReveal>

        {/* Titre + sous-titre */}
        <div className="flex max-w-4xl flex-col items-center text-center">
          <ScrollReveal delay={80}>
            <h1 className="text-4xl font-bold tracking-tight text-[#E5E7EB] sm:text-5xl lg:text-6xl">
              L’espace de travail pour{" "}
              <span className="bg-gradient-to-r from-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent">
                les miniamakers
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#9CA3AF] sm:text-xl">
              Gérez vos projets, assets et retours avec vos clients en un seul endroit. Briefs, versions et validation sans prise de tête.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className={cn(
                  "btn-cta-animate inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-medium text-white",
                  "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
                  "shadow-[0_0_24px_rgba(99,102,241,0.4)]",
                  "hover:shadow-[0_0_32px_rgba(99,102,241,0.5)]"
                )}
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo-app"
                className={cn(
                  "btn-cta-animate inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] px-6 py-3.5 text-base font-medium text-[#E5E7EB]",
                  "bg-white/[0.05] backdrop-blur-sm",
                  "transition-all hover:border-white/[0.2] hover:bg-white/[0.08]"
                )}
              >
                <Play className="h-4 w-4" />
                Voir la démo
              </a>
            </div>
          </ScrollReveal>
        </div>

        {/* Screenshot principal : dépose public/landing/hero.png pour l’afficher */}
        <ScrollReveal delay={320} direction="up">
          <div
            id="demo-app"
            className="relative w-full max-w-6xl overflow-hidden rounded-xl border border-white/[0.06] bg-[#111]/90 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm"
          >
            {showPlaceholder ? (
              <div className="flex aspect-video w-full items-center justify-center bg-[#0f172a] p-8 sm:p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.05]">
                    <ImageIcon className="h-8 w-8 text-[#6366F1]" />
                  </div>
                  <p className="text-sm font-medium text-[#E5E7EB]">Capture d’écran de l’application</p>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video w-full bg-[#0f172a]">
                <Image
                  src={HERO_IMAGE}
                  alt="Aperçu de l’application Pixelstack"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  onError={() => setHeroImageError(true)}
                  priority
                />
              </div>
            )}
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
