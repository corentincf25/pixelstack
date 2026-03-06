"use client";

import Link from "next/link";
import { LandingContainer } from "./LandingContainer";
import { ScrollReveal } from "./ScrollReveal";
import { Mail } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="py-20 sm:py-28">
      <LandingContainer size="narrow">
        <ScrollReveal>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center sm:p-12">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Contact
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#E5E7EB] sm:text-3xl">
              Une question ?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[#9CA3AF]">
              Envoyez-nous un email et nous vous répondrons au plus vite.
            </p>
            <Link
              href="mailto:blend.psd@gmail.com"
              className="btn-cta-animate mt-8 inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-6 py-3 text-[#E5E7EB] transition-colors hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10"
            >
              <Mail className="h-4 w-4" />
              blend.psd@gmail.com
            </Link>
          </div>
        </ScrollReveal>
      </LandingContainer>
    </section>
  );
}
