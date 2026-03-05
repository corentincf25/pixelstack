import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { Solution } from "@/components/landing/Solution";
import { Workflow } from "@/components/landing/Workflow";
import { DesignersVsYouTubers } from "@/components/landing/DesignersVsYouTubers";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

/**
 * Landing page marketing — direction artistique Pixelstack :
 * dark UI, glassmorphism, #0b0f1a / #0f172a / #1a1f36, accents #6366F1 / #3B82F6
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Fond dégradé landing (charte Pixelstack marketing) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, #0b0f1a 0%, #0f172a 45%, #1a1f36 100%)",
        }}
      />
      <div className="relative z-10">
        <LandingNav />
        <main>
          <Hero />
          <Problem />
          <Solution />
          <Workflow />
          <DesignersVsYouTubers />
          <Features />
          <Pricing />
          <CTA />
          <Footer />
        </main>
      </div>
    </div>
  );
}
