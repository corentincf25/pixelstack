"use client";

import { LandingContainer } from "./LandingContainer";
import { GlassCard } from "./GlassCard";
import { Palette, Video, Check } from "lucide-react";

const designers = [
  "Manage all your clients",
  "Track versions",
  "Organize assets",
];

const youtubers = [
  "Upload references",
  "Give feedback",
  "Approve thumbnails",
];

export function DesignersVsYouTubers() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            For designers and their clients
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
            One tool, two perspectives — built for how you actually work.
          </p>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <GlassCard className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6366F1]/20 text-[#6366F1]">
                <Palette className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-[#E5E7EB]">Designers</h3>
            </div>
            <ul className="mt-6 space-y-3">
              {designers.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[#9CA3AF]"
                >
                  <Check className="h-4 w-4 shrink-0 text-[#6366F1]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute right-4 top-4">
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                Clients use Pixelstack for free
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-[#E5E7EB]">
                Clients
              </h3>
            </div>
            <ul className="mt-6 space-y-3">
              {youtubers.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[#9CA3AF]"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </LandingContainer>
    </section>
  );
}
