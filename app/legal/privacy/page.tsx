export const metadata = {
  title: "Politique de confidentialité — Pixelstack",
  description: "Politique de confidentialité du service Pixelstack",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-[#E5E7EB] sm:text-3xl">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-[#9CA3AF]">Dernière mise à jour : mars 2025</p>

      <section className="mt-8 space-y-4 text-[#D1D5DB]">
        <h2 className="text-lg font-semibold text-[#E5E7EB]">1. Données collectées</h2>
        <p>
          Pixelstack collecte les données nécessaires au fonctionnement du service : identifiant de compte,
          adresse email, nom d&apos;affichage, photo de profil (optionnelle), rôle (graphiste / youtuber),
          et les contenus que vous uploadez dans le cadre des projets (fichiers, messages, commentaires).
          Les données de paiement sont gérées par Stripe et ne sont pas stockées sur nos serveurs.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">2. Finalité et base légale</h2>
        <p>
          Les données sont utilisées pour fournir le service (création de compte, gestion des projets,
          stockage, facturation), vous envoyer des notifications par email (nouveaux messages, versions,
          etc.) et respecter nos obligations légales. Le traitement repose sur l&apos;exécution du contrat
          et votre consentement lorsque la loi l&apos;exige.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">3. Protection des données</h2>
        <p>
          Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données
          (authentification, accès par projet, stockage sécurisé). Les données sont hébergées dans
          l&apos;Union européenne via nos prestataires (Supabase, Vercel, Stripe) conformes au RGPD.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">4. Partage des données</h2>
        <p>
          Vos données ne sont pas vendues. Elles sont partagées uniquement avec les autres membres des
          projets auxquels vous participez (client, graphiste, relecteurs). Nos sous-traitants (hébergement,
          paiement, envoi d&apos;emails) ont accès aux données strictement nécessaires à leur mission.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">5. Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité
          de vos données, ainsi que du droit de limiter le traitement et de vous opposer à celui-ci.
          Pour exercer ces droits ou pour toute question :{" "}
          <a
            href="mailto:contact@pixelstack.app"
            className="text-[#6366F1] hover:underline"
          >
            contact@pixelstack.app
          </a>
          . Vous pouvez également introduire une réclamation auprès de la CNIL.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">6. Conservation</h2>
        <p>
          Les données sont conservées tant que votre compte est actif. Après suppression du compte ou
          résiliation, les données peuvent être conservées pendant la durée nécessaire à nos obligations
          légales puis supprimées ou anonymisées.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">7. Contact</h2>
        <p>
          Pour toute question relative à la confidentialité :{" "}
          <a
            href="mailto:contact@pixelstack.app"
            className="text-[#6366F1] hover:underline"
          >
            contact@pixelstack.app
          </a>
        </p>
      </section>
    </article>
  );
}
