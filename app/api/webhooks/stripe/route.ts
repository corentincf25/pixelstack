import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook Stripe : customer.subscription.created | updated | deleted
 * Met à jour profiles.plan et profiles.storage_limit_bytes selon le plan.
 *
 * Prérequis : npm install stripe
 * Variables d'environnement :
 *   STRIPE_WEBHOOK_SECRET — secret du webhook (whsec_...)
 *   STRIPE_SECRET_KEY    — clé secrète Stripe (sk_...) pour instancier le client
 *
 * L'app doit renseigner profiles.stripe_customer_id quand un client Stripe est créé
 * (lors du checkout ou de la création du client Stripe côté serveur).
 *
 * Mapping plan → stockage : free = 100 Mo, pro = 10 GB, studio = 50 GB
 */

const PLAN_TO_BYTES: Record<string, number> = {
  free: 100 * 1024 * 1024,
  pro: 10 * 1024 * 1024 * 1024,
  studio: 50 * 1024 * 1024 * 1024,
};

function getStorageLimitForPlan(plan: string): number {
  return PLAN_TO_BYTES[plan] ?? PLAN_TO_BYTES.free;
}

/**
 * Récupère le plan depuis la souscription Stripe.
 * Option 1 : subscription.metadata.plan (recommandé)
 * Option 2 : mapper price.id ou product.id vers free | pro | studio
 */
function getPlanFromSubscription(subscription: {
  metadata?: { plan?: string };
  items?: unknown;
}): string {
  const fromMeta = subscription.metadata?.plan;
  if (fromMeta && (fromMeta === "free" || fromMeta === "pro" || fromMeta === "studio")) {
    return fromMeta;
  }
  // Option 2 : mapper les price_id Stripe (à adapter selon tes Price IDs)
  // const priceId = subscription.items?.data?.[0]?.price?.id;
  // if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  // if (priceId === process.env.STRIPE_PRICE_STUDIO) return 'studio';
  return "free";
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  let payload: string;
  let event: { type: string; data?: { object?: { customer?: string; metadata?: { plan?: string }; items?: unknown } } };

  try {
    payload = await request.text();
    // Vérification de la signature Stripe (nécessite le SDK stripe)
    // npm install stripe
    const stripe = await import("stripe").then((m) => new m.default(process.env.STRIPE_SECRET_KEY ?? ""));
    event = stripe.webhooks.constructEvent(payload, request.headers.get("stripe-signature") ?? "", webhookSecret) as typeof event;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe webhook] Signature ou parsing invalide:", message);
    return NextResponse.json({ error: "Invalid signature or payload" }, { status: 400 });
  }

  const subscription = event.data?.object;
  if (!subscription || typeof subscription !== "object") {
    return NextResponse.json({ received: true });
  }

  const rawCustomer = subscription.customer;
  const customerId =
    typeof rawCustomer === "string"
      ? rawCustomer
      : (rawCustomer as unknown as { id?: string } | undefined)?.id;
  if (!customerId) {
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[Stripe webhook] Supabase admin indisponible");
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const plan = getPlanFromSubscription(subscription);
      const storageLimitBytes = getStorageLimitForPlan(plan);
      const { error } = await admin
        .from("profiles")
        .update({ plan, storage_limit_bytes: storageLimitBytes, updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);
      if (error) {
        console.error("[Stripe webhook] Update profile failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const { error } = await admin
        .from("profiles")
        .update({
          plan: "free",
          storage_limit_bytes: getStorageLimitForPlan("free"),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);
      if (error) {
        console.error("[Stripe webhook] Update profile (deleted) failed:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
