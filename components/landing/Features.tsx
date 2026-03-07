"use client";

import { LandingContainer } from "./LandingContainer";
import { FeatureBlock } from "./FeatureBlock";

export function Features() {
  return (
    <section id="fonctionnalites" className="py-20 sm:py-28">
      <LandingContainer size="wide">
        <FeatureBlock
          tag="Piloté par les données"
          title="Des insights stratégiques pour vos projets"
          description="Briefs structurés, suivi des versions et des retours en un seul endroit. Gérez vos projets avec une visibilité en temps réel et des décisions basées sur les données."
          listItems={[
            "Suivi des projets et des échéances",
            "Historique complet des versions et commentaires",
            "Métriques et visibilité en temps réel",
          ]}
          imageSrc="/landing/dashboard.png"
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
            "Pastilles de lecture dans l'app",
            "Zones mises en avant à l'ouverture du projet",
          ]}
          imageSrc="/landing/notifications.png"
          imagePlaceholderLabel="Capture : notifications ou chat"
          imagePlaceholderDescription="Screenshot des notifications ou de la conversation projet"
          imageRight={true}
        />

        <FeatureBlock
          tag="Dépôt d'assets"
          title="Zones de dépôt dédiées par projet"
          description="Déposez images, références et inspirations dans des zones clairement identifiées. Chaque projet a son espace Assets, ses références et sa bibliothèque d'inspirations, avec aperçus et commentaires."
          listItems={[
            "Zone Assets : images et fichiers par projet",
            "Inspirations & Références : visuels et liens YouTube",
            "Aperçu et commentaires sur chaque élément",
          ]}
          imageSrc="/landing/assets.png"
          imagePlaceholderLabel="Capture : zones de dépôt (Assets, Inspirations, Références)"
          imagePlaceholderDescription="Screenshot des onglets Assets ou Inspirations & Références"
          imageRight={false}
        />

        <FeatureBlock
          tag="Conversation en temps réel"
          title="Chat intégré à chaque projet"
          description="Échangez avec le client ou le graphiste directement dans le projet. Messages et pièces jointes synchronisés en temps réel, sans quitter la page."
          listItems={[
            "Chat dédié par projet",
            "Synchronisation instantanée",
            "Pièces jointes et images dans la conversation",
          ]}
          imageSrc="/landing/chat.png"
          imagePlaceholderLabel="Capture : conversation du projet"
          imagePlaceholderDescription="Screenshot du chat dans la page projet"
          imageRight={true}
        />
      </LandingContainer>
    </section>
  );
}
