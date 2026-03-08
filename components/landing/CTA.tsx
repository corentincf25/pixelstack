"use client";

import Link from "next/link";
import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer size="narrow">
        <ScrollReveal>
          <div className="rounded-3xl border border-white/[0.1] bg-white/[0.05] p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-[20px] sm:p-14">
            <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Organisez votre workflow de projets design
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-[#9CA3AF]">
              Rejoignez les graphistes et créateurs qui livrent leurs visuels et contenus créatifs plus vite.
            </p>
            <Link
              href="/signup"
              className={cn(
                "btn-cta-animate mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-medium text-white",
                "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
                "shadow-[0_0_24px_rgba(99,102,241,0.4)]",
                "hover:shadow-[0_0_32px_rgba(99,102,241,0.5)]"
              )}
            >
              Créer un compte
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
