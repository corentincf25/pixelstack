"use client";

import Link from "next/link";
import { LandingContainer } from "./LandingContainer";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { ArrowRight, Play } from "lucide-react";

export function Hero() {
  return (
    <section id="hero" className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36">
      <LandingContainer className="flex flex-col items-center gap-14 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="max-w-2xl flex-shrink-0 text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-[#E5E7EB] sm:text-5xl lg:text-6xl">
            The workspace for{" "}
            <span className="bg-gradient-to-r from-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent">
              thumbnail designers
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#9CA3AF] sm:text-xl">
            Manage projects, assets and feedback with your clients in one place.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link
              href="/signup"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-medium text-white transition-all",
                "bg-gradient-to-r from-[#6366F1] to-[#3B82F6]",
                "shadow-[0_0_24px_rgba(99,102,241,0.4)]",
                "hover:shadow-[0_0_32px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
              )}
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] px-6 py-3.5 text-base font-medium text-[#E5E7EB]",
                "bg-white/[0.05] backdrop-blur-sm",
                "transition-all hover:border-white/[0.2] hover:bg-white/[0.08]"
              )}
            >
              <Play className="h-4 w-4" />
              View demo
            </a>
          </div>
        </div>
        {/* Mockup dashboard */}
        <div id="demo" className="w-full max-w-xl flex-shrink-0 lg:max-w-2xl">
          <GlassCard hover={false} className="overflow-hidden p-2 sm:p-3">
            <div className="rounded-xl bg-[#0f172a] border border-white/[0.06] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-[#6366F1]/60" />
                <div className="h-2 w-2 rounded-full bg-[#3B82F6]/40" />
                <div className="h-2 w-2 rounded-full bg-white/20" />
                <span className="ml-2 text-xs text-[#6B7280]">Dashboard</span>
              </div>
              <div className="grid grid-cols-12 gap-2 p-3 sm:p-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="col-span-4 rounded-lg border border-white/[0.06] bg-white/[0.04] p-3"
                  >
                    <div className="h-2 w-16 rounded bg-white/10" />
                    <div className="mt-2 h-8 rounded bg-white/5" />
                    <div className="mt-1 h-3 w-24 rounded bg-white/5" />
                  </div>
                ))}
                <div className="col-span-12 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 p-4">
                  <div className="h-3 w-32 rounded bg-[#6366F1]/30" />
                  <div className="mt-2 flex gap-2">
                    <div className="h-12 flex-1 rounded bg-white/5" />
                    <div className="h-12 flex-1 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </LandingContainer>
    </section>
  );
}
