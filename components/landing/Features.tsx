"use client";

import { LandingContainer } from "./LandingContainer";
import { FeatureBlock } from "./FeatureBlock";
import { ScrollReveal } from "./ScrollReveal";
import { FeatureCard } from "./FeatureCard";
import { LayoutDashboard, FolderOpen, History, MessageSquare } from "lucide-react";

const featureCards = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Dashboard projets",
    description: "Vue d’ensemble de tous vos projets, statuts et échéances en un coup d’œil.",
  },
  {
    icon: <FolderOpen className="h-5 w-5" />,
    title: "Bibliothèque d’assets",
    description: "Références et fichiers organisés par projet, faciles à retrouver.",
  },
  {
    icon: <History className="h-5 w-5" />,
    title: "Historique des versions",
    description: "V1, V2, V3 — tout l’historique avec commentaires et validation.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Retours client",
    description: "Feedback structuré et chat pour ne rien perdre en route.",
  },
];

export function Features() {
  return (
    <section id="fonctionnalites" className="py-20 sm:py-28">
      <LandingContainer size="wide">
        {/* En-tête */}
        <div className="text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#6366F1]">
              <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
              Pourquoi nous choisir
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#E5E7EB] sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#9CA3AF]">
              Conçu pour le workflow des miniatures, du brief à la validation.
            </p>
          </ScrollReveal>
        </div>

        {/* Cartes résumé */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 60}>
              <FeatureCard {...feature} />
            </ScrollReveal>
          ))}
        </div>

        <FeatureBlock
          tag="Piloté par les données"
          title="Des insights stratégiques pour vos projets"
          description="Briefs structurés, suivi des versions et des retours en un seul endroit. Gérez vos projets avec une visibilité en temps réel et des décisions basées sur les données."
          listItems={[
            "Suivi des projets et des échéances",
            "Historique complet des versions et commentaires",
            "Métriques et visibilité en temps réel",
          ]}
          imagePlaceholderLabel="Capture : page projet ou dashboard"
          imagePlaceholderDescription="Screenshot de votre interface projet (bento, versions, chat)"
          imageRight={false}
        />

        <FeatureBlock
          tag="Alertes intelligentes"
          title="Suivi des retours et des mises à jour"
          description="Restez informé avec des notifications sur les nouveaux messages, les versions déposées et les retours client. Plus rien ne vous échappe."
          listItems={[
            "Notifications par email (nouveaux messages, versions prêtes)",
            "Pastilles de lecture dans l’app",
            "Zones mises en avant à l’ouverture du projet",
          ]}
          imagePlaceholderLabel="Capture : notifications ou chat"
          imagePlaceholderDescription="Screenshot des notifications ou de la conversation projet"
          imageRight={true}
        />
      </LandingContainer>
    </section>
  );
}
