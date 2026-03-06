import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

const PLAN_TO_BYTES: Record<string, number> = {
  free: 25 * 1024 * 1024,
  pro: 10 * 1024 * 1024 * 1024,
  studio: 50 * 1024 * 1024 * 1024,
};

/**
 * POST /api/stripe/sync-plan
 *
 * Synchronise le plan de l'utilisateur avec Stripe (abonnement actif).
 * Utilisé après retour du checkout pour garantir la mise à jour même si le webhook
 * n'a pas encore été traité ou a échoué.
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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json({ updated: false, plan: profile?.plan ?? "free" });
  }

  const stripe = new Stripe(secretKey);
  const priceToPlan: Record<string, string> = {};
  const proMonthly = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const proYearly = process.env.STRIPE_PRICE_PRO_YEARLY;
  const studioMonthly = process.env.STRIPE_PRICE_STUDIO_MONTHLY;
  const studioYearly = process.env.STRIPE_PRICE_STUDIO_YEARLY;
  if (proMonthly) priceToPlan[proMonthly] = "pro";
  if (proYearly) priceToPlan[proYearly] = "pro";
  if (studioMonthly) priceToPlan[studioMonthly] = "studio";
  if (studioYearly) priceToPlan[studioYearly] = "studio";

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 5,
    });
    const activeOrTrialing = subscriptions.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    const subscription = activeOrTrialing;
    let plan = "free";
    if (subscription?.items?.data?.[0]?.price?.id) {
      const priceId = subscription.items.data[0].price.id;
      plan = priceToPlan[priceId] ?? subscription.metadata?.plan ?? "free";
    } else if (subscription?.metadata?.plan === "pro" || subscription?.metadata?.plan === "studio") {
      plan = subscription.metadata.plan;
    }

    const storageLimitBytes = PLAN_TO_BYTES[plan] ?? PLAN_TO_BYTES.free;
    const { error } = await admin
      .from("profiles")
      .update({
        plan,
        storage_limit_bytes: storageLimitBytes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("[Stripe sync-plan] Update profile failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: true, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[Stripe sync-plan]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
