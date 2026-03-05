"use client";

import { LandingContainer } from "./LandingContainer";
import { FeatureCard } from "./FeatureCard";
import {
  LayoutDashboard,
  FolderOpen,
  History,
  MessageSquare,
} from "lucide-react";

const features = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Project dashboard",
    description: "Overview of all projects, status, and deadlines in one view.",
  },
  {
    icon: <FolderOpen className="h-5 w-5" />,
    title: "Asset library",
    description: "References and files organized by project, easy to find.",
  },
  {
    icon: <History className="h-5 w-5" />,
    title: "Version history",
    description: "V1, V2, V3 — full history with comments and approval.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Client feedback",
    description: "Structured feedback and chat so nothing gets lost.",
  },
];

export function Features() {
  return (
    <section className="py-20 sm:py-28">
      <LandingContainer>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
            Built for thumbnail workflows from start to finish.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </LandingContainer>
    </section>
  );
}
