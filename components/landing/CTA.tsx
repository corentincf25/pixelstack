"use client";

import Link from "next/link";
import { LandingContainer } from "./LandingContainer";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer size="narrow">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.05] p-10 text-center backdrop-blur-xl sm:p-14">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Start organizing your thumbnail workflow
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-[#9CA3AF]">
            Join designers and YouTubers who ship thumbnails faster.
          </p>
          <Link
            href="/signup"
            className={cn(
              "mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-medium text-white transition-all",
              "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
              "shadow-[0_0_24px_rgba(99,102,241,0.4)]",
              "hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
            )}
          >
            Create account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </LandingContainer>
    </section>
  );
}
