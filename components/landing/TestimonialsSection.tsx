"use client";

import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { GlassCard } from "./GlassCard";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Enfin un outil qui rassemble brief, versions et retours au même endroit. Ça nous fait gagner des heures.",
    author: "Placeholder — Graphiste",
  },
  {
    quote:
      "Mes graphistes me envoient les minis, je commente direct dessus. Simple et clair.",
    author: "Placeholder — Créateur YouTube",
  },
];

export function TestimonialsSection() {
  return (
    <section id="temoignages" className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Témoignages
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Ils utilisent Pixelstack
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#9CA3AF]">
              Retrouvez les retours de graphistes et créateurs qui gèrent leurs miniatures avec nous.
            </p>
          </ScrollReveal>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {testimonials.map((t, i) => (
            <ScrollReveal key={i} delay={200 + i * 80}>
              <GlassCard className="relative p-6 sm:p-8">
                <Quote className="absolute right-4 top-4 h-8 w-8 text-[#6366F1]/20" />
                <p className="text-[#E5E7EB] leading-relaxed">{t.quote}</p>
                <p className="mt-4 text-sm text-[#9CA3AF]">{t.author}</p>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={400}>
          <p className="mt-8 text-center text-xs text-[#6B7280]">
            Remplacez ces blocs par de vrais témoignages et noms lorsque vous en avez.
          </p>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
