import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { TrustSection } from "@/components/landing/TrustSection";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQ } from "@/components/landing/FAQ";
import { ContactSection } from "@/components/landing/ContactSection";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

/**
 * Landing page marketing — direction artistique Pixelstack :
 * navbar flottante, smooth scroll, contenu en français, placeholders d’images, animations au scroll.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(180deg, #0a0a0a 0%, #0f172a 40%, #1a1f36 100%)",
        }}
      />
      <div className="relative z-10">
        <LandingNav />
        <main>
          <Hero />
          <TrustSection />
          <Features />
          <Pricing />
          <TestimonialsSection />
          <FAQ />
          <ContactSection />
          <CTA />
          <Footer />
        </main>
      </div>
    </div>
  );
}
