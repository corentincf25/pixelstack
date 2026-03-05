"use client";

import { LandingContainer } from "./LandingContainer";
import { GlassCard } from "./GlassCard";
import { Plus, UserPlus, Upload, MessageSquare } from "lucide-react";

const steps = [
  { icon: Plus, title: "Create a project", step: 1 },
  { icon: UserPlus, title: "Invite your client", step: 2 },
  { icon: Upload, title: "Upload versions", step: 3 },
  { icon: MessageSquare, title: "Collect feedback", step: 4 },
];

export function Workflow() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Simple workflow
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#9CA3AF]">
            Four steps from kickoff to approved thumbnail.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, step }) => (
            <GlassCard key={step} className="relative overflow-hidden p-6">
              <span className="absolute right-4 top-4 text-3xl font-bold text-white/[0.06]">
                {step}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3B82F6]/20 text-[#3B82F6]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#E5E7EB]">
                {title}
              </h3>
            </GlassCard>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
