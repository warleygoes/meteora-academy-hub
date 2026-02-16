import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { section, productName, salesPageData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { data: setting } = await sb.from("platform_settings").select("value").eq("key", "openai_api_key").single();
    const openaiKey = setting?.value;
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured. Configure in Settings." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = `Product: "${productName}". Target: ISP owners in Latin America. Write in Spanish.`;
    let systemPrompt = "You are an expert high-conversion sales copywriter for tech/SaaS products targeting ISP companies in Latin America. Write in Spanish. Return ONLY valid JSON.";
    let userPrompt = "";

    switch (section) {
      case "hero":
        userPrompt = `${context}\nGenerate hero section content. Return JSON: {"hero_headline":"...", "hero_subheadline":"...", "hero_context_line":"...", "hero_cta_text":"...", "hero_badge_text":"...", "hero_social_proof_micro":"..."}`;
        break;
      case "before_after":
        userPrompt = `${context}\nGenerate before/after comparison. Return JSON: {"problem_title":"...", "transformation_title":"...", "before_points":["..."], "after_points":["..."]}. Include 6-8 points each.`;
        break;
      case "problem":
        userPrompt = `${context}\nGenerate the "real problem" section explaining why ISPs struggle. Return JSON: {"problem_explanation_title":"...", "problem_explanation_text":"...", "problem_bullet_points":["..."]}. 4-6 bullet points.`;
        break;
      case "deliverables":
        userPrompt = `${context}\nGenerate program deliverables. Return JSON: {"program_name":"...", "program_format":"...", "program_duration":"...", "modules":[{"name":"...", "description":"...", "benefit":"..."}], "core_benefits":["..."]}. 4-8 modules, 6-8 benefits.`;
        break;
      case "objections":
        userPrompt = `${context}\nGenerate FAQ/objection handling for sales page. Return JSON: {"objections":[{"question":"...", "answer":"..."}]}. 5-7 objections.`;
        break;
      case "anchoring":
        userPrompt = `${context}\nGenerate value anchoring items. Return JSON: {"anchor_items":[{"title":"...", "value":"U$ ..."}], "anchor_total_value":"U$ ...", "anchor_comparison_text":"..."}. 4-6 items.`;
        break;
      case "bonuses":
        userPrompt = `${context}\nGenerate bonus offers. Return JSON: {"bonuses":[{"name":"...", "description":"...", "value":"U$ ...", "image":""}]}. 3-5 bonuses.`;
        break;
      case "guarantee":
        userPrompt = `${context}\nGenerate guarantee section. Return JSON: {"guarantee_title":"...", "guarantee_description":"...", "guarantee_days":30, "guarantee_type":"refund"}`;
        break;
      case "urgency":
        userPrompt = `${context}\nGenerate urgency section. Return JSON: {"urgency_type":"spots", "urgency_text":"..."}`;
        break;
      case "final_cta":
        userPrompt = `${context}\nGenerate final CTA section. Return JSON: {"final_cta_title":"...", "final_cta_text":"...", "final_cta_button_text":"..."}`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid section" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
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
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    let content;
    try { content = JSON.parse(raw); } catch { content = {}; }

    return new Response(JSON.stringify({ content, section }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sales-page-content error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
