"use client";

import { LandingContainer } from "./LandingContainer";
import { GlassCard } from "./GlassCard";
import { FolderKanban, Image, Layers } from "lucide-react";

const solutions = [
  {
    icon: FolderKanban,
    title: "Projects",
    description: "One space per client. Brief, deadlines, and history in one place.",
  },
  {
    icon: Image,
    title: "Assets",
    description: "References, backgrounds, and files organized by project.",
  },
  {
    icon: Layers,
    title: "Versions",
    description: "V1, V2, V3 — clear history and approval in one click.",
  },
];

export function Solution() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            One place for your entire thumbnail workflow
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
            From brief to final approval, everything lives in Pixelstack.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map(({ icon: Icon, title, description }) => (
            <GlassCard key={title} className="p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366F1]/20 text-[#6366F1]">
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
