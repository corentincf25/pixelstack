import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * POST /api/stripe/customer-portal
 *
 * Crée une session Stripe Customer Portal pour que l'utilisateur puisse gérer
 * son abonnement (changer de plan, annuler, mettre à jour le moyen de paiement).
 * Redirige vers le portail Stripe.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Aucun abonnement associé. Passez à un plan payant pour gérer votre facturation." },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const returnUrl = `${baseUrl}/dashboard/billing`;

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();

  try {
    const stripe = new Stripe(secretKey);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    if (!portalSession.url) {
      return NextResponse.json({ error: "Impossible de créer la session portail" }, { status: 500 });
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isNoSuchCustomer =
      message.includes("No such customer") || (err as { code?: string }).code === "resource_missing";
    if (isNoSuchCustomer && admin) {
      await admin
        .from("profiles")
        .update({ stripe_customer_id: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      console.warn("[Stripe customer-portal] Invalid customer ID cleared (test/live mismatch)");
      return NextResponse.json(
        {
          error:
            "L’ancien client de facturation n’existe plus (changement test/production). Cliquez sur « Souscrire » ou « Passer au Pro/Studio » ci-dessous pour recréer votre abonnement.",
        },
        { status: 400 }
      );
    }
    console.error("[Stripe customer-portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
