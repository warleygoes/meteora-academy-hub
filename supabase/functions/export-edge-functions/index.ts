import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Edge function source code embedded at deploy time
// Each function's index.ts content is read from the repo
const FUNCTION_SOURCES: Record<string, string> = {};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List of all edge functions in this project with their source code
    // We'll return them so the client can build a ZIP
    const functions = [
      {
        name: "automation-api",
        config: { verify_jwt: false },
      },
      {
        name: "check-subscription",
        config: { verify_jwt: true },
      },
      {
        name: "create-checkout",
        config: { verify_jwt: true },
      },
      {
        name: "customer-portal",
        config: { verify_jwt: true },
      },
      {
        name: "dispatch-webhook",
        config: { verify_jwt: false },
      },
      {
        name: "export-storage",
        config: { verify_jwt: true },
      },
      {
        name: "export-users",
        config: { verify_jwt: true },
      },
      {
        name: "export-edge-functions",
        config: { verify_jwt: true },
      },
      {
        name: "generate-product-content",
        config: { verify_jwt: false },
      },
      {
        name: "generate-sales-page-content",
        config: { verify_jwt: false },
      },
      {
        name: "import-users",
        config: { verify_jwt: false },
      },
      {
        name: "migrate-users",
        config: { verify_jwt: false },
      },
      {
        name: "notify-new-registration",
        config: { verify_jwt: false },
      },
      {
        name: "pg-dump-export",
        config: { verify_jwt: true },
      },
      {
        name: "reset-user-password",
        config: { verify_jwt: false },
      },
      {
        name: "translate-category",
        config: { verify_jwt: false },
      },
    ];

    // For each function, try to read its source from the filesystem
    const results = [];
    for (const fn of functions) {
      let source = "";
      try {
        // In Deno Deploy / edge runtime, the function code is at the current working directory
        // But we can't read other functions' code from one function.
        // Instead, we'll signal the client to fetch from the GitHub repo or provide a download mechanism.
        source = `// Source for ${fn.name} - download from your project repository at:\n// supabase/functions/${fn.name}/index.ts\n`;
      } catch {
        source = `// Could not read source for ${fn.name}`;
      }
      results.push({ ...fn, source });
    }

    // Generate config.toml content
    let configToml = `# Supabase Edge Functions Configuration\n# Place this file at supabase/config.toml in your self-hosted project\n\n`;
    for (const fn of functions) {
      if (!fn.config.verify_jwt) {
        configToml += `[functions.${fn.name}]\nverify_jwt = false\n\n`;
      }
    }

    return new Response(
      JSON.stringify({ functions: results, config_toml: configToml }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
