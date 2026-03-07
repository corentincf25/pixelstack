"use client";

import { ScrollReveal } from "./ScrollReveal";
import { MessageSquare, ImageIcon } from "lucide-react";

/**
 * Mini mockup : aperçu d’un projet avec versions et commentaires (visuel pédagogique).
 */
export function ProjectPreview() {
  return (
    <ScrollReveal delay={380} direction="up">
      <div className="mx-auto max-w-2xl rounded-xl border border-white/[0.08] bg-[#0f172a]/80 p-4 shadow-lg">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
          Aperçu d’un projet — versions & commentaires
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Fausses miniatures versions */}
          {["V1", "V2", "V3"].map((v, i) => (
            <div
              key={v}
              className="flex h-20 w-28 flex-col items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] text-[#9CA3AF]"
            >
              <ImageIcon className="h-6 w-6 opacity-60" />
              <span className="mt-1 text-xs font-medium">{v}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-2 text-xs text-[#A5B4FC]">
            <MessageSquare className="h-3.5 w-3.5" />
            Commentaires
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
