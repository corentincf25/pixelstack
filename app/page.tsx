import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { WhyPixelstack } from "@/components/landing/WhyPixelstack";
import { ClientNoAccount } from "@/components/landing/ClientNoAccount";
import { FounderStory } from "@/components/landing/FounderStory";
import { TrustSection } from "@/components/landing/TrustSection";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
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
      {/* Fond sombre + dot grid (aligné dashboard) */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          backgroundColor: "#0B0F19",
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10">
        <LandingNav />
        <main className="overflow-x-hidden">
          <Hero />
          <HowItWorks />
          <BeforeAfter />
          <WhyPixelstack />
          <ClientNoAccount />
          <TrustSection />
          <Features />
          <FounderStory />
          <Pricing />
          <FAQ />
          <ContactSection />
          <CTA />
          <Footer />
        </main>
      </div>
    </div>
  );
}
