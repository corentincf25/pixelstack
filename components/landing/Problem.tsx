"use client";

import { LandingContainer } from "./LandingContainer";
import { GlassCard } from "./GlassCard";
import { MessageCircle, Layers, FileQuestion } from "lucide-react";

const problems = [
  {
    icon: MessageCircle,
    title: "Assets lost in chat",
    description: "Files buried in threads, hard to find and version.",
  },
  {
    icon: Layers,
    title: "Feedback scattered everywhere",
    description: "Comments on Discord, email, WhatsApp — no single source of truth.",
  },
  {
    icon: FileQuestion,
    title: "Versions hard to track",
    description: "V1, V2, final_final_v3… impossible to know what’s approved.",
  },
];

export function Problem() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Stop managing thumbnails in WhatsApp and Discord
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
            Scattered tools and threads slow you down and confuse clients.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map(({ icon: Icon, title, description }) => (
            <GlassCard key={title} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#E5E7EB]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9CA3AF]">
                {description}
              </p>
            </GlassCard>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
