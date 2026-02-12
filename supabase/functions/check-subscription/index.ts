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
      return new Response(JSON.stringify({ subscribed: false, plans: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    // Also check one-time payments
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 50,
    });

    const activePriceIds: string[] = [];
    
    // From subscriptions
    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        activePriceIds.push(item.price.id);
      }
    }

    // From completed one-time payments
    for (const session of sessions.data) {
      if (session.payment_status === "paid" && session.mode === "payment") {
        // Get line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        for (const item of lineItems.data) {
          if (item.price?.id) activePriceIds.push(item.price.id);
        }
      }
    }

    logStep("Active price IDs", { activePriceIds });

    // Match with our plans
    const { data: matchingPlans } = await supabaseClient
      .from("plans")
      .select("id, name, stripe_price_id, payment_type, duration_days")
      .in("stripe_price_id", activePriceIds.length > 0 ? activePriceIds : ["none"]);

    // Sync to user_plans table
    for (const plan of (matchingPlans || [])) {
      const { data: existingUp } = await supabaseClient
        .from("user_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("plan_id", plan.id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingUp) {
        const expiresAt = plan.payment_type === "one_time" && plan.duration_days
          ? new Date(Date.now() + plan.duration_days * 86400000).toISOString()
          : null;

        await supabaseClient.from("user_plans").insert({
          user_id: user.id,
          plan_id: plan.id,
          status: "active",
          expires_at: expiresAt,
        });
        logStep("Created user_plan", { planId: plan.id });
      }
    }

    return new Response(JSON.stringify({
      subscribed: (matchingPlans || []).length > 0,
      plans: (matchingPlans || []).map(p => ({ id: p.id, name: p.name })),
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
