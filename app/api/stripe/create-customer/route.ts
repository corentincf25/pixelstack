import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * POST /api/stripe/create-customer
 *
 * Crée un client Stripe pour l'utilisateur connecté (s'il n'en a pas encore)
 * et enregistre stripe_customer_id dans profiles.
 *
 * À appeler avant de rediriger vers Stripe Checkout (page abonnement, bouton "Passer au plan Pro", etc.).
 * Variables d'environnement : STRIPE_SECRET_KEY
 */
export async function POST() {
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

  const stripe = new Stripe(secretKey);

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_customer_id) {
    return NextResponse.json({ customerId: profile.stripe_customer_id });
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: (await supabase.from("profiles").select("full_name").eq("id", user.id).single()).data?.full_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });

    const admin = (await import("@/lib/supabase/admin")).createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Impossible de mettre à jour le profil", customerId: customer.id },
        { status: 500 }
      );
    }

    const { error } = await admin
      .from("profiles")
      .update({
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("[Stripe create-customer] Update profile:", error);
      return NextResponse.json(
        { error: "Profil non mis à jour", customerId: customer.id },
        { status: 500 }
      );
    }

    return NextResponse.json({ customerId: customer.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    console.error("[Stripe create-customer]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
