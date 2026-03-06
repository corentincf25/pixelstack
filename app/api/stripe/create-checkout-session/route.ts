import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

const PRICE_KEYS: Record<string, Record<string, string>> = {
  pro: { monthly: "STRIPE_PRICE_PRO_MONTHLY", yearly: "STRIPE_PRICE_PRO_YEARLY" },
  studio: { monthly: "STRIPE_PRICE_STUDIO_MONTHLY", yearly: "STRIPE_PRICE_STUDIO_YEARLY" },
};

/**
 * POST /api/stripe/create-checkout-session
 *
 * Crée une session Stripe Checkout pour un abonnement (plan pro ou studio, mensuel ou annuel).
 * Body: { plan: "pro" | "studio", interval?: "monthly" | "yearly" } (interval défaut: "monthly")
 * Utilise STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_YEARLY, STRIPE_PRICE_STUDIO_MONTHLY, STRIPE_PRICE_STUDIO_YEARLY.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }

  let body: { plan?: string; interval?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const plan = body?.plan === "studio" ? "studio" : body?.plan === "pro" ? "pro" : null;
  if (!plan) {
    return NextResponse.json(
      { error: "Plan requis : pro ou studio" },
      { status: 400 }
    );
  }

  const interval = body?.interval === "yearly" ? "yearly" : "monthly";
  const priceKey = PRICE_KEYS[plan][interval];
  const priceId = process.env[priceKey];
  if (!priceId) {
    console.error(`[Stripe checkout] ${priceKey} non configuré`);
    return NextResponse.json(
      { error: "Tarification non configurée pour ce plan (vérifier " + priceKey + ")" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey);

  let customerId: string | undefined;
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_customer_id) {
    customerId = profile.stripe_customer_id as string;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      name: (await supabase.from("profiles").select("full_name").eq("id", user.id).single()).data?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    const admin = (await import("@/lib/supabase/admin")).createAdminClient();
    if (admin) {
      await admin
        .from("profiles")
        .update({
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
    customerId = customer.id;
  }

  if (!customerId) {
    return NextResponse.json({ error: "Impossible de créer ou récupérer le client Stripe" }, { status: 500 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        plan,
        supabase_user_id: user.id,
      },
      client_reference_id: user.id,
      success_url: `${baseUrl}/dashboard/billing/success?plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
      subscription_data: {
        metadata: { plan, user_id: user.id },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[Stripe create-checkout-session]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
