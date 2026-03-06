import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe :
 * - checkout.session.completed : met à jour profile (stripe_customer_id, plan, storage_limit_bytes)
 * - customer.subscription.updated / created : met à jour plan et storage_limit_bytes
 * - customer.subscription.deleted : repasse le profil en plan free (25 Mo)
 *
 * Variables d'environnement : STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY
 * Mapping plan → stockage : free = 25 Mo, pro = 10 Go, studio = 50 Go
 */

const PLAN_TO_BYTES: Record<string, number> = {
  free: 25 * 1024 * 1024,
  pro: 10 * 1024 * 1024 * 1024,
  studio: 50 * 1024 * 1024 * 1024,
};

function getStorageLimitForPlan(plan: string): number {
  return PLAN_TO_BYTES[plan] ?? PLAN_TO_BYTES.free;
}

function getPlanFromSubscription(subscription: {
  metadata?: { plan?: string };
}): string {
  const fromMeta = subscription.metadata?.plan;
  if (fromMeta && (fromMeta === "free" || fromMeta === "pro" || fromMeta === "studio")) {
    return fromMeta;
  }
  return "free";
}

async function updateProfileByCustomerId(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  customerId: string,
  plan: string
) {
  const storageLimitBytes = getStorageLimitForPlan(plan);
  const { error } = await admin
    .from("profiles")
    .update({
      plan,
      storage_limit_bytes: storageLimitBytes,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
  return error;
}

async function updateProfileByUserId(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string,
  plan: string,
  customerId: string
) {
  const storageLimitBytes = getStorageLimitForPlan(plan);
  const { error } = await admin
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      plan,
      storage_limit_bytes: storageLimitBytes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  return error;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe webhook] STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  let payload: string;
  let event: { type: string; data?: { object?: unknown } };

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("[Stripe webhook] Header stripe-signature manquant");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  try {
    payload = await request.text();
    const stripe = await import("stripe").then((m) => new m.default(process.env.STRIPE_SECRET_KEY ?? ""));
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret) as typeof event;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isSignature = message.toLowerCase().includes("signature") || (err as { type?: string })?.type === "StripeSignatureVerificationError";
    console.error("[Stripe webhook] Échec vérification:", isSignature ? "signature invalide (vérifier STRIPE_WEBHOOK_SECRET)" : message);
    return NextResponse.json({ error: "Invalid signature or payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[Stripe webhook] ALERT: Supabase admin indisponible — réconciliation manuelle requise. event_id=", (event as { id?: string }).id);
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const logFailure = (context: string, detail: Record<string, unknown>, err: unknown) => {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Stripe webhook] ALERT: Échec mise à jour profil — réconciliation manuelle possible.", {
      context,
      event_type: event.type,
      event_id: (event as { id?: string }).id,
      ...detail,
      error: errMsg,
    });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data?.object as {
        customer?: string;
        subscription?: string;
        metadata?: { plan?: string; user_id?: string; supabase_user_id?: string };
        client_reference_id?: string;
      };
      const rawCustomer = session?.customer;
      const customerId = typeof rawCustomer === "string" ? rawCustomer : (rawCustomer as unknown as { id?: string } | undefined)?.id;
      const plan = session?.metadata?.plan && ["pro", "studio"].includes(session.metadata.plan) ? session.metadata.plan : "free";
      const userId =
        session?.metadata?.user_id ||
        session?.metadata?.supabase_user_id ||
        (typeof session?.client_reference_id === "string" ? session.client_reference_id : undefined);

      if (customerId && userId) {
        const err = await updateProfileByUserId(admin, userId, plan, customerId);
        if (err) {
          logFailure("checkout.session.completed", { customerId, userId, plan }, err);
          return NextResponse.json({ error: "Update failed" }, { status: 500 });
        }
        console.info("[Stripe webhook] checkout.session.completed OK", { userId, plan, customerId });
      } else {
        console.error("[Stripe webhook] checkout.session.completed: customerId ou userId manquant", {
          customerId: !!customerId,
          userId: !!userId,
          metadata: session?.metadata,
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data?.object as {
        customer?: string | { id?: string };
        metadata?: { plan?: string };
      };
      if (!subscription) break;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : (subscription.customer as { id?: string })?.id;
      if (!customerId) break;

      const plan = getPlanFromSubscription(subscription);
      const err = await updateProfileByCustomerId(admin, customerId, plan);
      if (err) {
        logFailure("subscription.updated", { customerId, plan }, err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
      console.info("[Stripe webhook] subscription.updated/created OK", { customerId, plan });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data?.object as { customer?: string | { id?: string } };
      if (!subscription) break;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : (subscription.customer as { id?: string })?.id;
      if (!customerId) break;

      const err = await updateProfileByCustomerId(admin, customerId, "free");
      if (err) {
        logFailure("subscription.deleted", { customerId }, err);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }
      console.info("[Stripe webhook] subscription.deleted OK", { customerId });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
