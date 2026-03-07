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
  const admin = (await import("@/lib/supabase/admin")).createAdminClient();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  async function createSession(customerId: string) {
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
      success_url: `${baseUrl}/billing/success?plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { plan, user_id: user.id },
      },
    });
    return session;
  }

  let customerId: string | undefined;
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_customer_id) {
    customerId = profile.stripe_customer_id as string;
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: (await supabase.from("profiles").select("full_name").eq("id", user.id).single()).data?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    if (admin) {
      await admin
        .from("profiles")
        .update({
          stripe_customer_id: customer.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  }

  if (!customerId) {
    return NextResponse.json({ error: "Impossible de créer ou récupérer le client Stripe" }, { status: 500 });
  }

  try {
    const session = await createSession(customerId);
    if (!session.url) {
      return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isNoSuchCustomer =
      message.includes("No such customer") || (err as { code?: string }).code === "resource_missing";
    if (isNoSuchCustomer && profile?.stripe_customer_id && admin) {
      await admin
        .from("profiles")
        .update({ stripe_customer_id: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: (await supabase.from("profiles").select("full_name").eq("id", user.id).single()).data?.full_name ?? undefined,
          metadata: { supabase_user_id: user.id },
        });
        if (admin) {
          await admin
            .from("profiles")
            .update({
              stripe_customer_id: customer.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        }
        const session = await createSession(customer.id);
        if (session?.url) {
          return NextResponse.json({ url: session.url });
        }
      } catch (retryErr) {
        console.error("[Stripe create-checkout-session] retry after No such customer failed", retryErr);
      }
    }
    console.error("[Stripe create-checkout-session]", message);
    return NextResponse.json(
      { error: isNoSuchCustomer ? "Ancien client Stripe invalide (test/live). Réessaie : un nouveau client sera créé." : message },
      { status: 500 }
    );
  }
}
