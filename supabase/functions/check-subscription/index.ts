import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false, packages: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Collect active Stripe price IDs
    const activePriceIds: string[] = [];

    // From active subscriptions
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 });
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        activePriceIds.push(item.price.id);
      }
    }

    // From completed one-time payments
    const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 50 });
    for (const session of sessions.data) {
      if (session.payment_status === "paid" && session.mode === "payment") {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        for (const item of lineItems.data) {
          if (item.price?.id) activePriceIds.push(item.price.id);
        }
      }
    }

    logStep("Active price IDs", { activePriceIds });

    // Match with offers
    const { data: matchingOffers } = await supabaseClient
      .from("offers")
      .select("id, name, stripe_price_id, package_id, product_id")
      .in("stripe_price_id", activePriceIds.length > 0 ? activePriceIds : ["none"]);

    // Get package IDs from matching offers
    const packageIds = [...new Set((matchingOffers || []).filter(o => o.package_id).map(o => o.package_id!))];

    // Sync to user_plans for packages
    for (const packageId of packageIds) {
      const { data: existingUp } = await supabaseClient
        .from("user_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("package_id", packageId)
        .eq("status", "active")
        .maybeSingle();

      if (!existingUp) {
        await supabaseClient.from("user_plans").insert({
          user_id: user.id,
          package_id: packageId,
          status: "active",
        });
        logStep("Created user_plan", { packageId });
      }
    }

    // Get package names
    const { data: packageNames } = await supabaseClient
      .from("packages")
      .select("id, name")
      .in("id", packageIds.length > 0 ? packageIds : ["none"]);

    return new Response(JSON.stringify({
      subscribed: (matchingOffers || []).length > 0,
      packages: (packageNames || []).map(p => ({ id: p.id, name: p.name })),
      active_offer_ids: (matchingOffers || []).map(o => o.id),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
