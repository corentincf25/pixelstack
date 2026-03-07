import { NextResponse } from "next/server";

/**
 * GET /api/stripe/check-mode
 * Indique si l’app utilise la clé Stripe Live ou Test (sans exposer la clé).
 * Utile pour vérifier que la prod utilise bien sk_live_ après configuration Vercel.
 */
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ mode: null, message: "STRIPE_SECRET_KEY non définie" });
  }
  const isLive = key.startsWith("sk_live_");
  return NextResponse.json({
    mode: isLive ? "live" : "test",
    message: isLive
      ? "Clé Live : la page Stripe Checkout n’affichera pas « Environment test »."
      : "Clé Test : la page Stripe affichera « Environment test ». Pour la faire disparaître, définis STRIPE_SECRET_KEY=sk_live_... sur Vercel (Production) et redéploie.",
  });
}
