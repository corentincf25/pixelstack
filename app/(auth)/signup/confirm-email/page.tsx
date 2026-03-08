"use client";

import Link from "next/link";
import Image from "next/image";

export default function ConfirmEmailPage() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#111]/90 p-8 shadow-xl backdrop-blur-sm text-center">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-[#E5E7EB]">Pixelstack</span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-[#E5E7EB]">
          Vérifie ta boîte mail
        </h1>
        <p className="text-sm text-[#9CA3AF]">
          Un email de confirmation t'a été envoyé. Clique sur le lien dans le
          message pour activer ton compte, puis reviens ici pour te connecter et
          choisir ton rôle (Graphiste ou Client).
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl bg-[#6366F1] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#5558e3]"
        >
          Aller à la connexion
        </Link>
      </div>
    </div>
  );
}
