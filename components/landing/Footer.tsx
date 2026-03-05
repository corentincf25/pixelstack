"use client";

import Link from "next/link";
import { LandingContainer } from "./LandingContainer";

const footerLinks = [
  { label: "Product", href: "#hero" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#" },
  { label: "Contact", href: "mailto:hello@pixelstack.com" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12 sm:py-16">
      <LandingContainer>
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
          <div className="flex items-center gap-2 text-[#E5E7EB]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#3B82F6] text-sm font-bold text-white">
              P
            </span>
            <span className="font-semibold tracking-tight">Pixelstack</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {footerLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-[#9CA3AF] transition-colors hover:text-[#E5E7EB]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-[#6B7280] sm:text-left">
          © {new Date().getFullYear()} Pixelstack. All rights reserved.
        </p>
      </LandingContainer>
    </footer>
  );
}
