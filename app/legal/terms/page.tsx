export const metadata = {
  title: "Conditions d'utilisation — Pixelstack",
  description: "Conditions d'utilisation du service Pixelstack",
};

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-[#E5E7EB] sm:text-3xl">
        Conditions d&apos;utilisation
      </h1>
      <p className="text-sm text-[#9CA3AF]">Dernière mise à jour : mars 2025</p>

      <section className="mt-8 space-y-4 text-[#D1D5DB]">
        <h2 className="text-lg font-semibold text-[#E5E7EB]">1. Description du service</h2>
        <p>
          Pixelstack est une plateforme SaaS permettant aux graphistes et aux créateurs YouTube de collaborer
          sur des projets de miniatures (thumbnails). Le service inclut la gestion de projets, le dépôt
          d&apos;assets et de versions, les commentaires et le suivi du stockage selon l&apos;abonnement choisi.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">2. Responsabilités des utilisateurs</h2>
        <p>
          Vous vous engagez à fournir des informations exactes lors de l&apos;inscription, à maintenir la
          confidentialité de votre compte et à utiliser le service conformément aux lois en vigueur.
          Vous êtes responsable du contenu que vous uploadez et des échanges au sein des projets.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">3. Politique de stockage</h2>
        <p>
          Le stockage est limité selon le plan souscrit (Gratuit : 25 Mo, Pro : 2 Go, Studio : 10 Go).
          Les fichiers déposés (assets, versions, références, pièces jointes du chat) comptent dans ce quota.
          En cas de dépassement, les uploads peuvent être refusés jusqu&apos;à passage à un plan supérieur
          ou libération d&apos;espace.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">4. Paiement et facturation</h2>
        <p>
          Les plans payants (Pro, Studio) sont facturés via Stripe. Les prix et modalités de facturation
          sont indiqués sur la page Tarifs et dans le portail client Stripe. En souscrivant, vous acceptez
          les conditions de paiement de Stripe et les renouvellements automatiques sauf annulation.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">5. Annulation et résiliation</h2>
        <p>
          Vous pouvez annuler votre abonnement payant à tout moment depuis le portail de facturation Stripe.
          La résiliation prend effet en fin de période déjà payée. Après résiliation, votre plan repasse
          au plan Gratuit (25 Mo). Les données restent accessibles tant que votre compte est actif ;
          nous nous réservons le droit de supprimer les données des comptes inactifs selon notre politique
          de rétention.
        </p>

        <h2 className="text-lg font-semibold text-[#E5E7EB]">6. Contact</h2>
        <p>
          Pour toute question relative aux conditions d&apos;utilisation :{" "}
          <a
            href="mailto:blend.psd@gmail.com"
            className="text-[#6366F1] hover:underline"
          >
            blend.psd@gmail.com
          </a>
        </p>
      </section>
    </article>
  );
}
