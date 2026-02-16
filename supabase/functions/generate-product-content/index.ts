import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { section, productName, productDescription, productType } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: setting } = await sb
      .from("platform_settings")
      .select("value")
      .eq("key", "openai_api_key")
      .single();

    const openaiKey = setting?.value;
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured. Configure in Settings." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (section) {
      case "description":
        systemPrompt = "You are a marketing copywriter for SaaS/tech products targeting ISP companies in Latin America. Write in Spanish.";
        userPrompt = `Write a compelling product description (2-3 paragraphs) for: "${productName}". Type: ${productType}. ${productDescription ? `Current description: ${productDescription}` : ""}`;
        break;
      case "features":
        systemPrompt = "You are a product manager. Return ONLY a JSON array of strings, each being a feature name. No explanation, no markdown, just the JSON array. Write feature names in Spanish.";
        userPrompt = `List 8-12 key features for a ${productType} product called "${productName}". ${productDescription ? `Description: ${productDescription}` : ""} Return as JSON array of strings like ["Feature 1", "Feature 2"].`;
        break;
      case "trial_days":
        systemPrompt = "You are a SaaS pricing strategist. Return ONLY a JSON object with trial_days (number) and recurring_type (string: monthly/quarterly/semi_annual/annual). No explanation.";
        userPrompt = `Suggest optimal trial period and billing cycle for a ${productType} product called "${productName}". ${productDescription ? `Description: ${productDescription}` : ""} Return JSON: {"trial_days": N, "recurring_type": "monthly|quarterly|semi_annual|annual"}`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid section" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("OpenAI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ content, section }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-product-content error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
