import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Tables in dependency order (parents before children)
const TABLES_ORDER = [
  "course_categories",
  "courses",
  "course_modules",
  "course_lessons",
  "lesson_contents",
  "products",
  "product_categories",
  "product_sales_pages",
  "packages",
  "package_product_groups",
  "package_products",
  "offers",
  "plans",
  "plan_courses",
  "plan_services",
  "plan_meetings",
  "services",
  "profiles",
  "user_roles",
  "user_plans",
  "user_products",
  "user_lesson_access",
  "course_enrollments",
  "lesson_progress",
  "lesson_ratings",
  "lesson_comments",
  "community_posts",
  "community_comments",
  "community_likes",
  "diagnostics",
  "diagnostic_questions",
  "diagnostic_answers",
  "diagnostic_lead_tracking",
  "diagnostic_recommendation_rules",
  "banners",
  "menu_links",
  "menu_link_products",
  "menu_link_packages",
  "network_topologies",
  "platform_settings",
  "system_logs",
  "testimonials",
  "webhook_endpoints",
  "webhook_event_types",
];

function escapeSQL(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    // PostgreSQL array literal
    const items = val.map((v) => {
      if (v === null) return "NULL";
      const s = String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${s}"`;
    });
    return `'{${items.join(",")}}'`;
  }
  if (typeof val === "object") {
    // JSON
    const json = JSON.stringify(val).replace(/'/g, "''");
    return `'${json}'::jsonb`;
  }
  // String
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (!caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Not admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines: string[] = [];
    lines.push("-- =============================================================");
    lines.push("-- Meteora Academy - Full Data Dump (INSERT INTO statements)");
    lines.push(`-- Generated: ${new Date().toISOString()}`);
    lines.push("-- =============================================================");
    lines.push("");
    lines.push("BEGIN;");
    lines.push("");

    for (const tableName of TABLES_ORDER) {
      lines.push(`-- =====================`);
      lines.push(`-- TABLE: ${tableName}`);
      lines.push(`-- =====================`);

      // Fetch all rows (paginate to avoid 1000 limit)
      let allRows: Record<string, unknown>[] = [];
      let offset = 0;
      const PAGE_SIZE = 1000;

      while (true) {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select("*")
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
          lines.push(`-- ERROR fetching ${tableName}: ${error.message}`);
          break;
        }

        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (allRows.length === 0) {
        lines.push(`-- (empty table)`);
        lines.push("");
        continue;
      }

      // Get column names from first row
      const columns = Object.keys(allRows[0]);
      const colList = columns.map((c) => `"${c}"`).join(", ");

      for (const row of allRows) {
        const values = columns.map((col) => escapeSQL(row[col])).join(", ");
        lines.push(`INSERT INTO public."${tableName}" (${colList}) VALUES (${values});`);
      }

      lines.push(`-- ${allRows.length} rows`);
      lines.push("");
    }

    lines.push("COMMIT;");
    lines.push("");

    const sqlContent = lines.join("\n");

    return new Response(sqlContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": "attachment; filename=pg_dump_data.sql",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("pg-dump-export error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
