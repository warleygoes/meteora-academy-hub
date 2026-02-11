import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the user via getUser instead of getClaims
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = userData.user.email;

    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL is not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, displayName, companyName, country, roleType, phone, clientCount, networkType, cheapestPlan, mainProblems, mainDesires } = body;

    // Validate that the request email matches the authenticated user
    if (email && email !== userEmail) {
      return new Response(JSON.stringify({ error: "Email mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build query params for GET webhook
    const params = new URLSearchParams({
      event: "new_registration",
      email: userEmail || "",
      display_name: displayName || "",
      company_name: companyName || "",
      country: country || "",
      role_type: roleType || "",
      phone: phone || "",
      client_count: clientCount || "",
      network_type: networkType || "",
      cheapest_plan_usd: cheapestPlan || "",
      main_problems: mainProblems || "",
      main_desires: mainDesires || "",
      timestamp: new Date().toISOString(),
    });

    const webhookUrl = `${N8N_WEBHOOK_URL}?${params.toString()}`;
    console.log("Calling n8n webhook:", webhookUrl);

    const response = await fetch(webhookUrl, { method: "GET" });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`n8n webhook failed [${response.status}]: ${text}`);
    }

    await response.text();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error calling n8n webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
