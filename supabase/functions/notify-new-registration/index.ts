import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://meteoraacademy.lovable.app",
  "https://id-preview--ac0966f3-2002-481d-a0ce-6416e5364f4e.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const MAX_FIELD_LENGTH = 500;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory rate limiting per user (max 3 calls per hour)
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

function sanitize(value: unknown, maxLen = MAX_FIELD_LENGTH): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit per authenticated user
    const userId = (data.claims as Record<string, unknown>).sub as string;
    if (!checkRateLimit(userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL");
    if (!N8N_WEBHOOK_URL) {
      console.error("N8N_WEBHOOK_URL is not configured");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    const email = sanitize(body.email, 255);
    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      event: "new_registration",
      email,
      display_name: sanitize(body.displayName),
      company_name: sanitize(body.companyName),
      country: sanitize(body.country, 100),
      role_type: sanitize(body.roleType, 100),
      phone: sanitize(body.phone, 30),
      client_count: sanitize(body.clientCount, 50),
      network_type: sanitize(body.networkType, 100),
      cheapest_plan_usd: sanitize(String(body.cheapestPlan ?? ""), 20),
      main_problems: sanitize(body.mainProblems, 1000),
      main_desires: sanitize(body.mainDesires, 1000),
      timestamp: new Date().toISOString(),
    };

    console.log("Calling n8n webhook (POST) for:", email);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n webhook failed [${response.status}]`);
      return new Response(JSON.stringify({ success: false }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await response.text();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in notify-new-registration:", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
